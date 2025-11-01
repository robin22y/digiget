export default function ProblemSection() {
  const problems = [
    {
      icon: "📝",
      title: "Manual Payroll Takes Hours",
      description: "Tracking staff hours on paper or spreadsheets is time-consuming and error-prone. Hard to know who worked when."
    },
    {
      icon: "📍",
      title: "Can't Verify Staff Location",
      description: "Staff says they clocked in, but were they actually at the shop? No way to verify without being there yourself."
    },
    {
      icon: "💳",
      title: "Losing Customers to Competitors",
      description: "Other shops offer loyalty rewards. You don't. Customers go where they get something back for being regulars."
    },
    {
      icon: "🎫",
      title: "Paper Punch Cards Are Messy",
      description: "Customers lose them. They're easy to fake. Hard to track who's close to earning a reward."
    }
  ];

  return (
    <section id="problems" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Common Barber Shop Problems
        </h2>

        {/* Problem Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-5xl mb-4">{problem.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {problem.title}
              </h3>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

