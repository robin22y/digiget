import { CheckCircle } from 'lucide-react';

export default function SolutionSection() {
  const features = [
    {
      number: '01',
      title: 'Staff Time Tracking',
      description: 'Staff clock in with a 4-digit PIN. Optional GPS verification confirms they\'re at your shop. See who\'s working right now.',
      bullets: [
        'Simple PIN entry (~5 seconds)',
        'Optional GPS verification (50m radius)',
        'See who\'s currently clocked in',
        'Export hours to CSV for payroll'
      ],
      reversed: false,
      image: '/screenshots/clock-in.png',
      imageAlt: 'Staff clock-in'
    },
    {
      number: '02',
      title: 'Customer Loyalty Program',
      description: 'Type customer\'s phone number when they visit. They automatically get a point. Set how many points = reward.',
      bullets: [
        'Quick check-in (type phone number)',
        'Customers see their point balance',
        'Customize rewards (10 visits = free cut, etc)',
        'No apps for customers to download'
      ],
      reversed: true,
      image: '/screenshots/customer-checkin.png',
      imageAlt: 'Customer check-in'
    },
    {
      number: '03',
      title: 'Simple Payroll Reports',
      description: 'View hours worked by each staff member. Export to CSV. Send to your accountant or import into Xero/QuickBooks.',
      bullets: [
        'Automatic hour calculation',
        'Gross pay shown (hours × rate)',
        'Export to CSV',
        'Week/month views'
      ],
      reversed: false,
      image: '/screenshots/payroll.png',
      imageAlt: 'Payroll report'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How DigiGet Helps
          </h2>
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

              {/* Image */}
              <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 shadow-lg border-2 border-gray-200 ${feature.reversed ? 'md:order-1' : ''}`}>
                <img 
                  src={feature.image} 
                  alt={feature.imageAlt}
                  className="w-full h-auto rounded-lg shadow-md"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="bg-white rounded-lg p-6 text-center">
                          <div class="text-4xl mb-4">
                            ${index === 0 ? '⏰' : index === 1 ? '📱' : '📊'}
                          </div>
                          <p class="text-sm text-gray-500 italic">
                            ${feature.imageAlt}
                          </p>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

