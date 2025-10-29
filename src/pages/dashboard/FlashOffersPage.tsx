import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, X, Zap, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';

interface FlashOffer {
  id: string;
  offer_text: string;
  offer_type: 'percentage' | 'fixed_amount' | 'free_item' | null;
  offer_value: number | null;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
  target_classifications: string[] | null;
  created_at: string;
}

interface Shop {
  plan_type: 'basic' | 'pro';
}

export default function FlashOffersPage() {
  const { shopId } = useParams();
  const [offers, setOffers] = useState<FlashOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);

  const [newOffer, setNewOffer] = useState({
    offer_text: '',
    offer_type: 'percentage' as 'percentage' | 'fixed_amount' | 'free_item',
    offer_value: '',
    starts_at: '',
    ends_at: '',
    target_classifications: [] as string[],
  });

  const toggleClassification = (classification: string) => {
    setNewOffer(prev => {
      const current = prev.target_classifications || [];
      if (current.includes(classification)) {
        return { ...prev, target_classifications: current.filter(c => c !== classification) };
      } else {
        return { ...prev, target_classifications: [...current, classification] };
      }
    });
  };

  useEffect(() => {
    loadShop();
    loadOffers();
  }, [shopId]);

  const loadShop = async () => {
    if (!shopId) return;
    try {
      const { data } = await supabase
        .from('shops')
        .select('plan_type')
        .eq('id', shopId)
        .single();
      setShop(data);
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  const loadOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('flash_offers')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('flash_offers').insert({
        shop_id: shopId,
        offer_text: newOffer.offer_text,
        offer_type: newOffer.offer_type,
        offer_value: newOffer.offer_value ? parseFloat(newOffer.offer_value) : null,
        starts_at: newOffer.starts_at || new Date().toISOString(),
        ends_at: newOffer.ends_at || null,
        target_classifications: newOffer.target_classifications.length > 0 ? newOffer.target_classifications : null,
        active: true,
      });

      if (error) throw error;

      setShowNewModal(false);
      setNewOffer({
        offer_text: '',
        offer_type: 'percentage',
        offer_value: '',
        starts_at: '',
        ends_at: '',
        target_classifications: [],
      });
      loadOffers();
      alert('Flash offer created successfully!');
    } catch (error: any) {
      console.error('Error creating offer:', error);
      alert(error.message || 'Failed to create offer');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('flash_offers')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      loadOffers();
    } catch (error: any) {
      console.error('Error toggling offer:', error);
      alert(error.message || 'Failed to toggle offer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const { error } = await supabase.from('flash_offers').delete().eq('id', id);

      if (error) throw error;
      loadOffers();
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      alert(error.message || 'Failed to delete offer');
    }
  };

  const activeOffers = offers.filter((o) => o.active);
  const inactiveOffers = offers.filter((o) => !o.active);

  if (loading || !shop) {
    return <div>Loading...</div>;
  }

  if (shop.plan_type === 'basic') {
    return (
      <div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Pro Feature</h2>
          <p className="text-yellow-800 mb-4">
            Flash offers (Deals) are only available on the Pro plan.
          </p>
          <Link
            to={`/dashboard/${shopId}/settings`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Flash Offers</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Flash Offer
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-900 text-sm">
          Flash offers appear on the tablet check-in interface to promote special deals to customers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Active Offers</p>
              <p className="text-2xl font-bold text-gray-900">{activeOffers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Total Offers</p>
              <p className="text-2xl font-bold text-gray-900">{offers.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {activeOffers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Offers</h2>
            <div className="space-y-3">
              {activeOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white border-2 border-green-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{offer.offer_text}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {offer.offer_type && offer.offer_value && (
                          <p>
                            <strong>Value:</strong>{' '}
                            {offer.offer_type === 'percentage' && `${offer.offer_value}%`}
                            {offer.offer_type === 'fixed_amount' && `£${offer.offer_value}`}
                            {offer.offer_type === 'free_item' && offer.offer_value}
                          </p>
                        )}
                        <p>
                          <strong>Started:</strong>{' '}
                          {new Date(offer.starts_at).toLocaleString('en-GB')}
                        </p>
                        {offer.ends_at && (
                          <p>
                            <strong>Ends:</strong> {new Date(offer.ends_at).toLocaleString('en-GB')}
                          </p>
                        )}
                        {offer.target_classifications && offer.target_classifications.length > 0 && (
                          <p>
                            <strong>Target:</strong>{' '}
                            <span className="inline-flex gap-1 mt-1">
                              {offer.target_classifications.map((c) => (
                                <span
                                  key={c}
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    c === 'VIP'
                                      ? 'bg-purple-100 text-purple-700'
                                      : c === 'Regular'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {c}
                                </span>
                              ))}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(offer.id, offer.active)}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                      >
                        <ToggleRight className="w-4 h-4" />
                        Deactivate
                      </button>
                      <button
                        onClick={() => handleDelete(offer.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {inactiveOffers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inactive Offers</h2>
            <div className="space-y-3">
              {inactiveOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm opacity-75"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-700">{offer.offer_text}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {offer.offer_type && offer.offer_value && (
                          <p>
                            <strong>Value:</strong>{' '}
                            {offer.offer_type === 'percentage' && `${offer.offer_value}%`}
                            {offer.offer_type === 'fixed_amount' && `£${offer.offer_value}`}
                            {offer.offer_type === 'free_item' && offer.offer_value}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(offer.id, offer.active)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <ToggleLeft className="w-4 h-4" />
                        Activate
                      </button>
                      <button
                        onClick={() => handleDelete(offer.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {offers.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No flash offers yet. Create your first offer!</p>
          </div>
        )}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">New Flash Offer</h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offer Text *
                </label>
                <input
                  type="text"
                  required
                  value={newOffer.offer_text}
                  onChange={(e) => setNewOffer({ ...newOffer, offer_text: e.target.value })}
                  placeholder="e.g., 20% off all services today!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Type</label>
                <select
                  value={newOffer.offer_type}
                  onChange={(e) =>
                    setNewOffer({
                      ...newOffer,
                      offer_type: e.target.value as 'percentage' | 'fixed_amount' | 'free_item',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed_amount">Fixed Amount Discount</option>
                  <option value="free_item">Free Item</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offer Value {newOffer.offer_type !== 'free_item' && '(optional)'}
                </label>
                <input
                  type="text"
                  value={newOffer.offer_value}
                  onChange={(e) => setNewOffer({ ...newOffer, offer_value: e.target.value })}
                  placeholder={
                    newOffer.offer_type === 'percentage'
                      ? '20'
                      : newOffer.offer_type === 'fixed_amount'
                      ? '5.00'
                      : 'Free coffee'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newOffer.offer_type === 'percentage' && 'Enter percentage without % symbol'}
                  {newOffer.offer_type === 'fixed_amount' && 'Enter amount without £ symbol'}
                  {newOffer.offer_type === 'free_item' && 'Enter description of free item'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starts At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newOffer.starts_at}
                  onChange={(e) => setNewOffer({ ...newOffer, starts_at: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to start immediately</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ends At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newOffer.ends_at}
                  onChange={(e) => setNewOffer({ ...newOffer, ends_at: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Customer Classifications
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Select specific customer types, or leave all unchecked to show to ALL customers
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Clear all selections for "All Customers"
                      setNewOffer(prev => ({ ...prev, target_classifications: [] }));
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      newOffer.target_classifications.length === 0
                        ? 'bg-gray-700 text-white border-2 border-gray-700'
                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    All Customers
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleClassification('VIP')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      newOffer.target_classifications.includes('VIP')
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-xs">👑</span>
                    VIP
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleClassification('Regular')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      newOffer.target_classifications.includes('Regular')
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleClassification('New')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      newOffer.target_classifications.includes('New')
                        ? 'bg-green-600 text-white'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300'
                    }`}
                  >
                    New
                  </button>
                </div>
                {newOffer.target_classifications.length === 0 ? (
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    ✓ Will show to ALL customers
                  </p>
                ) : (
                  <p className="text-xs text-blue-600 mt-2">
                    Will show to: {newOffer.target_classifications.join(', ')} only
                  </p>
                )}
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
                  Create Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
