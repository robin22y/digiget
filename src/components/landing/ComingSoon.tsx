export default function ComingSoon() {
  const upcoming = [
    {
      icon: "📱",
      title: "NFC Tags",
      timing: "Coming Q1 2025",
      description: "Staff tap their phone to clock in. Customers tap to earn points. No typing. Just tap."
    },
    {
      icon: "⚡",
      title: "Flash Offers",
      timing: "Coming Q1 2025",
      description: "Send instant deals to customers who haven't visited in a while. 'Free coffee if you come back this week!'"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-apple-blue/10 to-apple-purple/10">
      <div className="max-w-4xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          What's Next
        </h2>
        <p className="text-xl text-center text-gray-600 mb-12">
          Want early access? Start using DigiGet now and you'll get these features first.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {upcoming.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-ios p-8 shadow-apple-lg"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <div className="inline-block bg-apple-blue/20 text-apple-blue px-3 py-1 rounded-full text-sm font-semibold mb-4">
                {feature.timing}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

