import { useEffect, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, CheckCircle, Download, Image as ImageIcon, MapPin } from 'lucide-react';
import { formatLocation, getGoogleMapsLink } from '../../utils/geolocation';
import { useShop } from '../../contexts/ShopContext';

interface Shop {
  plan_type: 'basic' | 'pro';
}

interface Incident {
  id: string;
  incident_type: string;
  incident_date: string;
  description: string;
  photo_url: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  employees: {
    first_name: string;
    last_name: string | null;
  } | null;
}

export default function IncidentsPage() {
  const { shopId: paramShopId } = useParams();
  const { shop: outletShop } = useOutletContext<{ shop: Shop }>();
  const { currentShop, hasAccess, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Use currentShop from context or validated paramShopId
  const shop = outletShop;
  const shopId = currentShop?.id || (paramShopId && hasAccess(paramShopId) ? paramShopId : null);

  // Validate access
  useEffect(() => {
    if (!shopLoading && paramShopId) {
      if (!hasAccess(paramShopId)) {
        navigate('/dashboard');
        return;
      }
    }
  }, [paramShopId, hasAccess, shopLoading, navigate]);

  useEffect(() => {
    if (shopId && shop) {
      loadIncidents();
    }
  }, [shopId, shop]);

  const loadIncidents = async () => {
    if (!shopId) return;
    
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*, employees(first_name, last_name)')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (incidentId: string) => {
    const resolutionNotes = prompt('Add resolution notes (optional):');

    try {
      const { error } = await supabase
        .from('incidents')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes || null
        })
        .eq('id', incidentId);

      if (error) throw error;
      loadIncidents();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const exportToPDF = (incident: Incident) => {
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Incident Report - ${incident.id}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #1f2937; margin-top: 5px; }
          .photo { max-width: 100%; height: auto; margin-top: 10px; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 14px; }
          .resolved { background: #d1fae5; color: #065f46; }
          .unresolved { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Incident Report</h1>
          <p>Report ID: ${incident.id}</p>
        </div>

        <div class="section">
          <div class="label">Status:</div>
          <div class="value">
            <span class="status ${incident.resolved ? 'resolved' : 'unresolved'}">
              ${incident.resolved ? 'Resolved' : 'Unresolved'}
            </span>
          </div>
        </div>

        <div class="section">
          <div class="label">Incident Type:</div>
          <div class="value">${incidentTypeLabels[incident.incident_type] || incident.incident_type}</div>
        </div>

        <div class="section">
          <div class="label">Reported By:</div>
          <div class="value">${incident.employees ? `${incident.employees.first_name} ${incident.employees.last_name || ''}` : 'N/A'}</div>
        </div>

        <div class="section">
          <div class="label">Incident Date & Time:</div>
          <div class="value">${new Date(incident.incident_date).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>

        <div class="section">
          <div class="label">Date Reported:</div>
          <div class="value">${new Date(incident.created_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>

        <div class="section">
          <div class="label">Description:</div>
          <div class="value">${incident.description}</div>
        </div>

        ${incident.photo_url ? `
          <div class="section">
            <div class="label">Photo Evidence:</div>
            <img src="${incident.photo_url}" class="photo" alt="Incident photo">
          </div>
        ` : ''}

        ${incident.resolved && incident.resolved_at ? `
          <div class="section">
            <div class="label">Date Resolved:</div>
            <div class="value">${new Date(incident.resolved_at).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
        ` : ''}

        ${incident.resolution_notes ? `
          <div class="section">
            <div class="label">Resolution Notes:</div>
            <div class="value">${incident.resolution_notes}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  // Incidents available to all shops - no plan restrictions

  if (loading) {
    return <div>Loading...</div>;
  }

  const filteredIncidents = incidents.filter((incident) => {
    if (filter === 'unresolved') return !incident.resolved;
    if (filter === 'resolved') return incident.resolved;
    return true;
  });

  const unresolvedCount = incidents.filter((i) => !i.resolved).length;

  const incidentTypeLabels: Record<string, string> = {
    shoplifting: 'Shoplifting',
    customer_complaint: 'Customer Complaint',
    safety_issue: 'Safety Issue',
    equipment_broken: 'Equipment Broken',
    staff_issue: 'Staff Issue',
    other: 'Other'
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Report a Problem</h1>
        {unresolvedCount > 0 && (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            {unresolvedCount} unresolved
          </span>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-900 text-sm">
          Staff can report incidents from the tablet interface. All reports appear here for review.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-none px-4 py-3 text-sm sm:text-base rounded-lg transition-colors font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({incidents.length})
          </button>
          <button
            onClick={() => setFilter('unresolved')}
            className={`flex-1 sm:flex-none px-4 py-3 text-sm sm:text-base rounded-lg transition-colors font-medium ${
              filter === 'unresolved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unresolved ({unresolvedCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`flex-1 sm:flex-none px-4 py-3 text-sm sm:text-base rounded-lg transition-colors font-medium ${
              filter === 'resolved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Resolved ({incidents.length - unresolvedCount})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No incidents to display</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className={`bg-white rounded-lg shadow p-6 ${
                !incident.resolved ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {incident.resolved ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {incidentTypeLabels[incident.incident_type] || incident.incident_type}
                    </h3>
                    {incident.resolved && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{incident.description}</p>

                  {incident.photo_url && (
                    <div className="mb-3">
                      <button
                        onClick={() => setSelectedPhoto(incident.photo_url)}
                        className="relative group"
                      >
                        <img
                          src={incident.photo_url}
                          alt="Incident evidence"
                          className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    </div>
                  )}

                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900">
                      Incident occurred: {new Date(incident.incident_date).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p>
                      Reported: {new Date(incident.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {incident.employees && (
                      <p>
                        By: {incident.employees.first_name} {incident.employees.last_name || ''}
                      </p>
                    )}
                    {incident.latitude && incident.longitude && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>Location:</span>
                        <a
                          href={getGoogleMapsLink(incident.latitude, incident.longitude) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {formatLocation(incident.latitude, incident.longitude)}
                        </a>
                      </div>
                    )}
                    {incident.resolved && incident.resolved_at && (
                      <p>
                        Resolved: {new Date(incident.resolved_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                  {incident.resolution_notes && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900 mb-1">Resolution Notes:</p>
                      <p className="text-sm text-green-800">{incident.resolution_notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => exportToPDF(incident)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                  {!incident.resolved && (
                    <button
                      onClick={() => handleResolve(incident.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Incident evidence full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white text-gray-900 rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
