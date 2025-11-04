import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  phone: string | null;
  name: string | null;
  current_points: number;
  total_visits: number;
  last_visit_at?: string;
  classification?: 'New' | 'Repeat' | 'VIP' | 'Regular' | null;
}

interface StaffCustomerManagementProps {
  employeeId: string;
  shopId: string;
}

export default function StaffCustomerManagement({ employeeId, shopId }: StaffCustomerManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [shop, setShop] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [employee, setEmployee] = useState<any>(null);
  const [updatingClassification, setUpdatingClassification] = useState(false);

  useEffect(() => {
    loadShop();
    loadEmployee();
  }, [shopId, employeeId]);

  const loadEmployee = async () => {
    if (!employeeId) return;
    const { data } = await supabase
      .from('employees')
      .select('*, payment_type, commission_percentage, base_hourly_rate, hourly_rate')
      .eq('id', employeeId)
      .maybeSingle();
    setEmployee(data);
  };

  const loadShop = async () => {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .maybeSingle();

    setShop(data);
  };

  const searchCustomers = async () => {
    if (!searchTerm.trim()) {
      setCustomers([]);
      setSelectedCustomer(null);
      setCustomerName('');
      setBillAmount('');
      setEditingName(false);
      setEditName('');
      return;
    }

    setLoading(true);
    try {
      // Clear previous selection when searching
      setSelectedCustomer(null);
      setCustomerName('');
      setBillAmount('');
      setEditingName(false);
      setEditName('');

      // Search by phone or name (PostgREST doesn't support UUID casting in filters)
      const searchPattern = `%${searchTerm}%`;
      
      // Check if search term is a full UUID
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm);
      
      let data = null;
      
      if (isUUIDFormat) {
        // If it's a full UUID, search by ID directly first
        const { data: uuidData, error: uuidError } = await supabase
          .from('customers')
          .select('*, classification')
          .eq('shop_id', shopId)
          .eq('id', searchTerm)
          .eq('active', true)
          .maybeSingle();
        
        if (!uuidError && uuidData) {
          data = [uuidData];
        }
      }
      
      // Always search by phone and name (even if UUID search found something, to show all matches)
      const { data: searchData, error } = await supabase
        .from('customers')
        .select('*, classification')
        .eq('shop_id', shopId)
        .or(`phone.ilike.${searchPattern},name.ilike.${searchPattern}`)
        .eq('active', true)
        .order('last_visit_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Combine results if UUID search found something
      if (data && data.length > 0) {
        // Merge UUID result with search results, removing duplicates
        const combined = [...data];
        if (searchData) {
          searchData.forEach(customer => {
            if (!combined.find(c => c.id === customer.id)) {
              combined.push(customer);
            }
          });
        }
        setCustomers(combined.slice(0, 10));
      } else {
        setCustomers(searchData || []);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewCustomer = async () => {
    // Allow creating guest with no information - will generate anonymous guest ID
    setLoading(true);
    try {
      // Generate a guest ID if no phone or name provided
      const phone = searchTerm.trim() || null;
      const name = customerName.trim() || null;
      const customerDisplayName = name || (phone ? `Guest ${phone.slice(-4)}` : `Guest ${Date.now().toString().slice(-6)}`);
      
      // Only give points to customers with phone numbers (not guests)
      const isGuest = !phone;
      const initialPoints = isGuest ? 0 : 1;
      const initialVisits = isGuest ? 0 : 1;

      // Create customer - guests get 0 points, customers with phone get 1 point
      const { data, error } = await supabase
        .from('customers')
        .insert({
          shop_id: shopId,
          phone: phone,
          name: name || customerDisplayName,
          current_points: initialPoints,
          lifetime_points: initialPoints,
          total_visits: initialVisits,
          last_visit_at: isGuest ? null : new Date().toISOString(),
          classification: 'New', // Default to New for all customers
        })
        .select()
        .single();

      if (error) throw error;

      // Create loyalty transaction for the automatic point (only if not a guest)
      if (!isGuest) {
        const { error: transError } = await supabase
          .from('loyalty_transactions')
          .insert({
            shop_id: shopId,
            customer_id: data.id,
            transaction_type: 'point_added',
            points_change: 1,
            balance_after: 1,
            added_by_employee_id: employeeId,
            notes: 'Welcome point - new customer',
          });

        if (transError) {
          console.warn('Failed to create loyalty transaction for new customer:', transError);
          // Continue even if transaction creation fails
        }
      }

      setSelectedCustomer(data);
      setCustomers([]);
      setSearchTerm('');
      setCustomerName('');
      setBillAmount('');
      setEditingName(false);
      setEditName('');
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async () => {
    if (!selectedCustomer || !shop) return;

    if (selectedCustomer.current_points < shop.points_needed) {
      alert('Customer does not have enough points');
      return;
    }

    setLoading(true);
    try {
      const newPoints = selectedCustomer.current_points - shop.points_needed;

      const { error: customerError } = await supabase
        .from('customers')
        .update({
          current_points: newPoints,
          rewards_redeemed: selectedCustomer.total_visits + 1,
        })
        .eq('id', selectedCustomer.id);

      if (customerError) throw customerError;

      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          shop_id: shopId,
          customer_id: selectedCustomer.id,
          transaction_type: 'reward_redeemed',
          points_change: -shop.points_needed,
          balance_after: newPoints,
          added_by_employee_id: employeeId,
        });

      if (transactionError) throw transactionError;

      setSelectedCustomer({
        ...selectedCustomer,
        current_points: newPoints,
      });

      alert(`Reward redeemed! Customer gets: ${shop.reward_description}`);
    } catch (err) {
      console.error('Error redeeming reward:', err);
      alert('Failed to redeem reward');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!selectedCustomer) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ name: editName.trim() || null })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      setSelectedCustomer({
        ...selectedCustomer,
        name: editName.trim() || null,
      });

      setEditingName(false);
      setEditName('');
      alert('Customer name updated successfully');
    } catch (err) {
      console.error('Error updating name:', err);
      alert('Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClassification = async (classification: 'New' | 'Repeat') => {
    if (!selectedCustomer) return;

    setUpdatingClassification(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ classification: classification })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      setSelectedCustomer({
        ...selectedCustomer,
        classification: classification,
      });

      alert(`Customer marked as ${classification}`);
    } catch (err) {
      console.error('Error updating classification:', err);
      alert('Failed to update classification');
    } finally {
      setUpdatingClassification(false);
    }
  };

  const handleCompleteTransaction = async () => {
    if (!selectedCustomer) return;

    // Validate bill amount is required
    const billValue = billAmount ? parseFloat(billAmount) : 0;
    if (!billAmount || isNaN(billValue) || billValue <= 0) {
      alert('Please enter a valid bill amount');
      return;
    }

    // Check if staff is clocked in
    if (!employeeId) {
      alert('Staff ID is required');
      return;
    }

    setLoading(true);
    try {
      // Verify staff is clocked in before allowing check-in
      const { data: clockEntry, error: clockError } = await supabase
        .from('clock_entries')
        .select('id, clock_in_time')
        .eq('employee_id', employeeId)
        .eq('shop_id', shopId)
        .is('clock_out_time', null)
        .order('clock_in_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (clockError) {
        console.error('Error checking clock status:', clockError);
        alert('Unable to verify clock status. Please try again.');
        setLoading(false);
        return;
      }

      if (!clockEntry) {
        alert('You must clock in before checking in customers. Please clock in first.');
        setLoading(false);
        return;
      }
      // Check cooldown period for automatic point
      const daysBetweenPoints = shop?.days_between_points || 7;
      const lastVisitDate = selectedCustomer.last_visit_at 
        ? new Date(selectedCustomer.last_visit_at)
        : null;

      let pointAdded = false;
      let newPoints = selectedCustomer.current_points;
      let newTotalVisits = selectedCustomer.total_visits;

      // Check if point can be added (cooldown period check)
      if (lastVisitDate) {
        const daysSinceLastVisit = Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastVisit >= daysBetweenPoints) {
          // Can add point - add automatically
          newPoints = selectedCustomer.current_points + 1;
          newTotalVisits = selectedCustomer.total_visits + 1;
          pointAdded = true;
        } else {
          // Cannot add point yet - show message but still record transaction
          const remainingDays = daysBetweenPoints - daysSinceLastVisit;
          const shouldContinue = confirm(
            `Customer visited ${daysSinceLastVisit} day${daysSinceLastVisit !== 1 ? 's' : ''} ago. ` +
            `Need to wait ${remainingDays} more day${remainingDays !== 1 ? 's' : ''} before next point.\n\n` +
            `Transaction will be recorded but no point will be added. Continue?`
          );
          
          if (!shouldContinue) {
            setLoading(false);
            return;
          }
          
          // Still update visit count but not points
          newTotalVisits = selectedCustomer.total_visits + 1;
        }
      } else {
        // First visit - add point automatically
        newPoints = selectedCustomer.current_points + 1;
        newTotalVisits = selectedCustomer.total_visits + 1;
        pointAdded = true;
      }

      // Calculate commission if bill amount provided and employee has commission
      // Re-fetch employee data to ensure we have latest commission_percentage
      let commissionEarned = 0;
      if (billValue > 0 && employee) {
        // Get latest employee data to ensure accurate commission rate
        const { data: latestEmployee } = await supabase
          .from('employees')
          .select('payment_type, commission_percentage')
          .eq('id', employeeId)
          .maybeSingle();

        const employeeData = latestEmployee || employee;
        
        if (employeeData.payment_type === 'commission' || employeeData.payment_type === 'hybrid') {
          const commissionRate = parseFloat(employeeData.commission_percentage?.toString() || '0');
          
          if (commissionRate > 0 && commissionRate <= 100) {
            commissionEarned = (billValue * commissionRate) / 100;
            // Round to 2 decimal places for currency
            commissionEarned = Math.round(commissionEarned * 100) / 100;
            
            // SECURITY: Don't log employee IDs or commission details
            console.log('Commission calculation completed (details hidden for security)');
          } else {
            // SECURITY: Don't log employee IDs
            console.warn('Invalid commission percentage (employee details hidden)');
          }
        }
      }

      // Update customer record
      const updateData: any = {
        total_visits: newTotalVisits,
        last_visit_at: new Date().toISOString(),
      };

      if (pointAdded) {
        updateData.current_points = newPoints;
        updateData.lifetime_points = (selectedCustomer.current_points || 0) + 1;
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', selectedCustomer.id);

      if (updateError) throw updateError;

      // Create loyalty transaction if point was added
      if (pointAdded) {
        const { error: transError } = await supabase
          .from('loyalty_transactions')
          .insert({
            shop_id: shopId,
            customer_id: selectedCustomer.id,
            transaction_type: 'point_added',
            points_change: 1,
            balance_after: newPoints,
            added_by_employee_id: employeeId,
          });

        if (transError) throw transError;
      }

      // Create customer visit/checkin record with bill amount
      // Build visit data with only fields that might exist
      const visitData: any = {
        shop_id: shopId,
        customer_id: selectedCustomer.id,
        visit_date: new Date().toISOString(),
      };

      // Add optional fields if they exist (will be added dynamically if insert fails)
      if (employeeId) {
        visitData.checked_in_by_employee_id = employeeId;
      }
      
      // Try with bill_amount and commission first
      visitData.bill_amount = billValue;
      visitData.commission_earned = commissionEarned;

      let visitInserted = false;
      
      // Try customer_visits first (customer_checkins may not exist)
      const { error: visitError } = await supabase
        .from('customer_visits')
        .insert(visitData)
        .select()
        .single();

      if (!visitError) {
        visitInserted = true;
      } else if (visitError.code === 'PGRST204') {
        // Column doesn't exist - try without bill_amount and commission_earned
        console.warn('bill_amount column not found, creating visit without bill/commission:', visitError);
        const fallbackData: any = {
          shop_id: shopId,
          customer_id: selectedCustomer.id,
          visit_date: new Date().toISOString(),
        };
        if (employeeId) {
          fallbackData.checked_in_by_employee_id = employeeId;
        }

        const { error: fallbackError } = await supabase
          .from('customer_visits')
          .insert(fallbackData)
          .select()
          .single();

        if (!fallbackError) {
          visitInserted = true;
          console.warn('Visit created without bill_amount column. Please run add_bill_amount_to_customer_visits.sql migration.');
        } else {
          console.warn('Could not create visit record (fallback):', fallbackError);
        }
      } else if (visitError.code === 'PGRST205' || visitError.message?.includes('Could not find the table')) {
        // customer_visits doesn't exist, try customer_checkins as fallback
        const { error: checkinError } = await supabase
          .from('customer_checkins')
          .insert(visitData)
          .select()
          .single();

        if (!checkinError) {
          visitInserted = true;
        } else {
          console.warn('Could not create checkin record:', checkinError);
        }
      } else {
        console.warn('Could not create visit record:', visitError);
      }

      // Record employee contribution if commission earned
      if (commissionEarned > 0 && visitInserted) {
        await supabase
          .from('employee_contributions')
          .insert({
            shop_id: shopId,
            employee_id: employeeId,
            contribution_date: new Date().toISOString().split('T')[0],
            bill_amount: billValue,
            commission_earned: commissionEarned,
            total_earnings: commissionEarned, // Will add hourly wages in payroll calculation
          });
      }

      // Update selected customer state
      setSelectedCustomer({
        ...selectedCustomer,
        current_points: newPoints,
        total_visits: newTotalVisits,
      });

      // Reset bill amount
      setBillAmount('');

      // Show success message
      const pointMsg = pointAdded 
        ? `Point added automatically! ` 
        : `Visit recorded (no point added - waiting period). `;
      
      const successMsg = `${pointMsg}Bill: £${billValue.toFixed(2)}`;
      
      alert(successMsg);
    } catch (err) {
      console.error('Error completing transaction:', err);
      alert('Failed to complete transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
          placeholder="Search by phone, name, or customer ID..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        onClick={searchCustomers}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>


      {/* Show create customer form when no customer is selected */}
      {!selectedCustomer && !loading && (
        <>
          {/* Show search results if found */}
          {customers.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg divide-y">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setCustomers([]);
                    setSearchTerm('');
                    setCustomerName('');
                    setBillAmount('');
                    setEditingName(false);
                    setEditName('');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{customer.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{customer.phone || 'No phone'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">{customer.current_points} points</p>
                      <p className="text-xs text-gray-500">{customer.total_visits} visits</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {/* Show create guest button when no results or no search performed */}
          {(customers.length === 0 || !searchTerm) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              {searchTerm && customers.length === 0 ? (
                <p className="text-gray-600 mb-4">No customer found</p>
              ) : null}
              <button
                onClick={createNewCustomer}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                {loading ? 'Creating Guest...' : 'Create Guest'}
              </button>
              <p className="text-xs text-gray-500 mt-3">Creates an anonymous guest customer with 0 points</p>
            </div>
          )}
        </>
      )}

      {selectedCustomer && shop && (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-6 space-y-4">
          <div className="text-center">
            {!editingName ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedCustomer.name || selectedCustomer.phone || `Guest Customer`}
                </h3>
                <p className="text-gray-600">
                  {selectedCustomer.phone ? selectedCustomer.phone : 'No phone number'}
                  <span className="ml-2 text-xs text-gray-400">ID: {selectedCustomer.id.slice(0, 8)}...</span>
                </p>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <button
                    onClick={() => {
                      setEditingName(true);
                      setEditName(selectedCustomer.name || '');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Edit Name
                  </button>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-600">
                    Status: <span className="font-semibold">{selectedCustomer.classification || 'New'}</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter customer full name"
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                  autoFocus
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleUpdateName}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setEditName('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Current Points</p>
            <p className="text-5xl font-bold text-blue-600 mb-2">
              {selectedCustomer.current_points}
            </p>
            <p className="text-sm text-gray-600">
              {shop.points_needed - selectedCustomer.current_points > 0
                ? `${shop.points_needed - selectedCustomer.current_points} more points until reward`
                : 'Ready to redeem!'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">{selectedCustomer.total_visits}</p>
              <p className="text-sm text-gray-600">Total Visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{shop.points_needed}</p>
              <p className="text-sm text-gray-600">Points Needed</p>
            </div>
          </div>

          {/* Classification Selector */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Mark Customer As:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateClassification('New')}
                disabled={updatingClassification || selectedCustomer.classification === 'New'}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  selectedCustomer.classification === 'New'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectedCustomer.classification === 'New' ? '✓ New' : 'New'}
              </button>
              <button
                onClick={() => handleUpdateClassification('Repeat')}
                disabled={updatingClassification || selectedCustomer.classification === 'Repeat'}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  selectedCustomer.classification === 'Repeat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectedCustomer.classification === 'Repeat' ? '✓ Repeat' : 'Repeat'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Bill Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Bill Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">£</span>
                <input
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the total bill amount. Point will be added automatically if waiting period has passed.
              </p>
              {selectedCustomer.last_visit_at && (() => {
                const daysBetweenPoints = shop?.days_between_points || 7;
                const lastVisitDate = new Date(selectedCustomer.last_visit_at);
                const daysSinceLastVisit = Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
                const remainingDays = daysBetweenPoints - daysSinceLastVisit;
                
                if (remainingDays > 0) {
                  return (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        ⚠️ {remainingDays} more day{remainingDays !== 1 ? 's' : ''} until next point can be added
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700">
                        ✓ Point will be added automatically
                      </p>
                    </div>
                  );
                }
              })()}
            </div>

            <button
              onClick={handleCompleteTransaction}
              disabled={loading || !billAmount || parseFloat(billAmount) <= 0}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Complete Transaction'}
            </button>

            {selectedCustomer.current_points >= shop.points_needed && (
              <button
                onClick={redeemReward}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-300"
              >
                Redeem Reward: {shop.reward_description}
              </button>
            )}

            <button
              onClick={() => {
                setSelectedCustomer(null);
                setCustomerName('');
                setEditingName(false);
                setEditName('');
                setBillAmount('');
              }}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
