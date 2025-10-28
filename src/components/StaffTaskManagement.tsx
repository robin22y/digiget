import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Send, X, Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compressAndConvertToWebP, generateUniqueFileName } from '../utils/imageCompression';
import { getCurrentPosition } from '../utils/geolocation';

interface Task {
  id: string;
  task_name: string;
  task_description: string | null;
  require_image: boolean;
  recurrence_type: 'daily' | 'weekly' | 'one_time';
  recurrence_day: string | null;
  valid_from: string | null;
  valid_until: string | null;
  completed: boolean;
}

interface TaskCompletion {
  task_id: string;
  completed: boolean;
  not_completed_reason: string;
  image_url: string | null;
  image_file?: File;
}

interface StaffTaskManagementProps {
  employeeId: string;
  shopId: string;
  currentClockEntryId?: string | null;
}

export default function StaffTaskManagement({ employeeId, shopId, currentClockEntryId }: StaffTaskManagementProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<Map<string, TaskCompletion>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [shopId, employeeId, currentClockEntryId]);

  const loadTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('shop_id', shopId)
        .eq('active', true)
        .or(`assigned_to.eq.all,assigned_employee_ids.cs.{${employeeId}}`);

      if (tasksError) throw tasksError;

      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const todayDate = today.toISOString().split('T')[0];

      const filteredTasks = (tasksData || []).filter((task: Task) => {
        if (task.recurrence_type === 'daily') {
          return true;
        }

        if (task.recurrence_type === 'weekly') {
          return task.recurrence_day === dayOfWeek;
        }

        if (task.recurrence_type === 'one_time') {
          if (task.completed) {
            return false;
          }

          const validFrom = task.valid_from ? new Date(task.valid_from) : null;
          const validUntil = task.valid_until ? new Date(task.valid_until) : null;
          const currentDate = new Date(todayDate);

          if (validFrom && currentDate < validFrom) {
            return false;
          }

          if (validUntil && currentDate > validUntil) {
            return false;
          }

          return true;
        }

        return true;
      });

      setTasks(filteredTasks);

      if (currentClockEntryId) {
        const { data: completionsData, error: completionsError } = await supabase
          .from('task_completions')
          .select('*')
          .eq('clock_entry_id', currentClockEntryId);

        if (completionsError) throw completionsError;

        const completionsMap = new Map<string, TaskCompletion>();
        completionsData?.forEach((completion) => {
          completionsMap.set(completion.task_id, {
            task_id: completion.task_id,
            completed: completion.completed,
            not_completed_reason: completion.not_completed_reason || '',
            image_url: completion.image_url,
          });
        });
        setTaskCompletions(completionsMap);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTickTask = (task: Task) => {
    if (task.require_image) {
      setSelectedTaskId(task.id);
      const existing = taskCompletions.get(task.id);
      setSelectedImage(existing?.image_file || null);
      setImagePreview(existing?.image_url || null);
      setShowImageModal(true);
    } else {
      const current = taskCompletions.get(task.id);
      const newCompletions = new Map(taskCompletions);

      if (current?.completed) {
        newCompletions.delete(task.id);
      } else {
        newCompletions.set(task.id, {
          task_id: task.id,
          completed: true,
          not_completed_reason: '',
          image_url: null,
        });
      }

      setTaskCompletions(newCompletions);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = () => {
    if (!selectedTaskId || !selectedImage) {
      alert('Please select an image');
      return;
    }

    const newCompletions = new Map(taskCompletions);
    newCompletions.set(selectedTaskId, {
      task_id: selectedTaskId,
      completed: true,
      not_completed_reason: '',
      image_url: null,
      image_file: selectedImage,
    });

    setTaskCompletions(newCompletions);
    setShowImageModal(false);
    setSelectedTaskId(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleMarkIncomplete = (taskId: string) => {
    setSelectedTaskId(taskId);
    setReason(taskCompletions.get(taskId)?.not_completed_reason || '');
    setShowReasonModal(true);
  };

  const handleSaveIncompleteReason = () => {
    if (!selectedTaskId) return;

    const newCompletions = new Map(taskCompletions);
    newCompletions.set(selectedTaskId, {
      task_id: selectedTaskId,
      completed: false,
      not_completed_reason: reason.trim(),
      image_url: null,
    });

    setTaskCompletions(newCompletions);
    setShowReasonModal(false);
    setSelectedTaskId(null);
    setReason('');
  };

  const handleSubmitTasks = async () => {
    if (!currentClockEntryId) return;

    const tasksRequiringImages = tasks.filter(t => t.require_image);
    for (const task of tasksRequiringImages) {
      const completion = taskCompletions.get(task.id);
      if (completion?.completed && !completion.image_file && !completion.image_url) {
        alert(`Task "${task.task_name}" requires an image. Please add one before submitting.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const location = await getCurrentPosition();
      const completionsToInsert = [];
      const oneTimeTasksToComplete = [];

      for (const [taskId, tc] of taskCompletions.entries()) {
        let imageUrl: string | null = tc.image_url || null;

        if (tc.image_file) {
          const compressedBlob = await compressAndConvertToWebP(tc.image_file);
          const fileName = generateUniqueFileName(tc.image_file.name);
          const filePath = `${shopId}/task-completions/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('task-photos')
            .upload(filePath, compressedBlob, {
              contentType: 'image/webp',
              cacheControl: '3600',
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('task-photos')
            .getPublicUrl(filePath);

          imageUrl = urlData.publicUrl;
        }

        completionsToInsert.push({
          task_id: taskId,
          employee_id: employeeId,
          clock_entry_id: currentClockEntryId,
          shop_id: shopId,
          completed: tc.completed,
          not_completed_reason: tc.completed ? null : tc.not_completed_reason,
          image_url: imageUrl,
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
        });

        const task = tasks.find(t => t.id === taskId);
        if (task?.recurrence_type === 'one_time' && tc.completed) {
          oneTimeTasksToComplete.push(taskId);
        }
      }

      const { error: deleteError } = await supabase
        .from('task_completions')
        .delete()
        .eq('clock_entry_id', currentClockEntryId);

      if (deleteError) throw deleteError;

      if (completionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('task_completions')
          .insert(completionsToInsert);

        if (insertError) throw insertError;
      }

      if (oneTimeTasksToComplete.length > 0) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ completed: true })
          .in('id', oneTimeTasksToComplete);

        if (updateError) throw updateError;
      }

      alert('Tasks submitted successfully!');
      loadTasks();
    } catch (err: any) {
      console.error('Error submitting tasks:', err);
      alert(err.message || 'Failed to submit tasks');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentClockEntryId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-medium">Please clock in to view and complete tasks</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No tasks assigned</p>
      </div>
    );
  }

  const completedCount = Array.from(taskCompletions.values()).filter(tc => tc.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-900">
            {completedCount} / {totalCount} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const completion = taskCompletions.get(task.id);
          const isCompleted = completion?.completed || false;
          const isMarkedIncomplete = completion && !completion.completed;
          const hasImage = completion?.image_url || completion?.image_file;

          return (
            <div
              key={task.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                isCompleted
                  ? 'bg-green-50 border-green-500'
                  : isMarkedIncomplete
                  ? 'bg-red-50 border-red-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleTickTask(task)}
                  className="flex-shrink-0 mt-0.5"
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold ${isCompleted ? 'text-green-900 line-through' : isMarkedIncomplete ? 'text-red-900' : 'text-gray-900'}`}>
                      {task.task_name}
                    </h4>
                    {task.require_image && (
                      <Camera className="w-4 h-4 text-blue-600" title="Photo required" />
                    )}
                  </div>
                  {task.task_description && (
                    <p className={`text-sm mt-1 ${isCompleted ? 'text-green-700' : isMarkedIncomplete ? 'text-red-700' : 'text-gray-600'}`}>
                      {task.task_description}
                    </p>
                  )}
                  {task.require_image && !isCompleted && !isMarkedIncomplete && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Photo required for this task
                    </p>
                  )}
                  {hasImage && isCompleted && (
                    <div className="mt-2">
                      <img
                        src={completion.image_url || (completion.image_file ? URL.createObjectURL(completion.image_file) : '')}
                        alt="Task completion"
                        className="w-32 h-32 object-cover rounded border-2 border-green-300"
                      />
                    </div>
                  )}
                  {isMarkedIncomplete && completion.not_completed_reason && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                      <p className="font-medium text-red-900">Reason:</p>
                      <p className="text-red-800">{completion.not_completed_reason}</p>
                    </div>
                  )}
                </div>
                {!isCompleted && (
                  <button
                    onClick={() => handleMarkIncomplete(task.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Not Done
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSubmitTasks}
        disabled={submitting}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>Submitting...</>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit Tasks
          </>
        )}
      </button>

      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add Photo</h3>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedTaskId(null);
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    <Camera className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">
                      Click to take or upload photo
                    </p>
                    <p className="text-xs text-gray-500">
                      Image will be compressed and converted to WebP
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-gray-300 mb-4">
                <img
                  src={imagePreview}
                  alt="Task preview"
                  className="w-full h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedTaskId(null);
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveImage}
                disabled={!selectedImage}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Why wasn't this task completed?</h3>
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setSelectedTaskId(null);
                  setReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter reason..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setSelectedTaskId(null);
                  setReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveIncompleteReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
