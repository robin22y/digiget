export default function WhoItsFor() {
  const shopTypes = [
    { emoji: "☕", name: "Coffee Shops" },
    { emoji: "🥖", name: "Bakeries" },
    { emoji: "🛒", name: "Small Groceries" },
    { emoji: "💇", name: "Barbers & Salons" },
    { emoji: "🥩", name: "Butchers" },
    { emoji: "🍕", name: "Takeaways" }
  ];

  const notFor = [
    "You need till/POS integration",
    "You have 20+ staff across multiple shops",
    "You want complex inventory management",
    "You need advanced analytics"
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
          Perfect For
        </h2>

        {/* Shop Types Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
          {shopTypes.map((shop, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-ios p-6 text-center hover:bg-apple-blue/5 transition-colors cursor-default"
            >
              <div className="text-5xl mb-3">{shop.emoji}</div>
              <div className="text-sm font-medium text-gray-700">{shop.name}</div>
            </div>
          ))}
        </div>

        {/* Not For Section */}
        <div className="bg-gray-50 rounded-ios p-8 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            You're probably NOT ready for DigiGet if:
          </h3>
          <ul className="space-y-3">
            {notFor.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-gray-400 text-xl">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-center text-gray-600 mt-6 italic">
            We keep it simple. That's the point.
          </p>
        </div>

      </div>
    </section>
  );
}

