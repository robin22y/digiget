import { Link } from 'react-router-dom';

export default function PricingSection() {
  return (
    <section id="pricing" className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 md:mb-12 text-center tracking-tight">
          Two Simple Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-6 md:mb-8">
          {/* Basic Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">BASIC</h3>
            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">FREE<span className="text-lg md:text-xl text-gray-600 font-normal">/month</span></div>
            <p className="text-sm md:text-base text-gray-600 mb-5 md:mb-6">Customer loyalty only</p>

            <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Unlimited customers</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Digital loyalty program</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Customer balance checker</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Simple booking diary</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">1 staff member only</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">50 customer check-ins/month</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2 font-bold">✗</span>
                <span className="text-sm md:text-base text-gray-500 leading-relaxed">No flash offers</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2 font-bold">✗</span>
                <span className="text-sm md:text-base text-gray-500 leading-relaxed">No geofencing/location tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2 font-bold">✗</span>
                <span className="text-sm md:text-base text-gray-500 leading-relaxed">No incident reports</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2 font-bold">✗</span>
                <span className="text-sm md:text-base text-gray-500 leading-relaxed">No clock requests</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2 font-bold">✗</span>
                <span className="text-sm md:text-base text-gray-500 leading-relaxed">No tasks</span>
              </li>
            </ul>

            <Link
              to="/signup"
              className="block w-full border-2 border-blue-600 text-blue-600 px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold text-center hover:bg-blue-50 transition-colors duration-200 text-sm md:text-base"
            >
              Start 90-Day Free Trial →
            </Link>
          </div>

          {/* Pro Card */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-600 p-6 md:p-8 relative hover:shadow-xl transition-shadow duration-200">
            <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold">
              ⭐ Best Value
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">PRO</h3>
            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">£9.99<span className="text-lg md:text-xl text-gray-600 font-normal">/month</span></div>
            <p className="text-sm md:text-base text-gray-600 mb-5 md:mb-6">Everything + staff management</p>

            <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Everything in Basic</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Unlimited staff</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Staff clock in/out</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Location verification (GPS)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Task management</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Payroll reports</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">✓</span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed">Incident reporting</span>
              </li>
            </ul>

            <Link
              to="/signup"
              className="block w-full bg-blue-600 text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold text-center hover:bg-blue-700 transition-colors duration-200 text-sm md:text-base"
            >
              Start 90-Day Free Trial →
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-600 mb-8">
          Try either plan free for 90 days. No card required.
          <br />
          After trial: Continue paying monthly. Cancel anytime. No contracts.
        </p>

        {/* Comparison Table */}
        <div className="bg-gray-50 rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 mb-5 md:mb-6">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 md:py-3 font-semibold text-gray-900">Feature</th>
                <th className="text-right py-2 md:py-3 font-semibold text-gray-900">Market Price</th>
                <th className="text-right py-2 md:py-3 font-semibold text-blue-600">DigiGet</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 md:py-3 text-gray-700">Staff scheduling</td>
                <td className="text-right py-2 md:py-3 text-gray-600">£68/month</td>
                <td className="text-right py-2 md:py-3 text-blue-600 font-semibold">↓</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 md:py-3 text-gray-700">Loyalty program</td>
                <td className="text-right py-2 md:py-3 text-gray-600">£29/month</td>
                <td className="text-right py-2 md:py-3 text-blue-600 font-semibold">↓</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 md:py-3 text-gray-700">Time tracking</td>
                <td className="text-right py-2 md:py-3 text-gray-600">£40/month</td>
                <td className="text-right py-2 md:py-3 text-blue-600 font-semibold">↓</td>
              </tr>
              <tr className="font-bold">
                <td className="py-2 md:py-3 text-gray-900">Total</td>
                <td className="text-right py-2 md:py-3 text-gray-900">£137/month</td>
                <td className="text-right py-2 md:py-3 text-blue-600">£9.99/month</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-center text-lg md:text-xl font-semibold text-gray-900">
          You save over £1,500 per year.
        </p>
      </div>
    </section>
  );
}

