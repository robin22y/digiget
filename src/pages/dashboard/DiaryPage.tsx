import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, Plus, Clock, User, Phone, CheckCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Appointment {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  appointment_date: string;
  appointment_time: string;
  service_type: string | null;
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  checked_in_at: string | null;
  completed_at: string | null;
}

export default function DiaryPage() {
  const { shopId } = useParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [showNewModal, setShowNewModal] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    customer_phone: '',
    customer_name: '',
    appointment_date: '',
    appointment_time: '',
    service_type: '',
    notes: '',
  });

  useEffect(() => {
    loadAppointments();
  }, [shopId, selectedDate, view]);

  const loadAppointments = async () => {
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('shop_id', shopId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const date = new Date(selectedDate);
    if (view === 'day') {
      return date.toISOString().split('T')[0];
    } else if (view === 'week') {
      date.setDate(date.getDate() - date.getDay());
      return date.toISOString().split('T')[0];
    } else {
      date.setDate(1);
      return date.toISOString().split('T')[0];
    }
  };

  const getEndDate = () => {
    const date = new Date(selectedDate);
    if (view === 'day') {
      return date.toISOString().split('T')[0];
    } else if (view === 'week') {
      date.setDate(date.getDate() - date.getDay() + 6);
      return date.toISOString().split('T')[0];
    } else {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      return date.toISOString().split('T')[0];
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('appointments').insert({
        shop_id: shopId,
        ...newAppointment,
      });

      if (error) throw error;

      setShowNewModal(false);
      setNewAppointment({
        customer_phone: '',
        customer_name: '',
        appointment_date: '',
        appointment_time: '',
        service_type: '',
        notes: '',
      });
      loadAppointments();
      alert('Appointment created successfully!');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      alert(error.message || 'Failed to create appointment');
    }
  };

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    try {
      const updateData: any = { status };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      loadAppointments();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      alert(error.message || 'Failed to update appointment');
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ checked_in_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadAppointments();
    } catch (error: any) {
      console.error('Error checking in:', error);
      alert(error.message || 'Failed to check in');
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    if (view === 'day') {
      date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(date);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const todayAppointments = appointments.filter((apt) => {
    const today = new Date().toISOString().split('T')[0];
    return apt.appointment_date === today;
  });

  const upcomingAppointments = appointments.filter((apt) => {
    const today = new Date().toISOString().split('T')[0];
    return apt.appointment_date >= today && apt.status === 'scheduled';
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Diary & Appointments</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Total Loaded</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">{formatDate(selectedDate)}</h2>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex gap-2">
            {['day', 'week', 'month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === v
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No appointments for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`border-2 rounded-lg p-4 ${
                    apt.status === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : apt.status === 'cancelled'
                      ? 'border-red-200 bg-red-50'
                      : apt.status === 'no_show'
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">
                          {apt.appointment_time}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            apt.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : apt.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : apt.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1).replace('_', ' ')}
                        </span>
                        {apt.checked_in_at && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                            Checked In
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900 font-medium">
                            {apt.customer_name || 'No name'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{apt.customer_phone}</span>
                        </div>
                        {apt.service_type && (
                          <p className="text-gray-700">
                            <strong>Service:</strong> {apt.service_type}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="text-gray-600">
                            <strong>Notes:</strong> {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    {apt.status === 'scheduled' && (
                      <div className="flex gap-2">
                        {!apt.checked_in_at && (
                          <button
                            onClick={() => handleCheckIn(apt.id)}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'completed')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'no_show')}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          No Show
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">New Appointment</h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={newAppointment.customer_phone}
                  onChange={(e) =>
                    setNewAppointment({ ...newAppointment, customer_phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={newAppointment.customer_name}
                  onChange={(e) =>
                    setNewAppointment({ ...newAppointment, customer_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newAppointment.appointment_date}
                    onChange={(e) =>
                      setNewAppointment({ ...newAppointment, appointment_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newAppointment.appointment_time}
                    onChange={(e) =>
                      setNewAppointment({ ...newAppointment, appointment_time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <input
                  type="text"
                  value={newAppointment.service_type}
                  onChange={(e) =>
                    setNewAppointment({ ...newAppointment, service_type: e.target.value })
                  }
                  placeholder="e.g., Haircut, Massage, Consultation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newAppointment.notes}
                  onChange={(e) =>
                    setNewAppointment({ ...newAppointment, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
