import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>
);

const STORAGE_URL = "http://localhost:8000/storage/";

const Speakers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- USER STATE ---
  const [user, setUser] = useState(() => {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [speakers, setSpeakers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- MODAL STATES ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [selectedSpeaker, setSelectedSpeaker] = useState(null); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordMode, setIsPasswordMode] = useState(false);

  // --- FORMS ---
  const [profileData, setProfileData] = useState({ 
      first_name: user?.first_name || '', 
      last_name: user?.last_name || '',
      position: user?.position || '' 
  });
  
  const [passwordData, setPasswordData] = useState({ 
      current_password: '', 
      new_password: '', 
      new_password_confirmation: '' 
  });

  const [formData, setFormData] = useState({ 
      name: "", 
      specialization: "", 
      description: "", 
      contact_email: "", 
      photo: null 
  });

  useEffect(() => { fetchUser(); fetchSpeakers(); }, []);

  const fetchUser = async () => {
      try { 
          const res = await api.get('/user'); 
          setUser(res.data); 
          localStorage.setItem('user', JSON.stringify(res.data));
          setProfileData({ 
              first_name: res.data.first_name, 
              last_name: res.data.last_name,
              position: res.data.position || '' 
          });
      } catch (err) { console.error("Failed to load profile"); }
  };

  const fetchSpeakers = async () => { 
      try { const res = await api.get('/all-speakers'); setSpeakers(res.data); } 
      catch (err) { console.error(err); } 
  };

  // --- PROFILE & PASSWORD HANDLERS ---
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

  const handleChangePassword = async (e) => {
      e.preventDefault();
      if (passwordData.new_password !== passwordData.new_password_confirmation) {
          return alert("New passwords do not match!");
      }
      try {
          await api.put('/user/password', passwordData);
          alert("Password changed successfully!");
          setIsPasswordMode(false); 
          setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
      } catch (err) {
          alert(err.response?.data?.message || "Failed to change password.");
      }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  // --- SPEAKER ACTIONS ---
  const openCreateModal = () => {
      setEditingId(null);
      setFormData({ name: "", specialization: "", description: "", contact_email: "", photo: null });
      setIsFormModalOpen(true);
  };

  const openEditModal = (speaker) => {
      setEditingId(speaker.id);
      setFormData({ 
          name: speaker.name, 
          specialization: speaker.specialization, 
          description: speaker.description || "", 
          contact_email: speaker.contact_email || "", 
          photo: null 
      });
      setSelectedSpeaker(null); 
      setIsFormModalOpen(true); 
  };

  const handleSaveSpeaker = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Name is required");

    const data = new FormData();
    data.append('name', formData.name);
    data.append('specialization', formData.specialization);
    data.append('description', formData.description);
    data.append('contact_email', formData.contact_email);
    if (formData.photo) data.append('photo', formData.photo);

    try {
        if (editingId) {
            data.append('_method', 'PUT');
            await api.post(`/speakers/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert("Speaker Updated!");
        } else {
            await api.post('/speakers', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert("Speaker Added!");
        }

        setIsFormModalOpen(false);
        setEditingId(null);
        setFormData({ name: "", specialization: "", description: "", contact_email: "", photo: null });
        fetchSpeakers(); 
    } catch (err) { alert(err.response?.data?.message || "Operation failed"); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Remove this speaker from the global roster?")) return;
    try { 
        await api.delete(`/speakers/${id}`); 
        setSpeakers(speakers.filter(s => s.id !== id)); 
        if(selectedSpeaker?.id === id) setSelectedSpeaker(null); 
    } catch (err) { alert("Failed to remove speaker."); }
  };

  const filteredSpeakers = speakers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.specialization?.toLowerCase().includes(searchQuery.toLowerCase()));

  const sidebarLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Events", path: "/events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { name: "Speakers", path: "/speakers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }
  ];

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-800 overflow-hidden relative">
      
      {/* --- FORM MODAL (CREATE & EDIT) --- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-black text-[#1e40af] uppercase">
                        {editingId ? "Edit Speaker" : "New Speaker"}
                    </h3>
                    <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-red-500"><Icon path="M6 18L18 6M6 6l12 12" /></button>
                </div>
                <form onSubmit={handleSaveSpeaker} className="flex flex-col gap-5">
                    <div className="flex gap-4">
                        <input placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="flex-1 bg-[#f1f5f9] p-5 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 border-2 border-transparent" />
                        <input placeholder="Role" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="flex-1 bg-[#f1f5f9] p-5 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 border-2 border-transparent" />
                    </div>
                    <input placeholder="Contact Email (Optional)" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} className="w-full bg-[#f1f5f9] p-5 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 border-2 border-transparent" />
                    <textarea placeholder="Bio / Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#f1f5f9] p-5 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 border-2 border-transparent h-36 resize-none" />
                    <div className="flex flex-col gap-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Photo</label><input type="file" onChange={e => setFormData({...formData, photo: e.target.files[0]})} className="text-sm font-bold text-slate-500" /></div>
                    
                    <button type="submit" className="bg-[#1e293b] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all mt-2">
                        {editingId ? "Update Speaker" : "Save Speaker"}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* --- DETAILS MODAL --- */}
      {selectedSpeaker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 animate-in zoom-in duration-200 relative">
                {/* CLOSE BUTTON */}
                <button onClick={() => setSelectedSpeaker(null)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><Icon path="M6 18L18 6M6 6l12 12" /></button>
                
                {/* EDIT BUTTON */}
                <button onClick={() => openEditModal(selectedSpeaker)} className="absolute top-8 left-8 text-blue-300 hover:text-blue-600 flex gap-2 items-center group">
                    <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    <span className="text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                </button>

                <div className="flex flex-col items-center text-center mt-6">
                    <div className="w-48 h-48 bg-slate-100 rounded-full mb-8 overflow-hidden border-4 border-white shadow-lg">
                        {selectedSpeaker.photo_path ? <img src={STORAGE_URL + selectedSpeaker.photo_path} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-6xl">{selectedSpeaker.name.charAt(0)}</div>}
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{selectedSpeaker.name}</h3>
                    <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2">{selectedSpeaker.specialization}</p>
                    <p className="text-sm text-slate-600 mb-8">{selectedSpeaker.contact_email}</p>
                    <div className="text-left w-full bg-slate-50 p-8 rounded-3xl border border-slate-100 max-h-72 overflow-y-auto"><p className="text-base text-slate-600 leading-relaxed font-medium">{selectedSpeaker.description || "No description."}</p></div>
                </div>
            </div>
        </div>
      )}

      {/* HEADER MATCHING ORGANIZER DASH */}
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

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="group absolute inset-y-0 left-0 z-20 flex flex-col justify-between w-24 hover:w-72 bg-[#1e293b] transition-all duration-300 m-6 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-3 p-5 mt-4">
            {sidebarLinks.map((link) => (
              <button key={link.name} onClick={() => navigate(link.path)} className={`flex items-center w-full py-4 px-4 rounded-2xl transition-all active:scale-95 ${location.pathname.startsWith(link.path) ? "bg-[#2563eb] text-white" : "text-slate-400 hover:bg-[#2563eb] hover:text-white"}`}>
                <div className="min-w-[32px] flex justify-center"><Icon path={link.icon} className="w-7 h-7" /></div>
                <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity font-black text-sm uppercase tracking-widest whitespace-nowrap">{link.name}</span>
              </button>
            ))}
          </div>
          <div className="p-5 mb-2">
            <button onClick={handleLogout} className="flex items-center w-full py-4 px-4 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all">
              <div className="min-w-[32px] flex justify-center"><Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></div>
              <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity font-black text-sm uppercase tracking-widest whitespace-nowrap">Log Out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-32 p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                <div><h2 className="text-4xl font-black text-[#1e40af] tracking-tight uppercase leading-none">Speakers</h2><span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Global Roster</span></div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={openCreateModal} className="bg-[#1e293b] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 shadow-lg transition-all active:scale-95 whitespace-nowrap">+ Add Speaker</button>
                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-blue-500"><Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-5 h-5" /></div>
                        <input type="text" placeholder="SEARCH SPEAKER..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-4 text-sm font-black uppercase tracking-widest outline-none focus:border-[#2563eb] shadow-sm transition-all" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSpeakers.map((s) => (
                    <div key={s.id} onClick={() => setSelectedSpeaker(s)} className="bg-white p-8 rounded-[3rem] shadow-lg flex gap-6 items-center border border-white relative group transition-all hover:-translate-y-2 cursor-pointer hover:border-blue-200">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Icon path="M6 18L18 6M6 6l12 12" /></button>
                        <div className="w-20 h-20 bg-slate-200 rounded-full overflow-hidden shrink-0 shadow-inner flex items-center justify-center text-blue-500 font-black text-2xl">{s.photo_path ? <img src={STORAGE_URL + s.photo_path} className="w-full h-full object-cover" /> : s.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-black text-slate-800 truncate">{s.name}</h4>
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest truncate">{s.specialization}</p>
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{s.description || "No description."}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </main>
      </div>

      {/* EDIT PROFILE / CHANGE PASSWORD MODAL */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in">
                
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-[#1e40af] uppercase text-center flex-1">
                        {isPasswordMode ? "Change Password" : "Edit Profile"}
                    </h3>
                </div>

                {/* TOGGLE TABS */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => setIsPasswordMode(false)} 
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${!isPasswordMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Profile
                    </button>
                    <button 
                        onClick={() => setIsPasswordMode(true)} 
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${isPasswordMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Security
                    </button>
                </div>

                {isPasswordMode ? (
                    // --- PASSWORD FORM ---
                    <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                        <input 
                            type="password" 
                            placeholder="Current Password" 
                            value={passwordData.current_password} 
                            onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} 
                            className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" 
                        />
                        <input 
                            type="password" 
                            placeholder="New Password" 
                            value={passwordData.new_password} 
                            onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} 
                            className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" 
                        />
                        <input 
                            type="password" 
                            placeholder="Confirm New Password" 
                            value={passwordData.new_password_confirmation} 
                            onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})} 
                            className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" 
                        />
                        <div className="flex gap-2 mt-4">
                            <button type="button" onClick={() => setIsProfileOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Cancel</button>
                            <button type="submit" className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600">Update</button>
                        </div>
                    </form>
                ) : (
                    // --- PROFILE FORM ---
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                        <input 
                            placeholder="First Name" 
                            value={profileData.first_name} 
                            onChange={(e) => setProfileData({...profileData, first_name: e.target.value})} 
                            className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" 
                        />
                        <input 
                            placeholder="Last Name" 
                            value={profileData.last_name} 
                            onChange={(e) => setProfileData({...profileData, last_name: e.target.value})} 
                            className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" 
                        />
                        <input 
                            placeholder="Position / Affiliation" 
                            value={profileData.position || ''} 
                            onChange={(e) => setProfileData({...profileData, position: e.target.value})} 
                            className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" 
                        />
                        <div className="flex gap-2 mt-4">
                            <button type="button" onClick={() => setIsProfileOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Cancel</button>
                            <button type="submit" className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600">Save</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Speakers;