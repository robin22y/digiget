import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatLocation, getGoogleMapsLink } from '../../utils/geolocation';

interface ClockInRequest {
  id: string;
  employee_id: string;
  requested_at: string;
  request_latitude: number;
  request_longitude: number;
  distance_from_shop: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  employees: {
    first_name: string;
    last_name: string | null;
    role: string;
  };
}

export default function ClockInRequestsPage() {
  const { shopId } = useParams();
  const [requests, setRequests] = useState<ClockInRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadRequests();
  }, [shopId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('clock_in_requests')
        .select('*, employees(first_name, last_name, role)')
        .eq('shop_id', shopId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, employeeId: string, latitude: number, longitude: number) => {
    try {
      const { error: clockError } = await supabase
        .from('clock_entries')
        .insert({
          shop_id: shopId,
          employee_id: employeeId,
          clock_in_time: new Date().toISOString(),
          clock_in_latitude: latitude,
          clock_in_longitude: longitude,
        });

      if (clockError) throw clockError;

      const { error: updateError } = await supabase
        .from('clock_in_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'Shop Owner',
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      loadRequests();
      alert('Clock-in request approved successfully!');
    } catch (error: any) {
      console.error('Error approving request:', error);
      alert(error.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Enter rejection reason (optional):');

    try {
      const { error } = await supabase
        .from('clock_in_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'Shop Owner',
          rejection_reason: reason || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      loadRequests();
      alert('Clock-in request rejected.');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      alert(error.message || 'Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-start h-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredRequests = requests.filter((req) => {
    if (filter === 'pending') return req.status === 'pending';
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clock-In Requests</h1>
        {pendingCount > 0 && (
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
        <p className="text-blue-900 text-sm">
          Staff members who clock in from more than 100 meters away require approval. Review and approve or reject their requests here.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({requests.length})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No clock-in requests to display</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className={`bg-white rounded-lg shadow p-6 ${
                request.status === 'pending'
                  ? 'border-l-4 border-orange-500'
                  : request.status === 'approved'
                  ? 'border-l-4 border-green-500'
                  : 'border-l-4 border-red-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {request.status === 'pending' && <Clock className="w-5 h-5 text-orange-600" />}
                    {request.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {request.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.employees.first_name} {request.employees.last_name || ''}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        request.status === 'pending'
                          ? 'bg-orange-100 text-orange-800'
                          : request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    Role: {request.employees.role}
                  </p>

                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p>
                      <strong>Requested:</strong>{' '}
                      {new Date(request.requested_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      <span>
                        <strong>Distance:</strong>{' '}
                        {request.distance_from_shop < 1000
                          ? `${Math.round(request.distance_from_shop)}m`
                          : `${(request.distance_from_shop / 1000).toFixed(2)}km`}{' '}
                        from shop
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>
                        <strong>Location:</strong>{' '}
                        <a
                          href={getGoogleMapsLink(request.request_latitude, request.request_longitude) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {formatLocation(request.request_latitude, request.request_longitude)}
                        </a>
                      </span>
                    </div>
                  </div>

                  {request.reviewed_at && (
                    <p className="text-sm text-gray-600">
                      <strong>Reviewed:</strong>{' '}
                      {new Date(request.reviewed_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      by {request.reviewed_by}
                    </p>
                  )}

                  {request.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 rounded">
                      <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                      <p className="text-sm text-red-800">{request.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() =>
                        handleApprove(
                          request.id,
                          request.employee_id,
                          request.request_latitude,
                          request.request_longitude
                        )
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
