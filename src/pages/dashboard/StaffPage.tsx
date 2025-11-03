import { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { UserPlus, Clock, Users as UsersIcon, Trash2, ExternalLink, Copy, KeyRound, Pencil, Lock } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { useOwnerPinProtection } from '../../hooks/useOwnerPinProtection';
import { useDestructiveAction } from '../../hooks/useDestructiveAction';
import { PINConfirmationModal } from '../../components/PINConfirmationModal';

interface Shop {
  id: string;
  plan_type: 'basic' | 'pro';
  shop_name: string;
  slug?: string | null;
  short_code?: string | null;
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
  pin?: string;
  pin_expires_at?: string | null;
  payment_type?: 'hourly' | 'commission' | 'hybrid' | null;
  commission_percentage?: number | null;
  base_hourly_rate?: number | null;
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

  // PIN protection
  const { isUnlocked, checking, showPinModal, PinProtectionModal } = useOwnerPinProtection({
    shopId,
    onCancel: () => navigate('/dashboard'),
  });

  // Destructive action confirmation
  const { 
    confirmDestructiveAction, 
    modalConfig, 
    isModalOpen, 
    handleConfirm, 
    handleCancel 
  } = useDestructiveAction();

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<any>({});
  const [showPinDisplayModal, setShowPinDisplayModal] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [reissuingPinFor, setReissuingPinFor] = useState<string | null>(null);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!shopLoading && paramShopId) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
    if (shopId && shop && isUnlocked) {
      loadShop();
      if (shop.plan_type === 'pro') {
        loadEmployees();
        loadWeeklyStats();
      } else {
        // For basic plan, still load employees but limit functionality
        loadEmployees();
        setLoading(false);
      }
    }
  }, [shopId, shop, paramShopId, hasAccess, shopLoading, navigate, isUnlocked]);

  const loadShop = async () => {
    if (!shopId) return;
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, slug, short_code')
        .eq('id', shopId)
        .single();
      if (error) throw error;
      if (data) {
        setShopData(data as Shop);
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  const loadEmployees = async () => {
    if (!shopId) return;
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, phone, email, hourly_rate, role, active, photo_url, pin_expires_at, payment_type, commission_percentage, base_hourly_rate, pin')
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

  const handleDeleteEmployee = async (employee: Employee) => {
    // Get employee details for better confirmation message
    const confirmed = await confirmDestructiveAction({
      title: `Deactivate ${employee.first_name} ${employee.last_name || ''}?`,
      message: `This will deactivate this staff member. They will no longer be able to clock in or access the staff portal. You can reactivate them later if needed.`,
      warningText: 'The staff member will lose access immediately',
      actionType: 'danger'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({ active: false })
        .eq('id', employee.id);

      if (error) throw error;
      
      setMessage({ type: 'success', text: `${employee.first_name} has been deactivated` });
      setTimeout(() => setMessage(null), 3000);
      loadEmployees();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to deactivate employee' });
      setTimeout(() => setMessage(null), 3000);
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
      setShowPinDisplayModal(true);
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

  // Show PIN modal if not unlocked
  if (checking || showPinModal) {
    return (
      <>
        <PinProtectionModal />
        {showPinModal && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">PIN required to access staff management</p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!isUnlocked) {
    return (
      <>
        <PinProtectionModal />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">PIN required to access staff management</p>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

      return (
        <>
          <PinProtectionModal />
          <PINConfirmationModal
            isOpen={isModalOpen}
            title={modalConfig?.title || ''}
            message={modalConfig?.message || ''}
            warningText={modalConfig?.warningText}
            actionType={modalConfig?.actionType}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-gray-600">
            <UsersIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">Active Staff: {employees.length}</span>
          </div>
        </div>
        <div className="border-t pt-4 space-y-4">
          {/* Staff Access Link (Quick Clock In/Out) */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Staff Access Link (Quick Clock In/Out):</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono truncate">
                {shopData?.short_code 
                  ? `${window.location.origin}/s/${shopData.short_code}`
                  : `${window.location.origin}/staff/${shopId}/clock-in`}
              </div>
              <button
                onClick={() => {
                  const link = shopData?.short_code 
                    ? `${window.location.origin}/s/${shopData.short_code}`
                    : `${window.location.origin}/staff/${shopId}/clock-in`;
                  navigator.clipboard.writeText(link);
                  alert('Staff access link copied to clipboard!');
                }}
                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Copy link"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={shopData?.short_code ? `/s/${shopData.short_code}` : `/staff/${shopId}/clock-in`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                title="Open access link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {shopData?.short_code 
                ? `Short URL: digiget.uk/s/${shopData.short_code} - Easy to share and remember!`
                : 'Quick access for clock in/out. Shows working time and clock out button when clocked in.'}
            </p>
          </div>

          {/* Staff Portal Link (Full Portal) */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Staff Portal Link (Full Portal):</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono truncate">
                {shopData?.short_code 
                  ? `${window.location.origin}/staff/${shopData.short_code}`
                  : shopData?.slug 
                    ? `${window.location.origin}/staff-portal/${shopData.slug}`
                    : `${window.location.origin}/staff-portal/${shopId}`}
              </div>
              <button
                onClick={() => {
                  const link = shopData?.short_code 
                    ? `${window.location.origin}/staff/${shopData.short_code}`
                    : shopData?.slug 
                      ? `${window.location.origin}/staff-portal/${shopData.slug}`
                      : `${window.location.origin}/staff-portal/${shopId}`;
                  navigator.clipboard.writeText(link);
                  alert('Staff portal link copied to clipboard!');
                }}
                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Copy link"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={shopData?.short_code 
                  ? `/staff/${shopData.short_code}` 
                  : shopData?.slug 
                    ? `/staff-portal/${shopData.slug}` 
                    : `/staff-portal/${shopId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                title="Open portal"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {shopData?.short_code 
                ? `Staff Portal: digiget.uk/staff/${shopData.short_code} - Full portal with customer management, tasks, and more.`
                : 'Full portal with customer management, tasks, and more. Shows working time and clock out button when clocked in. Both links stay in sync.'}
            </p>
          </div>
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
                        <span className="font-medium">PIN:</span> {employee.pin}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">This week:</span>{' '}
                        {(weeklyStats[employee.id]?.hours || 0).toFixed(1)}h
                      </p>
                      {/* Payment Information */}
                      {employee.payment_type === 'hourly' && employee.hourly_rate && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Payment:</span> £{employee.hourly_rate.toFixed(2)}/hour
                        </p>
                      )}
                      {employee.payment_type === 'commission' && employee.commission_percentage !== null && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Payment:</span> {employee.commission_percentage}% commission
                        </p>
                      )}
                      {employee.payment_type === 'hybrid' && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Payment:</span> £{employee.base_hourly_rate?.toFixed(2) || '0.00'}/hr + {employee.commission_percentage || 0}% commission
                        </p>
                      )}
                      {!employee.payment_type && employee.hourly_rate && (
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
                      onClick={() => handleDeleteEmployee(employee)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deactivate employee"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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
              setShowPinDisplayModal(true);
            }
          }}
        />
      )}

      {showPinDisplayModal && (
        <PinDisplayModal
          pin={generatedPin}
          employeeName={newEmployeeName}
          onClose={() => {
            setShowPinDisplayModal(false);
            setGeneratedPin('');
            setNewEmployeeName('');
          }}
        />
      )}
          </div>
        </>
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
  const [paymentType, setPaymentType] = useState<'hourly' | 'commission' | 'hybrid'>(employee?.payment_type || 'hourly');
  const [commissionRate, setCommissionRate] = useState(employee?.commission_percentage?.toString() || '');
  const [baseHourlyRate, setBaseHourlyRate] = useState(employee?.base_hourly_rate?.toString() || '');
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
      setPaymentType(employee?.payment_type || 'hourly');
      setCommissionRate(employee?.commission_percentage?.toString() || '');
      setBaseHourlyRate(employee?.base_hourly_rate?.toString() || '');
      setError('');
    } else {
      // Reset form for new employee
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setHourlyRate('');
      setRole('staff');
      setPaymentType('hourly');
      setCommissionRate('');
      setBaseHourlyRate('');
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
        role: role || 'staff',
        payment_type: paymentType,
        updated_at: new Date().toISOString()
      };

      // Set rates based on payment type
      if (paymentType === 'hourly') {
        employeeData.hourly_rate = hourlyRate ? parseFloat(hourlyRate) : null;
        employeeData.commission_percentage = 0;
        employeeData.base_hourly_rate = 0;
      } else if (paymentType === 'commission') {
        employeeData.hourly_rate = 0;
        employeeData.commission_percentage = commissionRate ? parseFloat(commissionRate) : 0;
        employeeData.base_hourly_rate = 0;
      } else if (paymentType === 'hybrid') {
        employeeData.hourly_rate = baseHourlyRate ? parseFloat(baseHourlyRate) : null;
        employeeData.commission_percentage = commissionRate ? parseFloat(commissionRate) : 0;
        employeeData.base_hourly_rate = baseHourlyRate ? parseFloat(baseHourlyRate) : 0;
      }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {employee ? `Edit Staff Member${employee.first_name ? `: ${employee.first_name}` : ''}` : 'Add Staff Member'}
        </h2>
        
        {/* Debug: Payment type selector should appear here after Email field */}

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

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Select how this staff member gets paid. Commission options will appear below.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('hourly')}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                  paymentType === 'hourly'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <div className="text-lg mb-1">💰</div>
                <div className="text-xs">Hourly</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('commission')}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                  paymentType === 'commission'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <div className="text-lg mb-1">📈</div>
                <div className="text-xs">Commission</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('hybrid')}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                  paymentType === 'hybrid'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <div className="text-lg mb-1">💎</div>
                <div className="text-xs">Hybrid</div>
              </button>
            </div>
          </div>

          {/* Hourly Rate (for hourly or hybrid) */}
          {(paymentType === 'hourly' || paymentType === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {paymentType === 'hybrid' ? 'Base Hourly Rate *' : 'Hourly Rate *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentType === 'hybrid' ? baseHourlyRate : hourlyRate}
                  onChange={(e) => {
                    if (paymentType === 'hybrid') {
                      setBaseHourlyRate(e.target.value);
                    } else {
                      setHourlyRate(e.target.value);
                    }
                  }}
                  disabled={loading}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="12.50"
                  required={paymentType === 'hourly' || paymentType === 'hybrid'}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {paymentType === 'hybrid' ? 'Base hourly wage (commission added on top)' : 'Used for payroll calculations'}
              </p>
            </div>
          )}

          {/* Commission Rate (for commission or hybrid) */}
          {(paymentType === 'commission' || paymentType === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Rate *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  disabled={loading}
                  className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="50"
                  required
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {paymentType === 'commission' 
                  ? 'Staff earns this % of total bill amounts'
                  : 'Staff earns hourly wage + this % of bill amounts'}
              </p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 font-semibold mb-1">Payment Summary:</p>
            {paymentType === 'hourly' && (
              <p className="text-sm text-blue-700">
                <strong>{firstName || 'Staff'}</strong> will earn{' '}
                <strong>£{hourlyRate || '0.00'}/hour</strong>
              </p>
            )}
            {paymentType === 'commission' && (
              <p className="text-sm text-blue-700">
                <strong>{firstName || 'Staff'}</strong> will earn{' '}
                <strong>{commissionRate || '0'}%</strong> commission on all sales
              </p>
            )}
            {paymentType === 'hybrid' && (
              <p className="text-sm text-blue-700">
                <strong>{firstName || 'Staff'}</strong> will earn{' '}
                <strong>£{baseHourlyRate || '0.00'}/hour</strong> +{' '}
                <strong>{commissionRate || '0'}%</strong> commission
              </p>
            )}
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
