import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  nfc_tag_id: string | null;
  nfc_tag_active: boolean;
}

export default function AssignNFCTags() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagIds, setTagIds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    setLoading(true);
    try {
      // Try to load with NFC columns first
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, owner_name, owner_email, nfc_tag_id, nfc_tag_active')
        .order('shop_name', { ascending: true });

      if (error) {
        // If it's a column error, try without NFC columns and show migration message
        if (error.message?.includes('nfc_tag_id') || error.message?.includes('does not exist') || error.code === '42703') {
          console.warn('NFC columns not found, loading without them. Migration needs to be run.');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('shops')
            .select('id, shop_name, owner_name, owner_email')
            .order('shop_name', { ascending: true });

          if (fallbackError) throw fallbackError;

          // Map to include null NFC fields so the UI still works
          const shopsWithNulls = (fallbackData || []).map(shop => ({
            ...shop,
            nfc_tag_id: null,
            nfc_tag_active: false
          }));

          setShops(shopsWithNulls);
          setTagIds({});
          setMessage({ 
            type: 'error', 
            text: 'NFC columns not found in database. Please run the migration: supabase/migrations/20250204000002_ensure_nfc_columns_exist.sql' 
          });
          return;
        }
        throw error;
      }

      setShops(data || []);
      
      // Pre-fill existing tag IDs
      const existingTags: Record<string, string> = {};
      (data || []).forEach((shop: any) => {
        if (shop.nfc_tag_id) {
          existingTags[shop.id] = shop.nfc_tag_id;
        }
      });
      setTagIds(existingTags);
      setMessage(null); // Clear any previous error messages
    } catch (error: any) {
      console.error('Error loading shops:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to load shops: ${error.message}. If this is about missing columns, please run the NFC migration first.` 
      });
    } finally {
      setLoading(false);
    }
  };

  const setTagId = (shopId: string, value: string) => {
    setTagIds(prev => ({
      ...prev,
      [shopId]: value.toUpperCase().trim()
    }));
    // Clear any existing messages when user types
    if (message) {
      setMessage(null);
    }
  };

  const assignTag = async (shopId: string) => {
    const tagId = tagIds[shopId]?.trim();

    if (!tagId) {
      setMessage({ type: 'error', text: 'Please enter a tag ID' });
      return;
    }

    // Validate format: DIGIGET-XXXXXXXX (8 alphanumeric characters)
    const tagFormat = /^DIGIGET-[A-Z0-9]{8}$/;
    if (!tagFormat.test(tagId)) {
      setMessage({ 
        type: 'error', 
        text: 'Invalid tag ID format. Must be: DIGIGET-XXXXXXXX (8 alphanumeric characters)' 
      });
      return;
    }

    setSaving(prev => ({ ...prev, [shopId]: true }));
    setMessage(null);

    try {
      // Check if NFC columns exist before proceeding
      const { data: columnTest } = await supabase
        .from('shops')
        .select('nfc_tag_id')
        .limit(0);

      if (!columnTest && columnTest !== null) {
        // Try to detect if column exists by checking error
        const { error: testError } = await supabase
          .from('shops')
          .select('nfc_tag_id')
          .limit(1);

        if (testError?.message?.includes('does not exist') || testError?.code === '42703') {
          setMessage({ 
            type: 'error', 
            text: 'NFC columns not found. Please run migration: supabase/migrations/20250203000002_add_nfc_clock_in_system.sql' 
          });
          setSaving(prev => ({ ...prev, [shopId]: false }));
          return;
        }
      }

      // Check if tag ID is already assigned to another shop
      const { data: existing, error: checkError } = await supabase
        .from('shops')
        .select('id, shop_name')
        .eq('nfc_tag_id', tagId)
        .neq('id', shopId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // If it's a column error, show helpful message
        if (checkError.message?.includes('does not exist') || checkError.code === '42703') {
          setMessage({ 
            type: 'error', 
            text: 'NFC columns not found. Please run migration: supabase/migrations/20250203000002_add_nfc_clock_in_system.sql' 
          });
          setSaving(prev => ({ ...prev, [shopId]: false }));
          return;
        }
        throw checkError;
      }

      if (existing) {
        setMessage({ 
          type: 'error', 
          text: `Tag ID ${tagId} is already assigned to shop: ${existing.shop_name}` 
        });
        setSaving(prev => ({ ...prev, [shopId]: false }));
        return;
      }

      // Assign tag to shop - build update object dynamically
      const updateData: any = {
        nfc_tag_id: tagId,
        nfc_tag_active: true
      };

      // Only include nfc_enabled if column exists
      try {
        const { error: testNfcEnabled } = await supabase
          .from('shops')
          .select('nfc_enabled')
          .limit(0);
        
        if (!testNfcEnabled || testNfcEnabled.code !== '42703') {
          updateData.nfc_enabled = true;
        }
      } catch {
        // Column might not exist, skip it
      }

      const { error: updateError } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', shopId);

      if (updateError) {
        throw updateError;
      }

      setMessage({ 
        type: 'success', 
        text: `✓ Tag ${tagId} assigned successfully to ${shops.find(s => s.id === shopId)?.shop_name}` 
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
      // Refresh shop list
      await loadShops();
    } catch (error: any) {
      console.error('Error assigning tag:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to assign tag: ${error.message || 'Unknown error'}` 
      });
    } finally {
      setSaving(prev => ({ ...prev, [shopId]: false }));
    }
  };

  const removeTag = async (shopId: string) => {
    if (!confirm('Are you sure you want to remove the NFC tag from this shop?')) {
      return;
    }

    setSaving(prev => ({ ...prev, [shopId]: true }));
    setMessage(null);

    try {
      // Build update object dynamically
      const removeData: any = {
        nfc_tag_id: null,
        nfc_tag_active: false
      };

      // Only include nfc_enabled if column exists
      try {
        const { error: testNfcEnabled } = await supabase
          .from('shops')
          .select('nfc_enabled')
          .limit(0);
        
        if (!testNfcEnabled || testNfcEnabled.code !== '42703') {
          removeData.nfc_enabled = false;
        }
      } catch {
        // Column might not exist, skip it
      }

      const { error } = await supabase
        .from('shops')
        .update(removeData)
        .eq('id', shopId);

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: `✓ NFC tag removed from ${shops.find(s => s.id === shopId)?.shop_name}` 
      });
      
      setTimeout(() => setMessage(null), 3000);
      await loadShops();
    } catch (error: any) {
      console.error('Error removing tag:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to remove tag: ${error.message || 'Unknown error'}` 
      });
    } finally {
      setSaving(prev => ({ ...prev, [shopId]: false }));
    }
  };

  const shopsWithTags = shops.filter(s => s.nfc_tag_id).length;
  const shopsWithoutTags = shops.filter(s => !s.nfc_tag_id).length;

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading shops...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="mb-2">Assign NFC Tags to Shops</h1>
            <p className="text-muted">
              Assign NFC tag IDs to shops for clock-in functionality. Format: DIGIGET-XXXXXXXX
            </p>
          </div>
          <button
            onClick={loadShops}
            className="btn btn-secondary"
          >
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Shops</p>
              <p className="text-2xl font-bold text-gray-900">{shops.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Shops with Tags</p>
              <p className="text-2xl font-bold text-green-600">{shopsWithTags}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Shops without Tags</p>
              <p className="text-2xl font-bold text-orange-600">{shopsWithoutTags}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">{message.text}</div>
              {message.type === 'error' && message.text.includes('migration') && (
                <button
                  onClick={() => {
                    const migrationPath = 'supabase/migrations/20250204000002_ensure_nfc_columns_exist.sql';
                    navigator.clipboard.writeText(`Please run this migration in Supabase SQL Editor:\n\n${migrationPath}\n\nOr copy the contents of the file and run it.`);
                    alert('Migration file path copied to clipboard! Open it and run the SQL in Supabase SQL Editor.');
                  }}
                  className="ml-4 text-sm underline text-blue-600 hover:text-blue-700"
                >
                  Copy Migration Info
                </button>
              )}
            </div>
          </div>
        )}

        {/* Migration Required Alert */}
        {message?.text?.includes('migration') && shops.length > 0 && (
          <div className="alert alert-warning mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Migration Required</h3>
                <p className="text-sm mb-3">
                  NFC columns are not present in your database. Please run the migration to enable NFC tag assignment.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-xs mb-3 break-all">
                  supabase/migrations/20250204000002_ensure_nfc_columns_exist.sql
                </div>
                <p className="text-sm mb-2">
                  <strong>Steps:</strong>
                </p>
                <ol className="text-sm list-decimal list-inside space-y-1 mb-3">
                  <li>Open Supabase Dashboard → SQL Editor</li>
                  <li>Open the migration file: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">supabase/migrations/20250204000002_ensure_nfc_columns_exist.sql</code></li>
                  <li>Copy and paste the SQL contents</li>
                  <li>Run the SQL in Supabase SQL Editor</li>
                  <li>Refresh this page</li>
                </ol>
                <button
                  onClick={async () => {
                    try {
                      // Try to read the migration file content
                      const response = await fetch('/supabase/migrations/20250204000002_ensure_nfc_columns_exist.sql');
                      if (response.ok) {
                        const content = await response.text();
                        await navigator.clipboard.writeText(content);
                        alert('Migration SQL copied to clipboard! Paste it in Supabase SQL Editor and run it.');
                      } else {
                        // Fallback: copy file path
                        await navigator.clipboard.writeText('supabase/migrations/20250204000002_ensure_nfc_columns_exist.sql');
                        alert('Migration file path copied. Please open the file and copy its contents.');
                      }
                    } catch {
                      // Fallback
                      await navigator.clipboard.writeText('supabase/migrations/20250204000002_ensure_nfc_columns_exist.sql');
                      alert('Migration file path copied. Please open the file manually.');
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Copy Migration SQL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shops Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Current Tag ID</th>
                  <th>New Tag ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No shops found
                    </td>
                  </tr>
                ) : (
                  shops.map(shop => (
                    <tr key={shop.id}>
                      <td className="font-semibold">{shop.shop_name}</td>
                      <td>{shop.owner_name}</td>
                      <td className="text-sm text-gray-600">{shop.owner_email}</td>
                      <td>
                        {shop.nfc_tag_id ? (
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {shop.nfc_tag_id}
                          </code>
                        ) : (
                          <em className="text-muted">Not assigned</em>
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="DIGIGET-XXXXXXXX"
                          value={tagIds[shop.id] || ''}
                          onChange={(e) => setTagId(shop.id, e.target.value)}
                          className="input"
                          style={{ minWidth: '200px' }}
                          disabled={saving[shop.id]}
                        />
                      </td>
                      <td>
                        {shop.nfc_tag_active ? (
                          <span className="badge badge-green">Active</span>
                        ) : shop.nfc_tag_id ? (
                          <span className="badge">Inactive</span>
                        ) : (
                          <span className="badge badge-red">No Tag</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => assignTag(shop.id)}
                            disabled={saving[shop.id] || !tagIds[shop.id]?.trim()}
                            className="btn btn-primary btn-sm"
                          >
                            {saving[shop.id] ? (
                              <>Saving...</>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-1" />
                                {shop.nfc_tag_id ? 'Update Tag' : 'Assign Tag'}
                              </>
                            )}
                          </button>
                          {shop.nfc_tag_id && (
                            <button
                              onClick={() => removeTag(shop.id)}
                              disabled={saving[shop.id]}
                              className="btn btn-danger btn-sm"
                              title="Remove NFC tag"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Help Section */}
        <div className="card mt-6">
          <h3 className="mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Instructions
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>Tag ID Format:</strong> Must be exactly <code className="bg-gray-100 px-1 rounded">DIGIGET-XXXXXXXX</code> where X is 8 alphanumeric characters (A-Z, 0-9)
            </li>
            <li>
              <strong>Validation:</strong> System will check if tag ID is already assigned to another shop
            </li>
            <li>
              <strong>Assignment:</strong> When you assign a tag, it automatically activates NFC clock-in for that shop
            </li>
            <li>
              <strong>First 20 Shops:</strong> NFC tags are free for the first 20 shops. After assignment, shop owner can enable/disable in Settings
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

