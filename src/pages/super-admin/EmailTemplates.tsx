import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Send, Save, Eye } from 'lucide-react';

interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  html_body: string;
  text_body: string;
  variables: string[];
}

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type');

      if (error) throw error;

      // Parse variables from JSONB and ensure it's always an array
      const parsedTemplates = (data || []).map((template: any) => ({
        ...template,
        variables: Array.isArray(template.variables) 
          ? template.variables 
          : (typeof template.variables === 'string' ? JSON.parse(template.variables) : [])
      }));

      setTemplates(parsedTemplates);
      if (parsedTemplates && parsedTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(parsedTemplates[0]);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to load templates: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: selectedTemplate.subject,
          html_body: selectedTemplate.html_body,
          text_body: selectedTemplate.text_body,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.email || 'unknown',
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Template saved successfully!' });
      await loadTemplates();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to save template: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedTemplate) return;

    setSending(true);
    try {
      // Replace template variables with test data
      const testData = {
        shopName: 'Test Shop',
        staffName: 'John Doe',
        pin: '1234',
        portalUrl: 'https://digiget.uk/test/staff',
      };

      let subject = selectedTemplate.subject;
      let htmlBody = selectedTemplate.html_body;
      let textBody = selectedTemplate.text_body || '';

      // Replace variables - ensure variables is an array
      const variables = Array.isArray(selectedTemplate.variables) 
        ? selectedTemplate.variables 
        : [];
      
      variables.forEach((variable: string) => {
        const value = testData[variable as keyof typeof testData] || `[${variable}]`;
        const regex = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
        subject = subject.replace(regex, String(value));
        htmlBody = htmlBody.replace(regex, String(value));
        textBody = textBody.replace(regex, String(value));
      });

      // Call the send-test-email function via edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          to: 'robin22y@gmail.com',
          subject,
          html: htmlBody,
          text: textBody,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      setMessage({ type: 'success', text: 'Test email sent successfully to robin22y@gmail.com!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to send test email: ${error.message}` });
    } finally {
      setSending(false);
    }
  };

  const getPreviewHTML = () => {
    if (!selectedTemplate) return '';
    
    const testData = {
      shopName: 'Test Shop',
      staffName: 'John Doe',
      pin: '1234',
      portalUrl: 'https://digiget.uk/test/staff',
    };

    let html = selectedTemplate.html_body;
    const variables = Array.isArray(selectedTemplate.variables) 
      ? selectedTemplate.variables 
      : [];
    
    variables.forEach((variable: string) => {
      const value = testData[variable as keyof typeof testData] || `[${variable}]`;
      const regex = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
      html = html.replace(regex, String(value));
    });

    return html;
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="text-center">
            <div className="loading"></div>
            <p className="text-muted mt-4">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="mb-4">Email Templates</h1>

        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Template List */}
          <div className="card">
            <h2 className="mb-3">Templates</h2>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setPreviewMode(false);
                  }}
                  className={`w-full text-left p-3 rounded-md transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">{template.template_type.replace('_', ' ').toUpperCase()}</div>
                  <div className="text-sm text-muted mt-1">{template.subject}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Editor */}
          {selectedTemplate && (
            <div className="md:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="mb-0">{selectedTemplate.template_type.replace('_', ' ').toUpperCase()}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="btn btn-secondary"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {previewMode ? 'Edit' : 'Preview'}
                    </button>
                    <button
                      onClick={handleSendTestEmail}
                      disabled={sending}
                      className="btn btn-secondary"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sending ? 'Sending...' : 'Send Test Email'}
                    </button>
                    <button
                      onClick={handleSaveTemplate}
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                {previewMode ? (
                  <div>
                    <div className="alert alert-info mb-4">
                      <strong>Preview Mode:</strong> This shows how the email will look with test data.
                    </div>
                    <div 
                      className="border border-gray-300 rounded-lg p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="label">Subject</label>
                      <input
                        type="text"
                        value={selectedTemplate.subject}
                        onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                        className="input"
                        placeholder="Email subject line"
                      />
                      <span className="help-text">Use {{variableName}} for dynamic content</span>
                    </div>

                    <div className="form-group">
                      <label className="label">HTML Body</label>
                      <textarea
                        value={selectedTemplate.html_body}
                        onChange={(e) => setSelectedTemplate({ ...selectedTemplate, html_body: e.target.value })}
                        className="input"
                        rows={20}
                        placeholder="HTML email content"
                      />
                      <span className="help-text">
                        Available variables: {Array.isArray(selectedTemplate.variables) 
                          ? selectedTemplate.variables.join(', ') 
                          : 'None'}
                      </span>
                    </div>

                    <div className="form-group">
                      <label className="label">Text Body (Plain Text)</label>
                      <textarea
                        value={selectedTemplate.text_body || ''}
                        onChange={(e) => setSelectedTemplate({ ...selectedTemplate, text_body: e.target.value })}
                        className="input"
                        rows={10}
                        placeholder="Plain text version (optional)"
                      />
                    </div>

                    <div className="alert alert-info">
                      <strong>Available Variables:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {Array.isArray(selectedTemplate.variables) && selectedTemplate.variables.length > 0 ? (
                          selectedTemplate.variables.map((variable: string) => (
                            <li key={variable}><code>{`{{${variable}}}`}</code></li>
                          ))
                        ) : (
                          <li>No variables defined</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

