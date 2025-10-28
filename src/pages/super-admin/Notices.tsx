import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Send, Bell, Filter } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  body: string;
  audience_filter: string;
  created_at: string;
  sent_by: string;
  show_on_dashboard: boolean;
}

export default function Notices() {
  const location = useLocation();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    body: '',
    audience_filter: 'all',
    show_on_dashboard: false,
  });

  const preFilledShopId = location.state?.shopId;

  useEffect(() => {
    if (preFilledShopId) {
      setNewNotice({ ...newNotice, audience_filter: `shop:${preFilledShopId}` });
    }
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      // In production, you'd have a notices table
      // For now, we'll use a placeholder structure
      // You'll need to create this table in Supabase first
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = relation does not exist
        throw error;
      }

      setNotices(data || []);
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        console.warn('Notices table does not exist yet. Create it in Supabase first.');
      } else {
        console.error('Error loading notices:', error);
      }
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('notices')
        .insert({
          title: newNotice.title,
          body: newNotice.body,
          audience_filter: newNotice.audience_filter,
          show_on_dashboard: newNotice.show_on_dashboard,
          sent_by: user?.email || 'super-admin',
        });

      if (error) {
        if (error.code === 'PGRST116') {
          alert('Notices table does not exist. Please create it in Supabase first with columns: id, title, body, audience_filter, created_at, sent_by, show_on_dashboard');
          return;
        }
        throw error;
      }

      setShowCreateModal(false);
      setNewNotice({ title: '', body: '', audience_filter: 'all', show_on_dashboard: false });
      await loadNotices();
      alert('Notice created successfully');
    } catch (error: any) {
      alert(`Error creating notice: ${error.message}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Notices</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <Send className="w-4 h-4 mr-2" />
          Create Notice
        </button>
      </div>

      {/* Existing Notices */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No notices yet. Create one to send messages to shop owners.</p>
            <p className="text-xs text-gray-500 mt-2">
              Note: You'll need to create a 'notices' table in Supabase first with the required columns.
            </p>
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-semibold text-gray-900">{notice.title}</h3>
                {notice.show_on_dashboard && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Dashboard
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{notice.body}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div>
                  <span className="font-medium">Audience:</span> {notice.audience_filter === 'all' ? 'All shops' : notice.audience_filter}
                </div>
                <div>
                  {new Date(notice.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Notice</h2>
            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Important System Update"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                <textarea
                  required
                  rows={6}
                  value={newNotice.body}
                  onChange={(e) => setNewNotice({ ...newNotice, body: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the notice message..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audience Filter</label>
                <select
                  value={newNotice.audience_filter}
                  onChange={(e) => setNewNotice({ ...newNotice, audience_filter: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Shops</option>
                  <option value="active">Active Shops Only</option>
                  <option value="trial">Trial Shops Only</option>
                  {preFilledShopId && <option value={`shop:${preFilledShopId}`}>Specific Shop</option>}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  You can also filter by postcode (e.g., "postcode:SW1A") or type (e.g., "type:Coffee shop") in production
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show_on_dashboard"
                  checked={newNotice.show_on_dashboard}
                  onChange={(e) => setNewNotice({ ...newNotice, show_on_dashboard: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="show_on_dashboard" className="ml-2 text-sm font-medium text-gray-700">
                  Show this notice on owner dashboard on next login
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Send Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

