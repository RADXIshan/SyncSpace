import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import Sidebar from '../components/Sidebar'
import Dashboard from '../components/Dashboard'
import Calendar from '../components/Calendar'
import Settings from '../components/Settings'
import JoinOrgModal from '../components/JoinOrgModal'
import CreateOrgModal from '../components/CreateOrgModal'
import OrgSettingsModal from '../components/OrgSettingsModal'
import InviteModal from '../components/InviteModal'

const Home = () => {
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

  const handleInvite = (organization) => {
    setInviteOrganization(organization);
    setShowInviteModal(true);
  };
  
  return (
    <div className="flex h-screen bg-[var(--color-primary)]">
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
          />} />
          <Route path="/calendar" element={<Calendar />} />
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