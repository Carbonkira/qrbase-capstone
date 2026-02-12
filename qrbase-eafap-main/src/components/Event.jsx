import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>
);

const STORAGE_URL = "http://localhost:8000/storage/";

const Events = () => {
  const navigate = useNavigate();
  // Initialize user from LocalStorage to prevent UI flickering
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  
  const [events, setEvents] = useState([]);
  const [allSpeakers, setAllSpeakers] = useState([]); 
  const [searchQuery, setSearchQuery] = useState("");
  
  // States
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState([]); 
  
  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({ 
      first_name: user?.first_name || '', 
      last_name: user?.last_name || '' 
  });
  
  const [formData, setFormData] = useState({ title: "", description: "", location: "", max_participants: 100, schedule_date: new Date().toISOString().split('T')[0], image: null });
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [viewDate, setViewDate] = useState(new Date()); 
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  useEffect(() => { fetchUser(); fetchEvents(); fetchSpeakers(); }, []);

  const fetchUser = async () => {
      try { 
          const res = await api.get('/user'); 
          setUser(res.data); 
          localStorage.setItem('user', JSON.stringify(res.data));
          setProfileData({ first_name: res.data.first_name, last_name: res.data.last_name });
      } catch (err) { console.error("Failed to load profile"); }
  };

  const fetchEvents = async () => { try { const res = await api.get('/events'); setEvents(res.data); } catch (err) { console.error("Error loading events", err); } };
  const fetchSpeakers = async () => { try { const res = await api.get('/all-speakers'); setAllSpeakers(res.data); } catch (err) { console.error("Error loading speakers", err); } };

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

  // CALENDAR LOGIC FIXED
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

  const handleEditClick = (event) => {
    setIsEditing(true);
    setEditId(event.id);
    setFormData({ title: event.title, description: event.description || "", location: event.location, max_participants: event.max_participants || 100, schedule_date: event.schedule_date, image: null });
    const currentSpeakerIds = event.speakers ? event.speakers.map(s => s.id) : [];
    setSelectedSpeakerIds(currentSpeakerIds);
    if (event.schedule_date) setSelectedDate(new Date(event.schedule_date));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ title: "", description: "", location: "", max_participants: 100, schedule_date: "", image: null });
    setSelectedSpeakerIds([]);
  };

  const handleSpeakerToggle = (id) => {
    if (selectedSpeakerIds.includes(id)) { setSelectedSpeakerIds(selectedSpeakerIds.filter(sid => sid !== id)); } 
    else { setSelectedSpeakerIds([...selectedSpeakerIds, id]); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this event? This cannot be undone.")) return;
    try { await api.delete(`/events/${id}`); setEvents(events.filter(e => e.id !== id)); if(editId === id) handleCancelEdit(); } catch (err) { alert("Failed to delete event."); }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.location) { alert("Please provide at least a Title and Location"); return; }
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('location', formData.location);
    data.append('max_participants', formData.max_participants);
    // Use selectedDate for the submission
    data.append('schedule_date', selectedDate.toLocaleDateString('en-CA')); // Format YYYY-MM-DD
    if (formData.image) data.append('image', formData.image);
    selectedSpeakerIds.forEach(id => data.append('speaker_ids[]', id));

    try {
        if (isEditing) { await api.post(`/events/${editId}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } }); alert("Event Updated!"); } 
        else { await api.post('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } }); alert("Event Created!"); }
        fetchEvents(); handleCancelEdit(); 
    } catch (err) { alert("Operation failed."); }
  };

  const filteredEvents = events.filter(event => event.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const sidebarLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Events", path: "/events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { name: "Speakers", path: "/speakers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }
  ];

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-800 overflow-hidden relative">
      
      {/* HEADER */}
      <header className="flex justify-between items-center px-12 py-6 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 onClick={() => navigate('/dashboard')} className="text-3xl font-black text-[#1e40af] tracking-tight cursor-pointer">QRBase Meetings</h1>
        {user && (
            <div onClick={() => setIsProfileOpen(true)} className="flex items-center gap-4 text-right cursor-pointer hover:opacity-80 transition-opacity group">
                <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500">Edit Profile</p>
                    <p className="text-lg font-black text-[#1e40af] uppercase leading-none">{user.first_name} {user.last_name}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xl border-2 border-blue-50">{user.first_name.charAt(0)}</div>
            </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="group absolute inset-y-0 left-0 z-20 flex flex-col justify-between w-24 hover:w-72 bg-[#1e293b] transition-all duration-300 m-6 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-3 p-5 mt-4">
            {sidebarLinks.map((link) => (
              <button key={link.name} onClick={() => navigate(link.path)} className={`flex items-center w-full py-4 px-4 rounded-2xl transition-all active:scale-95 ${link.name === "Events" ? "bg-[#2563eb] text-white" : "text-slate-400 hover:bg-[#2563eb] hover:text-white"}`}>
                <div className="min-w-[32px] flex justify-center"><Icon path={link.icon} className="w-7 h-7" /></div>
                <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity font-black text-sm uppercase tracking-widest whitespace-nowrap">{link.name}</span>
              </button>
            ))}
          </div>
          <div className="p-5 mb-2">
            <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="flex items-center w-full py-4 px-4 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all">
              <div className="min-w-[32px] flex justify-center"><Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></div>
              <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity font-black text-sm uppercase tracking-widest whitespace-nowrap">Log Out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-32 p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* COLUMN 1: FORM */}
            <section className="flex flex-col gap-4">
              <span className="text-xl font-black text-gray-400 uppercase tracking-[0.2em] ml-4">{isEditing ? "Edit Event" : "Create Event"}</span>
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 h-[650px] flex flex-col gap-6 overflow-y-auto border border-white/50">
                  <div className="flex flex-col gap-2"><label className="text-sm font-black text-[#1e40af] uppercase ml-1">Event Title</label><input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2563eb]" placeholder="E.G. TECH SUMMIT 2026" /></div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-black text-[#1e40af] uppercase ml-1">Location</label><input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2563eb]" placeholder="E.G. GRAND HALL A" /></div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-black text-[#1e40af] uppercase ml-1">Allowed Participants</label><input type="number" value={formData.max_participants} onChange={(e) => setFormData({...formData, max_participants: e.target.value})} className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2563eb]" placeholder="100" /></div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-black text-[#1e40af] uppercase ml-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2563eb] h-32 resize-none" placeholder="EVENT DETAILS..." /></div>
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3"><label className="text-sm font-black text-[#1e40af] uppercase ml-1">Select Speakers</label><div className="bg-[#f8fafc] border-2 border-slate-100 rounded-xl p-3 max-h-48 overflow-y-auto">{allSpeakers.length > 0 ? (allSpeakers.map(speaker => (<label key={speaker.id} className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg cursor-pointer"><input type="checkbox" checked={selectedSpeakerIds.includes(speaker.id)} onChange={() => handleSpeakerToggle(speaker.id)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" /><div className="flex flex-col"><span className="text-sm font-bold text-slate-700">{speaker.name}</span><span className="text-xs text-slate-400 uppercase">{speaker.specialization}</span></div></label>))) : (<div className="text-center py-4"><span className="text-xs text-slate-400 font-bold uppercase">No speakers found.<br/>Go to Speakers tab to add some.</span></div>)}</div></div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-black text-[#1e40af] uppercase ml-1">Banner Image</label><input type="file" onChange={(e) => setFormData({...formData, image: e.target.files[0]})} className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-3 text-sm font-bold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div>
                  <div className="mt-auto flex gap-2"><button onClick={handleSubmit} className="flex-1 bg-[#1e293b] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#2563eb] shadow-lg transition-all active:scale-95">{isEditing ? "Update Event" : "Create Event"}</button>{isEditing && <button onClick={handleCancelEdit} className="px-6 bg-red-50 text-red-500 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95">Cancel</button>}</div>
              </div>
            </section>

            {/* COLUMN 2: CALENDAR */}
            <section className="flex flex-col gap-4">
              <span className="text-xl font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Schedule</span>
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 h-[650px] flex flex-col gap-6">
                <div className="flex justify-between items-center mb-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#1e40af]"><Icon path="M15.75 19.5L8.25 12l7.5-7.5" /></button>
                    <h3 className="text-3xl font-black text-[#1e40af] tracking-tight text-center uppercase">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#1e40af]"><Icon path="M8.25 4.5l7.5 7.5-7.5 7.5" /></button>
                </div>
                <div className="p-5 bg-[#f1f5f9] rounded-2xl flex items-center gap-4 text-[#2563eb] border border-slate-100"><Icon path="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" className="w-8 h-8" /><div className="flex flex-col"><span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Selected Date</span><span className="text-xl font-bold text-slate-700 uppercase">{selectedDate.toLocaleDateString()}</span></div></div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="grid grid-cols-7 gap-2 text-center text-sm font-bold">
                    {Array.from({ length: getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }, (_, i) => { const day = i + 1; const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === viewDate.getMonth(); return (<div key={i} onClick={() => setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))} className={`p-4 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-[#2563eb] text-white shadow-md shadow-blue-200 font-black' : 'text-slate-500 hover:bg-slate-50'}`}>{day}</div>); })}
                  </div>
                </div>
              </div>
            </section>

            {/* COLUMN 3: EVENT LIST */}
            {/* ... (Event List code remains mostly the same, just keeping the font updates) ... */}
            <section className="flex flex-col gap-4">
              <span className="text-xl font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Manage</span>
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 h-[650px] flex flex-col">
                <h2 className="text-3xl font-black text-[#1e40af] tracking-tight mb-6 text-center uppercase">My events</h2>
                <div className="relative mb-6"><div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-blue-500"><Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-5 h-5" /></div><input type="text" placeholder="SEARCH..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#f1f5f9] border-2 border-slate-50 rounded-2xl py-4 pl-14 pr-4 text-sm font-black uppercase tracking-widest outline-none focus:border-[#2563eb] focus:bg-white transition-all shadow-sm" /></div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                      <div key={event.id} className={`p-6 border-2 rounded-[2rem] flex flex-col gap-5 transition-all ${editId === event.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-50'}`}>
                        {/* EVENT IMAGE */}
                        <div className="h-40 w-full bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner">
                            {event.image ? <img src={STORAGE_URL + event.image} alt="Event Banner" className="w-full h-full object-cover" onError={(e) => {e.target.style.display='none'}} /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-sm uppercase tracking-widest">No Image</div>}
                        </div>

                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1"><h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{event.title}</h4><span className="text-sm font-bold text-slate-500 uppercase">{event.schedule_date}</span></div>
                            <div className="flex gap-2">
                                <button onClick={() => navigate(`/events/${event.id}/manage`)} className="bg-[#1e293b] text-white p-3 rounded-xl hover:bg-black" title="Manage Module"><Icon path="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /></button>
                                <button onClick={() => handleEditClick(event)} className="bg-blue-100 text-blue-600 p-3 rounded-xl hover:bg-blue-200" title="Edit Info"><Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></button>
                                <button onClick={() => handleDelete(event.id)} className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-100" title="Delete"><Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></button>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center"><div className="flex flex-col"><span className="text-xs font-black text-blue-400 uppercase tracking-widest">Invite Code</span><span className="text-xl font-black text-blue-800 tracking-wider">{event.invite_code || "---"}</span></div><button onClick={() => {navigator.clipboard.writeText(event.invite_code); alert("Code Copied!");}} className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold border border-blue-100 shadow-sm hover:bg-blue-100">COPY</button></div>
                        
                        <div className="bg-slate-100 rounded-xl p-4 flex justify-between items-center">
                            <div className="flex flex-col items-center w-1/3 border-r border-slate-200"><span className="text-xs font-black text-slate-400 uppercase">Limit</span><span className="text-lg font-black text-slate-700">{event.max_participants || 100}</span></div>
                            <div className="flex flex-col items-center w-1/3 border-r border-slate-200"><span className="text-xs font-black text-slate-400 uppercase">Present</span><span className="text-lg font-black text-green-600">{event.present_count || 0}</span></div>
                            <div className="flex flex-col items-center w-1/3"><span className="text-xs font-black text-slate-400 uppercase">Absent</span><span className="text-lg font-black text-red-500">{Math.max(0, (event.registrations_count || 0) - (event.present_count || 0))}</span></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-60"><span className="text-sm font-black uppercase tracking-widest text-center px-4">No events found</span></div>
                  )}
                </div>
              </div>
            </section>
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
                        <button type="button" onClick={() => setIsProfileOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                        <button type="submit" className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600">Save</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Events;