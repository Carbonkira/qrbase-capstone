import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const Attendance = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState([]);
  const [newEntry, setNewEntry] = useState({ email: '', role: '', dateRange: '' });

  // 1. Fetch Requests from Backend
  useEffect(() => {
    const fetchRequests = async () => {
        try {
            const res = await api.get('/attendance-requests');
            const mapped = res.data.map(req => ({
                id: req.id,
                name: (req.user?.first_name + ' ' + req.user?.last_name).toUpperCase(),
                role: "PARTICIPANT",
                dateRange: req.event?.schedule_date || "N/A",
                status: req.status
            }));
            setRequests(mapped);
        } catch (err) {
            console.error("Error fetching requests", err);
        }
    };
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(r => 
    r.status === activeTab && 
    (r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     r.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStatusUpdate = async (id, nextStatus) => {
    try {
        await api.put(`/attendance-requests/${id}`, { status: nextStatus });
        setRequests(requests.map(r => r.id === id ? { ...r, status: nextStatus } : r));
    } catch(err) { alert("Update failed"); }
  };

  // CHECK-IN LOGIC
  const handleCheckIn = async (id) => {
      try {
          await api.post(`/attendance/checkin/${id}`);
          setRequests(requests.map(r => r.id === id ? { ...r, status: 'Present' } : r));
      } catch (err) {
          alert("Check-in failed: " + (err.response?.data?.message || err.message));
      }
  };

  const handleCreateEntry = async (e) => {
  e.preventDefault();
  if (!newEntry.email) return;

  try {
      const res = await api.post('/attendance-requests', {
          email: newEntry.email, // Send email instead of name
          role: newEntry.role 
      });

      const newReq = {
          id: res.data.id,
          name: (res.data.user.first_name + ' ' + res.data.user.last_name).toUpperCase(),
          role: "PARTICIPANT",
          dateRange: res.data.event.schedule_date,
          status: "Pending"
      };

      setRequests([newReq, ...requests]);
      setNewEntry({ email: '', role: '', dateRange: '' }); // Reset email
      setIsModalOpen(false);
      alert("Request Created!");
  } catch (err) {
      alert(err.response?.data?.message || "Failed. Ensure user exists.");
  }
};

  const sidebarLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Events", path: "/events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { name: "Team", path: "/role", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { name: "Attendance", path: "/attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { name: "Scanner", path: "/qr", icon: "M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" }
  ];

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-700 overflow-hidden relative">
      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-[#1e40af] uppercase tracking-tight mb-6 text-center">New Attendance Request</h3>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">User Email</label>
              <input 
                type="email" 
                required 
                value={newEntry.email} 
                onChange={e => setNewEntry({...newEntry, email: e.target.value})} 
                className="w-full bg-[#f1f5f9] rounded-xl p-3 text-xs font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" 
                placeholder="user@example.com" 
              />
            </div>             
            </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Role</label>
                <input required value={newEntry.role} onChange={e => setNewEntry({...newEntry, role: e.target.value})} className="w-full bg-[#f1f5f9] rounded-xl p-3 text-xs font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" placeholder="E.G. DEVELOPER" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-[#2563eb] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all active:scale-95">Submit Request</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex justify-between items-center px-12 py-5 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 onClick={() => navigate('/dashboard')} className="text-2xl font-black text-[#1e40af] tracking-tight cursor-pointer">QRBase Meetings</h1>
        <nav className="hidden md:flex items-center gap-10">
           <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-blue-600 font-bold uppercase">Log Out</button>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="group absolute inset-y-0 left-0 z-20 flex flex-col justify-between w-20 hover:w-64 bg-[#1e293b] transition-all duration-300 m-4 rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-2 p-4 mt-2">
            {sidebarLinks.map((link) => (
              <button key={link.name} onClick={() => navigate(link.path)} className={`flex items-center w-full py-3.5 px-3 rounded-2xl transition-all active:scale-95 ${link.name === "Attendance" ? "bg-[#2563eb] text-white" : "text-slate-400 hover:bg-[#2563eb] hover:text-white"}`}>
                <div className="min-w-[24px] flex justify-center"><Icon path={link.icon} /></div>
                <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity font-black text-[11px] uppercase tracking-widest whitespace-nowrap">{link.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 ml-24 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6 h-full">
            <div className="flex justify-between items-end px-4">
              <div>
                <h2 className="text-3xl font-black text-[#1e40af] tracking-tight uppercase leading-none">Attendance</h2>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Management</span>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#1e293b] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
                + Create Entry
              </button>
            </div>

            <section className="bg-white rounded-[2.5rem] shadow-xl p-10 h-[600px] flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-2">
                <div className="flex gap-10">
                  {['Pending', 'Confirmed', 'Rejected', 'Present'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative outline-none ${activeTab === tab ? 'text-blue-600' : 'text-gray-300 hover:text-slate-500'}`}>
                      {tab}
                      {activeTab === tab && <div className="absolute bottom-[-2px] left-0 w-full h-1 bg-blue-600 rounded-full" />}
                    </button>
                  ))}
                </div>
                {/* Search Bar */}
                <div className="relative min-w-[240px]">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500"><Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-4 h-4" /></div>
                  <input type="text" placeholder="SEARCH REQUESTS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#f1f5f9] border-2 border-transparent rounded-2xl py-2.5 pl-11 pr-4 text-[9px] font-black uppercase tracking-widest outline-none focus:border-[#2563eb] focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredRequests.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-slate-300 py-20">
                      <span className="font-black text-[10px] uppercase tracking-[0.3em]">No {activeTab} Results</span>
                    </div>
                  ) : (
                    filteredRequests.map(req => (
                      <div key={req.id} className="bg-[#f8fafc] border-2 border-transparent hover:border-blue-100 p-6 rounded-[2.5rem] shadow-sm transition-all group relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <Icon path="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                            <p className="text-xs font-black text-slate-800">{req.dateRange}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 py-4 border-t border-slate-200/50">
                          <div className="w-10 h-10 bg-blue-100 rounded-full border-4 border-white shadow-sm flex items-center justify-center font-black text-blue-600 text-xs">{req.name.charAt(0)}</div>
                          <div>
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{req.name}</p>
                            <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">{req.role}</p>
                          </div>
                        </div>
                        
                        {/* ACTIONS */}
                        <div className="mt-4 flex gap-2">
                           {activeTab === 'Pending' && (
                              <>
                                <button onClick={() => handleStatusUpdate(req.id, 'Confirmed')} className="flex-1 bg-blue-100 text-blue-600 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-200">Confirm</button>
                                <button onClick={() => handleStatusUpdate(req.id, 'Rejected')} className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100">Reject</button>
                              </>
                           )}
                           {activeTab === 'Confirmed' && (
                              <button onClick={() => handleCheckIn(req.id)} className="w-full bg-green-500 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-green-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Icon path="M4.5 12.75l6 6 9-13.5" className="w-4 h-4" />
                                Check In User
                              </button>
                           )}
                           {activeTab === 'Present' && (
                              <div className="w-full bg-slate-800 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-center">Checked In</div>
                           )}
                        </div>

                      </div>
                    ))
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

export default Attendance;