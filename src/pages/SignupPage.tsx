import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type SignupStep = 'category' | 'plan' | 'details' | 'loyalty';

interface SignupData {
  businessCategory: string;
  planType: 'basic' | 'pro';
  ownerName: string;
  shopName: string;
  email: string;
  password: string;
  loyaltyVisits: number;
  rewardDescription: string;
}

export default function SignupPage() {
  const [step, setStep] = useState<SignupStep>('category');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupData, setSignupData] = useState<Partial<SignupData>>({
    loyaltyVisits: 6,
    rewardDescription: 'Free service'
  });

  const navigate = useNavigate();
  const { signUp } = useAuth();

  const businessCategories = [
    { value: 'hair_salon', label: 'Hair Salon / Barbershop' },
    { value: 'beauty_salon', label: 'Beauty & Nail Salon' },
    { value: 'cafe', label: 'Cafe / Coffee Shop' },
    { value: 'restaurant', label: 'Restaurant / Takeaway' },
    { value: 'retail', label: 'Retail / Convenience Store' },
    { value: 'health_wellness', label: 'Health & Wellness' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'other', label: 'Other' }
  ];

  const handleCategorySelect = (category: string) => {
    setSignupData({ ...signupData, businessCategory: category });
    setStep('plan');
  };

  const handlePlanSelect = (plan: 'basic' | 'pro') => {
    setSignupData({ ...signupData, planType: plan });
    setStep('details');
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await signUp(
        signupData.email!,
        signupData.password!,
        {
          owner_name: signupData.ownerName,
          shop_name: signupData.shopName
        }
      );

      if (signUpError) {
        console.error('Signup error:', signUpError);
        throw signUpError;
      }
      
      // Check if email confirmation is required
      if (data?.user && !data.session) {
        setError('Please check your email to confirm your account before continuing.');
        return;
      }
      
      // Check if signup was successful
      if (!data?.user) {
        setError('Signup failed. Please try again.');
        return;
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 90);

      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          user_id: data.user.id,
          shop_name: signupData.shopName!,
          owner_name: signupData.ownerName!,
          owner_email: signupData.email!,
          business_category: signupData.businessCategory!,
          plan_type: signupData.planType!,
          subscription_status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          loyalty_enabled: true,
          points_type: 'per_visit',
          points_needed: signupData.loyaltyVisits!,
          reward_type: 'free_product',
          reward_description: signupData.rewardDescription!,
          diary_enabled: ['hair_salon', 'beauty_salon', 'health_wellness'].includes(signupData.businessCategory!)
        })
        .select()
        .single();

      if (shopError) throw shopError;

      navigate(`/dashboard/${shop.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'category') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-3xl w-full animate-fade-in">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="mb-4 flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-4xl">🚀</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to DigiGet
            </h1>
            <p className="text-lg text-gray-600 mb-2">Transform your business with digital customer loyalty</p>
            <p className="text-sm text-gray-500">90-day free trial • No credit card required</p>
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-4 text-center">What type of business do you run?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {businessCategories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategorySelect(category.value)}
                  className="group text-left px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                >
                  <span className="text-base font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                    {category.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-2">⭐</div>
                <div className="text-xs font-semibold text-gray-700">Free Trial</div>
              </div>
              <div>
                <div className="text-2xl mb-2">🔒</div>
                <div className="text-xs font-semibold text-gray-700">Secure</div>
              </div>
              <div>
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-xs font-semibold text-gray-700">Fast Setup</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'plan') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
            <p className="text-gray-600">90-day free trial • No card needed</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
              <h2 className="text-2xl font-bold mb-2">Basic</h2>
              <div className="text-3xl font-bold text-blue-600 mb-4">£5.99<span className="text-lg text-gray-600">/month</span></div>
              <p className="text-gray-600 mb-6">For solo owners</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Customer loyalty tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Digital diary</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Owner check-in system</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Customer balance checker</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Basic analytics</span>
                </li>
              </ul>

              <button
                onClick={() => handlePlanSelect('basic')}
                className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Select Basic
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-blue-500 relative">
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
                ⭐ RECOMMENDED
              </div>

              <h2 className="text-2xl font-bold mb-2">Pro</h2>
              <div className="text-3xl font-bold text-blue-600 mb-4">£9.99<span className="text-lg text-gray-600">/month</span></div>
              <p className="text-gray-600 mb-6">For teams</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Everything in Basic</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Staff clock in/out</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Task management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Payroll hours tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Incident reports</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Staff performance analytics</span>
                </li>
              </ul>

              <button
                onClick={() => handlePlanSelect('pro')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Select Pro
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => setStep('category')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Your Details
            </h1>
            <p className="text-gray-600">Let's set up your account</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleDetailsSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={signupData.ownerName || ''}
                onChange={(e) => setSignupData({ ...signupData, ownerName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business/Shop Name
              </label>
              <input
                type="text"
                required
                placeholder="My Awesome Shop"
                value={signupData.shopName || ''}
                onChange={(e) => setSignupData({ ...signupData, shopName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={signupData.email || ''}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={signupData.password || ''}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">Minimum 8 characters</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {loading ? 'Creating Account...' : 'Create Account & Start Free Trial'}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600 bg-blue-50 py-3 rounded-xl border-2 border-blue-100">
              ⭐ 90 days free • No card required
            </div>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => setStep('plan')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
