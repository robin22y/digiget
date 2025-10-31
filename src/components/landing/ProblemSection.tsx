export default function ProblemSection() {
  const problems = [
    {
      emoji: "😓",
      text: "\"Did Sarah work 6 or 8 hours yesterday?\""
    },
    {
      emoji: "😓",
      text: "\"Customers forget to come back\""
    },
    {
      emoji: "😓",
      text: "\"Other systems cost £50-200 per month\""
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Running a small shop is hard enough.
        </h2>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-modern p-8 text-center border-2 border-gray-200 hover:border-modern-blue transition-all duration-200 shadow-modern"
            >
              <div className="text-6xl mb-4">{problem.emoji}</div>
              <p className="text-lg text-gray-700">{problem.text}</p>
            </div>
          ))}
        </div>

        <p className="text-xl text-center text-gray-600">
          You shouldn't need a complicated system to solve simple problems.
        </p>

      </div>
    </section>
  );
}

