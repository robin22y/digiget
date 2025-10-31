import { Link } from 'react-router-dom';
import { CheckCircle, X } from 'lucide-react';

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          Two Plans. Pick What Fits.
        </h2>
        <p className="text-xl text-center text-gray-600 mb-16">
          No card needed for either plan
        </p>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          
          {/* BASIC PLAN */}
          <div className="bg-white rounded-ios p-8 border-2 border-gray-200 hover:border-apple-green transition-all hover:shadow-apple-lg">
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-block bg-apple-green/10 text-apple-green px-4 py-2 rounded-full text-sm font-semibold mb-4">
                🆓 BASIC
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                FREE
              </div>
              <div className="text-lg text-gray-600">
                Forever
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-ios p-4 mb-6">
              <p className="text-center text-gray-700 font-medium">
                Perfect if you're small:
              </p>
              <ul className="mt-2 space-y-1 text-center text-gray-600">
                <li>• You + 1 staff</li>
                <li>• 50 customers/month</li>
              </ul>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-green flex-shrink-0" />
                <span className="text-gray-700">Staff clock in/out</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-green flex-shrink-0" />
                <span className="text-gray-700">Customer loyalty</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-green flex-shrink-0" />
                <span className="text-gray-700">Points tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-green flex-shrink-0" />
                <span className="text-gray-700">Basic reports</span>
              </div>
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500">No new features</span>
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/signup"
              className="block w-full border-2 border-apple-blue text-apple-blue px-6 py-3 rounded-ios font-semibold text-center hover:bg-apple-blue/5 transition-colors duration-200 mb-3"
            >
              Start Free →
            </Link>
            <p className="text-center text-sm text-gray-500">
              Stay free forever
            </p>

          </div>

          {/* PRO PLAN */}
          <div className="bg-gradient-to-br from-apple-blue/10 to-apple-purple/10 rounded-ios p-8 border-2 border-apple-blue relative hover:shadow-apple-lg transition-all">
            
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-apple-blue to-apple-purple text-white px-6 py-2 rounded-full text-sm font-bold shadow-apple">
                ⭐ BEST VALUE
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-6 mt-4">
              <div className="inline-block bg-apple-blue/20 text-apple-blue px-4 py-2 rounded-full text-sm font-semibold mb-4">
                💼 PRO
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                £9.99
              </div>
              <div className="text-lg text-gray-600 mb-2">
                per month
              </div>
              <div className="bg-apple-yellow/20 text-apple-orange px-4 py-2 rounded-ios text-sm font-semibold inline-block">
                Free until Christmas 2025 🎄
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/80 rounded-ios p-4 mb-6">
              <p className="text-center text-gray-700 font-medium">
                Perfect if you're growing:
              </p>
              <ul className="mt-2 space-y-1 text-center text-gray-600">
                <li>• Unlimited staff</li>
                <li>• Unlimited customers</li>
              </ul>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-blue flex-shrink-0" />
                <span className="text-gray-900 font-medium">Everything in Basic</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-blue flex-shrink-0" />
                <span className="text-gray-900">Task management</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-blue flex-shrink-0" />
                <span className="text-gray-900">Payroll reports</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-blue flex-shrink-0" />
                <span className="text-gray-900">Incident reporting</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-blue flex-shrink-0" />
                <span className="text-gray-900">Staff analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-blue flex-shrink-0" />
                <span className="text-gray-900">New features</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-apple-blue flex-shrink-0" />
                <span className="text-gray-900">NFC tags (coming soon)</span>
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/signup"
              className="block w-full bg-apple-blue text-white px-6 py-3 rounded-ios font-semibold text-center hover:bg-opacity-90 transition-all duration-200 mb-3 shadow-apple"
            >
              Try Pro Free →
            </Link>
            <p className="text-center text-sm text-gray-600">
              Free til Xmas, then £9.99/month
            </p>

          </div>

        </div>

        {/* Additional Info */}
        <div className="text-center text-gray-600 space-y-2">
          <p className="text-lg">Upgrade or downgrade anytime.</p>
          <p className="text-lg">Cancel anytime. No contracts.</p>
        </div>

      </div>
    </section>
  );
}

