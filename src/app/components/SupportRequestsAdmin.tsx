import { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';
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

interface SupportRequestsAdminProps {
  accessToken: string;
}

export function SupportRequestsAdmin({ accessToken }: SupportRequestsAdminProps) {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accessToken) {
      fetchRequests();
    } else {
      setError('No access token available. Please sign in again.');
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/support-requests`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch support requests');
      }

      const data = await response.json();
      console.log('✓ Admin received support requests:', data);
      console.log('✓ Number of requests:', data.requests?.length || 0);
      setRequests(data.requests || []);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error fetching support requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.userName.toLowerCase().includes(term) ||
          req.userEmail.toLowerCase().includes(term) ||
          req.category.toLowerCase().includes(term) ||
          req.message.toLowerCase().includes(term)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRequest || !responseText.trim()) {
      setError('Please enter a response');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/support-requests/${selectedRequest.id}/respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ response: responseText }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

      // Reset form and refresh
      setResponseText('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err: any) {
      console.error('Error submitting response:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'pending' | 'resolved') => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/support-requests/${requestId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchRequests();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message);
    }
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

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const resolvedCount = requests.filter((r) => r.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, category, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold mb-1">Error</p>
          <p>{error}</p>
          {error.includes('Admin access required') && (
            <p className="text-sm mt-2">
              You need admin privileges to access support requests. Please sign in with an admin account.
            </p>
          )}
          {error.includes('Invalid') && error.includes('JWT') && (
            <p className="text-sm mt-2">
              Your session may have expired. Please <a href="/auth" className="underline font-semibold">sign in again</a>.
            </p>
          )}
        </div>
      )}

      {/* Requests List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No support requests found</p>
            <p className="text-sm mt-1">
              {statusFilter !== 'all'
                ? 'Try changing the status filter'
                : 'Support requests will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.userName}
                        </div>
                        <div className="text-sm text-gray-500">{request.userEmail}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          {request.userRole}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{request.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs line-clamp-2">
                        {request.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setResponseText(request.adminResponse || '');
                          setError('');
                        }}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Support Request Details</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.userName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.userRole}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.category}</p>
                  </div>
                </div>
              </div>

              {/* User Message */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">User Message:</p>
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <p className="text-sm text-gray-900">{selectedRequest.message}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Submitted on {formatDate(selectedRequest.createdAt)}
                </p>
              </div>

              {/* Admin Response Form */}
              <form onSubmit={handleRespond}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedRequest.adminResponse ? 'Admin Response (View/Edit):' : 'Your Response:'}
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response to the user..."
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={6}
                  disabled={selectedRequest.status === 'resolved' && selectedRequest.adminResponse !== null}
                />
                {selectedRequest.adminRespondedBy && (
                  <p className="text-xs text-gray-500 mt-1">
                    Previously responded by {selectedRequest.adminRespondedBy} on{' '}
                    {selectedRequest.adminRespondedAt && formatDate(selectedRequest.adminRespondedAt)}
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequest(null);
                      setResponseText('');
                      setError('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>

                  {selectedRequest.status === 'pending' && (
                    <button
                      type="submit"
                      disabled={submitting || !responseText.trim()}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Response
                        </>
                      )}
                    </button>
                  )}

                  {selectedRequest.status === 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'pending')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}