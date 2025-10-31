import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function SolutionSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
          What DigiGet Does
        </h2>

        {/* Main Visual - Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          
          {/* Staff Column */}
          <div className="bg-white rounded-ios p-8 shadow-apple-lg border-l-4 border-apple-blue">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">👤</span>
              <h3 className="text-2xl font-bold text-gray-900">STAFF</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-apple-green flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">Clock in with PIN</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-apple-green flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">GPS checks location</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-apple-green flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">Track hours worked</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-apple-green flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">Assign daily tasks</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-apple-green flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">See payroll reports</span>
              </li>
            </ul>
          </div>

          {/* Customers Column */}
          <div className="bg-white rounded-ios p-8 shadow-apple-lg border-l-4 border-apple-purple">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🎁</span>
              <h3 className="text-2xl font-bold text-gray-900">CUSTOMERS</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-apple-green flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">Check in with phone</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-apple-green flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">Earn points auto</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-apple-green flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">Get rewards</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-apple-green flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">No app needed</span>
              </li>
            </ul>
          </div>

        </div>

        <p className="text-xl text-center text-gray-600 mb-8">
          Everything on one tablet. Keep it by your till.
        </p>

        <div className="text-center">
          <Link
            to="/signup"
            className="inline-block bg-apple-blue text-white px-10 py-5 rounded-ios text-lg font-bold hover:bg-opacity-90 transition-all duration-200 shadow-apple-lg hover:shadow-apple hover:scale-[1.02]"
          >
            Start Free →
          </Link>
        </div>

      </div>
    </section>
  );
}

