import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router'
import Sidebar from '../components/Sidebar'
import Dashboard from '../components/Dashboard'
import Calendar from '../components/Calendar'
import Messages from '../components/Messages'
import Notifications from '../components/Notifications'
import Settings from '../components/Settings'
import ChannelPage from '../components/ChannelPage'
import JoinOrgModal from '../components/JoinOrgModal'
import CreateOrgModal from '../components/CreateOrgModal'
import OrgSettingsModal from '../components/OrgSettingsModal'
import InviteModal from '../components/InviteModal'

const Home = () => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOrgSettings, setShowOrgSettings] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgSettingsData, setOrgSettingsData] = useState({ organization: null, userRole: null, userPermissions: null });
  const [inviteOrganization, setInviteOrganization] = useState(null);
  
  const handleOrgSettings = (organization, userRole, userPermissions) => {
    setOrgSettingsData({ organization, userRole, userPermissions });
    setShowOrgSettings(true);
  };
  const [orgUpdateToggle, setOrgUpdateToggle] = useState(false);

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
    <div className="flex h-screen bg-[var(--color-primary)]" key={orgUpdateToggle}>
      <Sidebar 
        onSettingsClick={() => setShowSettings(true)} 
        onOrgSettingsClick={handleOrgSettings}
        onInviteClick={handleInvite}
      />
      <main className="flex-1 overflow-y-auto">
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
    </div>
  )
}

export default Home