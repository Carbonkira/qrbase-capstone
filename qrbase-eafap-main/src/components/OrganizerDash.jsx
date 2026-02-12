import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

// --- ICONS & HELPERS ---
const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>
);

const SIDEBAR_LINKS = [
  { name: "Dashboard", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "Events", path: "/events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { name: "Speakers", path: "/speakers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }
];

const SidebarItem = ({ icon, label, onClick, isActive, isDanger }) => (
  <button onClick={onClick} className={`flex items-center w-full py-4 px-4 rounded-2xl transition-all active:scale-95 group/btn ${isDanger ? "text-red-400 hover:bg-red-500 hover:text-white" : isActive ? "bg-[#2563eb] text-white" : "text-slate-400 hover:bg-[#2563eb] hover:text-white"}`}>
    <div className="min-w-[32px] flex justify-center"><Icon path={icon} className="w-7 h-7" /></div>
    <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity font-black text-sm uppercase tracking-widest whitespace-nowrap">{label}</span>
  </button>
);

const StatCard = ({ label, value, isPrimary }) => (
  <div className={`rounded-[3rem] p-16 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-[1.02] border border-white/50 ${isPrimary ? "bg-[#2563eb] text-white shadow-blue-200" : "bg-white text-[#1e40af]"}`}>
    <span className="text-8xl font-black mb-4 tracking-tighter">{value}</span>
    <span className={`text-sm font-black uppercase tracking-[0.2em] ${isPrimary ? "text-blue-100" : "text-gray-400"}`}>{label}</span>
  </div>
);

// --- MAIN COMPONENT ---
const OrganizerDash = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  // 1. FIXED: Initialize from LocalStorage
  const [user, setUser] = useState(() => {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Profile Edit State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({ 
      first_name: user?.first_name || '', 
      last_name: user?.last_name || '' 
  });

  const [statsData, setStatsData] = useState({ registrations: 0, checked_in: 0, total_events: 0, speakers: 0 });

  useEffect(() => {
    fetchUser();
    const fetchStats = async () => {
      try { const response = await api.get('/dashboard-stats'); setStatsData(response.data); } 
      catch (error) { console.error("Failed to load stats", error); }
    };
    fetchStats();
  }, []);

  const fetchUser = async () => {
      try { 
          const res = await api.get('/user'); 
          setUser(res.data); 
          localStorage.setItem('user', JSON.stringify(res.data)); // Sync
          setProfileData({ 
            first_name: res.data.first_name || '', 
            last_name: res.data.last_name || '' 
          });
      } catch (err) { 
          console.error("Failed to load profile", err); 
      }
  };

  const handleUpdateProfile = async (e) => {
      e.preventDefault();
      try {
          const res = await api.put('/user/profile', profileData);
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          setIsProfileOpen(false);
          alert("Profile updated!");
      } catch (err) { alert("Failed to update profile."); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const statsList = [
    { label: "Registrations", value: statsData.registrations, isPrimary: true },
    { label: "Checked In", value: statsData.checked_in, isPrimary: false },
    { label: "Total Events", value: statsData.total_events, isPrimary: false },
    { label: "Speakers", value: statsData.speakers, isPrimary: true },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-700 overflow-hidden relative">
      
      {/* HEADER */}
      <header className="flex justify-between items-center px-12 py-6 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 onClick={() => navigate('/dashboard')} className="text-3xl font-black text-[#1e40af] tracking-tight cursor-pointer">QRBase Meetings</h1>
        
        {user ? (
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organizer</p>
                    {/* VISIBLE EDIT TRIGGER */}
                    <div onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 cursor-pointer group">
                        <p className="text-lg font-black text-[#1e40af] uppercase leading-none group-hover:text-blue-600 transition-colors">
                            {user.first_name} {user.last_name}
                        </p>
                        <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                    </div>
                </div>
                <div onClick={() => setIsProfileOpen(true)} className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xl border-2 border-blue-50 cursor-pointer hover:bg-blue-200 transition-colors">
                    {user.first_name.charAt(0)}
                </div>
            </div>
        ) : (
            <div className="text-xs font-bold text-slate-400">Loading Profile...</div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="group absolute inset-y-0 left-0 z-20 flex flex-col justify-between w-24 hover:w-72 bg-[#1e293b] transition-all duration-300 m-6 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-3 p-5 mt-4">
            {SIDEBAR_LINKS.map((link) => (
              <SidebarItem key={link.name} icon={link.icon} label={link.name} isActive={location.pathname === link.path} onClick={() => navigate(link.path)} />
            ))}
          </div>
          <div className="p-5 mb-2">
            <SidebarItem icon="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" label="Log Out" onClick={handleLogout} isDanger />
          </div>
        </aside>

        <main className="flex-1 ml-32 p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10 ml-2">
              <h2 className="text-4xl font-black text-[#1e40af] tracking-tight uppercase leading-none">Summary</h2>
              <span className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Real-time Overview</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
              {statsList.map((stat, index) => <StatCard key={index} {...stat} />)}
            </div>
          </div>
        </main>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in">
                <h3 className="text-2xl font-black text-[#1e40af] uppercase mb-6 text-center">Edit Profile</h3>
                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                    <input placeholder="First Name" value={profileData.first_name} onChange={(e) => setProfileData({...profileData, first_name: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                    <input placeholder="Last Name" value={profileData.last_name} onChange={(e) => setProfileData({...profileData, last_name: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={() => setIsProfileOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Cancel</button>
                        <button type="submit" className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600">Save</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDash;