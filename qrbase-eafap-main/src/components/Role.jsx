import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const Role = () => {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Includes password
  const [formData, setFormData] = useState({ name: "", role: "VOLUNTEER", phone: "", email: "", password: "" });

  const fetchTeam = async () => {
    try {
        const res = await api.get('/team');
        const mapped = res.data.map(user => ({
            id: user.id,
            name: (user.first_name + " " + user.last_name).toUpperCase(),
            role: user.role.toUpperCase(),
            email: user.email,
            phone: "+91 00000 00000",
            status: "ACTIVE"
        }));
        setTeamMembers(mapped);
        if(mapped.length > 0 && !selectedId) setSelectedId(mapped[0].id);
    } catch(err) { console.error("Error fetching team", err); }
  };

  useEffect(() => { fetchTeam(); }, []);

  const selectedMember = teamMembers.find(m => m.id === selectedId) || teamMembers[0];

  const filteredMembers = teamMembers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Events", path: "/events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { name: "Team", path: "/role", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { name: "Attendance", path: "/attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { name: "Scanner", path: "/qr", icon: "M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" }
  ];

  const handleAddMember = async () => {
    if (!formData.name) return;
    
    // Split name for First/Last
    const parts = formData.name.trim().split(' ');
    const first = parts[0];
    const last = parts.slice(1).join(' ') || "User";

    try {
        await api.post('/team', {
            first_name: first,
            last_name: last,
            email: formData.email,
            role: formData.role.toLowerCase(),
            password: formData.password || "password123"
        });

        await fetchTeam();
        setFormData({ name: "", role: "VOLUNTEER", phone: "", email: "", password: "" });
        setIsAdding(false);
    } catch (err) {
        alert("Error adding member: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveMember = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    try {
        await api.delete(`/team/${id}`);
        fetchTeam();
    } catch(err) { console.error(err); }
  };

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-700 overflow-hidden">
      {/* HEADER */}
      <header className="flex justify-between items-center px-12 py-5 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 onClick={() => navigate('/dashboard')} className="text-2xl font-black text-[#1e40af] tracking-tight cursor-pointer">QRBase Meetings</h1>
        <nav className="hidden md:flex items-center gap-10">
           <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-blue-600 font-bold uppercase">Log Out</button>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <aside className="group absolute inset-y-0 left-0 z-20 flex flex-col justify-between w-20 hover:w-64 bg-[#1e293b] transition-all duration-300 m-4 rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-2 p-4 mt-2">
            {sidebarLinks.map((link) => (
              <button key={link.name} onClick={() => navigate(link.path)} className={`flex items-center w-full py-3.5 px-3 rounded-2xl transition-all active:scale-95 ${link.name === "Team" ? "bg-[#2563eb] text-white" : "text-slate-400 hover:bg-[#2563eb] hover:text-white"}`}>
                <div className="min-w-[24px] flex justify-center"><Icon path={link.icon} /></div>
                <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity font-black text-[11px] uppercase tracking-widest whitespace-nowrap">{link.name}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 ml-24 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* COLUMN 1: DIRECTORY */}
            <section className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Directory</span>
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 h-[580px] flex flex-col">
                <button onClick={() => setIsAdding(true)} className="w-full bg-[#1e293b] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-lg mb-6 transition-all active:scale-95">
                  + Add Team Member
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500"><Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-4 h-4" /></div>
                  <input type="text" placeholder="SEARCH DIRECTORY..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#f1f5f9] border-2 border-slate-50 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {filteredMembers.map(m => (
                      <div key={m.id} onClick={() => {setSelectedId(m.id); setIsAdding(false);}} className={`p-5 rounded-[2rem] cursor-pointer transition-all border-2 active:scale-[0.98] ${selectedId === m.id && !isAdding ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-50 hover:border-blue-100'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black uppercase text-slate-800 tracking-tight">{m.name}</span>
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{m.role}</span>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* COLUMN 2: SETTINGS */}
            <section className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Settings</span>
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 h-[580px] flex flex-col">
                <h2 className="text-2xl font-black text-[#1e40af] tracking-tight mb-8 text-center uppercase">{isAdding ? "Registration" : "Edit Role"}</h2>
                
                <div className="space-y-6 flex-grow overflow-y-auto pr-1">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-[#1e40af] uppercase tracking-widest ml-1">Full Name</label>
                    <input className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500 uppercase transition-all"
                      value={isAdding ? formData.name : selectedMember?.name || ""}
                      onChange={(e) => isAdding && setFormData({...formData, name: e.target.value})}
                      placeholder="ENTER NAME..." disabled={!isAdding}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-[#1e40af] uppercase tracking-widest ml-1">Email</label>
                    <input className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                      value={isAdding ? formData.email : selectedMember?.email || ""}
                      onChange={(e) => isAdding && setFormData({...formData, email: e.target.value})}
                      placeholder="EMAIL ADDRESS..." disabled={!isAdding}
                    />
                  </div>

                  {/* PASSWORD FIELD ADDED HERE */}
                  {isAdding && (
                     <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-[#1e40af] uppercase tracking-widest ml-1">Password</label>
                        <input className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="ASSIGN PASSWORD..."
                        />
                     </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-[#1e40af] uppercase tracking-widest ml-1">Position / Role</label>
                    <select className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500 uppercase cursor-pointer transition-all"
                      value={isAdding ? formData.role : selectedMember?.role || ""}
                      onChange={(e) => isAdding && setFormData({...formData, role: e.target.value})}
                      disabled={!isAdding}
                    >
                      <option>EVENT MANAGER</option>
                      <option>VOLUNTEER</option>
                      <option>SECURITY</option>
                      <option>COORDINATOR</option>
                    </select>
                  </div>
                </div>

                {isAdding ? (
                  <button onClick={handleAddMember} className="w-full mt-8 bg-[#1e293b] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2563eb] shadow-lg transition-all active:scale-95">Confirm & Add</button>
                ) : (
                  <button onClick={() => handleRemoveMember(selectedId)} className="w-full mt-8 border-2 border-red-500 text-red-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95">Remove Member</button>
                )}
              </div>
            </section>

            {/* COLUMN 3: OVERVIEW */}
            <section className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Overview</span>
              <div className="bg-[#1e293b] rounded-[2.5rem] shadow-xl p-8 h-[580px] flex flex-col items-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
                <div className="w-28 h-28 bg-slate-700 rounded-full flex items-center justify-center text-4xl font-black mb-6 border-4 border-slate-600 shadow-2xl z-10">
                  {selectedMember?.name?.charAt(0) || "?"}
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-1 z-10">{selectedMember?.name || "SELECT MEMBER"}</h3>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-10 z-10">{selectedMember?.role || "---"}</span>
                <div className="w-full space-y-4 z-10">
                  <div className="bg-slate-800/50 p-5 rounded-[1.5rem] border border-slate-700 flex flex-col gap-1 hover:bg-slate-800 transition-colors">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Email Address</span>
                    <span className="text-xs font-bold truncate">{selectedMember?.email || "N/A"}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Role;