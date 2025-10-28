import { Phone, UserCheck, Building2 } from 'lucide-react';

export default function USPSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            The Phone Number Only Advantage
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everyone already knows their phone number. That's the only thing they need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Customer */}
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">For Customers</h3>
            <div className="bg-blue-50 rounded-xl p-6 text-left">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>No app download required</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Just give your phone number at checkout</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Check points balance online anytime</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">✓</span>
                  <span>Automatic rewards when you reach your goal</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Staff */}
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCheck className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">For Staff</h3>
            <div className="bg-green-50 rounded-xl p-6 text-left">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">✓</span>
                  <span>One 4-digit PIN to remember</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">✓</span>
                  <span>Clock in/out in 2 seconds</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">✓</span>
                  <span>See daily tasks on the same screen</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">✓</span>
                  <span>GPS verification ensures you're at work</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Business */}
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">For Your Business</h3>
            <div className="bg-purple-50 rounded-xl p-6 text-left">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2 font-bold">✓</span>
                  <span>Everything in one dashboard</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2 font-bold">✓</span>
                  <span>No hardware costs—use existing tablets</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2 font-bold">✓</span>
                  <span>Payroll reports ready in seconds</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2 font-bold">✓</span>
                  <span>Customer loyalty without the complexity</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border-l-4 border-blue-600">
          <p className="text-xl text-gray-900 font-semibold text-center">
            "Phone number only" means less friction, faster service, and happier customers.
            <br />
            <span className="text-lg font-normal text-gray-700">No downloads. No training. No problem.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

