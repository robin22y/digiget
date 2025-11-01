import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PricingSection() {
  const faqItems = [
    {
      question: 'Do I need to buy hardware?',
      answer: 'No. Works on any phone or tablet you already have. Many shops use a tablet at the counter, but your phone works fine.'
    },
    {
      question: 'What about tax calculations?',
      answer: 'We calculate gross pay (hours × hourly rate). You export to CSV and send to your accountant for tax calculations. We don\'t handle tax to keep things simple and your cost low.'
    },
    {
      question: 'Do customers need an app?',
      answer: 'No. You type their phone number when they visit. They get points automatically. If they want to check their balance, they can visit a simple webpage - no app download needed.'
    },
    {
      question: 'How does GPS verification work?',
      answer: 'When staff clock in, we check if they\'re within 50 meters of your shop. This is optional - you can also use QR code or NFC tag for physical verification instead.'
    },
    {
      question: 'Can I try it before paying?',
      answer: 'Yes. 14-day free trial, no credit card required. If it doesn\'t work for you, just don\'t subscribe. No charge.'
    },
    {
      question: 'What if I need help?',
      answer: 'Email us at <a href="mailto:help@digiget.uk">help@digiget.uk</a> and we\'ll respond within 24 hours (usually much faster).'
    }
  ];

  const features = [
    'Unlimited staff',
    'Unlimited customers',
    'Staff time tracking with GPS',
    'Customer loyalty points',
    'Payroll reports (CSV export)',
    'Works on any device',
    'Email support'
  ];

  return (
    <section id="pricing" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Simple Pricing
        </h2>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-modern-blue/5 to-modern-indigo/5 rounded-2xl p-8 md:p-12 border-4 border-modern-blue relative mb-12">
          
          {/* Founding Member Badge */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            <div className="bg-modern-orange text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
              Founding Member Rate
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8 mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              DigiGet for Barbers
            </h3>
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="text-3xl md:text-4xl font-bold text-gray-900">£</span>
              <span className="text-6xl md:text-7xl font-bold text-gray-900">29</span>
              <span className="text-2xl md:text-3xl text-gray-600">/month</span>
            </div>
            <p className="text-base md:text-lg text-gray-600">
              First 20 shops lock in this rate forever
            </p>
          </div>

          {/* Features List */}
          <div className="grid md:grid-cols-2 gap-3 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-modern-green flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center mb-6">
            <Link
              to="/signup"
              className="inline-block bg-modern-green text-white px-12 py-4 rounded-lg text-xl font-bold hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Guarantee */}
          <p className="text-center text-sm text-gray-600">
            No credit card required. Cancel anytime.
          </p>
        </div>

        {/* FAQ */}
        <div className="space-y-6 mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Questions
          </h3>
          {faqItems.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">{item.question}</h4>
              <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.answer }} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
