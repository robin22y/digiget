import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 md:mb-12 text-center tracking-tight">
          Get Started in 3 Steps
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 mb-6 md:mb-8">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 text-center relative w-full md:w-64 hover:shadow-md transition-shadow duration-200">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 mt-4">Sign Up (2 minutes)</h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Enter your shop name and email. Choose your plan (Basic or Pro).
            </p>
          </div>

          {/* Arrow (hidden on mobile) */}
          <div className="hidden md:flex items-center justify-center px-2">
            <ArrowRight className="w-8 h-8 text-gray-400" />
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 text-center relative w-full md:w-64 hover:shadow-md transition-shadow duration-200">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 mt-4">Add Your Team</h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Add staff members and give them 4-digit PINs. Set up your loyalty reward.
            </p>
          </div>

          {/* Arrow (hidden on mobile) */}
          <div className="hidden md:flex items-center justify-center px-2">
            <ArrowRight className="w-8 h-8 text-gray-400" />
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 text-center relative w-full md:w-64 hover:shadow-md transition-shadow duration-200">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 mt-4">Start Using It</h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Open DigiGet on a tablet by your till. Staff and customers use it all day.
            </p>
          </div>
        </div>

        <p className="text-center text-sm md:text-base text-gray-600 mb-6 md:mb-8 italic leading-relaxed">
          That's it. No installation. No training. No IT support needed.
        </p>

        <div className="text-center">
          <Link
            to="/signup"
            className="inline-block bg-blue-600 text-white px-7 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg font-semibold hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            Start Your Free Trial →
          </Link>
        </div>
      </div>
    </section>
  );
}

