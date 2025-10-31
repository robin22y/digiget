import { privacyConfig } from '../config/privacyConfig';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-gray-600">Last Updated: {privacyConfig.dates.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          
          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to {privacyConfig.company.tradingAs} ("we," "our," or "us").
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We respect your privacy and are committed to protecting your personal data. This privacy policy tells you how we look after your personal data when you visit our website ({privacyConfig.links.websiteUrl}) or use our services, and tells you about your privacy rights and how the law protects you.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              This privacy policy applies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Shop owners who sign up for {privacyConfig.company.tradingAs}</li>
              <li>Staff members who use {privacyConfig.company.tradingAs} to clock in/out</li>
              <li>Customers who participate in shop loyalty programmes</li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="font-semibold text-gray-900 mb-2">Important information:</p>
              <ul className="list-none space-y-1 text-sm text-gray-700">
                <li><strong>Controller:</strong> {privacyConfig.company.legalName} trading as {privacyConfig.company.tradingAs} is the data controller responsible for your personal data</li>
                <li><strong>Registered Address:</strong> {privacyConfig.company.registeredAddress}</li>
                <li><strong>Contact:</strong> {privacyConfig.company.contactEmail}</li>
                {privacyConfig.company.icoNumber !== '[YOUR ICO NUMBER]' && (
                  <li><strong>ICO Registration:</strong> {privacyConfig.company.icoNumber}</li>
                )}
              </ul>
            </div>
          </section>

          {/* What Data We Collect */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. What Data We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Shop Owners (Account Holders)</h3>
            <p className="text-gray-700 leading-relaxed mb-3">When you sign up for {privacyConfig.company.tradingAs}, we collect:</p>
            
            <p className="font-semibold text-gray-900 mb-2">Account Information:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Email address</li>
              <li>Password (encrypted)</li>
              <li>Shop name</li>
              <li>Shop address</li>
              <li>Phone number (optional)</li>
            </ul>

            <p className="font-semibold text-gray-900 mb-2">Business Information:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Business category (e.g., coffee shop, bakery)</li>
              <li>Shop location (latitude/longitude for GPS verification)</li>
              <li>Plan type (Basic or Pro)</li>
            </ul>

            <p className="font-semibold text-gray-900 mb-2">Payment Information (Pro plan only):</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Credit/debit card details (processed by Stripe - we don't store full card numbers)</li>
              <li>Billing address</li>
              <li>Payment history</li>
            </ul>

            <p className="font-semibold text-gray-900 mb-2">Usage Data:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>How you use the dashboard</li>
              <li>Features accessed</li>
              <li>Login times and IP addresses</li>
              <li>Device information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Staff Members</h3>
            <p className="text-gray-700 leading-relaxed mb-3">When shop owners add staff to {privacyConfig.company.tradingAs}:</p>
            
            <p className="font-semibold text-gray-900 mb-2">Basic Information:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>First name and last name</li>
              <li>4-digit PIN (encrypted)</li>
              <li>Phone number (optional)</li>
              <li>Email address (optional - for future features)</li>
            </ul>

            <p className="font-semibold text-gray-900 mb-2">Work Data:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Clock in/out times</li>
              <li>GPS location when clocking in (to verify shop presence)</li>
              <li>Tasks completed</li>
              <li>Hours worked</li>
              <li>Incident reports (if filed)</li>
            </ul>

            <p className="font-semibold text-gray-900 mb-2">Session Data:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Login location (when using remote access)</li>
              <li>Device type</li>
              <li>IP address</li>
              <li>Session duration</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.3 Customers (Loyalty Programme Participants)</h3>
            <p className="text-gray-700 leading-relaxed mb-3">When customers check in at shops using {privacyConfig.company.tradingAs}:</p>
            
            <p className="font-semibold text-gray-900 mb-2">Basic Information:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Phone number (primary identifier)</li>
              <li>First name (optional - shop can add)</li>
              <li>Last name (optional - shop can add)</li>
            </ul>

            <p className="font-semibold text-gray-900 mb-2">Loyalty Data:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Points balance</li>
              <li>Visit history (dates and times)</li>
              <li>Rewards redeemed</li>
              <li>Shop(s) visited (if customer uses multiple {privacyConfig.company.tradingAs} shops)</li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="font-semibold text-gray-900 mb-2">We do NOT collect:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Email addresses (unless customer provides voluntarily)</li>
                <li>Purchase amounts</li>
                <li>Items purchased</li>
                <li>Payment information</li>
              </ul>
            </div>
          </section>

          {/* How We Collect Data */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Collect Data</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Direct Collection</h3>
            <p className="text-gray-700 leading-relaxed mb-3">You provide data directly when:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Creating an account</li>
              <li>Adding staff members</li>
              <li>Checking in customers</li>
              <li>Using the service</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Automatic Collection</h3>
            <p className="text-gray-700 leading-relaxed mb-3">We automatically collect:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>GPS location (when staff clock in or use remote access)</li>
              <li>Usage analytics (via cookies)</li>
              <li>Technical data (IP address, browser type, device)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Third Parties</h3>
            <p className="text-gray-700 leading-relaxed mb-3">We receive data from:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li><strong>Stripe</strong> (payment confirmations - Pro plan only)</li>
              <li><strong>Supabase</strong> (our hosting provider - stores all data)</li>
            </ul>
          </section>

          {/* How We Use Your Data */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Use Your Data</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Shop Owners</h3>
            <p className="text-gray-700 leading-relaxed mb-3">We use your data to:</p>
            <ul className="list-none pl-6 space-y-2 text-gray-700">
              <li>✓ Provide the {privacyConfig.company.tradingAs} service</li>
              <li>✓ Process payments (Pro plan)</li>
              <li>✓ Send service emails (account updates, system status)</li>
              <li>✓ Provide customer support</li>
              <li>✓ Improve our service</li>
              <li>✓ Comply with legal obligations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4"><strong>Legal Basis:</strong> Contract performance, legitimate interests, legal obligation</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Staff Members</h3>
            <p className="text-gray-700 leading-relaxed mb-3">Shop owners use {privacyConfig.company.tradingAs} to:</p>
            <ul className="list-none pl-6 space-y-2 text-gray-700">
              <li>✓ Track working hours (for payroll)</li>
              <li>✓ Verify staff are at shop location (GPS check)</li>
              <li>✓ Manage tasks and incidents</li>
              <li>✓ Monitor performance (Pro plan)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4"><strong>Legal Basis:</strong> Employment contract (between staff and shop owner), legitimate business interest</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="font-semibold text-gray-900 mb-2">Important:</p>
              <p className="text-gray-700">We are a data processor for staff data. The shop owner is the data controller. Staff should direct privacy queries to their employer.</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Customers</h3>
            <p className="text-gray-700 leading-relaxed mb-3">Shops use customer data to:</p>
            <ul className="list-none pl-6 space-y-2 text-gray-700">
              <li>✓ Track loyalty points</li>
              <li>✓ Provide rewards</li>
              <li>✓ Send flash offers (if customer opted in)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4"><strong>Legal Basis:</strong> Legitimate business interest (loyalty programme operation)</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="font-semibold text-gray-900 mb-2">Important:</p>
              <p className="text-gray-700">We are a data processor for customer data. The shop owner is the data controller. Customers should direct privacy queries to the shop.</p>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 We Share Data With:</h3>
            <p className="font-semibold text-gray-900 mb-2">Service Providers:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li><strong>Supabase</strong> (AWS EU servers) - database hosting</li>
              <li><strong>Stripe</strong> (if Pro plan) - payment processing</li>
              <li><strong>Resend</strong> - transactional emails</li>
              <li><strong>Netlify</strong> - website hosting</li>
            </ul>

            <p className="font-semibold text-gray-900 mb-2">Legal Requirements:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>UK authorities if required by law</li>
              <li>Fraud prevention agencies</li>
              <li>Professional advisers (lawyers, accountants)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 We Do NOT:</h3>
            <ul className="list-none pl-6 space-y-2 text-gray-700">
              <li>❌ Sell your data to anyone</li>
              <li>❌ Share data with advertisers</li>
              <li>❌ Use data for marketing (beyond service emails)</li>
              <li>❌ Share across different shops (each shop's data is isolated)</li>
            </ul>
          </section>

          {/* Data Storage & Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Storage & Security</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1 Where We Store Data</h3>
            <p className="text-gray-700 leading-relaxed mb-3">All data is stored in:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li><strong>Supabase (AWS EU-West-2 region)</strong> - London, UK data centers</li>
              <li><strong>Encrypted at rest and in transit</strong> (bank-level encryption)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">We do NOT transfer data outside the UK/EU.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2 Security Measures</h3>
            <ul className="list-none pl-6 space-y-2 text-gray-700">
              <li>✓ TLS/SSL encryption (HTTPS)</li>
              <li>✓ Password hashing (bcrypt for PINs)</li>
              <li>✓ Role-based access controls</li>
              <li>✓ Regular security audits</li>
              <li>✓ Automated backups</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.3 How Long We Keep Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 mt-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Data Type</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Retention Period</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Shop owner accounts</td>
                    <td className="border border-gray-300 px-4 py-2">Until account deleted + 30 days</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Staff clock-in records</td>
                    <td className="border border-gray-300 px-4 py-2">6 years (HMRC requirement for payroll)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Customer loyalty data</td>
                    <td className="border border-gray-300 px-4 py-2">Immediate and unrecoverable</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Staff GPS location logs</td>
                    <td className="border border-gray-300 px-4 py-2">90 days then auto-deleted</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Session logs</td>
                    <td className="border border-gray-300 px-4 py-2">90 days then auto-deleted</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Payment records</td>
                    <td className="border border-gray-300 px-4 py-2">7 years (legal requirement)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
              <p className="font-semibold text-gray-900 mb-2">Important Notes:</p>
              <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                <li><strong>Customer loyalty data:</strong> Deleted immediately and permanently when shop account is deleted. No recovery possible.</li>
                <li><strong>Shop accounts:</strong> Deleted permanently after 30-day grace period from account deletion request.</li>
                <li><strong>Staff clock-in records:</strong> Must be kept 6 years for HMRC requirements. Protected data.</li>
                <li><strong>GPS location logs:</strong> Auto-deleted every 90 days by automated process.</li>
                <li><strong>Payment records:</strong> Must be kept 7 years for tax/legal requirements. Protected data.</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights (UK GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">7.1 Access Your Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Request a copy of all data we hold about you.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">7.2 Rectification</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Correct inaccurate or incomplete data.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">7.3 Erasure ("Right to be Forgotten")</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Request deletion of your data (subject to legal obligations).</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">7.4 Restrict Processing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Ask us to stop processing your data temporarily.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">7.5 Data Portability</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Receive your data in a machine-readable format.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">7.6 Object</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Object to processing based on legitimate interests.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">7.7 Withdraw Consent</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Where we rely on consent, withdraw it at any time.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">7.8 Complain</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Lodge a complaint with the ICO (ico.org.uk).</p>
          </section>

          {/* How to Exercise Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. How to Exercise Your Rights</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">For Shop Owners:</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              Email: <a href={`mailto:${privacyConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{privacyConfig.company.contactEmail}</a>
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">Or use: Settings → Privacy → Export My Data</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">For Staff Members:</h3>
            <p className="text-gray-700 leading-relaxed mb-2">Contact your employer first (they control your data).</p>
            <p className="text-gray-700 leading-relaxed mb-4">If unresolved, email: <a href={`mailto:${privacyConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{privacyConfig.company.contactEmail}</a></p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">For Customers:</h3>
            <p className="text-gray-700 leading-relaxed mb-2">Contact the shop where you checked in first.</p>
            <p className="text-gray-700 leading-relaxed mb-4">If unresolved, email: <a href={`mailto:${privacyConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{privacyConfig.company.contactEmail}</a></p>

            <p className="text-gray-700 leading-relaxed"><strong>Response Time:</strong> We respond within 30 days.</p>
          </section>

          {/* Cookies & Tracking */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies & Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use minimal cookies:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Essential Cookies (Always On)</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li><strong>Session cookie:</strong> Keeps you logged in</li>
              <li><strong>Security cookie:</strong> Prevents attacks</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Analytics Cookies (Optional)</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li><strong>Usage tracking:</strong> Anonymous usage statistics</li>
              <li>You can opt out in Settings → Privacy</li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="font-semibold text-gray-900 mb-2">We do NOT use:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Advertising cookies</li>
                <li>Social media tracking pixels</li>
                <li>Third-party analytics beyond basic usage</li>
              </ul>
            </div>

            <p className="text-gray-700 leading-relaxed mt-4">See our full <a href={privacyConfig.links.cookiesPage} className="text-blue-600 hover:underline">Cookie Policy</a> for details.</p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {privacyConfig.company.tradingAs} is a business tool not intended for children under 13.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">We do not knowingly collect data from children. If we discover we have, we delete it immediately.</p>
            <p className="text-gray-700 leading-relaxed">If a child is registered as a customer (e.g., parent's phone number), the parent/guardian is responsible for that data.</p>
          </section>

          {/* Changes to This Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We may update this policy to reflect:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Legal changes</li>
              <li>New features</li>
              <li>Feedback</li>
            </ul>
            <p className="text-gray-700 leading-relaxed"><strong>We'll notify you via:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Email (for significant changes)</li>
              <li>Dashboard notice</li>
              <li>Updated "Last Updated" date</li>
            </ul>
          </section>

          {/* Contact Us */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            
            <p className="font-semibold text-gray-900 mb-2">Privacy Questions:</p>
            <p className="text-gray-700 leading-relaxed mb-1">
              Email: <a href={`mailto:${privacyConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{privacyConfig.company.contactEmail}</a>
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Mail: {privacyConfig.company.registeredAddress}
            </p>

            {privacyConfig.company.dpoEmail !== privacyConfig.company.contactEmail && (
              <>
                <p className="font-semibold text-gray-900 mb-2">Data Protection Officer:</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Email: <a href={`mailto:${privacyConfig.company.dpoEmail}`} className="text-blue-600 hover:underline">{privacyConfig.company.dpoEmail}</a>
                </p>
              </>
            )}

            <p className="font-semibold text-gray-900 mb-2">Supervisory Authority:</p>
            <p className="text-gray-700 leading-relaxed mb-1"><strong>Information Commissioner's Office (ICO)</strong></p>
            <p className="text-gray-700 leading-relaxed mb-1">Website: ico.org.uk</p>
            <p className="text-gray-700 leading-relaxed">Phone: 0303 123 1113</p>
          </section>

          {/* Legal Basis Summary */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Legal Basis Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 mt-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Legal Basis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Provide {privacyConfig.company.tradingAs} service</td>
                    <td className="border border-gray-300 px-4 py-2">Contract performance</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Process payments</td>
                    <td className="border border-gray-300 px-4 py-2">Contract performance</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Staff time tracking</td>
                    <td className="border border-gray-300 px-4 py-2">Legitimate business interest</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">GPS location verification</td>
                    <td className="border border-gray-300 px-4 py-2">Legitimate business interest</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Customer loyalty</td>
                    <td className="border border-gray-300 px-4 py-2">Legitimate business interest</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Legal compliance</td>
                    <td className="border border-gray-300 px-4 py-2">Legal obligation</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Service improvement</td>
                    <td className="border border-gray-300 px-4 py-2">Legitimate interest</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-8 mt-12">
            <p className="text-gray-700 leading-relaxed mb-2"><strong>Effective Date:</strong> {privacyConfig.dates.effectiveDate}</p>
            <p className="text-gray-700 leading-relaxed"><strong>Version:</strong> {privacyConfig.dates.version}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

