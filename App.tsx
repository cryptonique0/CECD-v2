
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import ReportIncident from './pages/ReportIncident';
import Volunteers from './pages/Volunteers';
import AdminGovernance from './pages/AdminGovernance';
import Profile from './pages/Profile';
import Login from './pages/Login';
import AiAssistant from './components/AiAssistant';
import { Incident, User, Role } from './types';
import { initialUsers, initialIncidents } from './mockData';
import { aiService } from './services/aiService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletProvider, setWalletProvider] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]); 
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [volunteers, setVolunteers] = useState<User[]>(initialUsers);
  const [globalWhisperMode, setGlobalWhisperMode] = useState(false);
  
  const lastResolvedCoords = useRef<{lat: number, lng: number} | null>(null);
  const currentUserIdRef = useRef<string>(currentUser.id);

  // Sync ref with state
  useEffect(() => {
    currentUserIdRef.current = currentUser.id;
  }, [currentUser.id]);

  // Real-time location watching for current user
  useEffect(() => {
    if (!isAuthenticated) return;

    let watchId: number;

    const updateLocationName = async (lat: number, lng: number) => {
      // Threshold check: ~11 meters roughly
      if (lastResolvedCoords.current) {
        const dist = Math.sqrt(
          Math.pow(lat - lastResolvedCoords.current.lat, 2) + 
          Math.pow(lng - lastResolvedCoords.current.lng, 2)
        );
        if (dist < 0.0001) return; 
      }

      try {
        const result = await aiService.getAddressFromCoords(lat, lng);
        lastResolvedCoords.current = { lat, lng };

        setCurrentUser(prev => ({ ...prev, location: result.address, lat, lng }));
        setVolunteers(prev => prev.map(v => v.id === currentUserIdRef.current ? { ...v, location: result.address, lat, lng } : v));
      } catch (e) {
        console.error("Failed to update location via AI", e);
      }
    };

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocationName(latitude, longitude);
        },
        (error) => {
          console.warn("[GEO-WATCH] Access Denied or Error:", error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isAuthenticated]);

  const addIncident = (newIncident: Incident) => {
    setIncidents(prev => [newIncident, ...prev]);
  };

  const addVolunteer = (newVolunteer: User) => {
    setVolunteers(prev => [newVolunteer, ...prev]);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setWalletAddress('');
    setWalletProvider('');
  };

  const handleLogin = (address: string, provider: string) => {
    setWalletAddress(address);
    setWalletProvider(provider);
    setIsAuthenticated(true);
    setCurrentUser(prev => ({ ...prev, walletAddress: address }));
  };

  const updateVolunteerStatus = (userId: string, newStatus: 'Available' | 'Busy' | 'OffDuty') => {
    setVolunteers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, status: newStatus };
        if (userId === currentUser.id) {
          setCurrentUser(prevUser => ({ ...prevUser, status: newStatus }));
        }
        return updated;
      }
      return u;
    }));
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex h-screen w-full bg-background-dark overflow-hidden">
        <Sidebar role={currentUser.role} onLogout={handleLogout} />
        
        <main className="flex-1 flex flex-col min-w-0 relative h-full">
          <Header user={currentUser} walletProvider={walletProvider} />
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <Routes>
              <Route path="/" element={<Dashboard incidents={incidents} volunteers={volunteers} currentUser={currentUser} />} />
              <Route path="/incidents" element={<Incidents incidents={incidents} />} />
              <Route path="/incidents/:id" element={<IncidentDetail incidents={incidents} setIncidents={setIncidents} currentUser={currentUser} />} />
              <Route path="/report" element={<ReportIncident onSubmit={addIncident} currentUser={currentUser} isWhisperMode={globalWhisperMode} setIsWhisperMode={setGlobalWhisperMode} />} />
              <Route path="/volunteers" element={<Volunteers volunteers={volunteers} onUpdateStatus={updateVolunteerStatus} onAddVolunteer={addVolunteer} />} />
              <Route path="/admin" element={<AdminGovernance />} />
              <Route path="/profile" element={<Profile user={currentUser} />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        
        <AiAssistant incidents={incidents} isWhisperActive={globalWhisperMode} />
      </div>
    </Router>
  );
};

export default App;
