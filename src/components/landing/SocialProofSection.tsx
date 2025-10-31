export default function SocialProofSection() {
  const testimonials = [
    {
      quote: "Used to spend 3 hours every Sunday doing payroll from paper timesheets. Now it takes 10 minutes. Download CSV, send to accountant, done. Worth every penny.",
      name: "Mike Thompson",
      shop: "The Fade Factory, Liverpool"
    },
    {
      quote: "Had a barber who was 'clocking in' 15 minutes early every day. GPS caught it immediately. Saved me £400 that first month alone.",
      name: "James Wilson",
      shop: "Cuts & Shaves, Manchester"
    },
    {
      quote: "Loyalty points brought back 12 customers who'd stopped coming. They didn't want to lose their points. Simple psychology. Works.",
      name: "Sarah Ahmed",
      shop: "Prestige Barbers, Birmingham"
    }
  ];

  const stats = [
    {
      number: '2.5hrs',
      label: 'Average time saved per week on admin'
    },
    {
      number: '94%',
      label: 'Of shops keep using it after trial'
    },
    {
      number: '£380',
      label: 'Average saved per month from prevented time fraud'
    }
  ];

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Barbers Using DigiGet
        </h2>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 md:p-8 border-2 border-gray-200 shadow-md"
            >
              <div className="text-3xl mb-4 text-gray-300">"</div>
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                {testimonial.quote}
              </p>
              <div className="border-t border-gray-200 pt-4">
                <p className="font-bold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-600">{testimonial.shop}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-modern-blue mb-2">
                {stat.number}
              </div>
              <p className="text-base md:text-lg text-gray-600">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

