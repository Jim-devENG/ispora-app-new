import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6`;

export default function DiagnosticPanel() {
  const { accessToken, user } = useAuth();
  const [healthResult, setHealthResult] = useState<any>(null);
  const [authTestResult, setAuthTestResult] = useState<any>(null);
  const [mentorshipsResult, setMentorshipsResult] = useState<any>(null);
  const [sessionsResult, setSessionsResult] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const testHealth = async () => {
    setLoading('health');
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setHealthResult({ success: true, status: response.status, data });
    } catch (error: any) {
      setHealthResult({ success: false, error: error.message });
    }
    setLoading(null);
  };

  const testAuth = async () => {
    setLoading('auth');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/test`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      setAuthTestResult({ success: response.ok, status: response.status, data });
    } catch (error: any) {
      setAuthTestResult({ success: false, error: error.message });
    }
    setLoading(null);
  };

  const testMentorships = async () => {
    setLoading('mentorships');
    try {
      const response = await fetch(`${API_BASE_URL}/mentorships`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setMentorshipsResult({ success: response.ok, status: response.status, data });
    } catch (error: any) {
      setMentorshipsResult({ success: false, error: error.message });
    }
    setLoading(null);
  };

  const testSessions = async () => {
    setLoading('sessions');
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setSessionsResult({ success: response.ok, status: response.status, data });
    } catch (error: any) {
      setSessionsResult({ success: false, error: error.message });
    }
    setLoading(null);
  };

  const getTokenInfo = () => {
    if (!accessToken) return 'No token';
    const parts = accessToken.split('.');
    return `${parts.length} parts, ${accessToken.substring(0, 30)}...`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="bg-white rounded-lg shadow-lg border border-gray-200">
        <summary className="cursor-pointer px-4 py-2 font-semibold bg-gray-100 rounded-t-lg hover:bg-gray-200">
          🔧 Diagnostic Panel
        </summary>
        
        <div className="p-4 max-w-md max-h-96 overflow-auto">
          {/* User Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">User Info</h3>
            <p className="text-sm">Email: {user?.email || 'Not signed in'}</p>
            <p className="text-sm">Role: {user?.role || 'N/A'}</p>
            <p className="text-sm break-all">Token: {getTokenInfo()}</p>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2 mb-4">
            <button
              onClick={testHealth}
              disabled={loading === 'health'}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading === 'health' ? 'Testing...' : 'Test Health Endpoint'}
            </button>

            <button
              onClick={testAuth}
              disabled={loading === 'auth' || !accessToken}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading === 'auth' ? 'Testing...' : 'Test Authentication'}
            </button>

            <button
              onClick={testMentorships}
              disabled={loading === 'mentorships' || !accessToken}
              className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading === 'mentorships' ? 'Testing...' : 'Test Mentorships API'}
            </button>

            <button
              onClick={testSessions}
              disabled={loading === 'sessions' || !accessToken}
              className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {loading === 'sessions' ? 'Testing...' : 'Test Sessions API'}
            </button>
          </div>

          {/* Results */}
          {healthResult && (
            <div className={`mb-3 p-2 rounded text-sm ${healthResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>Health:</strong> {healthResult.success ? '✅' : '❌'}
              <pre className="mt-1 text-xs overflow-auto">{JSON.stringify(healthResult, null, 2)}</pre>
            </div>
          )}

          {authTestResult && (
            <div className={`mb-3 p-2 rounded text-sm ${authTestResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>Auth Test:</strong> {authTestResult.success ? '✅' : '❌'}
              <pre className="mt-1 text-xs overflow-auto">{JSON.stringify(authTestResult, null, 2)}</pre>
            </div>
          )}

          {mentorshipsResult && (
            <div className={`mb-3 p-2 rounded text-sm ${mentorshipsResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>Mentorships:</strong> {mentorshipsResult.success ? '✅' : '❌'}
              <pre className="mt-1 text-xs overflow-auto max-h-32">{JSON.stringify(mentorshipsResult, null, 2)}</pre>
            </div>
          )}

          {sessionsResult && (
            <div className={`mb-3 p-2 rounded text-sm ${sessionsResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>Sessions:</strong> {sessionsResult.success ? '✅' : '❌'}
              <pre className="mt-1 text-xs overflow-auto max-h-32">{JSON.stringify(sessionsResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
