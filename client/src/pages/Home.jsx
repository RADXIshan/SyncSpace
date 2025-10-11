import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import Sidebar from '../components/Sidebar'
import Dashboard from '../components/Dashboard'
import Calendar from '../components/Calendar'
import Settings from '../components/Settings'
import JoinOrgModal from '../components/JoinOrgModal'
import CreateOrgModal from '../components/CreateOrgModal'

const Home = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <div className="flex h-screen bg-[var(--color-primary)]">
      <Sidebar 
        onSettingsClick={() => setShowSettings(true)} 
        onJoinOrgClick={() => setShowJoinModal(true)} 
        onCreateOrgClick={() => setShowCreateModal(true)} 
      />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/home/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard  onSettingsClick={() => setShowSettings(true)} />} />
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
      </main>
    </div>
  )
}

export default Home