import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-modern-blue to-modern-purple">
      <div className="max-w-4xl mx-auto text-center">
        
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Try It?
        </h2>
        
        <p className="text-xl md:text-2xl text-white/90 mb-4">
          Start with Basic (free forever).
        </p>
        <p className="text-xl md:text-2xl text-white/90 mb-12">
          Upgrade to Pro when you're ready (free til Christmas).
        </p>

        <Link
          to="/signup"
          className="inline-block bg-white text-modern-blue px-12 py-5 rounded-modern text-xl font-bold hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] shadow-modern-lg hover:shadow-modern mb-8"
        >
          START FREE - NO CARD NEEDED →
        </Link>

        <p className="text-white/80 text-lg mb-12">
          Takes 2 minutes to set up.
        </p>

        <div className="border-t border-white/20 pt-8">
          <p className="text-white/80">
            Questions? <a href="mailto:hello@digiget.uk" className="text-white font-semibold hover:underline">hello@digiget.uk</a>
          </p>
        </div>

      </div>
    </section>
  );
}

