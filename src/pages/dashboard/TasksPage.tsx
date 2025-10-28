import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, CheckCircle, TrendingUp, BarChart3, Camera, History, Calendar, Repeat, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Shop {
  plan_type: 'basic' | 'pro';
}

interface Task {
  id: string;
  task_name: string;
  task_description: string | null;
  assigned_to: 'all' | 'specific';
  assigned_employee_ids: string[] | null;
  active: boolean;
  require_image: boolean;
  recurrence_type: 'daily' | 'weekly' | 'one_time';
  recurrence_day: string | null;
  valid_from: string | null;
  valid_until: string | null;
  completed: boolean;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface TaskFulfillment {
  taskId: string;
  taskName: string;
  completionRate: number;
  totalShifts: number;
  completedShifts: number;
}

export default function TasksPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { shop } = useOutletContext<{ shop: Shop }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [taskFulfillment, setTaskFulfillment] = useState<TaskFulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFulfillment, setShowFulfillment] = useState(false);

  useEffect(() => {
    if (shop.plan_type === 'pro') {
      loadTasks();
      loadEmployees();
      loadTaskFulfillment();
    }
  }, [shopId, shop]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('shop_id', shopId)
        .eq('active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('shop_id', shopId)
        .eq('active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadTaskFulfillment = async () => {
    try {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const { data: clockEntriesData, error: clockError } = await supabase
        .from('clock_entries')
        .select('id')
        .eq('shop_id', shopId)
        .gte('clock_in_time', last30Days.toISOString())
        .not('clock_out_time', 'is', null);

      if (clockError) throw clockError;

      const clockEntryIds = clockEntriesData?.map(ce => ce.id) || [];

      if (clockEntryIds.length === 0) {
        setTaskFulfillment([]);
        return;
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, task_name')
        .eq('shop_id', shopId)
        .eq('active', true);

      if (tasksError) throw tasksError;

      const fulfillmentData: TaskFulfillment[] = [];

      for (const task of tasksData || []) {
        const { data: completionsData, error: completionsError } = await supabase
          .from('task_completions')
          .select('completed, clock_entry_id')
          .eq('task_id', task.id)
          .in('clock_entry_id', clockEntryIds);

        if (completionsError) throw completionsError;

        const completedCount = completionsData?.filter(c => c.completed).length || 0;
        const totalShifts = clockEntryIds.length;
        const completionRate = totalShifts > 0 ? (completedCount / totalShifts) * 100 : 0;

        fulfillmentData.push({
          taskId: task.id,
          taskName: task.task_name,
          completionRate,
          totalShifts,
          completedShifts: completedCount,
        });
      }

      fulfillmentData.sort((a, b) => a.completionRate - b.completionRate);
      setTaskFulfillment(fulfillmentData);
    } catch (error) {
      console.error('Error loading task fulfillment:', error);
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ active: false })
        .eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (shop.plan_type !== 'pro') {
    return (
      <div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Pro Feature</h2>
          <p className="text-yellow-800">
            Task management is only available on the Pro plan.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Daily Task List</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/dashboard/${shopId}/tasks/history`)}
            className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold border border-slate-300"
          >
            <History className="w-5 h-5 mr-2" />
            View History
          </button>
          <button
            onClick={() => setShowFulfillment(!showFulfillment)}
            className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            {showFulfillment ? 'Hide' : 'Show'} Analytics
          </button>
          <button
            onClick={handleAddTask}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Task
          </button>
        </div>
      </div>

      {showFulfillment && taskFulfillment.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Task Fulfillment (Last 30 Days)</h2>
          </div>
          <div className="space-y-4">
            {taskFulfillment.map((tf) => (
              <div key={tf.taskId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{tf.taskName}</span>
                  <span className="text-sm text-gray-600">
                    {tf.completedShifts} / {tf.totalShifts} shifts ({tf.completionRate.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      tf.completionRate >= 80
                        ? 'bg-green-600'
                        : tf.completionRate >= 50
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${tf.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-900 text-sm">
          Staff must complete or report these tasks during their shift. They can clock out without completing all tasks but will receive a warning.
        </p>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No tasks yet. Add your first task to get started.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.task_name}</h3>
                    {task.require_image && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        <Camera className="w-3 h-3" />
                        Photo Required
                      </span>
                    )}
                  </div>
                  {task.task_description && (
                    <p className="text-sm text-gray-600 mt-1">{task.task_description}</p>
                  )}
                  <div className="mt-3 space-y-1">
                    <span className="text-sm text-gray-700 block">
                      <span className="font-medium">Assigned to:</span>{' '}
                      {task.assigned_to === 'all' ? (
                        'All staff'
                      ) : (
                        employees
                          .filter((e) => task.assigned_employee_ids?.includes(e.id))
                          .map((e) => `${e.first_name} ${e.last_name || ''}`.trim())
                          .join(', ') || 'No one'
                      )}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      {task.recurrence_type === 'daily' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          <Repeat className="w-3 h-3" />
                          Daily
                        </span>
                      )}
                      {task.recurrence_type === 'weekly' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          <Calendar className="w-3 h-3" />
                          Every {task.recurrence_day ? task.recurrence_day.charAt(0).toUpperCase() + task.recurrence_day.slice(1) : 'week'}
                        </span>
                      )}
                      {task.recurrence_type === 'one_time' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                          <Clock className="w-3 h-3" />
                          One-time
                          {task.valid_from && task.valid_until && (
                            <span className="ml-1">
                              ({new Date(task.valid_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(task.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})
                            </span>
                          )}
                          {task.completed && (
                            <span className="ml-1 font-semibold">✓ Completed</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          shopId={shopId!}
          employees={employees}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingTask(null);
            loadTasks();
          }}
        />
      )}
    </div>
  );
}

interface TaskModalProps {
  task: Task | null;
  shopId: string;
  employees: Employee[];
  onClose: () => void;
  onSave: () => void;
}

function TaskModal({ task, shopId, employees, onClose, onSave }: TaskModalProps) {
  const [taskName, setTaskName] = useState(task?.task_name || '');
  const [taskDescription, setTaskDescription] = useState(task?.task_description || '');
  const [assignedTo, setAssignedTo] = useState<'all' | 'specific'>(task?.assigned_to || 'all');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(task?.assigned_employee_ids || []);
  const [requireImage, setRequireImage] = useState(task?.require_image || false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'one_time'>(task?.recurrence_type || 'daily');
  const [recurrenceDay, setRecurrenceDay] = useState(task?.recurrence_day || 'monday');
  const [validFrom, setValidFrom] = useState(task?.valid_from || '');
  const [validUntil, setValidUntil] = useState(task?.valid_until || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleEmployee = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const taskData: any = {
        task_name: taskName,
        task_description: taskDescription || null,
        assigned_to: assignedTo,
        assigned_employee_ids: assignedTo === 'specific' ? selectedEmployees : null,
        require_image: requireImage,
        recurrence_type: recurrenceType,
        recurrence_day: recurrenceType === 'weekly' ? recurrenceDay : null,
        valid_from: recurrenceType === 'one_time' && validFrom ? validFrom : null,
        valid_until: recurrenceType === 'one_time' && validUntil ? validUntil : null,
        completed: false
      };

      if (task) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id);

        if (updateError) throw updateError;
      } else {
        taskData.shop_id = shopId;
        taskData.active = true;

        const { error: insertError } = await supabase
          .from('tasks')
          .insert(taskData);

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {task ? 'Edit Task' : 'Add New Task'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name *
            </label>
            <input
              type="text"
              required
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g., Empty bins"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Additional details or instructions"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to:
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={assignedTo === 'all'}
                  onChange={(e) => setAssignedTo(e.target.value as 'all')}
                  className="mr-2"
                />
                <span>All staff (everyone must do)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="specific"
                  checked={assignedTo === 'specific'}
                  onChange={(e) => setAssignedTo(e.target.value as 'specific')}
                  className="mr-2"
                />
                <span>Specific staff:</span>
              </label>
            </div>

            {assignedTo === 'specific' && (
              <div className="mt-3 pl-6 space-y-2">
                {employees.length === 0 ? (
                  <p className="text-sm text-gray-500">No staff members available</p>
                ) : (
                  employees.map((employee) => (
                    <label key={employee.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => toggleEmployee(employee.id)}
                        className="mr-2"
                      />
                      <span>
                        {employee.first_name} {employee.last_name || ''}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={requireImage}
                onChange={(e) => setRequireImage(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Require photo submission
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Staff must upload a photo when completing this task
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Frequency:
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="daily"
                  checked={recurrenceType === 'daily'}
                  onChange={(e) => setRecurrenceType(e.target.value as 'daily')}
                  className="mr-2"
                />
                <span>Daily - appears every day</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="weekly"
                  checked={recurrenceType === 'weekly'}
                  onChange={(e) => setRecurrenceType(e.target.value as 'weekly')}
                  className="mr-2"
                />
                <span>Weekly - appears on specific day</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="one_time"
                  checked={recurrenceType === 'one_time'}
                  onChange={(e) => setRecurrenceType(e.target.value as 'one_time')}
                  className="mr-2"
                />
                <span>One-time task</span>
              </label>
            </div>

            {recurrenceType === 'weekly' && (
              <div className="mt-3 pl-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which day?
                </label>
                <select
                  value={recurrenceDay}
                  onChange={(e) => setRecurrenceDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
            )}

            {recurrenceType === 'one_time' && (
              <div className="mt-3 pl-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid from (optional)
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid until (optional)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Leave dates empty to make task always available until completed
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : task ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
