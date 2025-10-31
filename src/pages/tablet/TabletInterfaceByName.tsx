import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import TabletInterface from './TabletInterface';

/**
 * Wrapper component for TabletInterface that allows access via staff name/identifier
 * Route: /xtra/:staffIdentifier
 * This component looks up the staff member and shop, then renders TabletInterface
 */
export default function TabletInterfaceByName() {
  const { staffIdentifier } = useParams();
  const [shopId, setShopId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lookupStaffAndShop = async () => {
      if (!staffIdentifier) {
        setError('Staff identifier is required');
        setLoading(false);
        return;
      }

      try {
        // Try to find employee by first_name (case-insensitive)
        const normalizedIdentifier = staffIdentifier.toLowerCase().replace(/-/g, ' ');
        
        // First try exact match
        const { data: exactMatch, error: exactError } = await supabase
          .from('employees')
          .select('id, shop_id, first_name, last_name')
          .eq('active', true)
          .ilike('first_name', staffIdentifier);

        if (!exactError && exactMatch && exactMatch.length > 0) {
          setShopId(exactMatch[0].shop_id);
          setEmployeeId(exactMatch[0].id);
          setLoading(false);
          return;
        }

        // Try case-insensitive partial match
        const { data: employees, error: employeeError } = await supabase
          .from('employees')
          .select('id, shop_id, first_name, last_name')
          .eq('active', true)
          .ilike('first_name', `%${normalizedIdentifier}%`);

        if (employeeError) {
          throw employeeError;
        }

        if (!employees || employees.length === 0) {
          setError(`Staff member "${staffIdentifier}" not found`);
          setLoading(false);
          return;
        }

        // Use the first matching employee's shop_id and id
        setShopId(employees[0].shop_id);
        setEmployeeId(employees[0].id);
      } catch (err: any) {
        console.error('Error looking up staff:', err);
        setError(err.message || 'Failed to look up staff member');
      } finally {
        setLoading(false);
      }
    };

    lookupStaffAndShop();
  }, [staffIdentifier]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            Please check the URL or contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Not Found</h2>
          <p className="text-gray-600">Unable to find shop for staff member "{staffIdentifier}"</p>
        </div>
      </div>
    );
  }

  // Render TabletInterface with the found shopId and employeeId as props
  return <TabletInterface shopId={shopId} employeeId={employeeId || undefined} />;
}

