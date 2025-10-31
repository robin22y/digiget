import { legalConfig } from '../config/privacyConfig';

export default function GDPRRights() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Your Data Protection Rights</h1>
          <p className="mt-2 text-gray-600">Last Updated: {legalConfig.dates.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          
          {/* Introduction */}
          <section className="mb-12">
            <p className="text-gray-700 leading-relaxed mb-4">
              Under UK GDPR, you have rights over your personal data.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              This page explains your rights and how to exercise them with {legalConfig.company.tradingAs}.
            </p>
          </section>

          {/* Who This Applies To */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Who This Applies To</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="font-semibold text-gray-900 mb-1">Shop Owners (Account Holders)</p>
                <p className="text-gray-700 text-sm">You control your own account data.</p>
                <p className="text-gray-700 text-sm"><strong>Contact:</strong> <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a></p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="font-semibold text-gray-900 mb-1">Staff Members</p>
                <p className="text-gray-700 text-sm">Your employer controls your employment data.</p>
                <p className="text-gray-700 text-sm"><strong>Contact:</strong> Your employer first, then <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a> if unresolved</p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <p className="font-semibold text-gray-900 mb-1">Customers (Loyalty Programme)</p>
                <p className="text-gray-700 text-sm">The shop controls your loyalty data.</p>
                <p className="text-gray-700 text-sm"><strong>Contact:</strong> The shop directly, then <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a> if unresolved</p>
              </div>
            </div>
          </section>

          {/* Right 1 - Access */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1️⃣ Right to Access</h2>
            <p className="text-gray-700 leading-relaxed mb-4"><strong>What:</strong> Get a copy of all data we hold about you</p>
            
            <p className="font-semibold text-gray-900 mb-2">How to request:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Shop owners: Settings → Privacy → Export My Data</li>
              <li>Staff/Customers: Email {legalConfig.company.contactEmail} with your full name, phone number (if customer), and shop name</li>
            </ul>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Response time:</strong> 30 days | <strong>Format:</strong> CSV or JSON | <strong>Cost:</strong> Free</p>
            </div>
          </section>

          {/* Right 2 - Rectification */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2️⃣ Right to Rectification</h2>
            <p className="text-gray-700 leading-relaxed mb-4"><strong>What:</strong> Correct inaccurate or incomplete data</p>
            
            <p className="font-semibold text-gray-900 mb-2">How to request:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Shop owners: Settings → Account → Edit Details</li>
              <li>Staff: Ask your employer to update, or email {legalConfig.company.contactEmail}</li>
              <li>Customers: Ask the shop, or email {legalConfig.company.contactEmail}</li>
            </ul>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Response time:</strong> 30 days | <strong>Cost:</strong> Free</p>
            </div>
          </section>

          {/* Right 3 - Erasure */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3️⃣ Right to Erasure ("Right to be Forgotten")</h2>
            <p className="text-gray-700 leading-relaxed mb-4"><strong>What:</strong> Request deletion of your data</p>
            
            <p className="font-semibold text-gray-900 mb-2">How to request:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Shop owners: Settings → Account → Delete Account</li>
              <li>Staff: Email {legalConfig.company.contactEmail}</li>
              <li>Customers: Contact the shop or email {legalConfig.company.contactEmail}</li>
            </ul>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="font-semibold text-gray-900 mb-2">Important limitations:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>We must keep payroll data for 6 years (HMRC requirement)</li>
                <li>We must keep payment records for 7 years (legal requirement)</li>
                <li>Active employment data can't be deleted (your employer needs it)</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Response time:</strong> 30 days | <strong>Cost:</strong> Free</p>
            </div>
          </section>

          {/* Right 4 - Restrict */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4️⃣ Right to Restrict Processing</h2>
            <p className="text-gray-700 leading-relaxed mb-4"><strong>What:</strong> Ask us to stop processing your data temporarily</p>
            
            <p className="font-semibold text-gray-900 mb-2">When this applies:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>You contest data accuracy (while we verify)</li>
              <li>Processing is unlawful but you don't want deletion</li>
              <li>We no longer need data but you need it for legal claims</li>
            </ul>
            
            <p className="font-semibold text-gray-900 mb-2">How to request:</p>
            <p className="text-gray-700 mb-4">Email {legalConfig.company.contactEmail} with your details and reason for restriction.</p>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Response time:</strong> 30 days</p>
            </div>
          </section>

          {/* Right 5 - Portability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5️⃣ Right to Data Portability</h2>
            <p className="text-gray-700 leading-relaxed mb-4"><strong>What:</strong> Receive your data in a machine-readable format</p>
            
            <p className="font-semibold text-gray-900 mb-2">What you get:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>All your personal data</li>
              <li>In CSV or JSON format</li>
              <li>Ready to import elsewhere</li>
            </ul>
            
            <p className="font-semibold text-gray-900 mb-2">How to request:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Shop owners: Settings → Export Data</li>
              <li>Staff/Customers: Email {legalConfig.company.contactEmail}</li>
            </ul>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Response time:</strong> 30 days | <strong>Cost:</strong> Free</p>
            </div>
          </section>

          {/* Right 6 - Object */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6️⃣ Right to Object</h2>
            <p className="text-gray-700 leading-relaxed mb-4"><strong>What:</strong> Object to processing based on legitimate interests</p>
            
            <p className="font-semibold text-gray-900 mb-2">Examples:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Staff: Object to GPS tracking</li>
              <li>Customers: Object to flash offers</li>
            </ul>
            
            <p className="font-semibold text-gray-900 mb-2">How to request:</p>
            <p className="text-gray-700 mb-4">Email {legalConfig.company.contactEmail} explaining what processing you object to and why.</p>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-gray-700"><strong>Note:</strong> Some processing (like staff time tracking) may be required by your employment contract. Contact your employer.</p>
            </div>
          </section>

          {/* Right 7 - Withdraw Consent */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7️⃣ Right to Withdraw Consent</h2>
            <p className="text-gray-700 leading-relaxed mb-4"><strong>What:</strong> If we process data based on consent, you can withdraw it</p>
            
            <p className="font-semibold text-gray-900 mb-2">What needs consent:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Analytics cookies (withdraw in Settings → Privacy)</li>
              <li>Marketing emails (we don't send these anyway)</li>
              <li>Flash offers (customers can unsubscribe)</li>
            </ul>
            
            <p className="font-semibold text-gray-900 mb-2">How to withdraw:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Cookies: Settings → Privacy → Cookie Preferences</li>
              <li>Flash offers: Reply "STOP" to any offer text (future feature)</li>
            </ul>
            
            <p className="text-gray-700 leading-relaxed"><strong>Effect:</strong> We stop that processing immediately</p>
          </section>

          {/* Right 8 - Complain */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8️⃣ Right to Complain</h2>
            <p className="text-gray-700 leading-relaxed mb-4"><strong>What:</strong> Lodge a complaint with the UK data protection authority</p>
            
            <p className="font-semibold text-gray-900 mb-2">When to complain:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>You think we've violated your rights</li>
              <li>We haven't responded to your request</li>
              <li>You're unhappy with our response</li>
            </ul>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">UK Supervisory Authority:</p>
              <p className="text-gray-900 mb-1"><strong>Information Commissioner's Office (ICO)</strong></p>
              <p className="text-gray-700 text-sm">Website: ico.org.uk</p>
              <p className="text-gray-700 text-sm">Phone: 0303 123 1113</p>
              <p className="text-gray-700 text-sm">Online reporting: ico.org.uk/make-a-complaint</p>
            </div>
            
            <p className="text-gray-700 leading-relaxed mt-4">Our preference: Contact us first so we can resolve your concern.</p>
          </section>

          {/* How to Exercise Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Exercise Your Rights</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Step 1: Identify Your Role</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Are you a shop owner, staff member, or customer?</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Step 2: Contact the Right Party</h3>
            <p className="font-semibold text-gray-900 mb-2">Shop Owners:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Use {legalConfig.company.tradingAs} settings directly</li>
              <li>Or email: <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a></li>
            </ul>

            <p className="font-semibold text-gray-900 mb-2">Staff Members:</p>
            <ol className="list-decimal pl-6 space-y-1 text-gray-700 mb-4">
              <li>Contact your employer first (they control your employment data)</li>
              <li>If unresolved, email us: <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a></li>
            </ol>

            <p className="font-semibold text-gray-900 mb-2">Customers:</p>
            <ol className="list-decimal pl-6 space-y-1 text-gray-700 mb-4">
              <li>Contact the shop where you checked in</li>
              <li>If unresolved, email us: <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a></li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Step 3: Provide Required Information</h3>
            <p className="text-gray-700 leading-relaxed mb-2">Include in your request:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Full name</li>
              <li>Email address or phone number</li>
              <li>Shop name (if staff/customer)</li>
              <li>Specific right you're exercising</li>
              <li>Any supporting details</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Step 4: Verify Your Identity</h3>
            <p className="text-gray-700 leading-relaxed">We may ask for proof of identity to prevent unauthorized access (copy of ID or utility bill). This protects YOUR data.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Step 5: Wait for Response</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>We aim to respond within 30 days</li>
              <li>We may extend by 60 days if request is complex (we'll tell you why)</li>
              <li>We'll confirm we've received your request within 48 hours</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact & Complaints</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">Data Protection Queries</p>
              <p className="text-gray-700">Email: <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a></p>
              <p className="text-gray-700">Response: Within 48 hours (confirmation)</p>
              <p className="text-gray-700">Resolution: Within 30 days</p>
              
              <p className="font-semibold text-gray-900 mb-2 mt-4">Formal Complaints</p>
              <p className="text-gray-700 mb-2">If you're unhappy with how we handle your data:</p>
              <ol className="list-decimal pl-6 space-y-1 text-gray-700">
                <li>Email us: <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a> (we'll try to resolve)</li>
                <li>ICO: ico.org.uk/concerns (if unresolved)</li>
              </ol>
              
              <p className="font-semibold text-gray-900 mb-2 mt-4">Postal Address</p>
              <p className="text-gray-700">{legalConfig.company.legalName}</p>
              <p className="text-gray-700">Trading as {legalConfig.company.tradingAs}</p>
              <p className="text-gray-700">{legalConfig.company.registeredAddress}</p>
            </div>
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

