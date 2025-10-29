import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Star, Search, Users } from 'lucide-react';
import { maskPhone } from '../../utils/maskCustomerData';

export default function CustomersPage() {
  const { shopId } = useParams();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [shopId]);

  const loadCustomers = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .order('last_visit_at', { ascending: false });

      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    (c.name?.toLowerCase().includes(search.toLowerCase())) ||
    c.phone.includes(search)
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">All Customers</h1>
          <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
            {customers.length} total
          </span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No customers found</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredCustomers.map((customer) => (
              <Link
                key={customer.id}
                to={`/dashboard/${shopId}/customers/${customer.id}`}
                className="group flex justify-between items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(customer.name || customer.phone).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600">
                      {customer.name || 'Unnamed Customer'}
                    </h3>
                    <p className="text-sm text-gray-600">{maskPhone(customer.phone)}</p>
                    <div className="flex items-center mt-1">
                      {Array.from({ length: Math.min(customer.current_points, 6) }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="ml-2 text-xs text-gray-600">
                        {customer.current_points} points
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{customer.total_visits} visits</div>
                  <div className="text-xs text-gray-600">{customer.rewards_redeemed} rewards</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
