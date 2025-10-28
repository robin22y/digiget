import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="pt-20 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8 bg-white min-h-[85vh] flex items-center">
      <div className="max-w-4xl mx-auto text-center w-full">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-5 md:mb-6 leading-[1.1] tracking-tight">
          Professional Shop Management. <span className="text-blue-600">Finally Affordable.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-4 md:mb-5 max-w-2xl mx-auto leading-relaxed">
          Track staff hours, reward loyal customers, and manage daily tasks—for less than the price of two coffees a day.
        </p>

        <div className="text-xl md:text-2xl font-semibold text-gray-900 mb-6 md:mb-8">
          £9.99/month. No hardware. No contracts. Set up in minutes.
        </div>

        <Link
          to="/signup"
          className="inline-block bg-blue-600 text-white px-8 py-4 md:px-10 md:py-5 rounded-xl md:rounded-2xl text-lg md:text-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] mb-5 md:mb-6"
        >
          Start Your 90-Day Free Trial →
        </Link>

        <p className="text-xs md:text-sm text-gray-500">
          Built for UK independent shops • Coffee shops • Convenience stores • Cafés
        </p>
      </div>
    </section>
  );
}

