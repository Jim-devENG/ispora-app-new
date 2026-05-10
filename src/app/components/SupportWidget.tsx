import { useState, useEffect } from 'react';
import { HelpCircle, X, Send, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface SupportRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  category: string;
  message: string;
  status: 'pending' | 'resolved';
  adminResponse: string | null;
  adminRespondedBy: string | null;
  adminRespondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SupportWidgetProps {
  accessToken: string;
}

const CATEGORIES = [
  'Technical Issue',
  'Account Help',
  'Feature Request',
  'General Inquiry',
  'Report Bug',
  'Other'
];

export function SupportWidget({ accessToken }: SupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && !showForm) {
      fetchUserRequests();
    }
  }, [isOpen, showForm]);

  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/support-requests/user`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch support requests');
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      console.error('Error fetching support requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/support-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ category, message }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit support request');
      }

      // Reset form
      setCategory('');
      setMessage('');
      setShowForm(false);
      
      // Refresh requests list
      await fetchUserRequests();
    } catch (err: any) {
      console.error('Error submitting support request:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRequestExpanded = (requestId: string) => {
    setExpandedRequestId(expandedRequestId === requestId ? null : requestId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 bg-sky-500 text-white p-4 rounded-full shadow-lg hover:bg-sky-600 transition-colors z-40 flex items-center gap-2"
        aria-label="Open support"
      >
        <HelpCircle className="w-6 h-6" />
        <span className="font-medium hidden md:inline">Support</span>
      </button>
    );
  }

  return (
    <div className="fixed md:bottom-6 bottom-20 md:right-6 right-0 left-0 md:left-auto bg-white rounded-lg md:shadow-2xl shadow-lg md:w-96 w-full mx-4 md:mx-0 max-h-[500px] md:max-h-[600px] flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-sky-500 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          <h3 className="font-semibold">Support Center</h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setShowForm(false);
            setError('');
          }}
          className="hover:bg-sky-600 p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showForm ? (
          // New Request Form
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question..."
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                rows={6}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError('');
                  setCategory('');
                  setMessage('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          // Requests List
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading your requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No support requests yet</p>
                <p className="text-sm mt-1">Click "New Request" to get started</p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-sky-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {request.category}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            request.status === 'resolved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {request.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleRequestExpanded(request.id)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      {expandedRequestId === request.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded View */}
                  {expandedRequestId === request.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          Your Message:
                        </p>
                        <p className="text-sm text-gray-700">{request.message}</p>
                      </div>
                      
                      {request.adminResponse && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-xs font-semibold text-green-800 mb-1">
                            Admin Response:
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            {request.adminResponse}
                          </p>
                          <p className="text-xs text-gray-600">
                            By {request.adminRespondedBy} on{' '}
                            {request.adminRespondedAt && formatDate(request.adminRespondedAt)}
                          </p>
                        </div>
                      )}

                      {!request.adminResponse && request.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="text-xs text-yellow-700">
                            Waiting for admin response...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!showForm && (
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-sky-500 text-white py-2 rounded hover:bg-sky-600 transition-colors font-medium"
          >
            + New Request
          </button>
        </div>
      )}
    </div>
  );
}