import { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { UserPlus, Clock, Users as UsersIcon, Trash2, ExternalLink, Copy, KeyRound, Pencil } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';

interface Shop {
  plan_type: 'basic' | 'pro';
  shop_name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  hourly_rate: number | null;
  role: string;
  active: boolean;
  photo_url: string | null;
  pin_expires_at?: string | null;
}

export default function StaffPage() {
  const { shopId: paramShopId } = useParams();
  const { shop: outletShop } = useOutletContext<{ shop: Shop }>();
  const { currentShop, hasAccess, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Use currentShop from context or validated paramShopId
  const shop = outletShop;
  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<any>({});
  const [showPinModal, setShowPinModal] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [reissuingPinFor, setReissuingPinFor] = useState<string | null>(null);

  useEffect(() => {
    if (!shopLoading && paramShopId) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
    if (shopId && shop) {
      if (shop.plan_type === 'pro') {
        loadEmployees();
        loadWeeklyStats();
      } else {
        // For basic plan, still load employees but limit functionality
        loadEmployees();
        setLoading(false);
      }
    }
  }, [shopId, shop, paramShopId, hasAccess, shopLoading, navigate]);

  const loadEmployees = async () => {
    if (!shopId) return;
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, phone, email, hourly_rate, role, active, photo_url, pin_expires_at')
        .eq('shop_id', shopId)
        .eq('active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyStats = async () => {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      if (!shopId) return;
      
      const { data, error } = await supabase
        .from('clock_entries')
        .select('employee_id, hours_worked')
        .eq('shop_id', shopId)
        .gte('clock_in_time', weekStart.toISOString())
        .not('clock_out_time', 'is', null);

      if (error) throw error;

      const stats: any = {};
      data?.forEach((entry) => {
        if (!stats[entry.employee_id]) {
          stats[entry.employee_id] = { hours: 0 };
        }
        stats[entry.employee_id].hours += entry.hours_worked || 0;
      });

      setWeeklyStats(stats);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    }
  };

  const handleAddEmployee = () => {
    if (checkStaffLimit()) {
      // No restrictions - all shops can add unlimited staff
      return;
    }
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    console.log('Editing employee:', employee);
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({ active: false })
        .eq('id', employeeId);

      if (error) throw error;
      loadEmployees();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleReissuePin = async (employee: Employee) => {
    if (!confirm(`Re-issue PIN for ${employee.first_name}? Their current PIN will no longer work.`)) return;

    setReissuingPinFor(employee.id);

    try {
      const generatePin = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
      };

      let generatedPin = generatePin();
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const { data: existingEmployee } = await supabase
          .from('employees')
          .select('id')
          .eq('shop_id', shopId)
          .eq('pin', generatedPin)
          .maybeSingle();

        if (!existingEmployee) break;
        generatedPin = generatePin();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique PIN. Please try again.');
      }

      const now = new Date().toISOString();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const { error } = await supabase
        .from('employees')
        .update({
          pin: generatedPin,
          pin_change_required: true,
          last_pin_change_at: now,
          pin_expires_at: expiryDate.toISOString()
        })
        .eq('id', employee.id);

      if (error) throw error;

      setGeneratedPin(generatedPin);
      setNewEmployeeName(employee.first_name);
      setShowPinModal(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setReissuingPinFor(null);
    }
  };

  // No staff limits - all shops can add unlimited staff
  const checkStaffLimit = () => {
    return false; // Always allow adding staff
  };

  const getDaysUntilPinExpiry = (pinExpiresAt: string | null | undefined): number | null => {
    if (!pinExpiresAt) return null;
    const now = new Date();
    const expiry = new Date(pinExpiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

      return (
        <div className="w-full max-w-full overflow-x-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Management</h1>
            <button
              onClick={handleAddEmployee}
              disabled={checkStaffLimit()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add Staff Member
            </button>
          </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center text-gray-600 mb-2">
          <UsersIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Active Staff: {employees.length}</span>
        </div>
        <Link
          to={`/dashboard/${shopId}/payroll`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
        >
          <Clock className="w-4 h-4 mr-1" />
          View Payroll Report →
        </Link>
      </div>

      <div className="space-y-4">
        {employees.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No staff members yet. Add your first employee to get started.</p>
          </div>
        ) : (
          employees.map((employee) => {
            const shopName = shop.shop_name.toLowerCase().replace(/\s+/g, '-');
            const staffPortalUrl = `${window.location.origin}/${shopName}/${employee.first_name.toLowerCase()}`;

            const copyToClipboard = () => {
              navigator.clipboard.writeText(staffPortalUrl);
              alert('Link copied to clipboard!');
            };

            return (
              <div key={employee.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {employee.first_name} {employee.last_name || ''}
                    </h3>
                    {employee.phone && (
                      <p className="text-sm text-gray-600 mt-1">{employee.phone}</p>
                    )}
                    {employee.email && (
                      <p className="text-sm text-gray-600 mt-1">{employee.email}</p>
                    )}
                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">This week:</span>{' '}
                        {(weeklyStats[employee.id]?.hours || 0).toFixed(1)}h
                      </p>
                      {employee.hourly_rate && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Hourly rate:</span> £{employee.hourly_rate.toFixed(2)}
                        </p>
                      )}
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Role:</span> {employee.role === 'manager' ? 'Manager' : 'Staff'}
                      </p>
                      {(() => {
                        const daysUntilExpiry = getDaysUntilPinExpiry(employee.pin_expires_at);
                        if (daysUntilExpiry !== null) {
                          if (daysUntilExpiry <= 0) {
                            return (
                              <p className="text-sm text-red-600 font-semibold flex items-center gap-1">
                                <span>⚠️</span>
                                <span>PIN expired - Please reissue</span>
                              </p>
                            );
                          } else if (daysUntilExpiry <= 5) {
                            return (
                              <p className="text-sm text-orange-600 font-semibold">
                                🔔 PIN expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
                              </p>
                            );
                          } else {
                            return (
                              <p className="text-sm text-gray-600">
                                🔐 PIN expires in {daysUntilExpiry} days
                              </p>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReissuePin(employee)}
                      disabled={reissuingPinFor === employee.id}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Re-issue PIN"
                    >
                      <KeyRound className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditEmployee(employee)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit employee"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deactivate employee"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Staff Portal Link:</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono truncate">
                      {staffPortalUrl}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a
                      href={staffPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                      title="Open portal"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          shopId={shopId!}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
          onSave={(pin?: string, employeeName?: string) => {
            setShowModal(false);
            setEditingEmployee(null);
            loadEmployees();
            if (pin && employeeName) {
              setGeneratedPin(pin);
              setNewEmployeeName(employeeName);
              setShowPinModal(true);
            }
          }}
        />
      )}

      {showPinModal && (
        <PinDisplayModal
          pin={generatedPin}
          employeeName={newEmployeeName}
          onClose={() => {
            setShowPinModal(false);
            setGeneratedPin('');
            setNewEmployeeName('');
          }}
        />
      )}
    </div>
  );
}

interface EmployeeModalProps {
  employee: Employee | null;
  shopId: string;
  onClose: () => void;
  onSave: (generatedPin?: string, employeeName?: string) => void;
}

function EmployeeModal({ employee, shopId, onClose, onSave }: EmployeeModalProps) {
  const [firstName, setFirstName] = useState(employee?.first_name || '');
  const [lastName, setLastName] = useState(employee?.last_name || '');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [hourlyRate, setHourlyRate] = useState(employee?.hourly_rate?.toString() || '');
  const [role, setRole] = useState(employee?.role || 'staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Update form fields when employee prop changes (for editing)
  useEffect(() => {
    console.log('EmployeeModal: employee prop changed', employee);
    if (employee) {
      console.log('Setting form fields from employee:', {
        first_name: employee.first_name,
        last_name: employee.last_name,
        phone: employee.phone,
        email: employee.email,
        hourly_rate: employee.hourly_rate,
        role: employee.role
      });
      setFirstName(employee.first_name || '');
      setLastName(employee.last_name || '');
      setPhone(employee.phone || '');
      setEmail(employee.email || '');
      setHourlyRate(employee.hourly_rate?.toString() || '');
      setRole(employee.role || 'staff');
      setError('');
    } else {
      // Reset form for new employee
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setHourlyRate('');
      setRole('staff');
      setError('');
    }
  }, [employee]);

  const generatePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const employeeData: any = {
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        role: role || 'staff',
        updated_at: new Date().toISOString()
      };

      if (employee) {
        // Update existing employee
        console.log('Updating employee:', employee.id, employeeData);
        
        const { data: updatedData, error: updateError } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', employee.id)
          .select();

        if (updateError) {
          console.error('Update error details:', {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code
          });
          setError(`Failed to update: ${updateError.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
        
        console.log('Employee updated successfully:', updatedData);
        alert('Staff member updated successfully!');
        onSave();
      } else {
        let generatedPin = generatePin();
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          const { data: existingEmployee } = await supabase
            .from('employees')
            .select('id')
            .eq('shop_id', shopId)
            .eq('pin', generatedPin)
            .maybeSingle();

          if (!existingEmployee) break;
          generatedPin = generatePin();
          attempts++;
        }

        if (attempts >= maxAttempts) {
          throw new Error('Unable to generate unique PIN. Please try again.');
        }

        const now = new Date().toISOString();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        employeeData.shop_id = shopId;
        employeeData.pin = generatedPin;
        employeeData.role = role || 'staff';
        employeeData.pin_change_required = true;
        employeeData.last_pin_change_at = now;
        employeeData.pin_expires_at = expiryDate.toISOString();

        const { error: insertError } = await supabase
          .from('employees')
          .insert(employeeData);

        if (insertError) throw insertError;

        if (email) {
          setSendingEmail(true);
          try {
            const { data: shopData } = await supabase
              .from('shops')
              .select('shop_name')
              .eq('id', shopId)
              .single();

            const shopName = shopData?.shop_name || 'Shop';
            const staffName = firstName.toLowerCase();
            const shopSlug = shopName.toLowerCase().replace(/\s+/g, '-');
            const staffPortalUrl = `${window.location.origin}/${shopSlug}/${staffName}`;

            const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-staff-credentials`;
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                firstName,
                lastName: lastName || undefined,
                pin: generatedPin,
                staffPortalUrl,
                shopName,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Failed to send email:', errorData);
            }
          } catch (emailError) {
            console.error('Error sending email:', emailError);
          } finally {
            setSendingEmail(false);
          }
        }

        onSave(generatedPin, firstName);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {employee ? `Edit Staff Member${employee.first_name ? `: ${employee.first_name}` : ''}` : 'Add Staff Member'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-4">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => {
                console.log('First name changed:', e.target.value);
                setFirstName(e.target.value);
              }}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="staff@example.com"
            />
            {!employee && email && (
              <p className="text-xs text-gray-600 mt-1">
                Login link and PIN will be sent to this email address
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate (optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                disabled={loading}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="12.50"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Used for payroll calculations
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => {
                console.log('Role changed:', e.target.value);
                setRole(e.target.value);
              }}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Managers have additional permissions
            </p>
          </div>

          {employee && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Editing existing staff member.</span> Changes will be saved immediately.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || sendingEmail}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || sendingEmail}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : sendingEmail ? 'Sending Email...' : employee ? 'Update' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PinDisplayModalProps {
  pin: string;
  employeeName: string;
  onClose: () => void;
}

function PinDisplayModal({ pin, employeeName, onClose }: PinDisplayModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <KeyRound className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">PIN Generated</h2>
          <p className="text-gray-600 mb-6">
            New PIN for {employeeName}
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="text-5xl font-bold text-blue-600 tracking-wider mb-2">
              {pin}
            </div>
            <button
              onClick={handleCopy}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {copied ? 'Copied!' : 'Click to copy'}
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Important:</span>
            </p>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
              <li>Share this PIN with {employeeName} securely</li>
              <li>They must change it on their first login</li>
              <li>PIN expires after 30 days</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
