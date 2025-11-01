import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-modern-blue to-modern-indigo text-white">
      <div className="max-w-4xl mx-auto text-center">
        
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Try DigiGet?
        </h2>
        
        <p className="text-xl md:text-2xl text-white/90 mb-8">
          14-day free trial. No credit card required.<br />
          First 20 shops get £29/month locked in forever.
        </p>

        <Link
          to="/signup"
          className="inline-block bg-white text-modern-blue px-12 py-5 rounded-lg text-xl font-bold hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl mb-6"
        >
          Start Your Free Trial
        </Link>

        <p className="text-white/80 text-base md:text-lg">
          Founding member spots: 14 of 20 claimed
        </p>


      </div>
    </section>
  );
}

