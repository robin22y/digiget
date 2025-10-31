
export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Sign Up',
      description: 'Email and password. That\'s it. No credit card needed for trial.'
    },
    {
      number: 2,
      title: 'Add Your Shop Location',
      description: 'Type your address or tap "Use Current Location." Done.'
    },
    {
      number: 3,
      title: 'Add Your Staff',
      description: 'Name, hourly rate, 4-digit PIN. Takes 30 seconds per person.'
    },
    {
      number: 4,
      title: 'Start Using It',
      description: 'Staff clock in. You check in customers. That\'s it. You\'re done.'
    }
  ];

  return (
    <section id="setup" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
      <div className="max-w-4xl mx-auto text-center">
        
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
          Set Up In 5 Minutes. Seriously.
        </h2>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-6 md:gap-4 mb-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
                <div className="w-16 h-16 mx-auto mb-4 bg-modern-blue text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-gray-300 text-2xl">
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-modern-blue max-w-2xl mx-auto">
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            <span className="font-semibold">Works on any device you already own.</span> Phone, tablet, laptop - doesn't matter. 
            Just open the browser. No app to download. No hardware to buy.
          </p>
        </div>

      </div>
    </section>
  );
}

