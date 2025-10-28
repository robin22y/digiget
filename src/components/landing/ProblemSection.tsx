export default function ProblemSection() {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4 text-center tracking-tight">
          Why Most Small Shops Don't Have a Proper System
        </h2>

        <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 text-center leading-relaxed">
          Let's be honest. You probably know you should be tracking things better. But here's the problem:
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 mb-5 md:mb-6 shadow-sm">
          <ul className="space-y-3 md:space-y-4 text-gray-700">
            <li className="flex items-start">
              <span className="text-red-600 mr-3 text-xl font-bold">×</span>
              <span className="leading-relaxed">Professional systems cost £50-200/month</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-3 text-xl font-bold">×</span>
              <span className="leading-relaxed">You need to buy expensive tablets and card readers</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-3 text-xl font-bold">×</span>
              <span className="leading-relaxed">Setup takes days and requires IT help</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-3 text-xl font-bold">×</span>
              <span className="leading-relaxed">They're built for big chains, not independents</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-3 text-xl font-bold">×</span>
              <span className="leading-relaxed">Monthly costs are per location or per staff member</span>
            </li>
          </ul>
        </div>

        <p className="text-base md:text-lg text-gray-600 text-center leading-relaxed">
          So you don't use one. Or you use spreadsheets and WhatsApp. We get it. That's exactly why we built DigiGet.
        </p>
      </div>
    </section>
  );
}

