export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Column */}
          <div>
            <div className="text-2xl font-bold text-white mb-2">DigiGet</div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Built for UK barber shops
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><button onClick={() => {
                const element = document.getElementById('demo-video');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }} className="hover:text-white transition-colors text-left">Demo</button></li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:help@digiget.uk" className="hover:text-white transition-colors">help@digiget.uk</a></li>
              <li><span className="text-gray-400">07XXX XXX XXX</span></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
              <li><a href="/cookies" className="hover:text-white">Cookie Policy</a></li>
              <li><a href="/gdpr" className="hover:text-white">GDPR Info</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © {currentYear} DigiGet. Built in the UK, for UK barber shops.
          </p>
        </div>

      </div>
    </footer>
  );
}

