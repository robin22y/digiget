import { Link } from 'react-router-dom';

export default function AccountDeleted() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8 text-center">
        <div className="text-6xl mb-6">👋</div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Account Deleted</h1>
        
        <p className="text-gray-600 mb-6">
          Your DigiGet account and all associated data have been permanently deleted.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <strong className="text-blue-900 block mb-2">What was deleted:</strong>
          <ul className="mt-2 mb-0 text-blue-800 text-sm space-y-1">
            <li>Your shop account</li>
            <li>All staff members</li>
            <li>All customers</li>
            <li>All clock-in/out history</li>
            <li>All loyalty points</li>
            <li>All settings and data</li>
          </ul>
        </div>

        <p className="mb-4 text-gray-700">
          Thank you for using DigiGet. We're sorry it didn't work out.
        </p>

        <p className="text-gray-600 text-sm mb-6">
          If you have feedback on how we can improve, please email{' '}
          <a href="mailto:help@digiget.uk" className="underline">help@digiget.uk</a>
        </p>

        <div className="flex gap-3 justify-center">
          <Link 
            to="/" 
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Home
          </Link>
          <Link 
            to="/signup" 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create New Account
          </Link>
        </div>
      </div>
    </div>
  );
}

