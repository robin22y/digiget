import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Package, Calendar, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface StaffRequest {
  id: string;
  request_type: 'uniform' | 'equipment' | 'supplies' | 'time_off' | 'other';
  title: string;
  description: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  response_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface StaffRequestsProps {
  employeeId: string;
  shopId: string;
}

const REQUEST_TYPES = [
  { value: 'uniform', label: 'Uniform', icon: Package },
  { value: 'equipment', label: 'Equipment', icon: Package },
  { value: 'supplies', label: 'Supplies', icon: Package },
  { value: 'time_off', label: 'Time Off', icon: Calendar },
  { value: 'other', label: 'Other', icon: AlertCircle },
];

const PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

export default function StaffRequests({ employeeId, shopId }: StaffRequestsProps) {
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    request_type: 'uniform' as StaffRequest['request_type'],
    title: '',
    description: '',
    priority: 'normal' as StaffRequest['priority'],
  });

  useEffect(() => {
    loadRequests();
  }, [employeeId, shopId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRequest.title.trim()) {
      alert('Please enter a title for your request');
      return;
    }

    try {
      const { error } = await supabase
        .from('staff_requests')
        .insert({
          shop_id: shopId,
          employee_id: employeeId,
          request_type: newRequest.request_type,
          title: newRequest.title.trim(),
          description: newRequest.description.trim() || null,
          priority: newRequest.priority,
          status: 'pending',
        });

      if (error) throw error;

      setShowNewModal(false);
      setNewRequest({
        request_type: 'uniform',
        title: '',
        description: '',
        priority: 'normal',
      });
      await loadRequests();
      alert('Request submitted successfully! Shop owner will be notified.');
    } catch (error: any) {
      console.error('Error creating request:', error);
      alert(error.message || 'Failed to submit request');
    }
  };

  const getPriorityColor = (priority: StaffRequest['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: StaffRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-purple-100 text-purple-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: StaffRequest['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">My Requests</h3>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No requests yet</p>
          <p className="text-sm text-gray-500 mt-1">Click "New Request" to submit a request</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const TypeIcon = REQUEST_TYPES.find(t => t.value === request.request_type)?.icon || Package;
            return (
              <div
                key={request.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <TypeIcon className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">{request.title}</h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {STATUS_LABELS[request.status]}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                          request.priority
                        )}`}
                      >
                        {PRIORITY_LABELS[request.priority]}
                      </span>
                    </div>
                    {request.description && (
                      <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        <strong>Type:</strong> {REQUEST_TYPES.find(t => t.value === request.request_type)?.label}
                      </span>
                      <span>
                        <strong>Submitted:</strong>{' '}
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {request.response_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-1">Response:</p>
                        <p className="text-sm text-gray-600">{request.response_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit New Request</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type
                </label>
                <select
                  required
                  value={newRequest.request_type}
                  onChange={(e) =>
                    setNewRequest({
                      ...newRequest,
                      request_type: e.target.value as StaffRequest['request_type'],
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {REQUEST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="e.g., New uniform needed"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Add any additional details..."
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newRequest.priority}
                  onChange={(e) =>
                    setNewRequest({
                      ...newRequest,
                      priority: e.target.value as StaffRequest['priority'],
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewModal(false);
                    setNewRequest({
                      request_type: 'uniform',
                      title: '',
                      description: '',
                      priority: 'normal',
                    });
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

