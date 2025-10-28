import { useState, useEffect } from 'react';
import { Camera, AlertTriangle, Upload, X, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compressAndConvertToWebP, generateUniqueFileName } from '../utils/imageCompression';
import { getCurrentPosition } from '../utils/geolocation';

interface StaffIncidentReportProps {
  employeeId: string;
  shopId: string;
}

const INCIDENT_TYPES = [
  { value: 'shoplifting', label: 'Shoplifting' },
  { value: 'customer_complaint', label: 'Customer Complaint' },
  { value: 'safety_issue', label: 'Safety Issue' },
  { value: 'equipment_broken', label: 'Equipment Broken' },
  { value: 'staff_issue', label: 'Staff Issue' },
  { value: 'other', label: 'Other' },
];

export default function StaffIncidentReport({ employeeId, shopId }: StaffIncidentReportProps) {
  const [incidentType, setIncidentType] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    setIncidentDate(dateStr);
    setIncidentTime(timeStr);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
      }

      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!incidentType || !description.trim() || !incidentDate || !incidentTime) {
      alert('Please fill in all required fields');
      return;
    }

    setUploading(true);

    try {
      const location = await getCurrentPosition();
      let photoUrl: string | null = null;

      if (photo) {
        const compressedBlob = await compressAndConvertToWebP(photo);
        const fileName = generateUniqueFileName(photo.name);
        const filePath = `${shopId}/incidents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('incident-photos')
          .upload(filePath, compressedBlob, {
            contentType: 'image/webp',
            cacheControl: '3600',
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('incident-photos')
          .getPublicUrl(filePath);

        photoUrl = urlData.publicUrl;
      }

      const incidentDateTime = new Date(`${incidentDate}T${incidentTime}`).toISOString();

      const { error: insertError } = await supabase
        .from('incidents')
        .insert({
          shop_id: shopId,
          employee_id: employeeId,
          incident_type: incidentType,
          incident_date: incidentDateTime,
          description: description.trim(),
          photo_url: photoUrl,
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setIncidentType('');
      setDescription('');
      setPhoto(null);
      setPhotoPreview(null);

      const now = new Date();
      setIncidentDate(now.toISOString().split('T')[0]);
      setIncidentTime(now.toTimeString().slice(0, 5));

      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error submitting incident:', error);
      alert(error.message || 'Failed to submit incident report');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">Incident report submitted successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incident Type *
          </label>
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select incident type...</option>
            {INCIDENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Incident *
            </label>
            <div className="relative">
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time of Incident *
            </label>
            <input
              type="time"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please describe what happened in detail..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo (optional)
          </label>

          {!photoPreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <Camera className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload photo
                  </p>
                  <p className="text-xs text-gray-500">
                    Image will be compressed and converted to WebP
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-gray-300">
              <img
                src={photoPreview}
                alt="Incident preview"
                className="w-full h-64 object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important</p>
            <p>This report will be sent to management and cannot be deleted. Please ensure all information is accurate.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Upload className="w-5 h-5 animate-pulse" />
              Submitting Report...
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5" />
              Submit Incident Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}
