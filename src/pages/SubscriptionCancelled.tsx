import { Link } from 'react-router-dom';

export default function SubscriptionCancelled() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8 text-center">
        <div className="text-6xl mb-6">😢</div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Subscription Cancelled</h1>
        
        <p className="text-gray-600 mb-6">
          We're sorry to see you go. Your subscription has been cancelled.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
          <strong className="text-blue-900 block mb-2">What happens next:</strong>
          <ul className="mt-2 mb-0 text-blue-800 text-sm space-y-1">
            <li>You can use DigiGet until the end of your billing period</li>
            <li>Your data will be kept for 30 days</li>
            <li>You can reactivate anytime within 30 days</li>
            <li>After 30 days, all data will be deleted</li>
          </ul>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-left">
          <strong className="text-orange-900 block mb-2">Changed your mind?</strong>
          <p className="mb-0 mt-2 text-orange-800 text-sm">
            Email us at <a href="mailto:help@digiget.uk" className="underline">help@digiget.uk</a> and 
            we'll reactivate your account immediately.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link 
            to="/dashboard" 
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Dashboard
          </Link>
          <a 
            href="mailto:help@digiget.uk" 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

