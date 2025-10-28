export default function SocialProof() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
          Trusted by Independent Shops Across the UK
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600">Active Shops</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
            <div className="text-gray-600">Loyal Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">2K+</div>
            <div className="text-gray-600">Staff Members</div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-xl">☕</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Sarah, Coffee Shop Owner</p>
                <p className="text-sm text-gray-600">Manchester</p>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "My customers love that they don't need an app. They just say their number and get their points. Simple."
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-xl">🏪</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Mike, Convenience Store</p>
                <p className="text-sm text-gray-600">Birmingham</p>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "Finally, staff clock-in that actually works. No more 'forgot my password' or 'the app isn't loading'."
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-xl">✂️</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Emma, Hair Salon</p>
                <p className="text-sm text-gray-600">Leeds</p>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "£9.99 for everything? Best decision we made. Pays for itself with just one new customer per month."
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-xl">🥖</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">David, Bakery Owner</p>
                <p className="text-sm text-gray-600">Edinburgh</p>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "Set up in 2 minutes. No IT help needed. That's what sold me. Everything just works."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

