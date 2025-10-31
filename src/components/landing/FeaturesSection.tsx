import { Link } from 'react-router-dom';

export default function FeaturesSection() {
  const features = [
    {
      icon: "⏰",
      title: "STAFF CLOCK IN",
      description: "Staff enter their 4-digit PIN. GPS checks they're at your shop. Hours tracked automatically.",
      benefit: "→ See who worked when. Get payroll ready in seconds."
    },
    {
      icon: "🎁",
      title: "CUSTOMER LOYALTY",
      description: "Customer gives their phone number. Points added instantly. They get rewarded automatically.",
      benefit: "→ No apps. No cards. No complicated signup."
    },
    {
      icon: "✅",
      title: "DAILY TASKS",
      badge: "Pro only",
      description: "Create task lists for your team. Staff tick them off during shifts. You see what's done.",
      benefit: "→ Stop wondering if things got done."
    },
    {
      icon: "📊",
      title: "REPORTS",
      badge: "Pro only",
      description: "Payroll hours per staff member. Customer loyalty statistics. Export everything for your accountant.",
      benefit: "→ All your data, ready when you need it."
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
          What You Can Do
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-ios p-8 shadow-apple hover:shadow-apple-lg transition-shadow border border-gray-200"
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="text-5xl">{feature.icon}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  {feature.badge && (
                    <span className="inline-block bg-apple-blue/10 text-apple-blue px-3 py-1 rounded-full text-xs font-semibold">
                      {feature.badge}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {feature.description}
              </p>
              <p className="text-apple-blue font-medium">
                {feature.benefit}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/signup"
            className="inline-block bg-apple-blue text-white px-10 py-5 rounded-ios text-lg font-bold hover:bg-opacity-90 transition-all duration-200 shadow-apple-lg hover:shadow-apple hover:scale-[1.02]"
          >
            Try It Free →
          </Link>
        </div>

      </div>
    </section>
  );
}

