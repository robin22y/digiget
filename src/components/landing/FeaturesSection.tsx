export default function FeaturesSection() {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 md:mb-12 text-center tracking-tight">
          What You Get
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-5 md:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3 md:mb-4">
              PRO PLAN - £9.99/month
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">STAFF MANAGEMENT</h3>
            
            <div className="space-y-3 text-gray-700">
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-1">Clock In/Out</h4>
                <p className="text-xs md:text-sm leading-relaxed">Staff enter their 4-digit PIN to clock in. DigiGet tracks their hours automatically.</p>
              </div>
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-1">Location Verification</h4>
                <p className="text-xs md:text-sm leading-relaxed">GPS checks they're actually at your shop. They can't clock in from home.</p>
              </div>
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-1">Payroll Reports</h4>
                <p className="text-xs md:text-sm leading-relaxed">See hours worked per person, per day/week/month. Ready for your accountant.</p>
              </div>
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-1">Task Checklists</h4>
                <p className="text-xs md:text-sm leading-relaxed">Create daily tasks. Staff tick them off. You see what's been done.</p>
              </div>
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-1">Incident Logging</h4>
                <p className="text-xs md:text-sm leading-relaxed">Record accidents or issues immediately with photos and notes.</p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-5 md:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3 md:mb-4">
              BASIC & PRO
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">CUSTOMER LOYALTY</h3>
            
            <div className="space-y-3 text-gray-700">
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-1">No App Required</h4>
                <p className="text-xs md:text-sm leading-relaxed">Customers give their phone number at the till. DigiGet tracks their points.</p>
              </div>
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-1">Customizable Rewards</h4>
                <p className="text-xs md:text-sm leading-relaxed">"Buy 10 coffees, get 1 free" or "Collect 100 points for £5 off"—your choice.</p>
              </div>
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-1">Flash Offers</h4>
                <p className="text-xs md:text-sm leading-relaxed">Send instant deals to customers who haven't visited in a while.</p>
              </div>
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-1">Balance Checker</h4>
                <p className="text-xs md:text-sm leading-relaxed">Customers can check their points anytime via a simple web link.</p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-200 p-5 md:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3 md:mb-4">
              BASIC & PRO
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">SIMPLE BOOKINGS</h3>
            
            <div className="space-y-3 text-gray-700">
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-1">Appointment Diary</h4>
                <p className="text-xs md:text-sm leading-relaxed">Track basic bookings and walk-ins. No complex features you don't need.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

