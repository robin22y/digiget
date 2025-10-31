import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function Hero() {
  return (
    <section className="pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-100 via-blue-50 to-white min-h-[90vh] flex items-center">
      <div className="max-w-4xl mx-auto text-center w-full">
        {/* Main Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
          Track Staff. <br className="hidden sm:block" />
          Reward Customers. <br className="hidden sm:block" />
          Simple.
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-600 mb-4">
          Free for small shops. £9.99/month when you grow.
        </p>
        <p className="text-lg md:text-xl text-gray-500 mb-8">
          No complicated setup. No expensive hardware.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/signup"
            className="inline-block bg-apple-blue text-white px-8 py-4 md:px-10 md:py-5 rounded-ios text-lg md:text-xl font-bold hover:bg-opacity-90 transition-all duration-200 shadow-apple-lg hover:shadow-apple hover:scale-[1.02]"
          >
            Start Free →
          </Link>
          <Link
            to="#how-it-works"
            className="inline-block bg-white text-apple-blue border-2 border-apple-blue px-8 py-4 md:px-10 md:py-5 rounded-ios text-lg md:text-xl font-bold hover:bg-apple-blue/5 transition-all duration-200 shadow-apple hover:scale-[1.02]"
          >
            See How It Works ↓
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 text-sm md:text-base text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-apple-green flex-shrink-0" />
            <span>Free until Christmas 2025</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-apple-green flex-shrink-0" />
            <span>No card needed</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-apple-green flex-shrink-0" />
            <span>Set up in 2 minutes</span>
          </div>
        </div>

        {/* Small Trust Icons */}
        <div className="flex flex-wrap justify-center gap-8 mt-12 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇬🇧</span>
            <span>Made in UK</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <span>Bank-level security</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <span>Works on any device</span>
          </div>
        </div>

      </div>
    </section>
  );
}

