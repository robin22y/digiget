import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, CheckCircle, XCircle, Plus, Trash2, Clock } from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface RemoteApproval {
  id: string;
  employee_id: string;
  days_of_week: number[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  notes: string | null;
  employees: Employee;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function RemoteClockInApprovals() {
  const { shopId } = useParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [approvals, setApprovals] = useState<RemoteApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [newApproval, setNewApproval] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  useEffect(() => {
    loadEmployees();
    loadApprovals();
  }, [shopId]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('shop_id', shopId)
        .eq('active', true)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('remote_clock_in_approvals')
        .select(`
          *,
          employees(first_name, last_name)
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayValue: number) => {
    setSelectedDays(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const handleCreateApproval = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newApproval.employee_id) {
      alert('Please select an employee');
      return;
    }

    if (selectedDays.length === 0) {
      alert('Please select at least one day of the week');
      return;
    }

    if (!newApproval.start_date || !newApproval.end_date) {
      alert('Please select start and end dates');
      return;
    }

    if (new Date(newApproval.start_date) > new Date(newApproval.end_date)) {
      alert('End date must be after start date');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('remote_clock_in_approvals')
        .insert({
          shop_id: shopId,
          employee_id: newApproval.employee_id,
          days_of_week: selectedDays.sort(),
          start_date: newApproval.start_date,
          end_date: newApproval.end_date,
          notes: newApproval.notes || null,
          created_by: user?.id || null,
          is_active: true,
        });

      if (error) throw error;

      setShowAddModal(false);
      setNewApproval({ employee_id: '', start_date: '', end_date: '', notes: '' });
      setSelectedDays([]);
      await loadApprovals();
      alert('Remote clock-in approval created successfully!');
    } catch (error: any) {
      console.error('Error creating approval:', error);
      alert(error.message || 'Failed to create approval');
    }
  };

  const handleToggleActive = async (approvalId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('remote_clock_in_approvals')
        .update({ is_active: !currentStatus })
        .eq('id', approvalId);

      if (error) throw error;
      await loadApprovals();
    } catch (error: any) {
      alert(error.message || 'Failed to update approval');
    }
  };

  const handleDelete = async (approvalId: string) => {
    if (!confirm('Are you sure you want to delete this approval?')) return;

    try {
      const { error } = await supabase
        .from('remote_clock_in_approvals')
        .delete()
        .eq('id', approvalId);

      if (error) throw error;
      await loadApprovals();
      alert('Approval deleted successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to delete approval');
    }
  };

  const formatDays = (days: number[]) => {
    if (days.length === 0) return 'None';
    const dayNames = days.sort().map(d => DAYS_OF_WEEK[d]?.label).filter(Boolean);
    return dayNames.join(', ');
  };

  const isCurrentlyValid = (approval: RemoteApproval) => {
    if (!approval.is_active) return false;

    const today = new Date();
    const startDate = new Date(approval.start_date);
    const endDate = new Date(approval.end_date);
    endDate.setHours(23, 59, 59, 999);

    if (today < startDate || today > endDate) return false;

    const currentDay = today.getDay();
    return approval.days_of_week.includes(currentDay);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-start h-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Remote Clock-In Approvals</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Approval
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Pre-approve staff to clock in remotely on specific days and date ranges. 
          When they clock in from outside the shop location, it will be automatically approved if they have a valid pre-approval.
        </p>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {approvals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No remote clock-in approvals set up yet.</p>
            <p className="text-sm text-gray-500 mt-2">Click "Add Approval" to create one.</p>
          </div>
        ) : (
          approvals.map((approval) => {
            const isValid = isCurrentlyValid(approval);
            return (
              <div
                key={approval.id}
                className={`bg-white rounded-xl shadow-sm border-2 p-4 ${
                  isValid ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {approval.employees.first_name} {approval.employees.last_name}
                      </h3>
                      {isValid && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active Now
                        </span>
                      )}
                      {!approval.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Days:</span>
                        <p className="text-gray-900">{formatDays(approval.days_of_week)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date Range:</span>
                        <p className="text-gray-900">
                          {new Date(approval.start_date).toLocaleDateString()} - {new Date(approval.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <p className={approval.is_active ? 'text-green-600' : 'text-gray-600'}>
                          {approval.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>

                    {approval.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Notes: </span>
                        <span className="text-sm text-gray-900">{approval.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(approval.id, approval.is_active)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        approval.is_active
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {approval.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(approval.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Approval Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Remote Clock-In Approval</h2>
            <form onSubmit={handleCreateApproval} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  required
                  value={newApproval.employee_id}
                  onChange={(e) => setNewApproval({ ...newApproval, employee_id: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleToggleDay(day.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedDays.includes(day.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
                {selectedDays.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">Selected: {formatDays(selectedDays)}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newApproval.start_date}
                    onChange={(e) => setNewApproval({ ...newApproval, start_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newApproval.end_date}
                    onChange={(e) => setNewApproval({ ...newApproval, end_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={newApproval.notes}
                  onChange={(e) => setNewApproval({ ...newApproval, notes: e.target.value })}
                  rows={3}
                  placeholder="e.g., 'Traveling for deliveries every Tuesday'"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewApproval({ employee_id: '', start_date: '', end_date: '', notes: '' });
                    setSelectedDays([]);
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

