export default function SolutionSection() {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 md:mb-12 text-center tracking-tight">
          What Makes DigiGet Different
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-3xl mb-3 md:mb-4">1️⃣</div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Actually Affordable</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed">
              £9.99/month total. Not per location. Not per staff member. Just £9.99.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Square POS:</span>
                <span className="font-semibold">From £49/month</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Deputy scheduling:</span>
                <span className="font-semibold">From £68/month for 5 staff</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Sumup Loyalty:</span>
                <span className="font-semibold">£29/month</span>
              </div>
              <div className="flex justify-between py-2 pt-2">
                <span className="text-blue-600 font-semibold">DigiGet:</span>
                <span className="text-blue-600 font-bold">£9.99/month for everything</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-3xl mb-3 md:mb-4">2️⃣</div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">No Hardware to Buy</h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Use any tablet, phone, or computer you already have. Just open a web browser. That's it.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-3xl mb-3 md:mb-4">3️⃣</div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Set Up in 2 Minutes</h3>
            <p className="text-sm md:text-base text-gray-600 mb-2 md:mb-3 leading-relaxed">
              Create account → Add staff → Choose reward → Done.
            </p>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              No installation. No training manuals. No IT support needed.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-3xl mb-3 md:mb-4">4️⃣</div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Built for Independents</h3>
            <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 leading-relaxed">
              You're not Tesco. You don't need inventory management, multi-location dashboards, or 50-page analytics reports.
            </p>
            <p className="text-sm md:text-base text-gray-900 mb-2 md:mb-3 font-semibold">You need:</p>
            <ul className="space-y-2 text-sm md:text-base text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span className="leading-relaxed">Staff to clock in reliably (and not from home)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span className="leading-relaxed">Customers to come back more often</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">✓</span>
                <span className="leading-relaxed">Daily tasks to actually get done</span>
              </li>
            </ul>
            <p className="text-xs md:text-sm text-gray-600 mt-3 md:mt-4 italic leading-relaxed">
              That's what DigiGet does. Nothing more, nothing less.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

