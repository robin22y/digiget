import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4 tracking-tight">
          Ready to Get Started?
        </h2>

        <p className="text-lg md:text-xl text-blue-100 mb-4 md:mb-5 leading-relaxed">
          Try DigiGet free for 90 days. No card required.
        </p>

        <p className="text-base md:text-lg text-blue-50 mb-6 md:mb-8 leading-relaxed">
          Takes 2 minutes to set up. Start tracking staff hours and rewarding customers today.
        </p>

        <Link
          to="/signup"
          className="inline-block bg-white text-blue-600 px-9 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-bold hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] shadow-xl hover:shadow-2xl mb-5 md:mb-6"
        >
          START YOUR FREE TRIAL →
        </Link>

        <p className="text-sm md:text-base text-blue-100">
          Questions? <a href="mailto:hello@digiget.uk" className="underline hover:text-white transition-colors duration-200">hello@digiget.uk</a>
        </p>
      </div>
    </section>
  );
}

