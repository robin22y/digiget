/**
 * Offline Sync Service
 * Handles syncing of offline clock entries when internet connection is restored
 */

import { supabase } from './supabase';
import {
  getPendingClockEntries,
  markEntrySynced,
  incrementRetryCount,
  deleteSyncedEntry,
  type PendingClockEntry,
} from './offlineStorage';
import { handleStaffClock } from './clockService';

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Sync all pending clock entries
 */
export async function syncPendingClockEntries(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  if (!isOnline()) {
    console.log('Device is offline, cannot sync');
    return { success: 0, failed: 0, errors: ['Device is offline'] };
  }

  const pending = await getPendingClockEntries();
  if (pending.length === 0) {
    console.log('No pending clock entries to sync');
    return { success: 0, failed: 0, errors: [] };
  }

  console.log(`Syncing ${pending.length} pending clock entries...`);

  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  // Sort by timestamp to maintain order (clock-in before clock-out)
  const sortedEntries = pending.sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );

  for (const entry of sortedEntries) {
    try {
      await syncSingleEntry(entry);
      successCount++;
    } catch (error: any) {
      console.error('Failed to sync entry:', entry.id, error);
      failedCount++;
      errors.push(`Entry ${entry.id}: ${error.message || 'Unknown error'}`);
      await incrementRetryCount(entry.id);

      // Don't delete entry on failure - keep it for retry
      // Only delete if retry count is too high (optional safeguard)
      if (entry.retry_count > 10) {
        console.warn(`Entry ${entry.id} has exceeded retry limit, skipping`);
      }
    }
  }

  console.log(`Sync complete: ${successCount} succeeded, ${failedCount} failed`);
  return { success: successCount, failed: failedCount, errors };
}

/**
 * Sync a single clock entry
 */
async function syncSingleEntry(entry: PendingClockEntry): Promise<void> {
  if (entry.synced) {
    return; // Already synced
  }

  // For clock-out, we need to handle it differently
  if (entry.action === 'clock_out') {
    // First, check if the clock-in entry exists in database
    // If not, we need to clock in first, then clock out
    
    // Try to find existing clock entry in database
    const { data: existingClockIn } = await supabase
      .from('clock_entries')
      .select('*')
      .eq('employee_id', entry.employee_id)
      .eq('shop_id', entry.shop_id)
      .is('clock_out_time', null)
      .order('clock_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingClockIn) {
      // Clock out normally
      const result = await handleStaffClock(
        entry.employee_id,
        entry.shop_id,
        entry.method,
        {
          shopLocation: entry.latitude && entry.longitude
            ? {
                latitude: entry.latitude,
                longitude: entry.longitude,
                radius: 10000,
              }
            : undefined,
        }
      );

      if (result.success) {
        await markEntrySynced(entry.id);
        await deleteSyncedEntry(entry.id); // Clean up after successful sync
        return;
      } else {
        throw new Error(result.error || 'Failed to clock out');
      }
    } else {
      // No clock-in found - this shouldn't happen, but handle gracefully
      console.warn('Clock-out without clock-in entry found in database');
      await markEntrySynced(entry.id); // Mark as synced to avoid retry loops
      await deleteSyncedEntry(entry.id);
      return;
    }
  } else {
    // Clock in
    const result = await handleStaffClock(
      entry.employee_id,
      entry.shop_id,
      entry.method,
      {
        shopLocation: entry.latitude && entry.longitude
          ? {
              latitude: entry.latitude,
              longitude: entry.longitude,
              radius: 10000,
            }
          : undefined,
        nfcTagId: entry.nfc_tag_id,
      }
    );

    if (result.success && result.clockEvent) {
      await markEntrySynced(entry.id);
      await deleteSyncedEntry(entry.id); // Clean up after successful sync
      return;
    } else {
      throw new Error(result.error || 'Failed to clock in');
    }
  }
}

/**
 * Set up automatic sync when connection is restored
 */
export function setupOfflineSync(): void {
  // Sync when connection is restored
  window.addEventListener('online', () => {
    console.log('Connection restored, syncing pending entries...');
    syncPendingClockEntries().catch((error) => {
      console.error('Failed to sync on connection restore:', error);
    });
  });

  // Also sync periodically (every 30 seconds) if online
  setInterval(() => {
    if (isOnline()) {
      syncPendingClockEntries().catch((error) => {
        console.error('Failed to sync periodically:', error);
      });
    }
  }, 30000); // 30 seconds
}

/**
 * Get sync status for UI display
 */
export async function getSyncStatus(): Promise<{
  pending: number;
  isOnline: boolean;
}> {
  try {
    const pending = await getPendingClockEntries().then((entries) => entries.length);
    return {
      pending,
      isOnline: isOnline(),
    };
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return { pending: 0, isOnline: isOnline() };
  }
}

