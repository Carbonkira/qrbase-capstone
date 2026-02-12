import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code"; 
import api from '../api';

const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>
);

const STORAGE_URL = "http://localhost:8000/storage/";

const ParticipantDash = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [evalModalOpen, setEvalModalOpen] = useState(false); 
  const [joinModalOpen, setJoinModalOpen] = useState(false); 
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const [inviteCode, setInviteCode] = useState(""); 
  
  const [profileData, setProfileData] = useState({ first_name: '', last_name: '' });
  const [eventDetails, setEventDetails] = useState(null); 
  const [formConfig, setFormConfig] = useState({ global: [], speakers: {} });
  const [answers, setAnswers] = useState({});

  useEffect(() => { fetchUser(); fetchTickets(); }, []);

  const fetchUser = async () => {
      try { 
          const res = await api.get('/user'); 
          setUser(res.data); 
          setProfileData({ first_name: res.data.first_name, last_name: res.data.last_name });
      } catch (err) { console.error("Failed to load profile"); }
  };

  const fetchTickets = async () => {
      try { const res = await api.get('/my-tickets'); setMyEvents(res.data); } catch (err) { console.error(err); }
  };

  const handleUpdateProfile = async (e) => {
      e.preventDefault();
      try {
          const res = await api.put('/user/profile', profileData);
          setUser(res.data.user);
          setIsProfileOpen(false);
          alert("Name updated successfully!");
      } catch (err) { alert("Failed to update profile."); }
  };

  const openTicket = (ticket) => { setSelectedEvent(ticket); };
  
  const openEvaluation = async (ticket) => {
      try {
          const res = await api.get(`/events/${ticket.event.id}/form`);
          setEventDetails(res.data);
          let config = { global: [], speakers: {} };
          if (res.data.feedback_form && res.data.feedback_form.questions) {
              try { const parsed = JSON.parse(res.data.feedback_form.questions); if (!Array.isArray(parsed)) config = parsed; } catch (e) { }
          }
          setFormConfig(config); setAnswers({}); setEvalModalOpen(true);
      } catch (err) { 
          if(err.response?.status === 404) alert("Evaluation not active yet."); else alert("Error loading form.");
      }
  };

  const handleAnswerChange = (key, value) => { setAnswers(prev => ({ ...prev, [key]: value })); };
  
  const submitEvaluation = async () => { 
      if (!eventDetails) return; 
      try { 
          await api.post(`/events/${eventDetails.event.id}/feedback`, { responses: answers }); 
          alert("Feedback Submitted!"); 
          setEvalModalOpen(false); 
          fetchTickets(); 
      } catch (err) { alert(err.response?.data?.message || "Submission failed."); } 
  };

  const handleJoinEvent = async (e) => { 
      e.preventDefault(); 
      try { 
          await api.post('/join', { invite_code: inviteCode }); 
          alert("Joined!"); 
          setJoinModalOpen(false); 
          setInviteCode(""); 
          fetchTickets(); 
      } catch (err) { alert(err.response?.data?.message || "Failed."); } 
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const renderStars = (answerKey) => ( <div className="flex gap-2">{[1,2,3,4,5].map(star => (<button key={star} onClick={() => handleAnswerChange(answerKey, star)} className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${answers[answerKey] >= star ? 'bg-yellow-400 text-white' : 'bg-slate-100 text-slate-300'}`}>{star}</button>))}</div> );

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-800 overflow-hidden relative">
      
      {/* HEADER */}
      <header className="flex justify-between items-center px-12 py-6 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-6">
            <h1 className="text-3xl font-black text-[#1e40af] tracking-tight">Overview</h1>
            <button onClick={() => setJoinModalOpen(true)} className="bg-[#1e293b] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 shadow-lg active:scale-95">+ Join Event</button>
        </div>
        <div className="flex items-center gap-6">
            {user && (
                <div onClick={() => setIsProfileOpen(true)} className="flex items-center gap-4 text-right cursor-pointer hover:opacity-80 transition-opacity group">
                    <div className="hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500">Edit Profile</p>
                        <p className="text-lg font-black text-[#1e40af] uppercase leading-none">{user.first_name} {user.last_name}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xl border-2 border-blue-50">{user.first_name.charAt(0)}</div>
                </div>
            )}
            <div className="h-10 w-px bg-slate-100 mx-2"></div>
            <button onClick={handleLogout} className="text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-600 flex items-center gap-2">Log Out <Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></button>
        </div>
      </header>

      {/* EVENT LIST */}
      <main className="flex-1 p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            {myEvents.length === 0 && <div className="col-span-full text-center py-24 opacity-50"><h3 className="text-3xl font-black uppercase text-slate-400">No events yet</h3></div>}
            
            {myEvents.map(ticket => (
                <div key={ticket.id} className="bg-white p-8 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all cursor-pointer border-4 border-transparent hover:border-blue-100 flex flex-col h-full" onClick={() => openTicket(ticket)}>
                    
                    {/* IMAGE */}
                    <div className="h-48 w-full bg-slate-100 rounded-[2rem] mb-6 overflow-hidden relative shadow-inner">
                        {ticket.event.image ? <img src={STORAGE_URL + ticket.event.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-sm uppercase tracking-widest">No Image</div>}
                        <div className="absolute top-4 right-4"><span className="text-xs font-black uppercase tracking-widest bg-white/95 text-blue-600 px-4 py-2 rounded-xl shadow-sm">{ticket.status}</span></div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight mb-2">{ticket.event.title}</h3>
                        <p className="text-sm font-bold text-slate-400 mb-4">{ticket.event.schedule_date} @ {ticket.event.location}</p>
                        
                        <div className="flex flex-col gap-2 mb-6">
                            {/* SHOW ORGANIZER */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest min-w-[80px]">Organized By:</span>
                                <span className="text-xs font-black text-slate-700 uppercase">{ticket.event.organizer ? `${ticket.event.organizer.first_name} ${ticket.event.organizer.last_name}` : "Unknown"}</span>
                            </div>

                            {/* SHOW SPEAKERS & TOPICS ON CARD */}
                            {ticket.event.speakers && ticket.event.speakers.length > 0 && (
                                <div className="flex items-start gap-2 mt-1">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest min-w-[80px] mt-0.5">Speakers:</span>
                                    <div className="flex flex-col gap-1">
                                        {ticket.event.speakers.map(s => (
                                            <div key={s.id} className="flex flex-col">
                                                <span className="text-xs font-black text-slate-700 uppercase leading-none">{s.name}</span>
                                                {/* FIX: Access topic via pivot */}
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.pivot?.topic || s.topic || "Topic TBA"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {ticket.status === 'Present' && (
                        ticket.has_feedback ? 
                        <button disabled className="w-full bg-green-50 text-green-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest cursor-not-allowed border border-green-100 flex items-center justify-center gap-2"><Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />Completed</button> 
                        : <button onClick={(e) => { e.stopPropagation(); openEvaluation(ticket); }} className="w-full bg-[#1e293b] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl active:scale-95">Evaluate</button>
                    )}
                </div>
            ))}
          </div>
      </main>

      {/* JOIN MODAL */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in">
                <h3 className="text-2xl font-black text-[#1e40af] uppercase mb-1 text-center">Join Event</h3>
                <form onSubmit={handleJoinEvent} className="flex flex-col gap-4 mt-6">
                    <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="ENTER CODE" className="bg-[#f1f5f9] p-5 rounded-2xl text-center font-black uppercase tracking-widest text-xl outline-none border-2 border-transparent focus:border-blue-500" autoFocus />
                    <div className="flex gap-2"><button type="button" onClick={() => setJoinModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button><button type="submit" className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600">Join</button></div>
                </form>
            </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in">
                <h3 className="text-2xl font-black text-[#1e40af] uppercase mb-6 text-center">Edit Profile</h3>
                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                    <input placeholder="First Name" value={profileData.first_name} onChange={(e) => setProfileData({...profileData, first_name: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                    <input placeholder="Last Name" value={profileData.last_name} onChange={(e) => setProfileData({...profileData, last_name: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                    <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => setIsProfileOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                        <button type="submit" className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600">Save</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* TICKET DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in relative flex flex-col md:flex-row gap-8 overflow-hidden">
                <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 z-10 text-slate-400 hover:text-red-500 bg-white rounded-full p-2 shadow-sm"><Icon path="M6 18L18 6M6 6l12 12" /></button>
                <div className="flex flex-col items-center justify-center bg-blue-50 p-8 rounded-[2rem] min-w-[240px]">
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4"><QRCode size={160} value={selectedEvent.qr_token || String(selectedEvent.id)} /></div>
                    <div className="text-center">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Ticket ID</p>
                        <p className="text-4xl font-black text-slate-800 tracking-tighter mb-2">#{selectedEvent.id}</p>
                        <div className="bg-blue-100/50 p-2 rounded-lg inline-block"><p className="text-[8px] font-bold text-blue-400 uppercase">Secure Token</p><p className="text-[9px] font-mono text-slate-500 break-all">{selectedEvent.qr_token ? selectedEvent.qr_token.substring(0, 16) + "..." : "LEGACY"}</p></div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="h-32 w-full bg-slate-100 rounded-[1.5rem] mb-6 overflow-hidden">
                        {selectedEvent.event.image ? <img src={STORAGE_URL + selectedEvent.event.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs">No Image</div>}
                    </div>
                    <h2 className="text-3xl font-black text-[#1e40af] uppercase leading-none mb-6">{selectedEvent.event.title}</h2>
                    <div className="space-y-5">
                        <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date</span><span className="text-sm font-bold text-slate-700">{selectedEvent.event.schedule_date}</span></div>
                        <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Location</span><span className="text-sm font-bold text-slate-700">{selectedEvent.event.location}</span></div>
                        
                        {/* SPEAKERS IN MODAL */}
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Speakers</span>
                            <div className="flex flex-wrap gap-2">
                                {selectedEvent.event.speakers && selectedEvent.event.speakers.map(s => (
                                    <div key={s.id} className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                        <span className="text-xs font-black text-slate-700 uppercase block">{s.name}</span>
                                        {/* FIX: Access topic via pivot */}
                                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">{s.pivot?.topic || s.topic || "Topic TBA"}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* EVALUATION MODAL */}
      {evalModalOpen && eventDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl p-10 animate-in zoom-in">
                <h3 className="text-3xl font-black text-[#1e40af] uppercase mb-8 text-center">Feedback</h3>
                <div className="space-y-10">
                    {formConfig.global && formConfig.global.length > 0 && (<div><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">General Questions</h4>{formConfig.global.map((q, idx) => (<div key={idx} className="mb-8"><p className="text-lg font-bold text-slate-800 mb-3">{q.text}</p>{q.type === 'rating' ? renderStars(`global_${idx}`) : <textarea onChange={(e) => handleAnswerChange(`global_${idx}`, e.target.value)} className="w-full bg-[#f1f5f9] p-4 rounded-xl text-sm font-bold outline-none h-24 resize-none" placeholder="Your answer..." />}</div>))}</div>)}
                    
                    {eventDetails.speakers.map(s => {
                        const speakerQuestions = formConfig.speakers?.[s.id] || [];
                        if (speakerQuestions.length === 0) return null;
                        return (
                            <div key={s.id}>
                                <div className="flex items-center gap-4 mb-4 border-b-2 border-slate-100 pb-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-sm">{s.name.charAt(0)}</div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.name}</h4>
                                        {/* FIX: Access topic via pivot for Feedback Form */}
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Topic: {s.pivot?.topic || s.topic || "General"}</p>
                                    </div>
                                </div>
                                {speakerQuestions.map((q, idx) => (
                                    <div key={idx} className="mb-8 pl-6 border-l-4 border-slate-100">
                                        <p className="text-lg font-bold text-slate-800 mb-3">{q.text}</p>
                                        {q.type === 'rating' ? renderStars(`speaker_${s.id}_${idx}`) : <textarea onChange={(e) => handleAnswerChange(`speaker_${s.id}_${idx}`, e.target.value)} className="w-full bg-[#f1f5f9] p-4 rounded-xl text-sm font-bold outline-none h-24 resize-none" placeholder="Your answer..." />}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                    <div><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Additional Comments</h4><textarea onChange={(e) => handleAnswerChange('final_comments', e.target.value)} className="w-full bg-[#f1f5f9] p-4 rounded-xl text-sm font-bold outline-none h-24 resize-none" placeholder="Any other thoughts?" /></div>
                </div>
                <div className="flex gap-4 mt-10 pt-8 border-t border-slate-100"><button onClick={() => setEvalModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200">Cancel</button><button onClick={submitEvaluation} className="flex-1 bg-[#1e293b] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 shadow-xl">Submit Feedback</button></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantDash;