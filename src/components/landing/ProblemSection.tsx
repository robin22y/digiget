export default function ProblemSection() {
  const problems = [
    {
      icon: "📝",
      title: "Paper Timesheets Are Hell",
      description: "You spend 3 hours every Sunday calculating hours from scrappy paper. Half the time the writing's illegible. Your barbers \"forget\" to clock out. You're doing maths instead of running your shop."
    },
    {
      icon: "🏠",
      title: "\"I'm Here\" - But Are They?",
      description: "John texts \"clocked in\" at 9am. He actually rolled up at 9:30. No way to prove it. You're paying for hours he didn't work. Happens every week."
    },
    {
      icon: "💳",
      title: "Customers Go Elsewhere",
      description: "Mike's been coming for 2 years. Then Turkish place down the road offers \"10th cut free.\" You lose him. You had no loyalty program. He's gone."
    },
    {
      icon: "🎫",
      title: "Paper Punch Cards Don't Work",
      description: "Customers lose them. They're easy to fake. You can't track who's close to a reward. No way to send them a reminder when they're due back. It's 2025 - there's got to be a better way."
    }
  ];

  return (
    <section id="problems" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Sound Familiar?
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

