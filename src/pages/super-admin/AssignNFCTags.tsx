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
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, owner_name, owner_email, nfc_tag_id, nfc_tag_active')
        .order('shop_name', { ascending: true });

      if (error) throw error;

      setShops(data || []);
      
      // Pre-fill existing tag IDs
      const existingTags: Record<string, string> = {};
      (data || []).forEach(shop => {
        if (shop.nfc_tag_id) {
          existingTags[shop.id] = shop.nfc_tag_id;
        }
      });
      setTagIds(existingTags);
    } catch (error: any) {
      console.error('Error loading shops:', error);
      setMessage({ type: 'error', text: `Failed to load shops: ${error.message}` });
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
      // Check if tag ID is already assigned to another shop
      const { data: existing, error: checkError } = await supabase
        .from('shops')
        .select('id, shop_name')
        .eq('nfc_tag_id', tagId)
        .neq('id', shopId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
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

      // Assign tag to shop
      const { error: updateError } = await supabase
        .from('shops')
        .update({
          nfc_tag_id: tagId,
          nfc_tag_active: true,
          nfc_enabled: true
        })
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
      const { error } = await supabase
        .from('shops')
        .update({
          nfc_tag_id: null,
          nfc_tag_active: false,
          nfc_enabled: false
        })
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
            {message.text}
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

