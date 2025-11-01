import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function Hero() {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-block bg-modern-orange text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              For UK Barber Shops
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Track Staff Hours.<br />
              Reward Regular Customers.
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              Simple time tracking and loyalty program for barber shops.<br />
              Works on any phone or tablet. £29/month.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center bg-modern-green text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] h-14"
              >
                Start Free Trial
              </Link>
              <Link
                to="#demo"
                className="inline-flex items-center justify-center bg-white text-modern-blue border-2 border-modern-blue px-8 py-4 rounded-lg text-lg font-bold hover:bg-modern-blue/5 transition-all duration-200 shadow-md hover:shadow-lg h-14"
              >
                See How It Works
              </Link>
            </div>

            {/* Trial Info */}
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-modern-green flex-shrink-0" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-modern-green flex-shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-modern-green flex-shrink-0" />
                <span>First 20 shops: £29/month forever</span>
              </div>
            </div>
          </div>

          {/* Right Column - Image Placeholder */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 shadow-xl border-4 border-white">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="text-lg font-bold text-gray-900">DigiGet Dashboard</h3>
                    <span className="text-sm text-gray-500">Live</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Staff Clocked In:</span>
                      <span className="text-green-700 font-bold">3</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Today's Customers:</span>
                      <span className="text-blue-700 font-bold">18</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium">This Week's Hours:</span>
                      <span className="text-purple-700 font-bold">142.5h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

