import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const Events = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [viewDate, setViewDate] = useState(new Date()); 
  const [searchQuery, setSearchQuery] = useState("");
  
  // FORM STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    title: "", 
    description: "", 
    location: "", 
    max_participants: 100, 
    image: null 
  });
  
  const [events, setEvents] = useState([]);
  
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const years = Array.from({ length: 10 }, (_, i) => 2024 + i);

  // FETCH EVENTS
  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error("Error loading events", err);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  // --- HANDLERS ---

  const handleEditClick = (event) => {
    setIsEditing(true);
    setEditId(event.id);
    setFormData({
        title: event.title,
        description: event.description || "",
        location: event.location,
        max_participants: event.max_participants || 100,
        image: null // Reset image input
    });
    if (event.schedule_date) {
        setSelectedDate(new Date(event.schedule_date));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ title: "", description: "", location: "", max_participants: 100, image: null });
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this event? This cannot be undone.")) return;
    try {
        await api.delete(`/events/${id}`);
        setEvents(events.filter(e => e.id !== id));
        if(editId === id) handleCancelEdit();
    } catch (err) {
        alert("Failed to delete event.");
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.location) {
        alert("Please provide at least a Title and Location");
        return;
    }
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('location', formData.location);
    data.append('max_participants', formData.max_participants);
    data.append('schedule_date', selectedDate.toISOString().split('T')[0]);
    
    if (formData.image) {
        data.append('image', formData.image);
    }

    try {
        if (isEditing) {
            await api.post(`/events/${editId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert("Event Updated!");
        } else {
            await api.post('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert("Event Created!");
        }
        
        fetchEvents(); 
        handleCancelEdit(); 
    } catch (err) {
        console.error(err);
        alert("Operation failed. " + (err.response?.data?.message || ""));
    }
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Events", path: "/events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { name: "Team", path: "/role", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { name: "Attendance", path: "/attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { name: "Scanner", path: "/qr", icon: "M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" }
  ];

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-700 overflow-hidden">
      
      {/* HEADER */}
      <header className="flex justify-between items-center px-12 py-5 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 onClick={() => navigate('/dashboard')} className="text-2xl font-black text-[#1e40af] tracking-tight cursor-pointer">QRBase Meetings</h1>
        <nav className="hidden md:flex items-center gap-10">
          <div className="flex gap-8 text-sm font-bold items-center uppercase tracking-widest">
            {/* Navigation Links moved to Header */}
            {sidebarLinks.filter(l => l.name !== "Scanner").map(link => (
                <button key={link.name} onClick={() => navigate(link.path)} className="text-blue-600 hover:text-gray-400 transition-colors bg-transparent border-none p-0 cursor-pointer font-bold uppercase tracking-widest">{link.name}</button>
            ))}
          </div>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <aside className="group absolute inset-y-0 left-0 z-20 flex flex-col justify-between w-20 hover:w-64 bg-[#1e293b] transition-all duration-300 m-4 rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-2 p-4 mt-2">
            {sidebarLinks.map((link) => (
              <button key={link.name} onClick={() => navigate(link.path)} className={`flex items-center w-full py-3.5 px-3 rounded-2xl transition-all active:scale-95 ${link.name === "Events" ? "bg-[#2563eb] text-white" : "text-slate-400 hover:bg-[#2563eb] hover:text-white"}`}>
                <div className="min-w-[24px] flex justify-center"><Icon path={link.icon} /></div>
                <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity font-black text-[11px] uppercase tracking-widest whitespace-nowrap">{link.name}</span>
              </button>
            ))}
          </div>
          
          {/* LOG OUT BUTTON MOVED TO SIDEBAR BOTTOM */}
          <div className="p-4 mb-2">
            <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="flex items-center w-full py-3.5 px-3 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all">
              <div className="min-w-[24px] flex justify-center"><Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></div>
              <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity font-black text-[11px] uppercase tracking-widest whitespace-nowrap">Log Out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-24 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* COLUMN 1: ADD/EDIT FORM */}
            <section className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">
                  {isEditing ? "Edit Event" : "Create Event"}
              </span>
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 h-[650px] flex flex-col gap-4 overflow-y-auto border border-white/50">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-[#1e40af] uppercase ml-1">Event Title</label>
                    <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#2563eb]" placeholder="E.G. TECH SUMMIT 2026" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-[#1e40af] uppercase ml-1">Location</label>
                    <input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#2563eb]" placeholder="E.G. GRAND HALL A" />
                  </div>
                  {/* ALLOWED PARTICIPANTS */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-[#1e40af] uppercase ml-1">Allowed Participants</label>
                    <input type="number" value={formData.max_participants} onChange={(e) => setFormData({...formData, max_participants: e.target.value})} className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#2563eb]" placeholder="100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-[#1e40af] uppercase ml-1">Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#2563eb] h-20 resize-none" placeholder="EVENT DETAILS..." />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-[#1e40af] uppercase ml-1">Banner Image {isEditing && "(Leave empty to keep)"}</label>
                    <input type="file" onChange={(e) => setFormData({...formData, image: e.target.files[0]})} className="w-full bg-[#f1f5f9] border-2 border-slate-100 rounded-xl p-2 text-xs font-bold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button onClick={handleSubmit} className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2563eb] shadow-lg transition-all active:scale-95">
                      {isEditing ? "Update Event" : "Create Event"}
                    </button>
                    {isEditing && (
                        <button onClick={handleCancelEdit} className="px-6 bg-red-50 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95">Cancel</button>
                    )}
                  </div>
              </div>
            </section>

            {/* COLUMN 2: CALENDAR */}
            <section className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Schedule</span>
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 h-[650px] flex flex-col gap-6">
                <h3 className="text-2xl font-black text-[#1e40af] tracking-tight text-center uppercase">Calendar</h3>
                <div className="p-4 bg-[#f1f5f9] rounded-2xl flex items-center gap-4 text-[#2563eb] border border-slate-100">
                  <Icon path="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Selected Date</span>
                    <span className="text-sm font-bold text-slate-700 uppercase">{selectedDate.getDate()} {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold">
                    {Array.from({ length: getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }, (_, i) => {
                      const day = i + 1;
                      const isSelected = selectedDate.getDate() === day;
                      return (
                        <div key={i} onClick={() => setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))}
                          className={`p-2 py-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-[#2563eb] text-white shadow-md shadow-blue-200 font-black' : 'text-slate-500 hover:bg-slate-50'}`}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* COLUMN 3: EVENT LIST */}
            <section className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Manage</span>
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 h-[650px] flex flex-col">
                <h2 className="text-2xl font-black text-[#1e40af] tracking-tight mb-6 text-center uppercase">My events</h2>
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500"><Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-4 h-4" /></div>
                  <input type="text" placeholder="SEARCH..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#f1f5f9] border-2 border-slate-50 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#2563eb] focus:bg-white transition-all shadow-sm" />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                      <div key={event.id} className={`p-5 border-2 rounded-[2rem] flex flex-col gap-4 transition-all ${editId === event.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-50'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{event.title}</h4>
                                <span className="text-[9px] font-bold text-slate-500 uppercase">{event.schedule_date}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditClick(event)} className="bg-blue-100 text-blue-600 p-2 rounded-xl hover:bg-blue-200">
                                    <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </button>
                                <button onClick={() => handleDelete(event.id)} className="bg-red-50 text-red-500 p-2 rounded-xl hover:bg-red-100">
                                    <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </button>
                            </div>
                        </div>

                        {/* INVITE CODE DISPLAY */}
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Invite Code</span>
                                <span className="text-lg font-black text-blue-800 tracking-wider">{event.invite_code || "---"}</span>
                            </div>
                            <button onClick={() => {navigator.clipboard.writeText(event.invite_code); alert("Code Copied!");}} className="bg-white text-blue-600 px-3 py-1 rounded-lg text-[9px] font-bold border border-blue-100 shadow-sm hover:bg-blue-100">COPY</button>
                        </div>

                        {/* STATS BAR */}
                        <div className="bg-slate-100 rounded-xl p-3 flex justify-between items-center">
                            <div className="flex flex-col items-center w-1/3 border-r border-slate-200">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Limit</span>
                                <span className="text-xs font-black text-slate-700">{event.max_participants || 100}</span>
                            </div>
                            <div className="flex flex-col items-center w-1/3 border-r border-slate-200">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Booked</span>
                                <span className="text-xs font-black text-blue-600">{event.registrations_count || 0}</span>
                            </div>
                            <div className="flex flex-col items-center w-1/3">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Present</span>
                                <span className="text-xs font-black text-green-600">{event.attendances_count || 0}</span>
                            </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-60">
                      <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">No events found</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Events;