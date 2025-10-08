import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import Sidebar from '../components/Sidebar'
import Dashboard from '../components/Dashboard'
import Calendar from '../components/Calendar'
import Settings from '../components/Settings'

const Home = () => {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <div className="flex h-screen bg-[var(--color-primary)]">
      <Sidebar onSettingsClick={() => setShowSettings(true)} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/home/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
         <Route path="*" element={<Navigate to="/home/dashboard" replace />} />
        </Routes>
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </main>
    </div>
  )
}

export default Home