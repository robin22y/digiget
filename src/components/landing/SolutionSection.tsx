import { CheckCircle } from 'lucide-react';

export default function SolutionSection() {
  const features = [
    {
      number: '01',
      title: 'Staff Clock In With GPS Proof',
      description: 'Your staff clock in with a 4-digit PIN. GPS confirms they\'re actually at your shop - not at home, not at the pub. You see exactly when they arrived and left. No more "forgot to clock out" excuses.',
      bullets: [
        'GPS verification - must be within 50m of shop',
        'Simple PIN entry - 5 seconds to clock in',
        'See who\'s working right now at a glance',
        'End of week: export hours to CSV, done'
      ],
      reversed: false
    },
    {
      number: '02',
      title: 'Customers Check In, Get Points Automatically',
      description: 'Customer walks in. You type their phone number on your tablet. Boom - they get a point. 10 visits = free haircut. They can see their balance on their phone. No cards to lose. No stamps to fake. Just works.',
      bullets: [
        'Type phone number, customer gets point (5 seconds)',
        'They see: "9 points - 1 more for free haircut!"',
        'Brings regulars back (they don\'t want to lose points)',
        'Automatic - no apps for customers to download'
      ],
      reversed: true
    },
    {
      number: '03',
      title: 'Payroll In 10 Minutes, Not 3 Hours',
      description: 'End of week. Click "Payroll Report." See exactly who worked what hours. Export to CSV. Send to your accountant. Done. No calculator. No checking paper. No arguments about hours. Just facts.',
      bullets: [
        'Automatic hour tracking (no manual entry)',
        'Gross pay calculated instantly',
        'Export to CSV for your accountant',
        'Saves 2-3 hours every single week'
      ],
      reversed: false
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Here's How DigiGet Fixes It
          </h2>
          <p className="text-xl text-gray-600">
            Two problems. One solution. Works on any phone or tablet.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-16 md:space-y-24">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`grid md:grid-cols-2 gap-8 lg:gap-12 items-center ${
                feature.reversed ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Content */}
              <div className={feature.reversed ? 'md:order-2' : ''}>
                <div className="text-6xl md:text-7xl font-bold text-gray-200 mb-4">
                  {feature.number}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-modern-green flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Image Placeholder */}
              <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 shadow-lg border-2 border-gray-200 ${feature.reversed ? 'md:order-1' : ''}`}>
                <div className="bg-white rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">
                    {index === 0 && '⏰'}
                    {index === 1 && '📱'}
                    {index === 2 && '📊'}
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    {index === 0 && 'Staff clock-in screenshot'}
                    {index === 1 && 'Customer check-in screenshot'}
                    {index === 2 && 'Payroll report screenshot'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

