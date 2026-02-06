import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code"; 
import api from '../api';

const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const ParticipantDash = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [myEvents, setMyEvents] = useState([]);
  
  // JOIN STATE
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const fetchTickets = async () => {
      try {
        const res = await api.get('/my-tickets');
        const tickets = res.data.map(ticket => ({
            id: ticket.id,
            title: ticket.event.title,
            date: ticket.event.schedule_date,
            location: ticket.event.location,
            status: ticket.status,
            qr_string: ticket.qr_code_string,
            description: ticket.event.description
        }));
        setMyEvents(tickets);
      } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleJoinEvent = async (e) => {
      e.preventDefault();
      try {
          await api.post('/events/join', { invite_code: inviteCode });
          alert("Successfully Joined!");
          setInviteCode("");
          setIsJoinModalOpen(false);
          fetchTickets();
      } catch (err) {
          alert(err.response?.data?.message || "Failed to join event");
      }
  };

  const filteredEvents = myEvents.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarLinks = [
    { name: "My Events", path: "/participant", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-700 overflow-hidden relative">
      
      {/* --- JOIN EVENT MODAL --- */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in duration-200">
                <h3 className="text-xl font-black text-[#1e40af] uppercase text-center mb-6">Join Event</h3>
                <form onSubmit={handleJoinEvent} className="flex flex-col gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Enter Invite Code</label>
                        <input 
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            className="w-full bg-[#f1f5f9] rounded-xl p-4 text-center text-xl font-black tracking-widest outline-none border-2 border-transparent focus:border-blue-500 uppercase"
                            placeholder="XXXXXX"
                            maxLength={6}
                        />
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button type="submit" className="flex-1 bg-[#2563eb] text-white py-3 rounded-xl font-black text-xs uppercase hover:bg-blue-600">Join</button>
                        <button type="button" onClick={() => setIsJoinModalOpen(false)} className="px-6 bg-slate-100 text-slate-500 py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-200">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- TICKET MODAL --- */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-200 relative overflow-hidden">
            <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors">
               <Icon path="M6 18L18 6M6 6l12 12" />
            </button>
            <div className="text-center mb-6">
               <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${selectedEvent.status === 'Present' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  {selectedEvent.status}
               </span>
               <h3 className="text-xl font-black text-[#1e40af] uppercase mt-4 leading-tight">{selectedEvent.title}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{selectedEvent.date} • {selectedEvent.location}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-200 flex justify-center mb-6">
                <div style={{ height: "auto", margin: "0 auto", maxWidth: 160, width: "100%" }}>
                    <QRCode size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} value={selectedEvent.qr_string} viewBox={`0 0 256 256`} />
                </div>
            </div>
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">Show this code to the organizer<br/>for check-in.</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex justify-between items-center px-12 py-5 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 onClick={() => navigate('/participant')} className="text-2xl font-black text-[#1e40af] tracking-tight cursor-pointer">QRBase Meetings</h1>
        <nav className="hidden md:flex items-center gap-10">
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-blue-600 hover:text-gray-400 transition-colors text-sm font-black uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer">Log Out</button>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="group absolute inset-y-0 left-0 z-20 flex flex-col justify-between w-20 hover:w-64 bg-[#1e293b] transition-all duration-300 m-4 rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-2 p-4 mt-2">
            {sidebarLinks.map((link) => (
              <button key={link.name} onClick={() => navigate(link.path)} className={`flex items-center w-full py-3.5 px-3 rounded-2xl transition-all active:scale-95 ${link.path === "/participant" ? "bg-[#2563eb] text-white" : "text-slate-400 hover:bg-[#2563eb] hover:text-white"}`}>
                <div className="min-w-[24px] flex justify-center"><Icon path={link.icon} /></div>
                <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity font-black text-[11px] uppercase tracking-widest whitespace-nowrap">{link.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 ml-24 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="px-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-[#1e40af] tracking-tight uppercase leading-none">Overview</h2>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Participant Portal</span>
              </div>
              
              <div className="flex gap-4 w-full md:w-auto">
                  <button onClick={() => setIsJoinModalOpen(true)} className="bg-[#1e293b] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-lg transition-all active:scale-95 whitespace-nowrap">
                    + Join Event
                  </button>
                  <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500"><Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-4 h-4" /></div>
                    <input type="text" placeholder="SEARCH EVENTS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#2563eb] shadow-sm transition-all" />
                  </div>
              </div>
            </div>

            <section className="bg-white rounded-[2.5rem] shadow-xl p-10 min-h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map(event => (
                    <div key={event.id} onClick={() => setSelectedEvent(event)} className="group bg-[#f8fafc] p-8 rounded-[2.5rem] border-2 border-transparent hover:border-blue-100 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                          <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${event.status === 'Present' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{event.status}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 group-hover:text-blue-600 transition-colors">{event.title}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.date} • {event.location}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-300 gap-4 opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-widest">No events found</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ParticipantDash;