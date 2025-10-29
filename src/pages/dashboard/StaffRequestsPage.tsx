import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Package, Calendar, AlertCircle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';

interface StaffRequest {
  id: string;
  employee_id: string;
  request_type: 'uniform' | 'equipment' | 'supplies' | 'time_off' | 'other';
  title: string;
  description: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  response_notes: string | null;
  created_at: string;
  updated_at: string;
  employees: {
    first_name: string;
    last_name: string | null;
  };
}

const REQUEST_TYPES = {
  uniform: { label: 'Uniform', icon: Package },
  equipment: { label: 'Equipment', icon: Package },
  supplies: { label: 'Supplies', icon: Package },
  time_off: { label: 'Time Off', icon: Calendar },
  other: { label: 'Other', icon: AlertCircle },
};

export default function StaffRequestsPage() {
  const { shopId } = useParams();
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<StaffRequest | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [responseStatus, setResponseStatus] = useState<'approved' | 'rejected' | 'completed'>('approved');

  useEffect(() => {
    loadRequests();
  }, [shopId, statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('staff_requests')
        .select(`
          *,
          employees(first_name, last_name)
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedRequest) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('staff_requests')
        .update({
          status: responseStatus,
          response_notes: responseNotes.trim() || null,
          responded_at: new Date().toISOString(),
          responded_by: user?.id || null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setSelectedRequest(null);
      setResponseNotes('');
      setResponseStatus('approved');
      await loadRequests();
      alert(`Request ${responseStatus} successfully!`);
    } catch (error: any) {
      alert(error.message || 'Failed to update request');
    }
  };

  const getPriorityColor = (priority: StaffRequest['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'normal':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-300';
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

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-start h-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Staff Requests</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-orange-600 mt-1">
              {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} need attention
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex-1 sm:flex-none px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No requests found</p>
          <p className="text-sm text-gray-500 mt-1">
            {statusFilter !== 'all' ? `No ${statusFilter} requests` : 'No requests have been submitted yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const typeInfo = REQUEST_TYPES[request.request_type];
            const TypeIcon = typeInfo.icon;

            return (
              <div
                key={request.id}
                className={`bg-white rounded-xl shadow-sm border-2 p-4 ${
                  request.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <TypeIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{request.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                          request.priority
                        )}`}
                      >
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                      <span>
                        <strong>Staff:</strong> {request.employees.first_name}{' '}
                        {request.employees.last_name}
                      </span>
                      <span>
                        <strong>Type:</strong> {typeInfo.label}
                      </span>
                      <span>
                        <strong>Submitted:</strong>{' '}
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {request.description && (
                      <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                    )}

                    {request.response_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-1">Your Response:</p>
                        <p className="text-sm text-gray-600">{request.response_notes}</p>
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="w-full md:w-auto px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      Respond
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Respond to Request</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">
                <strong>From:</strong> {selectedRequest.employees.first_name}{' '}
                {selectedRequest.employees.last_name}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Request:</strong> {selectedRequest.title}
              </p>
              {selectedRequest.description && (
                <p className="text-sm text-gray-600">{selectedRequest.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response
                </label>
                <select
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                  <option value="completed">Mark as Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Add response notes..."
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setResponseNotes('');
                    setResponseStatus('approved');
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRespond}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

