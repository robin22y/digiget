import { legalConfig } from '../config/privacyConfig';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-gray-600">Last Updated: {legalConfig.dates.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          
          {/* Agreement to Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing or using {legalConfig.company.tradingAs} ({legalConfig.links.websiteUrl}), you agree to be bound by these Terms of Service ("Terms").
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">If you disagree with any part of these Terms, you may not access the service.</p>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="font-semibold text-gray-900 mb-2">Key Definitions:</p>
              <ul className="list-none space-y-1 text-sm text-gray-700">
                <li><strong>"We," "Us," "Our"</strong>: {legalConfig.company.legalName} trading as {legalConfig.company.tradingAs}</li>
                <li><strong>"You," "Your"</strong>: The shop owner (account holder)</li>
                <li><strong>"Service"</strong>: The {legalConfig.company.tradingAs} platform (website, software, features)</li>
                <li><strong>"Shop"</strong>: Your business using {legalConfig.company.tradingAs}</li>
                <li><strong>"Staff"</strong>: Your employees using {legalConfig.company.tradingAs}</li>
                <li><strong>"Customers"</strong>: People in your loyalty programme</li>
              </ul>
            </div>
          </section>

          {/* Service Description */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 leading-relaxed mb-3">{legalConfig.company.tradingAs} provides:</p>
            <ul className="list-none pl-6 space-y-2 text-gray-700 mb-6">
              <li>✓ Staff clock in/out tracking (GPS-verified)</li>
              <li>✓ Customer loyalty programme management</li>
              <li>✓ Task management (Pro plan)</li>
              <li>✓ Payroll reporting (Pro plan)</li>
              <li>✓ Incident reporting (Pro plan)</li>
            </ul>
            
            <p className="font-semibold text-gray-900 mb-2">What {legalConfig.company.tradingAs} is NOT:</p>
            <ul className="list-none pl-6 space-y-2 text-gray-700">
              <li>❌ Not a POS (point of sale) system</li>
              <li>❌ Not a payment processor</li>
              <li>❌ Not an accounting system</li>
              <li>❌ Not inventory management</li>
              <li>❌ Not a complete HR system</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Eligibility</h3>
            <p className="text-gray-700 leading-relaxed mb-3">You must be:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>18+ years old</li>
              <li>Authorized to bind your business to these Terms</li>
              <li>Operating a legitimate business in the UK</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Account Accuracy</h3>
            <p className="text-gray-700 leading-relaxed mb-3">You agree to:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Provide accurate information</li>
              <li>Keep your account details updated</li>
              <li>Maintain password security</li>
              <li>Notify us immediately of unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 One Account Per Shop</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>You may create ONE account per physical shop location</li>
              <li>Multiple shops require separate accounts</li>
              <li>Account sharing is not permitted</li>
            </ul>
          </section>

          {/* Plans & Pricing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Plans & Pricing</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Basic Plan (FREE)</h3>
            <p className="font-semibold text-gray-900 mb-2">Included:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>1 staff member + owner (2 people total)</li>
              <li>50 customer check-ins per month</li>
              <li>Basic clock in/out</li>
              <li>Basic loyalty features</li>
            </ul>
            <p className="font-semibold text-gray-900 mb-2">Limitations:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>No access to new features</li>
              <li>50 customer limit resets monthly</li>
              <li>Limited support (email only)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Pro Plan (£{legalConfig.pricing.proMonthly}/month)</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="font-semibold text-gray-900 mb-2">Promotional Period:</p>
              <ul className="list-none space-y-1 text-gray-700">
                <li>• FREE until {legalConfig.pricing.christmasFreeUntil}</li>
                <li>• After Christmas: £{legalConfig.pricing.proMonthly}/month</li>
              </ul>
            </div>
            <p className="font-semibold text-gray-900 mb-2">Included:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Unlimited staff</li>
              <li>Unlimited customers</li>
              <li>All features (tasks, reports, analytics)</li>
              <li>Access to new experimental features</li>
              <li>Priority email support</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Pricing Changes</h3>
            <p className="text-gray-700 leading-relaxed mb-3">We reserve the right to:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Change prices with 30 days' notice</li>
              <li>Grandfather existing customers at old price for 12 months</li>
              <li>Adjust Pro price after promotional period</li>
            </ul>
            <p className="text-gray-700 leading-relaxed font-semibold">Note: Basic plan will remain free forever (subject to fair use limits).</p>
          </section>

          {/* Payment Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment Terms (Pro Plan Only)</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Billing</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Charged monthly in advance</li>
              <li>First charge: 26 December 2025 (after free period)</li>
              <li>Automatic renewal unless cancelled</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Payment Methods</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Credit/debit card via Stripe</li>
              <li>UK-issued cards accepted</li>
              <li>Payment failures may suspend service</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3 Refunds</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>No refunds for partial months</li>
              <li>Cancel anytime before next billing cycle</li>
              <li>Free trial: No charges if cancelled before Christmas 2025</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.4 Failed Payments</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>3 retry attempts over 10 days</li>
              <li>Email notifications sent</li>
              <li>Service suspended after 3 failures</li>
              <li>Account deleted after 30 days non-payment</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Acceptable Use</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1 You MAY:</h3>
            <ul className="list-none pl-6 space-y-2 text-gray-700">
              <li>✓ Use {legalConfig.company.tradingAs} for your legitimate business</li>
              <li>✓ Add staff and customers</li>
              <li>✓ Export your data anytime</li>
              <li>✓ Cancel your account anytime</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2 You MAY NOT:</h3>
            <ul className="list-none pl-6 space-y-2 text-gray-700">
              <li>❌ Violate any laws or regulations</li>
              <li>❌ Misuse staff or customer data</li>
              <li>❌ Attempt to hack, disrupt, or abuse the service</li>
              <li>❌ Resell or redistribute {legalConfig.company.tradingAs}</li>
              <li>❌ Use for illegal activities</li>
              <li>❌ Share your account with other businesses</li>
              <li>❌ Abuse the free plan (e.g., creating multiple accounts)</li>
              <li>❌ Reverse engineer the software</li>
            </ul>
          </section>

          {/* Data Ownership */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Ownership & Control</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.1 Your Data</h3>
            <p className="font-semibold text-gray-900 mb-2">You own:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Your shop information</li>
              <li>Your staff data</li>
              <li>Your customer data</li>
              <li>All content you create</li>
            </ul>
            <p className="font-semibold text-gray-900 mb-2">We own:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>The {legalConfig.company.tradingAs} software</li>
              <li>The platform infrastructure</li>
              <li>Our code and designs</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.2 Data Controller/Processor Roles</h3>
            <p className="font-semibold text-gray-900 mb-2">You are the data controller for:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Staff data (employment data)</li>
              <li>Customer data (loyalty data)</li>
            </ul>
            <p className="font-semibold text-gray-900 mb-2">We are the data processor:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>We process data on your instructions</li>
              <li>You must have legal basis to collect data</li>
              <li>You're responsible for GDPR compliance with your staff/customers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.3 Your Responsibilities</h3>
            <p className="text-gray-700 leading-relaxed mb-3">You must:</p>
            <ul className="list-none pl-6 space-y-2 text-gray-700 mb-4">
              <li>✓ Inform staff about GPS tracking</li>
              <li>✓ Have legal basis to track staff hours</li>
              <li>✓ Inform customers about loyalty data collection</li>
              <li>✓ Comply with UK GDPR</li>
              <li>✓ Respond to data subject requests from your staff/customers</li>
            </ul>
            <p className="text-gray-700 leading-relaxed font-semibold">We provide tools, but YOU are responsible for lawful use.</p>
          </section>

          {/* Data Processing Agreement */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Processing Agreement (DPA)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">By using {legalConfig.company.tradingAs}, you agree to our Data Processing Agreement:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.1 Our Obligations</h3>
            <p className="text-gray-700 leading-relaxed mb-3">We will:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Process data only per your instructions</li>
              <li>Keep data secure (encryption, access controls)</li>
              <li>Not share data with third parties (except service providers)</li>
              <li>Delete data when you request it</li>
              <li>Assist with data subject requests</li>
              <li>Notify you of data breaches within 72 hours</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.2 Your Obligations</h3>
            <p className="text-gray-700 leading-relaxed mb-3">You will:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Ensure you have legal right to process the data</li>
              <li>Inform staff/customers about data collection</li>
              <li>Handle data subject requests</li>
              <li>Use data lawfully</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.3 Sub-Processors</h3>
            <p className="text-gray-700 leading-relaxed mb-3">We use these sub-processors:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Supabase (database hosting - AWS EU)</li>
              <li>Stripe (payments - Pro plan only)</li>
              <li>Resend (transactional emails)</li>
              <li>Netlify (website hosting)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">All sub-processors are UK GDPR compliant.</p>
          </section>

          {/* Service Availability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Service Availability</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.1 Uptime Target</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We aim for 99% uptime monthly, but do NOT guarantee it.</p>
            <p className="font-semibold text-gray-900 mb-2">Reasons for downtime:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Scheduled maintenance (announced 24h advance)</li>
              <li>Emergency fixes</li>
              <li>Server issues beyond our control</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.2 No Warranty</h3>
            <p className="text-gray-700 leading-relaxed mb-3">{legalConfig.company.tradingAs} is provided "AS IS" without warranties of:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Uninterrupted service</li>
              <li>Error-free operation</li>
              <li>Specific results</li>
              <li>Fitness for particular purpose</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.3 Backup Your Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4 font-semibold">You should regularly export your data.</p>
            <p className="text-gray-700 leading-relaxed mb-3">While we maintain backups, we're not liable for data loss.</p>
            <p className="font-semibold text-gray-900 mb-2">Export options:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Settings → Export Data (CSV)</li>
              <li>Available anytime</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10.1 {legalConfig.company.tradingAs} IP</h3>
            <p className="text-gray-700 leading-relaxed mb-3">We own all rights to:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>{legalConfig.company.tradingAs} software</li>
              <li>Logos, designs, trademarks</li>
              <li>Code, algorithms, features</li>
              <li>Documentation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10.2 License Grant</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We grant you a non-exclusive, non-transferable license to use {legalConfig.company.tradingAs} for your business.</p>
            <p className="text-gray-700 leading-relaxed">This license terminates when your account closes.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10.3 Feedback</h3>
            <p className="text-gray-700 leading-relaxed mb-3">If you provide ideas or feedback:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>We can use it without obligation</li>
              <li>You don't get ownership or compensation</li>
              <li>No obligation to implement</li>
            </ul>
          </section>

          {/* Limitations of Liability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitations of Liability</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.1 Indirect Damages</h3>
            <p className="font-semibold text-gray-900 mb-2">We are NOT liable for:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Lost profits or revenue</li>
              <li>Lost data (export regularly!)</li>
              <li>Business interruption</li>
              <li>Indirect or consequential damages</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.2 Maximum Liability</h3>
            <p className="font-semibold text-gray-900 mb-2">Our total liability is limited to:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Basic plan: £0 (it's free)</li>
              <li>Pro plan: 12 months of fees paid (max £119.88)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.3 Exceptions</h3>
            <p className="text-gray-700 leading-relaxed">Limitations don't apply to:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Death or personal injury from our negligence</li>
              <li>Fraud or fraudulent misrepresentation</li>
              <li>Anything that cannot be limited by UK law</li>
            </ul>
          </section>

          {/* Indemnification */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You agree to indemnify us against claims arising from:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Your breach of these Terms</li>
              <li>Your violation of laws</li>
              <li>Your misuse of staff/customer data</li>
              <li>Content you upload</li>
              <li>Your business practices</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-gray-700"><strong>Example:</strong> If a staff member sues us because you tracked them illegally, you're responsible.</p>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Termination</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">13.1 You Can Cancel Anytime</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Cancel from Settings → Account → Cancel</li>
              <li>Access continues until end of billing period (Pro)</li>
              <li>Data retained for 30 days then deleted</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">13.2 We Can Suspend/Terminate If:</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>You breach these Terms</li>
              <li>You abuse the service</li>
              <li>Payment fails (Pro)</li>
              <li>Illegal activity detected</li>
              <li>We discontinue the service (30 days' notice)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">13.3 Upon Termination</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Your access stops immediately</li>
              <li>Data retained 30 days (for recovery)</li>
              <li>After 30 days: Permanent deletion</li>
            </ul>
            <p className="text-gray-700 leading-relaxed font-semibold">Export your data before cancelling!</p>
          </section>

          {/* Changes to Service */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to Service</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">14.1 Feature Changes</h3>
            <p className="text-gray-700 leading-relaxed mb-3">We may:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Add new features (Pro users get access)</li>
              <li>Modify existing features (with notice)</li>
              <li>Remove features (rare, with 90 days' notice)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">14.2 Terms Changes</h3>
            <p className="text-gray-700 leading-relaxed mb-3">We may update these Terms:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Minor changes: Posted on website</li>
              <li>Major changes: Email notice + 30 days to object</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">Continued use = acceptance of new Terms.</p>
          </section>

          {/* Disputes & Governing Law */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Disputes & Governing Law</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.1 Governing Law</h3>
            <p className="text-gray-700 leading-relaxed">These Terms are governed by the laws of England and Wales.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.2 Jurisdiction</h3>
            <p className="text-gray-700 leading-relaxed">Courts of England and Wales have exclusive jurisdiction.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.3 Dispute Resolution</h3>
            <p className="text-gray-700 leading-relaxed mb-3">Before legal action:</p>
            <ol className="list-decimal pl-6 space-y-1 text-gray-700">
              <li>Contact us: <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a></li>
              <li>We'll try to resolve within 30 days</li>
              <li>If unresolved, proceed to court</li>
            </ol>
          </section>

          {/* General Provisions */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. General Provisions</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">16.1 Entire Agreement</h3>
            <p className="text-gray-700 leading-relaxed">These Terms + Privacy Policy = the complete agreement.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">16.2 Severability</h3>
            <p className="text-gray-700 leading-relaxed">If any provision is unenforceable, the rest remains valid.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">16.3 No Waiver</h3>
            <p className="text-gray-700 leading-relaxed">Our failure to enforce a right doesn't waive that right.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">16.4 Assignment</h3>
            <p className="text-gray-700 leading-relaxed">You can't transfer your account. We can transfer our rights (e.g., if acquired).</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">16.5 Force Majeure</h3>
            <p className="text-gray-700 leading-relaxed">We're not liable for delays due to events beyond our control (natural disasters, pandemics, war, etc.).</p>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Contact Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">Company:</p>
              <p className="text-gray-700">{legalConfig.company.legalName}</p>
              <p className="text-gray-700">Trading as: {legalConfig.company.tradingAs}</p>
              
              <p className="font-semibold text-gray-900 mb-2 mt-4">Registered Address:</p>
              <p className="text-gray-700">{legalConfig.company.registeredAddress}</p>
              
              <p className="font-semibold text-gray-900 mb-2 mt-4">Contact:</p>
              <p className="text-gray-700">Email: <a href={`mailto:${legalConfig.company.contactEmail}`} className="text-blue-600 hover:underline">{legalConfig.company.contactEmail}</a></p>
              <p className="text-gray-700">Website: {legalConfig.links.websiteUrl}</p>
              
              {legalConfig.company.companyNumber !== '[COMPANY NUMBER]' && (
                <p className="text-gray-700 mt-2">Company Number: {legalConfig.company.companyNumber}</p>
              )}
              {legalConfig.company.icoNumber !== '[YOUR ICO NUMBER]' && (
                <p className="text-gray-700">ICO Registration: {legalConfig.company.icoNumber}</p>
              )}
            </div>
          </section>

          {/* Specific Terms for Different Users */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Specific Terms for Different Users</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">18.1 Staff Terms</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Staff members use {legalConfig.company.tradingAs} under their employer's account.</p>
            <p className="font-semibold text-gray-900 mb-2">Staff agree to:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Use their assigned PIN responsibly</li>
              <li>Clock in only when actually at work</li>
              <li>Not share PINs</li>
              <li>Accept GPS location tracking</li>
            </ul>
            <p className="text-gray-700 leading-relaxed"><strong>Staff disputes:</strong> Contact your employer first, not {legalConfig.company.tradingAs}.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">18.2 Customer Terms</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Customers participate in loyalty programmes.</p>
            <p className="font-semibold text-gray-900 mb-2">By checking in, customers agree:</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Their phone number is stored</li>
              <li>Visit history is tracked</li>
              <li>Shop can send flash offers (if opted in)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed"><strong>Data requests:</strong> Contact the shop directly, not {legalConfig.company.tradingAs}.</p>
          </section>

          {/* Acceptance */}
          <section className="mb-12">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance</h2>
              <p className="text-gray-700 leading-relaxed mb-3">By clicking "Sign Up" or using {legalConfig.company.tradingAs}, you acknowledge:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>You've read these Terms</li>
                <li>You understand your obligations</li>
                <li>You agree to be bound by these Terms</li>
                <li>You have authority to bind your business</li>
              </ul>
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

