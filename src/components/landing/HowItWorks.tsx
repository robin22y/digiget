import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: "1️⃣",
      title: "Sign Up",
      subtitle: "(2 minutes)",
      details: [
        "Enter email",
        "Choose plan",
        "Done"
      ]
    },
    {
      number: "2️⃣",
      title: "Add Staff",
      subtitle: "Set Reward",
      details: [
        "Give staff their PINs",
        "Create loyalty reward"
      ]
    },
    {
      number: "3️⃣",
      title: "Start Using",
      subtitle: "(same day)",
      details: [
        "Leave tablet open by till",
        "That's it"
      ]
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          Get Started in 3 Steps
        </h2>
        <p className="text-xl text-center text-gray-600 mb-16">
          No installation. No training. No IT help needed.
        </p>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              
              {/* Step Card */}
              <div className="bg-white rounded-modern p-8 shadow-modern text-center h-full">
                <div className="text-6xl mb-4">{step.number}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 mb-6">{step.subtitle}</p>
                <ul className="space-y-2 text-left">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-modern-green flex-shrink-0" />
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrow (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-4xl text-gray-300">
                  →
                </div>
              )}

            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/signup"
            className="inline-block bg-modern-blue text-white px-10 py-5 rounded-modern text-lg font-bold hover:bg-opacity-90 transition-all duration-200 shadow-modern-lg hover:shadow-modern hover:scale-[1.02]"
          >
            Start Free Now →
          </Link>
        </div>

      </div>
    </section>
  );
}

