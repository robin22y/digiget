export default function WhoItsFor() {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 md:mb-12 text-center tracking-tight">
          Perfect For:
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-12">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="text-2xl mb-2">☕</div>
            <p className="text-sm md:text-base font-semibold text-gray-900">Coffee shops & cafés</p>
            <p className="text-xs md:text-sm text-gray-600">(1-10 staff)</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="text-2xl mb-2">🏪</div>
            <p className="text-sm md:text-base font-semibold text-gray-900">Convenience stores</p>
            <p className="text-xs md:text-sm text-gray-600">(family-run)</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="text-2xl mb-2">🥖</div>
            <p className="text-sm md:text-base font-semibold text-gray-900">Independent bakeries</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="text-2xl mb-2">✂️</div>
            <p className="text-sm md:text-base font-semibold text-gray-900">Barbers & hair salons</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="text-2xl mb-2">🍕</div>
            <p className="text-sm md:text-base font-semibold text-gray-900">Small takeaways</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="text-2xl mb-2">🛍️</div>
            <p className="text-sm md:text-base font-semibold text-gray-900">Local retailers</p>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-5 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">Not for you if:</h3>
          <ul className="space-y-1.5 md:space-y-2 text-sm md:text-base text-gray-700">
            <li>• You need full POS/till integration</li>
            <li>• You have 20+ staff across multiple locations</li>
            <li>• You need complex inventory management</li>
            <li>• You want advanced analytics and reporting</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

