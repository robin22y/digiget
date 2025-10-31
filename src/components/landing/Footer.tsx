export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Column */}
          <div>
            <div className="text-2xl font-bold text-white mb-4">DigiGet</div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Simple staff & loyalty tracking for UK small shops
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#coming-soon" className="hover:text-white">What's Coming</a></li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/help" className="hover:text-white">Help Centre</a></li>
              <li><a href="mailto:hello@digiget.uk" className="hover:text-white">Contact Us</a></li>
              <li><a href="/status" className="hover:text-white">System Status</a></li>
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
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {currentYear} DigiGet. Made in the UK for UK shops.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="text-xl">🇬🇧</span>
            <span>Simple software for small businesses</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

