import { useState } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface GPSConsentModalProps {
  employeeName: string;
  onAgree: () => void;
  onDecline: () => void;
  isOpen: boolean;
}

export default function GPSConsentModal({ employeeName, onAgree, onDecline, isOpen }: GPSConsentModalProps) {
  const [checked, setChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">GPS Location Consent</h2>
          <button
            onClick={onDecline}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-lg font-semibold text-gray-900">Hi {employeeName}!</p>
              <p className="text-sm text-gray-600">Before you can clock in, we need your consent for location tracking.</p>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <label className="flex items-start gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  ☐ I consent to DigiGet recording my GPS location when I clock in and out.
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  This is used to verify I am at the shop location.
                </p>
                
                <div className="bg-white rounded-lg p-4 space-y-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-2">I understand:</p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Location is only recorded at clock-in/out times</li>
                    <li>Location data is stored for 3 years for payroll records</li>
                    <li>I can object to this processing (but may not be able to use the service)</li>
                    <li>Shop owner can see my location stamps</li>
                  </ul>
                </div>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onDecline}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors border-2 border-gray-300"
            >
              I Do Not Agree
            </button>
            <button
              onClick={onAgree}
              disabled={!checked}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all border-2 ${
                checked
                  ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-lg'
                  : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                I Agree
              </span>
            </button>
          </div>

          {/* Info Note */}
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 border border-gray-200">
            <p className="font-semibold mb-1">📋 Your Rights:</p>
            <p>
              You have the right to withdraw consent at any time. However, GPS location tracking is required 
              for the clock in/out feature. If you decline, you may need to contact your manager for alternative 
              clock-in arrangements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

