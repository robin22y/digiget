import { Link } from 'react-router-dom';
import { CheckCircle, Shield } from 'lucide-react';

export default function PricingSection() {
  const faqItems = [
    {
      question: 'Do I need to buy hardware?',
      answer: 'No. Works on any phone or tablet you already have. Most shops use a cheap tablet (£50 Amazon Fire) at the counter, but your phone works fine to start.'
    },
    {
      question: 'What about tax calculations?',
      answer: 'We calculate gross pay (hours × rate). You export to CSV and send to your accountant or import into Xero/QuickBooks for tax calculations. We don\'t touch tax - that keeps your cost low and liability zero.'
    },
    {
      question: 'Do customers need to download an app?',
      answer: 'No. You type their phone number when they come in. They get points automatically. If they want to check their balance, they can visit a simple webpage - no app needed.'
    }
  ];

  const features = [
    'Unlimited staff',
    'Unlimited customers',
    'GPS-verified clock in/out',
    'Customer loyalty points',
    'Payroll reports (export to CSV)',
    'Deals & flash offers',
    'Works on any device',
    'Email support'
  ];

  return (
    <section id="pricing" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          One Price. Everything Included.
        </h2>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-modern-blue/5 to-modern-indigo/5 rounded-2xl p-8 md:p-12 border-4 border-modern-blue relative mb-12">
          
          {/* Founding Member Badge */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            <div className="bg-modern-orange text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
              🎉 Founding Member Rate
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
              First 20 shops only - locks in forever<br />
              <span className="text-sm text-gray-500">After that: £39/month</span>
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
              Start Your 14-Day Free Trial
            </Link>
          </div>

          {/* Guarantee */}
          <div className="flex items-start gap-3 bg-white/80 rounded-lg p-4 border-2 border-modern-green/30">
            <Shield className="w-6 h-6 text-modern-green flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <span className="font-semibold">30-day money-back guarantee.</span> If you're not saving at least 2 hours a week, full refund.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Common Questions
          </h3>
          {faqItems.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">{item.question}</h4>
              <p className="text-gray-700 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
