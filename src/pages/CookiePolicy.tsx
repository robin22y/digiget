import { legalConfig } from '../config/privacyConfig';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Cookie Policy</h1>
          <p className="mt-2 text-gray-600">Last Updated: {legalConfig.dates.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          
          {/* What Are Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cookies are small text files stored on your device when you visit a website.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">They help websites:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Remember you between visits</li>
              <li>Keep you logged in</li>
              <li>Track usage (analytics)</li>
            </ul>
          </section>

          {/* Cookies We Use */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Cookies We Use</h2>
            <p className="text-gray-700 leading-relaxed mb-6 font-semibold text-lg">
              {legalConfig.company.tradingAs} uses <strong>MINIMAL cookies</strong> because we respect your privacy.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Essential Cookies (Always On)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">These are required for {legalConfig.company.tradingAs} to work. You cannot disable them.</p>
            
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Cookie Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-sm bg-gray-50 px-2 py-1 rounded">sb-access-token</code></td>
                    <td className="border border-gray-300 px-4 py-2">Keeps you logged in</td>
                    <td className="border border-gray-300 px-4 py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-sm bg-gray-50 px-2 py-1 rounded">sb-refresh-token</code></td>
                    <td className="border border-gray-300 px-4 py-2">Refreshes your session</td>
                    <td className="border border-gray-300 px-4 py-2">7 days</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-sm bg-gray-50 px-2 py-1 rounded">__csrf</code></td>
                    <td className="border border-gray-300 px-4 py-2">Prevents security attacks</td>
                    <td className="border border-gray-300 px-4 py-2">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-gray-700 leading-relaxed mb-2"><strong>Storage:</strong> Supabase (our authentication provider)</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Analytics Cookies (Optional)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">If you consent, we use anonymous usage analytics to improve {legalConfig.company.tradingAs}.</p>
            
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Cookie Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Duration</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Provider</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-sm bg-gray-50 px-2 py-1 rounded">_ga</code></td>
                    <td className="border border-gray-300 px-4 py-2">Anonymous usage tracking</td>
                    <td className="border border-gray-300 px-4 py-2">2 years</td>
                    <td className="border border-gray-300 px-4 py-2">Google Analytics</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-sm bg-gray-50 px-2 py-1 rounded">_gid</code></td>
                    <td className="border border-gray-300 px-4 py-2">Anonymous session tracking</td>
                    <td className="border border-gray-300 px-4 py-2">24 hours</td>
                    <td className="border border-gray-300 px-4 py-2">Google Analytics</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="font-semibold text-gray-900 mb-2">What we track (anonymously):</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Pages visited</li>
              <li>Buttons clicked</li>
              <li>Time spent on site</li>
              <li>Device type (mobile/desktop)</li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="font-semibold text-gray-900 mb-2">What we DON'T track:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Your personal information</li>
                <li>What you type</li>
                <li>Your customer/staff data</li>
                <li>Cross-site activity</li>
              </ul>
            </div>

            <p className="text-gray-700 leading-relaxed"><strong>Opt-out:</strong> Settings → Privacy → Disable Analytics</p>
          </section>

          {/* Third-Party Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Stripe (Pro Plan Only)</h3>
            <p className="text-gray-700 leading-relaxed mb-2">If you add a payment method, Stripe may set cookies for fraud prevention.</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Used for payment security</li>
              <li>Required for Pro plan payments</li>
              <li>See Stripe's privacy policy: <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline">stripe.com/privacy</a></li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 No Advertising Cookies</h3>
            <p className="text-gray-700 leading-relaxed mb-3">We do NOT use:</p>
            <ul className="list-none pl-6 space-y-2 text-gray-700">
              <li>❌ Facebook Pixel</li>
              <li>❌ Google Ads tracking</li>
              <li>❌ Third-party advertisers</li>
              <li>❌ Social media trackers</li>
            </ul>
          </section>

          {/* Local Storage */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Local Storage</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {legalConfig.company.tradingAs} also uses browser local storage (similar to cookies but stays local):
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Key</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Cleared When</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-sm bg-gray-50 px-2 py-1 rounded">digiget_session_id</code></td>
                    <td className="border border-gray-300 px-4 py-2">Staff session tracking</td>
                    <td className="border border-gray-300 px-4 py-2">Logout/Browser close</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2"><code className="text-sm bg-gray-50 px-2 py-1 rounded">digiget_preferences</code></td>
                    <td className="border border-gray-300 px-4 py-2">Your UI preferences</td>
                    <td className="border border-gray-300 px-4 py-2">Account deletion</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-gray-700 leading-relaxed">This is NOT sent to servers - it stays on your device.</p>
          </section>

          {/* Your Choices */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Choices</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Accept/Reject Cookies</h3>
            <p className="text-gray-700 leading-relaxed mb-4"><strong>On first visit</strong>, you'll see a cookie banner:</p>
            
            <div className="bg-gray-100 border-2 border-gray-300 p-6 rounded-lg font-mono text-sm mb-4">
              <p className="mb-2">┌─────────────────────────────────────────────┐</p>
              <p className="mb-2">│ We use cookies                              │</p>
              <p className="mb-2">│                                             │</p>
              <p className="mb-2">│ Essential cookies: Required (always on)     │</p>
              <p className="mb-2">│ Analytics cookies: Optional                 │</p>
              <p className="mb-2">│                                             │</p>
              <p className="mb-2">│ [Accept All] [Essential Only] [Settings]   │</p>
              <p>└─────────────────────────────────────────────┘</p>
            </div>
            
            <p className="font-semibold text-gray-900 mb-2">Choices:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li><strong>Accept All:</strong> Essential + Analytics</li>
              <li><strong>Essential Only:</strong> No analytics</li>
              <li><strong>Settings:</strong> Choose specifically</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Change Cookie Preferences</h3>
            <p className="text-gray-700 leading-relaxed mb-4"><strong>Anytime:</strong> Settings → Privacy → Cookie Preferences</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3 Browser Settings</h3>
            <p className="text-gray-700 leading-relaxed mb-3">You can also block cookies via your browser:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li><strong>Chrome:</strong> Settings → Privacy → Cookies</li>
              <li><strong>Firefox:</strong> Settings → Privacy → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="font-semibold text-gray-900"><strong>Warning:</strong> Blocking essential cookies will break {legalConfig.company.tradingAs}'s functionality.</p>
            </div>
          </section>

          {/* Cookie Consent */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookie Consent</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We comply with UK GDPR and PECR (Privacy and Electronic Communications Regulations).
            </p>
            
            <p className="font-semibold text-gray-900 mb-2">What this means:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Essential cookies: No consent needed (legitimate interest)</li>
              <li>Analytics cookies: Consent required</li>
              <li>We ask before setting non-essential cookies</li>
              <li>You can withdraw consent anytime</li>
            </ul>
          </section>

          {/* Updates */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Updates to This Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We may update this policy if:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>We add new cookies</li>
              <li>Laws change</li>
              <li>Our practices change</li>
            </ul>
            
            <p className="font-semibold text-gray-900 mb-2">How we notify you:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Updated "Last Updated" date</li>
              <li>Email (if significant changes)</li>
              <li>Dashboard notice</li>
            </ul>
          </section>

          {/* More Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. More Information</h2>
            
            <p className="font-semibold text-gray-900 mb-2">Questions about cookies?</p>
            <p className="text-gray-700 mb-4">
              Email: <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a>
            </p>

            <p className="font-semibold text-gray-900 mb-2">Learn more about cookies:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li><a href="https://aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">aboutcookies.org</a></li>
              <li><a href="https://allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">allaboutcookies.org</a></li>
              <li><a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ico.org.uk</a> (UK regulator)</li>
            </ul>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-8 mt-12">
            <p className="text-gray-700 leading-relaxed mb-2"><strong>Last Updated:</strong> {legalConfig.dates.lastUpdated}</p>
            <p className="text-gray-700 leading-relaxed"><strong>Version:</strong> {legalConfig.dates.version}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

