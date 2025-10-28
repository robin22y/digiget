import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Clock, CheckCircle, AlertCircle, Star } from 'lucide-react';

interface ClockEntry {
  id: string;
  employee_id: string;
  clock_in_time: string;
  tasks_assigned: any;
}

interface Task {
  id: string;
  task_name: string;
  task_description: string | null;
  completed: boolean;
}

export default function TabletInterface() {
  const { shopId } = useParams();
  const [view, setView] = useState<'idle' | 'pin' | 'changepin' | 'workspace'>('idle');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [currentEntry, setCurrentEntry] = useState<ClockEntry | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkInMessage, setCheckInMessage] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    loadShop();
  }, [shopId]);

  const loadShop = async () => {
    const { data } = await supabase
      .from('shops')
      .select('shop_name, points_needed, reward_description')
      .eq('id', shopId)
      .single();
    setShop(data);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shopId)
        .eq('pin', pin)
        .eq('active', true);

      if (!employees || employees.length === 0) {
        throw new Error('Invalid PIN. Please try again.');
      }

      const employee = employees[0];
      setCurrentEmployee(employee);

      const now = new Date();
      const pinExpiry = employee.pin_expires_at ? new Date(employee.pin_expires_at) : null;
      const isPinExpired = pinExpiry && now > pinExpiry;

      if (employee.pin_change_required || isPinExpired) {
        setPin('');
        setView('changepin');
        return;
      }

      const { data: activeEntry } = await supabase
        .from('clock_entries')
        .select('*')
        .eq('employee_id', employee.id)
        .is('clock_out_time', null)
        .maybeSingle();

      if (activeEntry) {
        setCurrentEntry(activeEntry);
        loadTasks(activeEntry);
        setView('workspace');
      } else {
        await clockIn(employee.id);
      }

      setPin('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clockIn = async (employeeId: string) => {
    try {
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('shop_id', shopId)
        .eq('active', true);

      const assignedTasks = allTasks?.filter(
        (task) =>
          task.assigned_to === 'all' ||
          (task.assigned_to === 'specific' && task.assigned_employee_ids?.includes(employeeId))
      ) || [];

      const { data: entry, error } = await supabase
        .from('clock_entries')
        .insert({
          shop_id: shopId!,
          employee_id: employeeId,
          clock_in_time: new Date().toISOString(),
          tasks_assigned: assignedTasks.map((t: any) => ({ id: t.id, name: t.task_name, completed: false }))
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentEntry(entry);
      loadTasks(entry);
      setView('workspace');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadTasks = (entry: ClockEntry) => {
    if (entry.tasks_assigned) {
      setTasks(entry.tasks_assigned);
    }
  };

  const toggleTask = async (taskId: string) => {
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);

    await supabase
      .from('clock_entries')
      .update({ tasks_assigned: updatedTasks })
      .eq('id', currentEntry!.id);
  };

  const handleCustomerCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckInMessage('');

    try {
      const cleanPhone = customerPhone.replace(/\s/g, '');

      let { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (!customer) {
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert({
            shop_id: shopId!,
            phone: cleanPhone,
            current_points: 1,
            lifetime_points: 1,
            total_visits: 1
          })
          .select()
          .single();

        if (error) throw error;
        customer = newCustomer;

        await supabase
          .from('loyalty_transactions')
          .insert({
            shop_id: shopId!,
            customer_id: customer.id,
            transaction_type: 'point_added',
            points_change: 1,
            balance_after: 1,
            added_by_employee_id: currentEmployee.id
          });

        setCheckInMessage(`New customer! 1/${shop.points_needed} visits`);
      } else {
        const newPoints = customer.current_points + 1;

        if (newPoints >= shop.points_needed) {
          setCheckInMessage(`🎉 REWARD READY! ${shop.reward_description}`);
        } else {
          setCheckInMessage(`Point added! ${newPoints}/${shop.points_needed} visits`);
        }

        await supabase
          .from('customers')
          .update({
            current_points: newPoints,
            lifetime_points: customer.lifetime_points + 1,
            total_visits: customer.total_visits + 1,
            last_visit_at: new Date().toISOString()
          })
          .eq('id', customer.id);

        await supabase
          .from('loyalty_transactions')
          .insert({
            shop_id: shopId!,
            customer_id: customer.id,
            transaction_type: 'point_added',
            points_change: 1,
            balance_after: newPoints,
            added_by_employee_id: currentEmployee.id
          });
      }

      setCustomerPhone('');
      setTimeout(() => setCheckInMessage(''), 5000);
    } catch (err: any) {
      setCheckInMessage(`Error: ${err.message}`);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        throw new Error('PIN must be exactly 4 digits');
      }

      if (newPin !== confirmPin) {
        throw new Error('PINs do not match');
      }

      const now = new Date().toISOString();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const { error: updateError } = await supabase
        .from('employees')
        .update({
          pin: newPin,
          pin_change_required: false,
          last_pin_change_at: now,
          pin_expires_at: expiryDate.toISOString()
        })
        .eq('id', currentEmployee.id);

      if (updateError) throw updateError;

      const { data: activeEntry } = await supabase
        .from('clock_entries')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .is('clock_out_time', null)
        .maybeSingle();

      if (activeEntry) {
        setCurrentEntry(activeEntry);
        loadTasks(activeEntry);
        setView('workspace');
      } else {
        await clockIn(currentEmployee.id);
      }

      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    const incompleteTasks = tasks.filter((t) => !t.completed);

    if (incompleteTasks.length > 0) {
      alert('You must complete all tasks before clocking out:\n' + incompleteTasks.map(t => `- ${t.task_name}`).join('\n'));
      return;
    }

    if (!confirm('Clock out now?')) return;

    try {
      const clockOutTime = new Date();
      const clockInTime = new Date(currentEntry!.clock_in_time);
      const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      await supabase
        .from('clock_entries')
        .update({
          clock_out_time: clockOutTime.toISOString(),
          hours_worked: parseFloat(hoursWorked.toFixed(2)),
          tasks_complete: true,
          tasks_completed_at: clockOutTime.toISOString()
        })
        .eq('id', currentEntry!.id);

      setView('idle');
      setCurrentEmployee(null);
      setCurrentEntry(null);
      setTasks([]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 5)} ${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8, 11)}`;
  };

  const getElapsedTime = () => {
    if (!currentEntry) return '0h 0m';
    const now = new Date();
    const clockIn = new Date(currentEntry.clock_in_time);
    const diff = now.getTime() - clockIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (view === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DigiGet</h1>
          {shop && <p className="text-xl text-gray-600 mb-8">{shop.shop_name}</p>}
          <button
            onClick={() => setView('pin')}
            className="px-12 py-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-2xl font-bold"
          >
            STAFF CLOCK IN/OUT
          </button>
          <p className="mt-4 text-gray-500">No staff currently clocked in</p>
        </div>
      </div>
    );
  }

  if (view === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Enter Your PIN</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-6 py-4 text-3xl text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Submit'}
            </button>
          </form>

          <button
            onClick={() => {
              setView('idle');
              setPin('');
              setError('');
            }}
            className="w-full mt-4 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Forgot PIN? Ask your manager
          </p>
        </div>
      </div>
    );
  }

  if (view === 'changepin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Change Your PIN</h2>
          <p className="text-gray-600 text-center mb-6">
            {currentEmployee?.pin_expires_at && new Date() > new Date(currentEmployee.pin_expires_at)
              ? 'Your PIN has expired. Please create a new one.'
              : 'For security, please create a new 4-digit PIN'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleChangePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-6 py-4 text-3xl text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-6 py-4 text-3xl text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Set New PIN'}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-500 text-center">
            Remember this PIN - you'll need it to clock in/out. It will expire in 30 days.
          </p>
        </div>
      </div>
    );
  }

  if (view === 'workspace') {
    const completedTasks = tasks.filter((t) => t.completed).length;
    const allTasksComplete = tasks.length === 0 || completedTasks === tasks.length;

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {currentEmployee.first_name}
            </h2>
            <div className="flex items-center text-gray-600 mt-1">
              <Clock className="w-4 h-4 mr-1" />
              <span>Clocked in: {new Date(currentEntry!.clock_in_time).toLocaleTimeString()} ({getElapsedTime()})</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {tasks.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
                <span className="text-sm text-gray-600">
                  {completedTasks}/{tasks.length} complete
                </span>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="w-full flex items-start p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center mr-3 ${
                      task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {task.completed && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <span className={task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                      {task.task_name}
                    </span>
                  </button>
                ))}
              </div>
              {!allTasksComplete && (
                <p className="mt-4 text-sm text-gray-500">
                  Complete all tasks to enable clock out
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Check-In</h3>

            {checkInMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                checkInMessage.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
              }`}>
                {checkInMessage}
              </div>
            )}

            <form onSubmit={handleCustomerCheckIn}>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                placeholder="07XXX XXX XXX"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Add Point
              </button>
            </form>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClockOut}
              disabled={!allTasksComplete}
              className="flex-1 bg-red-600 text-white py-4 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allTasksComplete ? 'Clock Out' : 'Complete Tasks First'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
