import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import {
  Lock,
  Bell,
  Shield,
  HelpCircle,
  X,
  Save,
  Smartphone,
  Monitor,
  CheckCircle,
  Trash2,
  Download,
  AlertTriangle
} from 'lucide-react';

type SettingsSection = 'account' | 'notifications' | 'privacy' | 'help';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFeatureRequestModal, setShowFeatureRequestModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');

  // Mentorship settings state
  const [acceptingMentees, setAcceptingMentees] = useState(true);
  const [maxActiveMentees, setMaxActiveMentees] = useState('5');
  const [sessionAvailability, setSessionAvailability] = useState('30 minutes');
  const [focusAreas, setFocusAreas] = useState('');
  const [defaultMeetingLink, setDefaultMeetingLink] = useState('');

  const [profileVisibility, setProfileVisibility] = useState('verified');
  const [showInDirectory, setShowInDirectory] = useState(true);
  const [showEmployer, setShowEmployer] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    whatsapp: true,
    mentorshipRequests: true,
    sessionReminders: true,
    newRequests: true,
    newMessages: true,
    opportunities: true,
    sessionUpdates: true,
    messages: true
  });
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load settings from backend
  useEffect(() => {
    loadSettings();
  }, [user]);

  // Sync defaultMeetingLink from user context whenever it changes
  useEffect(() => {
    if (user?.defaultMeetingLink !== undefined) {
      setDefaultMeetingLink(user.defaultMeetingLink || '');
    }
  }, [user?.defaultMeetingLink]);

  // Load active sessions when account section is viewed
  useEffect(() => {
    if (activeSection === 'account') {
      loadActiveSessions();
    }
  }, [activeSection]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('ispora_access_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/settings`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          // Load settings
          if (data.settings.mentorship) {
            setAcceptingMentees(data.settings.mentorship.acceptingMentees ?? true);
            setMaxActiveMentees(data.settings.mentorship.maxActiveMentees || '5');
            setSessionAvailability(data.settings.mentorship.sessionAvailability || '30 minutes');
            setFocusAreas(data.settings.mentorship.focusAreas || '');
          }
          if (data.settings.privacy) {
            setProfileVisibility(data.settings.privacy.profileVisibility || 'verified');
            setShowInDirectory(data.settings.privacy.showInDirectory ?? true);
            setShowEmployer(data.settings.privacy.showEmployer ?? true);
            setAnalyticsEnabled(data.settings.privacy.analyticsEnabled ?? true);
            setMarketingEnabled(data.settings.privacy.marketingEnabled ?? false);
          }
          if (data.settings.notifications) {
            setNotificationSettings({
              email: data.settings.notifications.email ?? true,
              push: data.settings.notifications.push ?? true,
              whatsapp: data.settings.notifications.whatsapp ?? true,
              mentorshipRequests: data.settings.notifications.mentorshipRequests ?? true,
              sessionReminders: data.settings.notifications.sessionReminders ?? true,
              newRequests: data.settings.notifications.newRequests ?? true,
              newMessages: data.settings.notifications.newMessages ?? true,
              opportunities: data.settings.notifications.opportunities ?? true,
              sessionUpdates: data.settings.notifications.sessionUpdates ?? true,
              messages: data.settings.notifications.messages ?? true
            });
          }
        }

        // Load user profile data for defaultMeetingLink
        const userResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/users/${user?.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user) {
            setDefaultMeetingLink(userData.user.defaultMeetingLink || '');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const markChanged = () => {
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const accessToken = localStorage.getItem('ispora_access_token');

      // Save mentorship settings and meeting link for account section
      if (activeSection === 'account') {
        // Save mentorship settings
        const settingsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/settings`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              mentorship: {
                acceptingMentees,
                maxActiveMentees,
                sessionAvailability,
                focusAreas
              }
            })
          }
        );

        if (!settingsResponse.ok) {
          throw new Error('Failed to update mentorship settings');
        }

        // Save default meeting link to user profile
        const profileResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/users/${user?.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ defaultMeetingLink })
          }
        );

        if (!profileResponse.ok) {
          throw new Error('Failed to update meeting link');
        }
      }

      // Save settings for notifications, privacy, connected sections
      if (activeSection === 'notifications' || activeSection === 'privacy' || activeSection === 'connected') {
        const settingsData: any = {};
        
        if (activeSection === 'notifications') {
          settingsData.notifications = notificationSettings;
        }
        
        if (activeSection === 'privacy') {
          settingsData.privacy = {
            profileVisibility,
            showInDirectory,
            showEmployer,
            analyticsEnabled,
            marketingEnabled
          };
        }

        const settingsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/settings`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(settingsData)
          }
        );

        if (!settingsResponse.ok) {
          throw new Error('Failed to update settings');
        }
      }

      // Refresh user data from backend to get updated profile
      await refreshUser();
      
      setHasChanges(false);
      alert('Changes saved successfully!');
    } catch (error: any) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setHasChanges(false);
    // Reload section data
    loadSettings();
  };

  const downloadMyData = async () => {
    try {
      const accessToken = localStorage.getItem('ispora_access_token');
      
      // Fetch user data from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/users/${user?.id}/data-export`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Create a blob with the JSON data
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `ispora-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert('Your data has been downloaded successfully!');
      } else {
        throw new Error('Failed to export data');
      }
    } catch (error: any) {
      console.error('Failed to download data:', error);
      alert('Failed to download your data. Please try again.');
    }
  };

  const loadActiveSessions = async () => {
    try {
      const accessToken = localStorage.getItem('ispora_access_token');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/sessions/active`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sessions) {
          setActiveSessions(data.sessions);
        }
      }
    } catch (error) {
      console.error('Failed to load active sessions:', error);
    }
  };

  const handleChangeEmail = async () => {
    try {
      setSaving(true);
      const accessToken = localStorage.getItem('ispora_access_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/account/change-email`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ newEmail })
        }
      );

      if (response.ok) {
        await refreshUser();
        setShowEmailModal(false);
        setNewEmail('');
        alert('Email updated successfully! Please check your new email for verification.');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update email');
      }
    } catch (error) {
      console.error('Failed to change email:', error);
      alert('Failed to update email. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('ispora_access_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/account/change-password`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
          })
        }
      );

      if (response.ok) {
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert('Password updated successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;

    try {
      const accessToken = localStorage.getItem('ispora_access_token');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/sessions/revoke/${sessionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        loadActiveSessions();
        alert('Session revoked successfully');
      } else {
        alert('Failed to revoke session');
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
      alert('Failed to revoke session. Please try again.');
    }
  };

  const handleSignOutAllDevices = async () => {
    if (!confirm('Are you sure you want to sign out all other devices? You will remain logged in on this device.')) return;

    try {
      const accessToken = localStorage.getItem('ispora_access_token');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/sessions/revoke-all`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        loadActiveSessions();
        alert('All other sessions have been signed out');
      } else {
        alert('Failed to sign out devices');
      }
    } catch (error) {
      console.error('Failed to sign out devices:', error);
      alert('Failed to sign out devices. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('ispora_access_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/account/delete`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        // Clear local storage and redirect to login
        localStorage.removeItem('ispora_access_token');
        localStorage.removeItem('ispora_refresh_token');
        window.location.href = '/signin';
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[var(--ispora-bg)]">
      {/* Mobile Tab Selector */}
      <div className="md:hidden bg-white border-b-[1.5px] border-[var(--ispora-border)] overflow-x-auto">
        <div className="flex gap-2 px-4 py-3 min-w-max">
          <button
            onClick={() => setActiveSection('account')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSection === 'account'
                ? 'bg-[var(--ispora-brand)] text-white'
                : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)]'
            }`}
          >
            Account & Security
          </button>
          <button
            onClick={() => setActiveSection('notifications')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSection === 'notifications'
                ? 'bg-[var(--ispora-brand)] text-white'
                : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)]'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveSection('privacy')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSection === 'privacy'
                ? 'bg-[var(--ispora-brand)] text-white'
                : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)]'
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => setActiveSection('help')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSection === 'help'
                ? 'bg-[var(--ispora-brand)] text-white'
                : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)]'
            }`}
          >
            Help & Support
          </button>
        </div>
      </div>

      {/* Settings Navigation - Desktop Only */}
      <div className="hidden md:block w-56 flex-shrink-0 border-r-[1.5px] border-[var(--ispora-border)] bg-white overflow-y-auto py-5">
        <div className="px-5 mb-1">
          <div className="text-[10px] font-bold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">Account</div>
        </div>
        <button
          onClick={() => setActiveSection('account')}
          className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-medium transition-all border-l-[3px] ${
            activeSection === 'account'
              ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] border-[var(--ispora-brand)] font-semibold'
              : 'text-[var(--ispora-text2)] border-transparent hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-brand)]'
          }`}
        >
          <Lock className="w-4 h-4" strokeWidth={2} />
          Account & Security
        </button>

        <div className="px-5 mt-5 mb-1">
          <div className="text-[10px] font-bold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">Preferences</div>
        </div>
        <button
          onClick={() => setActiveSection('notifications')}
          className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-medium transition-all border-l-[3px] ${
            activeSection === 'notifications'
              ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] border-[var(--ispora-brand)] font-semibold'
              : 'text-[var(--ispora-text2)] border-transparent hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-brand)]'
          }`}
        >
          <Bell className="w-4 h-4" strokeWidth={2} />
          Notifications
        </button>
        <button
          onClick={() => setActiveSection('privacy')}
          className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-medium transition-all border-l-[3px] ${
            activeSection === 'privacy'
              ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] border-[var(--ispora-brand)] font-semibold'
              : 'text-[var(--ispora-text2)] border-transparent hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-brand)]'
          }`}
        >
          <Shield className="w-4 h-4" strokeWidth={2} />
          Privacy
        </button>

        <div className="px-5 mt-5 mb-1">
          <div className="text-[10px] font-bold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">Integrations</div>
        </div>
        <div className="px-5 mt-5 mb-1">
          <div className="text-[10px] font-bold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">Support</div>
        </div>
        <button
          onClick={() => setActiveSection('help')}
          className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-medium transition-all border-l-[3px] ${
            activeSection === 'help'
              ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] border-[var(--ispora-brand)] font-semibold'
              : 'text-[var(--ispora-text2)] border-transparent hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-brand)]'
          }`}
        >
          <HelpCircle className="w-4 h-4" strokeWidth={2} />
          Help & Support
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 md:px-9 py-4 md:py-7 pb-20 md:pb-7">
          <div className="max-w-[680px]">
            {/* Account & Security Section */}
            {activeSection === 'account' && (
              <>
                <div className="mb-5">
                  <h2 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1">Account & Security</h2>
                  <p className="text-xs text-[var(--ispora-text3)]">Manage your login credentials and security settings</p>
                </div>

                {/* Mentorship Settings */}
                {user?.role === 'diaspora' && (
                  <>
                    <div className="mb-5">
                      <h2 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1">Mentorship Settings</h2>
                      <p className="text-xs text-[var(--ispora-text3)]">Control how and when students can reach you</p>
                    </div>

                    <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden mb-3.5">
                      <SettingRow
                        label="Accepting new mentees"
                        description="Allow students to send you mentorship requests"
                        control={
                          <Toggle
                            checked={acceptingMentees}
                            onChange={(checked) => {
                              setAcceptingMentees(checked);
                              markChanged();
                            }}
                          />
                        }
                      />
                      <SettingRow
                        label="Maximum active mentees"
                        description="Limit how many active mentorships you take on at once"
                        control={
                          <select
                            value={maxActiveMentees}
                            onChange={(e) => {
                              setMaxActiveMentees(e.target.value);
                              markChanged();
                            }}
                            className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 pr-8 py-2 text-xs text-[var(--ispora-text)] outline-none cursor-pointer"
                          >
                            <option>3</option>
                            <option>5</option>
                            <option>8</option>
                            <option>10</option>
                            <option>Unlimited</option>
                          </select>
                        }
                      />
                      <SettingRow
                        label="Session availability"
                        description="Default session length for new bookings"
                        control={
                          <select
                            value={sessionAvailability}
                            onChange={(e) => {
                              setSessionAvailability(e.target.value);
                              markChanged();
                            }}
                            className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 pr-8 py-2 text-xs text-[var(--ispora-text)] outline-none cursor-pointer"
                          >
                            <option>30 minutes</option>
                            <option>45 minutes</option>
                            <option>60 minutes</option>
                            <option>90 minutes</option>
                          </select>
                        }
                      />
                      <SettingRow
                        label="Mentorship focus areas"
                        description={focusAreas || "Software Engineering, Career Development, UK Job Market"}
                        control={
                          <button 
                            onClick={() => {
                              const newAreas = prompt('Enter your focus areas (comma-separated):', focusAreas);
                              if (newAreas !== null) {
                                setFocusAreas(newAreas);
                                markChanged();
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-xs font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all">
                            Edit
                          </button>
                        }
                      />
                      <SettingRow
                        label="Default Meeting Link"
                        description="Your preferred video meeting link (Google Meet, Zoom, Microsoft Teams, etc.)"
                        control={
                          <input
                            type="url"
                            value={defaultMeetingLink}
                            onChange={(e) => {
                              setDefaultMeetingLink(e.target.value);
                              markChanged();
                            }}
                            placeholder="https://meet.google.com/..."
                            className="w-full md:w-64 border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 py-2 text-xs text-[var(--ispora-text)] outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                          />
                        }
                        noBorder
                      />
                    </div>
                  </>
                )}

                <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden mb-3.5">
                  <SettingRow
                    label="Email address"
                    description={user?.email || 'amina.osei@barclays.com'}
                    control={
                      <button 
                        onClick={() => setShowEmailModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-xs font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all">
                        Change
                      </button>
                    }
                  />
                  <SettingRow
                    label="Password"
                    description="Last changed 3 months ago"
                    control={
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-xs font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                      >
                        Change Password
                      </button>
                    }
                  />
                  <SettingRow
                    label="Two-factor authentication"
                    description="Add an extra layer of security to your account"
                    control={
                      twoFactorEnabled ? (
                        <button 
                          onClick={() => setShow2FAModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ispora-bg)] text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-xs font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all">
                          Disable 2FA
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShow2FAModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ispora-success)] text-white rounded-lg text-xs font-semibold hover:bg-[#059669] transition-all">
                          Enable 2FA
                        </button>
                      )
                    }
                    noBorder
                  />
                </div>

                {/* Active Sessions */}
                <div className="mt-7 mb-5">
                  <h2 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1">Active Sessions</h2>
                  <p className="text-xs text-[var(--ispora-text3)]">Devices currently logged into your account</p>
                </div>

                {activeSessions.length > 0 ? (
                  <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden mb-2.5">
                    {activeSessions.map((session, index) => (
                      <div 
                        key={session.id} 
                        className={`flex items-center gap-3.5 px-5 py-4 ${index < activeSessions.length - 1 ? 'border-b border-[var(--ispora-border)]' : ''}`}
                      >
                        <div className={`w-9 h-9 ${session.isCurrent ? 'bg-[var(--ispora-brand-light)]' : 'bg-[var(--ispora-bg)]'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          {session.deviceType === 'mobile' ? (
                            <Smartphone className={`w-4 h-4 ${session.isCurrent ? 'text-[var(--ispora-brand)]' : 'text-[var(--ispora-text3)]'}`} strokeWidth={2} />
                          ) : (
                            <Monitor className={`w-4 h-4 ${session.isCurrent ? 'text-[var(--ispora-brand)]' : 'text-[var(--ispora-text3)]'}`} strokeWidth={2} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-[13px] text-[var(--ispora-text)]">{session.deviceName}</div>
                          <div className="text-xs text-[var(--ispora-text3)] mt-0.5">
                            {session.location} · {session.lastActive}
                            {session.isCurrent && <> · <strong className="text-[var(--ispora-success)]">This device</strong></>}
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button 
                            onClick={() => handleRevokeSession(session.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--ispora-bg)] text-[var(--ispora-text2)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-[11px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all">
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl px-5 py-8 text-center mb-2.5">
                    <p className="text-sm text-[var(--ispora-text3)]">No active sessions found</p>
                  </div>
                )}

                <button 
                  onClick={handleSignOutAllDevices}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[var(--ispora-danger)] border-[1.5px] border-[var(--ispora-danger)] rounded-lg text-xs font-semibold hover:bg-[var(--ispora-danger-light)] transition-all">
                  Sign out all other devices
                </button>

                {/* Danger Zone */}
                <div className="mt-7">
                  <div className="mb-5">
                    <h2 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1">Danger Zone</h2>
                    <p className="text-xs text-[var(--ispora-text3)]">Permanent actions that cannot be reversed</p>
                  </div>

                  <div className="bg-[var(--ispora-danger-light)] border-[1.5px] border-[rgba(239,68,68,0.25)] rounded-2xl px-5 py-5">
                    <div className="font-bold text-[13px] text-[var(--ispora-danger)] mb-1">Delete Account</div>
                    <div className="text-xs text-[var(--ispora-text2)] leading-relaxed mb-3.5">
                      Once you delete your account, all your mentorships, sessions, messages, and resources will be permanently removed. Your active mentees will be notified.
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ispora-danger)] text-white rounded-lg text-xs font-semibold hover:bg-[#dc2626] transition-all"
                    >
                      <Trash2 className="w-3 h-3" strokeWidth={2.5} />
                      Delete My Account
                    </button>
                  </div>
                </div>
              </>
            )}





            {/* Privacy Section */}
            {activeSection === 'privacy' && (
              <>
                <div className="mb-5">
                  <h2 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1">Privacy Settings</h2>
                  <p className="text-xs text-[var(--ispora-text3)]">Control who can see your profile and how your data is used</p>
                </div>

                <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden mb-6">
                  <SettingRow
                    label="Profile visibility"
                    description="Who can view your full mentor profile"
                    control={
                      <select
                        value={profileVisibility}
                        onChange={(e) => {
                          setProfileVisibility(e.target.value);
                          markChanged();
                        }}
                        className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 pr-8 py-2 text-xs text-[var(--ispora-text)] outline-none cursor-pointer"
                      >
                        <option value="everyone">Everyone on Ispora</option>
                        <option value="verified">Verified students only</option>
                        <option value="mentees">My mentees only</option>
                      </select>
                    }
                  />
                  <SettingRow
                    label="Show in mentor directory"
                    description="Appear in search results when students look for mentors"
                    control={
                      <Toggle
                        checked={showInDirectory}
                        onChange={(checked) => {
                          setShowInDirectory(checked);
                          markChanged();
                        }}
                      />
                    }
                  />
                  <SettingRow
                    label="Show current employer"
                    description="Display your company name on your public profile"
                    control={
                      <Toggle
                        checked={showEmployer}
                        onChange={(checked) => {
                          setShowEmployer(checked);
                          markChanged();
                        }}
                      />
                    }
                    noBorder
                  />
                </div>

                <div className="mb-5">
                  <h2 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1">Data & Privacy</h2>
                  <p className="text-xs text-[var(--ispora-text3)]">Control how Ispora uses your data</p>
                </div>

                <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden mb-3.5">
                  <SettingRow
                    label="Analytics & personalisation"
                    description="Help us improve Ispora by sharing usage data"
                    control={
                      <Toggle
                        checked={analyticsEnabled}
                        onChange={(checked) => {
                          setAnalyticsEnabled(checked);
                          markChanged();
                        }}
                      />
                    }
                  />
                  <SettingRow
                    label="Marketing communications"
                    description="Receive emails about new features and Ispora events"
                    control={
                      <Toggle
                        checked={marketingEnabled}
                        onChange={(checked) => {
                          setMarketingEnabled(checked);
                          markChanged();
                        }}
                      />
                    }
                    noBorder
                  />
                </div>

                <button 
                  onClick={downloadMyData}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-xs font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                >
                  <Download className="w-3.5 h-3.5" strokeWidth={2} />
                  Download My Data
                </button>
              </>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <>
                <div className="mb-5">
                  <h2 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1">Notification Channels</h2>
                  <p className="text-xs text-[var(--ispora-text3)]">Choose how you want to receive notifications</p>
                </div>

                <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden mb-6">
                  <SettingRow
                    label="Email notifications"
                    description="Receive updates and alerts via email"
                    control={
                      <Toggle
                        checked={notificationSettings.email}
                        onChange={(checked) => {
                          setNotificationSettings({ ...notificationSettings, email: checked });
                          markChanged();
                        }}
                      />
                    }
                  />
                  <SettingRow
                    label="Push notifications"
                    description="Receive push notifications on your devices"
                    control={
                      <Toggle
                        checked={notificationSettings.push}
                        onChange={(checked) => {
                          setNotificationSettings({ ...notificationSettings, push: checked });
                          markChanged();
                        }}
                      />
                    }
                  />
                  <SettingRow
                    label="WhatsApp notifications"
                    description={user?.phoneNumber ? `Receive instant notifications via WhatsApp to ${user.phoneNumber}` : 'Add phone number in your profile to enable WhatsApp notifications'}
                    control={
                      <Toggle
                        checked={notificationSettings.whatsapp && !!user?.phoneNumber}
                        disabled={!user?.phoneNumber}
                        onChange={(checked) => {
                          setNotificationSettings({ ...notificationSettings, whatsapp: checked });
                          markChanged();
                        }}
                      />
                    }
                    noBorder
                  />
                </div>

                <div className="mb-5">
                  <h2 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1">Notification Types</h2>
                  <p className="text-xs text-[var(--ispora-text3)]">Control which events trigger notifications</p>
                </div>

                <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden mb-6">
                  <SettingRow
                    label="New mentorship requests"
                    description="Get notified when students send mentorship requests"
                    control={
                      <Toggle
                        checked={notificationSettings.newRequests}
                        onChange={(checked) => {
                          setNotificationSettings({ ...notificationSettings, newRequests: checked });
                          markChanged();
                        }}
                      />
                    }
                  />
                  <SettingRow
                    label="Session reminders"
                    description="Receive reminders 24 hours and 1 hour before scheduled sessions"
                    control={
                      <Toggle
                        checked={notificationSettings.sessionReminders}
                        onChange={(checked) => {
                          setNotificationSettings({ ...notificationSettings, sessionReminders: checked });
                          markChanged();
                        }}
                      />
                    }
                  />
                  <SettingRow
                    label="Session updates"
                    description="Get notified when sessions are scheduled, cancelled, or rescheduled"
                    control={
                      <Toggle
                        checked={notificationSettings.sessionUpdates}
                        onChange={(checked) => {
                          setNotificationSettings({ ...notificationSettings, sessionUpdates: checked });
                          markChanged();
                        }}
                      />
                    }
                  />
                  <SettingRow
                    label="New messages"
                    description="Get notified about new messages from mentees or mentors"
                    control={
                      <Toggle
                        checked={notificationSettings.newMessages}
                        onChange={(checked) => {
                          setNotificationSettings({ ...notificationSettings, newMessages: checked });
                          markChanged();
                        }}
                      />
                    }
                  />
                  <SettingRow
                    label="Opportunities"
                    description="Be the first to know about new scholarships, internships, and job postings"
                    control={
                      <Toggle
                        checked={notificationSettings.opportunities}
                        onChange={(checked) => {
                          setNotificationSettings({ ...notificationSettings, opportunities: checked });
                          markChanged();
                        }}
                      />
                    }
                    noBorder
                  />
                </div>
              </>
            )}

            {/* Help & Support Section */}
            {activeSection === 'help' && (
              <>
                <div className="mb-5">
                  <h2 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1">Help & Support</h2>
                  <p className="text-xs text-[var(--ispora-text3)]">Get assistance and learn more about Ispora</p>
                </div>

                <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden mb-3.5">
                  <button 
                    onClick={() => alert('Documentation coming soon! We\'re building comprehensive guides to help you make the most of Ispora.')}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--ispora-border)] hover:bg-[var(--ispora-bg)] transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-[13px] text-[var(--ispora-text)]">Documentation</div>
                      <div className="text-xs text-[var(--ispora-text3)] mt-0.5">Learn how to use Ispora effectively</div>
                    </div>
                    <span className="text-[var(--ispora-text3)]">→</span>
                  </button>
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--ispora-border)] hover:bg-[var(--ispora-bg)] transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-[13px] text-[var(--ispora-text)]">Contact Support</div>
                      <div className="text-xs text-[var(--ispora-text3)] mt-0.5">Get help from our support team</div>
                    </div>
                    <span className="text-[var(--ispora-text3)]">→</span>
                  </button>
                  <button 
                    onClick={() => setShowFeatureRequestModal(true)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--ispora-border)] hover:bg-[var(--ispora-bg)] transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-[13px] text-[var(--ispora-text)]">Feature Requests</div>
                      <div className="text-xs text-[var(--ispora-text3)] mt-0.5">Suggest improvements to Ispora</div>
                    </div>
                    <span className="text-[var(--ispora-text3)]">→</span>
                  </button>
                  <button 
                    onClick={() => alert('Terms of Service and Privacy Policy coming soon. We\'re committed to protecting your data and privacy.')}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-[var(--ispora-bg)] transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-[13px] text-[var(--ispora-text)]">Terms & Privacy</div>
                      <div className="text-xs text-[var(--ispora-text3)] mt-0.5">Read our terms of service and privacy policy</div>
                    </div>
                    <span className="text-[var(--ispora-text3)]">→</span>
                  </button>
                </div>

                <div className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-2xl px-5 py-4">
                  <div className="font-semibold text-[13px] text-[var(--ispora-text)] mb-1">Version</div>
                  <div className="text-xs text-[var(--ispora-text3)]">Ispora v1.0.0 Beta</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Save Bar */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-white border-t-[1.5px] border-[var(--ispora-border)] px-9 py-3.5 flex items-center justify-between z-10">
            <div className="text-[13px] text-[var(--ispora-text2)]">
              <strong className="text-[var(--ispora-text)] font-semibold">Unsaved changes</strong> — save before leaving this section
            </div>
            <div className="flex gap-2">
              <button
                onClick={discardChanges}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-xs font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
              >
                Discard
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-[var(--ispora-brand)] text-white rounded-lg text-xs font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.25)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" strokeWidth={2.5} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ModalOverlay onClose={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[420px] shadow-[var(--ispora-shadow-lg)] overflow-hidden max-h-[88vh] overflow-y-auto">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-start justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">Change Password</h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">Use a strong password you do not use elsewhere</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Current password</label>
                <input 
                  type="password" 
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">New password</label>
                <input 
                  type="password" 
                  placeholder="At least 8 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Confirm new password</label>
                <input 
                  type="password" 
                  placeholder="Repeat new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]" />
              </div>
            </div>
            <div className="px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5">
              <button onClick={() => setShowPasswordModal(false)} className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all">
                Cancel
              </button>
              <button 
                onClick={handleChangePassword}
                disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <ModalOverlay onClose={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[420px] shadow-[var(--ispora-shadow-lg)] overflow-hidden max-h-[88vh] overflow-y-auto">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-start justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[var(--ispora-danger)]">Delete Account</h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">This action is permanent and cannot be undone</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="bg-[var(--ispora-danger-light)] rounded-[10px] px-3.5 py-3 text-[13px] text-[#7f1d1d] leading-relaxed mb-4">
                Deleting your account will permanently remove all your mentorships, sessions, messages, and resources. Your mentees will be notified.
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Type DELETE to confirm</label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>
            </div>
            <div className="px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5">
              <button onClick={() => setShowDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all">
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || saving}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-danger)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[#dc2626] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Change Email Modal */}
      {showEmailModal && (
        <ModalOverlay onClose={() => setShowEmailModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[420px] shadow-[var(--ispora-shadow-lg)] overflow-hidden max-h-[88vh] overflow-y-auto">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-start justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">Change Email Address</h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">You'll need to verify your new email address</p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-6 py-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Current email</label>
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text3)] bg-[var(--ispora-bg)] outline-none mb-3.5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">New email address</label>
                <input 
                  type="email" 
                  placeholder="Enter new email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]" />
              </div>
            </div>
            <div className="px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5">
              <button 
                onClick={() => setShowEmailModal(false)} 
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all">
                Cancel
              </button>
              <button 
                onClick={handleChangeEmail}
                disabled={saving || !newEmail || newEmail === user?.email}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <ModalOverlay onClose={() => setShow2FAModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[420px] shadow-[var(--ispora-shadow-lg)] overflow-hidden max-h-[88vh] overflow-y-auto">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-start justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">
                  {twoFactorEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
                </h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">
                  {twoFactorEnabled 
                    ? 'Remove the extra layer of security from your account'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
              <button
                onClick={() => setShow2FAModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="bg-[var(--ispora-bg)] rounded-[10px] px-3.5 py-3 text-[13px] text-[var(--ispora-text2)] leading-relaxed">
                {twoFactorEnabled 
                  ? 'Disabling 2FA will make your account less secure. You will only need your password to log in.'
                  : 'Two-factor authentication is currently not available in this demo version. This feature will be available in production.'}
              </div>
            </div>
            <div className="px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5">
              <button 
                onClick={() => setShow2FAModal(false)} 
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all">
                Cancel
              </button>
              <button 
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  setShow2FAModal(false);
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 ${twoFactorEnabled ? 'bg-[var(--ispora-danger)]' : 'bg-[var(--ispora-brand)]'} text-white rounded-[10px] text-[13px] font-semibold hover:opacity-90 transition-all`}>
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Contact Support Modal */}
      {showContactModal && (
        <ModalOverlay onClose={() => setShowContactModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[480px] shadow-[var(--ispora-shadow-lg)] overflow-hidden max-h-[88vh] overflow-y-auto">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-start justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">Contact Support</h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">We're here to help! Share your issue and we'll get back to you.</p>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text)] mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Brief description of your issue"
                  className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-[13px] text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text)] mb-1.5">
                  Category
                </label>
                <select className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-[13px] text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-colors">
                  <option>Technical Issue</option>
                  <option>Account Problem</option>
                  <option>Mentorship Question</option>
                  <option>Billing/Payment</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text)] mb-1.5">
                  Message
                </label>
                <textarea
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-[13px] text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-colors resize-none"
                />
              </div>
              <div className="bg-[var(--ispora-brand-light)] rounded-lg px-4 py-3">
                <p className="text-xs text-[var(--ispora-text2)] leading-relaxed">
                  💡 <strong>Tip:</strong> Include screenshots or specific error messages to help us resolve your issue faster.
                </p>
              </div>
            </div>
            <div className="px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5">
              <button 
                onClick={() => setShowContactModal(false)} 
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('Thank you for contacting us! Your message has been sent. Our support team will respond within 24 hours.');
                  setShowContactModal(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-lg transition-all"
              >
                Send Message
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Feature Request Modal */}
      {showFeatureRequestModal && (
        <ModalOverlay onClose={() => setShowFeatureRequestModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[480px] shadow-[var(--ispora-shadow-lg)] overflow-hidden max-h-[88vh] overflow-y-auto">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-start justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">Suggest a Feature</h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">Help us improve Ispora! Share your ideas with us.</p>
              </div>
              <button
                onClick={() => setShowFeatureRequestModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text)] mb-1.5">
                  Feature Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Video call integration, Group mentoring"
                  className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-[13px] text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text)] mb-1.5">
                  Category
                </label>
                <select className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-[13px] text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-colors">
                  <option>Mentorship Features</option>
                  <option>Communication Tools</option>
                  <option>Session Management</option>
                  <option>Profile & Discovery</option>
                  <option>Resources & Content</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text)] mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  placeholder="What would this feature do? How would it help you?"
                  rows={5}
                  className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-[13px] text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text)] mb-1.5">
                  Priority
                </label>
                <select className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-[13px] text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-colors">
                  <option>Nice to have</option>
                  <option>Important</option>
                  <option>Critical</option>
                </select>
              </div>
              <div className="bg-[var(--ispora-success-light)] rounded-lg px-4 py-3">
                <p className="text-xs text-[var(--ispora-text2)] leading-relaxed">
                  ✨ <strong>Thank you!</strong> Your feedback shapes Ispora's future. We review every suggestion carefully.
                </p>
              </div>
            </div>
            <div className="px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5">
              <button 
                onClick={() => setShowFeatureRequestModal(false)} 
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('🎉 Feature request submitted! We love hearing from our community. We\'ll review your suggestion and keep you updated.');
                  setShowFeatureRequestModal(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-lg transition-all"
              >
                Submit Request
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

// Helper Components
const SettingRow: React.FC<{
  label: string;
  description: string;
  control: React.ReactNode;
  noBorder?: boolean;
}> = ({ label, description, control, noBorder }) => (
  <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 px-4 md:px-5 py-4 ${!noBorder ? 'border-b border-[var(--ispora-border)]' : ''}`}>
    <div className="flex-1">
      <div className="font-semibold text-[13px] text-[var(--ispora-text)] mb-0.5">{label}</div>
      <div className="text-xs text-[var(--ispora-text3)] leading-snug">{description}</div>
    </div>
    <div className="w-full md:w-auto">
      {control}
    </div>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange?: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <label className="relative w-11 h-6 flex-shrink-0 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      className="opacity-0 w-0 h-0 absolute"
    />
    <div className={`absolute inset-0 rounded-full transition-colors ${checked ? 'bg-[var(--ispora-brand)]' : 'bg-[var(--ispora-border2)]'}`} />
    <div className={`absolute top-1 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform ${checked ? 'left-5.5' : 'left-1'}`} />
  </label>
);

const PlanCard: React.FC<{
  name: string;
  price: string;
  period: string;
  features: string[];
  current?: boolean;
}> = ({ name, price, period, features, current }) => (
  <div className={`border-2 rounded-2xl px-4 py-4 cursor-pointer transition-all relative ${
    current
      ? 'border-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
      : 'border-[var(--ispora-border)] hover:border-[var(--ispora-brand-hover)] hover:shadow-[var(--ispora-shadow-sm)]'
  }`}>
    {current && (
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-[var(--ispora-brand)] text-white px-2.5 py-0.5 rounded-full whitespace-nowrap">
        Current Plan
      </div>
    )}
    <div className="font-syne font-bold text-sm text-[var(--ispora-text)] mb-0.5">{name}</div>
    <div className="text-xl font-bold text-[var(--ispora-brand)] mb-1.5">
      {price}<span className="text-xs font-medium text-[var(--ispora-text3)]">{period}</span>
    </div>
    <ul className="space-y-1">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text2)]">
          <CheckCircle className="w-3 h-3 text-[var(--ispora-success)]" strokeWidth={2.5} />
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

const ModalOverlay: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div
    className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-[1000] p-3 md:p-4"
    onClick={onClose}
  >
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

export default Settings;