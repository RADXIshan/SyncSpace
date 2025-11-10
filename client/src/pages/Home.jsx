import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router'
import Sidebar from '../components/Sidebar'
import Dashboard from '../components/Dashboard'
import Calendar from '../components/Calendar'
import Messages from '../components/Messages'
import Notifications from '../components/Notifications'
import Settings from '../components/Settings'
import ChannelPage from '../components/ChannelPage'
import MeetingReportsPage from './MeetingReportsPage'
import JoinOrgModal from '../components/JoinOrgModal'
import CreateOrgModal from '../components/CreateOrgModal'
import OrgSettingsModal from '../components/OrgSettingsModal'
import InviteModal from '../components/InviteModal'
import FeatureHub from '../components/FeatureHub'
import SmartSearch from '../components/SmartSearch'
import FocusMode from '../components/FocusMode'
import KeyboardShortcuts from '../components/KeyboardShortcuts'
import AIAssistant from '../components/AIAssistant'
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts'
import { toast } from 'react-hot-toast'

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOrgSettings, setShowOrgSettings] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgSettingsData, setOrgSettingsData] = useState({ organization: null, userRole: null, userPermissions: null });
  const [inviteOrganization, setInviteOrganization] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentChannelId, setCurrentChannelId] = useState(null);
  
  // Global feature modals state
  const [activeFeature, setActiveFeature] = useState(null);

  // Global keyboard shortcuts - work everywhere
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, callback: () => setActiveFeature('search') },
    { key: 'f', ctrl: true, shift: true, callback: () => setActiveFeature('focus') },
    { key: '/', ctrl: true, callback: () => setActiveFeature('shortcuts') },
    { key: 'a', ctrl: true, shift: true, callback: () => setActiveFeature('ai') },
    { key: 'Escape', callback: () => {
      if (activeFeature) {
        setActiveFeature(null);
      }
    }, allowInInput: true },
  ]);

  // Extract channel ID from URL
  useEffect(() => {
    const match = location.pathname.match(/\/channels\/(\d+)/);
    if (match) {
      setCurrentChannelId(match[1]);
    } else {
      setCurrentChannelId(null);
    }
  }, [location]);
  
  const handleOrgSettings = (organization, userRole, userPermissions) => {
    setOrgSettingsData({ organization, userRole, userPermissions });
    setShowOrgSettings(true);
  };
  const [, setOrgUpdateToggle] = useState(false);

  const handleInvite = (organization) => {
    setInviteOrganization(organization);
    setShowInviteModal(true);
  };

  // Refresh components upon organization update without full reload
  useEffect(() => {
    const handleRefresh = () => {
      setOrgUpdateToggle(prev => !prev);
    };
    const handleDeleted = () => {
      navigate('/home/dashboard');
    }
    window.addEventListener('organizationUpdated', handleRefresh);
    window.addEventListener('organizationDeleted', handleDeleted);
    return () => {
      window.removeEventListener('organizationUpdated', handleRefresh);
      window.removeEventListener('organizationDeleted', handleDeleted);
    };
  }, []);

  return (
    <div className="flex h-screen bg-[var(--color-primary)]">
      <Sidebar 
        onSettingsClick={() => setShowSettings(true)} 
        onOrgSettingsClick={handleOrgSettings}
        onInviteClick={handleInvite}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />
      <main className="flex-1 overflow-y-auto main-content w-full md:w-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/home/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard 
            onSettingsClick={() => setShowSettings(true)} 
            onJoinOrgClick={() => setShowJoinModal(true)} 
            onCreateOrgClick={() => setShowCreateModal(true)}
            onMessagesClick={() => navigate('/home/messages')}
            onNotificationsClick={() => navigate('/home/notifications')}
          />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/channels/:channelId" element={<ChannelPage />} />
          <Route path="/channels/:channelId/reports" element={<MeetingReportsPage />} />
          <Route path="*" element={<Navigate to="/home/dashboard" replace />} />
        </Routes>
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        {showJoinModal && (
          <JoinOrgModal onClose={() => setShowJoinModal(false)} />
        )}
        {showCreateModal && (
          <CreateOrgModal onClose={() => setShowCreateModal(false)} />
        )}
        {showOrgSettings && (
          <OrgSettingsModal 
            organization={orgSettingsData.organization}
            userRole={orgSettingsData.userRole}
            userPermissions={orgSettingsData.userPermissions}
            onClose={() => setShowOrgSettings(false)}
            onSuccess={() => {
              // Optionally refresh the organization data
              setShowOrgSettings(false);
            }}
          />
        )}
        {showInviteModal && (
          <InviteModal 
            organization={inviteOrganization}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </main>

      {/* Feature Hub - Hide only on direct messages page */}
      {!location.pathname.includes('/messages') && (
        <FeatureHub 
          channelId={currentChannelId}
          onFeatureAction={(action) => {
            switch(action) {
              case 'voice-send':
                toast.success('Voice message feature ready!');
                break;
              case 'poll-created':
                toast.success('Poll created successfully!');
                break;
              case 'status-updated':
                toast.success('Status updated!');
                break;
              default:
                break;
            }
          }}
        />
      )}

      {/* Global Feature Modals - Work everywhere via keyboard shortcuts */}
      {activeFeature === 'search' && (
        <SmartSearch onClose={() => setActiveFeature(null)} />
      )}
      
      {activeFeature === 'focus' && (
        <FocusMode onClose={() => setActiveFeature(null)} />
      )}
      
      {activeFeature === 'shortcuts' && (
        <KeyboardShortcuts onClose={() => setActiveFeature(null)} />
      )}

      {activeFeature === 'ai' && (
        <AIAssistant 
          onClose={() => setActiveFeature(null)} 
          context={{
            page: location.pathname.split('/')[2] || 'dashboard',
            currentPath: location.pathname,
            channelId: currentChannelId,
          }}
        />
      )}
    </div>
  )
}

export default Home