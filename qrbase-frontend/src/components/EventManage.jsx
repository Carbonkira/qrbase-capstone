import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import api from '../api';

const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>
);

const STORAGE_URL = "http://localhost:8000/storage/";

const EventManage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [profileData, setProfileData] = useState({ first_name: '', last_name: '' }); 
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });

  const [speakerForm, setSpeakerForm] = useState({ id: null, name: '', specialization: '', topic: '', contact_email: '', description: '', photo: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInData, setWalkInData] = useState({ first_name: '', last_name: '', email: '' });

  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participantForm, setParticipantForm] = useState({ position: '', status: 'Unpaid', proof: '' });

  const [addMode, setAddMode] = useState('existing'); 
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [availableSpeakers, setAvailableSpeakers] = useState([]);
  const [evalConfig, setEvalConfig] = useState({ global: [], speakers: {} });
  const [isFormLocked, setIsFormLocked] = useState(false); 
  const [selectedFeedbackUser, setSelectedFeedbackUser] = useState(null); 
  const [selectedSpeaker, setSelectedSpeaker] = useState(null); 
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true); 
  const [manualCode, setManualCode] = useState(""); 

  useEffect(() => { fetchUser(); fetchData(); }, [id]);

  const fetchUser = async () => {
      try { 
          const res = await api.get('/user'); 
          setUser(res.data); 
          localStorage.setItem('user', JSON.stringify(res.data));
          setProfileData({ first_name: res.data.first_name, last_name: res.data.last_name });
      } catch (err) { console.error("Failed to load profile"); }
  };

  const fetchData = async () => {
    try {
        const res = await api.get(`/events/${id}/module`);
        setData(res.data);
        setAvailableSpeakers(res.data.available_speakers || []);
        if (res.data.feedback_form && res.data.feedback_form.questions) {
            try {
                const parsed = JSON.parse(res.data.feedback_form.questions);
                setEvalConfig(Array.isArray(parsed) ? { global: parsed, speakers: {} } : parsed);
                setIsFormLocked(true); 
            } catch (e) { setEvalConfig({ global: [], speakers: {} }); }
        }
        setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleUpdateProfile = async (e) => {
      e.preventDefault();
      try { await api.put('/user/profile', profileData); setUser(res.data.user); setIsProfileOpen(false); alert("Profile updated!"); } 
      catch (err) { alert("Failed to update profile."); }
  };

  const handleChangePassword = async (e) => {
      e.preventDefault();
      if (passwordData.new_password !== passwordData.new_password_confirmation) return alert("Mismatch!");
      try { await api.put('/user/password', passwordData); alert("Password changed!"); setIsPasswordMode(false); setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' }); } 
      catch (err) { alert(err.response?.data?.message || "Failed."); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const handleWalkInSubmit = async (e) => {
      e.preventDefault();
      try {
          const res = await api.post(`/events/${id}/walk-in`, walkInData);
          if (res.data.temp_password) alert(`Registered!\nEmail: ${res.data.user.email}\nPW: ${res.data.temp_password}`);
          else alert("Registered (Account existed).");
          setIsWalkInOpen(false); setWalkInData({ first_name: '', last_name: '', email: '' }); fetchData(); 
      } catch (err) { alert(err.response?.data?.message || "Failed."); }
  };

  const handleEditParticipantClick = (reg) => {
      setSelectedParticipant(reg);
      setParticipantForm({
          position: reg.position || '', 
          status: reg.payment_status || 'Unpaid',
          proof: reg.proof_of_payment || ''
      });
  };

  const handleSaveParticipant = async (e) => {
      e.preventDefault();
      try {
          await api.put(`/attendance-requests/${selectedParticipant.id}`, {
              position: participantForm.position, 
              payment_status: participantForm.status,
              proof_of_payment: participantForm.proof
          });
          alert("Details updated!");
          setSelectedParticipant(null);
          fetchData();
      } catch (err) { alert("Failed to update."); }
  };

  const handleEditSpeaker = (s, e) => { e.stopPropagation(); setSpeakerForm({ id: s.id, name: s.name, specialization: s.specialization, topic: s.pivot?.topic || s.topic || '', contact_email: s.contact_email || '', description: s.description || '', photo: null }); setAddMode('new'); document.getElementById('speaker-form-container')?.scrollIntoView({ behavior: 'smooth' }); };
  const cancelEditSpeaker = () => { setSpeakerForm({ id: null, name: '', specialization: '', topic: '', contact_email: '', description: '', photo: null }); setSelectedExistingId(''); };
  
  const handleAttachExisting = async () => {
    if(!selectedExistingId) return alert("Select a speaker first");
    const speakerToAttach = availableSpeakers.find(s => s.id == selectedExistingId);
    if(!speakerToAttach) return;
    const formData = new FormData();
    formData.append('event_id', id);
    formData.append('topic', speakerForm.topic || 'Guest Speaker');
    formData.append('name', speakerToAttach.name);
    formData.append('specialization', speakerToAttach.specialization);
    formData.append('_method', 'PUT'); 
    try { await api.post(`/speakers/${selectedExistingId}`, formData); alert("Speaker Attached!"); cancelEditSpeaker(); fetchData(); } catch (err) { alert("Failed to attach."); }
  };

  const handleSaveSpeaker = async () => {
      if (!speakerForm.name) return alert("Name is required");
      const formData = new FormData();
      formData.append('event_id', id);
      formData.append('name', speakerForm.name);
      formData.append('specialization', speakerForm.specialization);
      formData.append('topic', speakerForm.topic);
      formData.append('contact_email', speakerForm.contact_email);
      formData.append('description', speakerForm.description);
      if(speakerForm.photo) formData.append('photo', speakerForm.photo);
      try {
        if (speakerForm.id) {
            formData.append('_method', 'PUT'); 
            await api.post(`/speakers/${speakerForm.id}`, formData, { headers: {'Content-Type': 'multipart/form-data'} });
            alert("Speaker Updated!");
        } else {
            await api.post('/speakers', formData, { headers: {'Content-Type': 'multipart/form-data'} });
            alert("Speaker Added!");
        }
        cancelEditSpeaker(); fetchData();
      } catch (err) { alert(err.response?.data?.message || "Operation failed."); }
  };

  const handleDeleteSpeaker = async (speakerId) => { if(confirm("Remove this speaker from the event?")) { await api.delete(`/speakers/${speakerId}`); fetchData(); } };

  const handleUpdateStatus = async (regId, status) => { try { await api.put(`/attendance-requests/${regId}`, { status }); fetchData(); } catch (err) { alert("Failed."); } };
  const handleExportCSV = async () => { try { const response = await api.get(`/events/${id}/export`, { responseType: 'blob' }); const url = window.URL.createObjectURL(new Blob([response.data])); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `Event_${id}_Report.csv`); document.body.appendChild(link); link.click(); } catch (err) { alert("Failed."); } };
  const processScan = async (code) => { try { const res = await api.post(`/events/${id}/scan`, { code }); setScanResult({ success: true, message: res.data.message, user: res.data.user }); setIsScanning(false); fetchData(); } catch (err) { setScanResult({ success: false, message: err.response?.data?.message || "Scan Failed" }); } };
  const handleWebcamScan = (result) => { if (result) processScan(result[0].rawValue); };
  const handleManualSubmit = (e) => { e.preventDefault(); if(manualCode) processScan(manualCode); };
  const resetScan = () => { setScanResult(null); setIsScanning(true); setManualCode(""); };

  const getFilteredAttendees = () => {
      if (!data || !data.attendees) return [];
      return data.attendees.filter(u => {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = u.user.first_name.toLowerCase().includes(searchLower) || u.user.last_name.toLowerCase().includes(searchLower) || u.user.email.toLowerCase().includes(searchLower);
          let matchesStatus = true;
          if (statusFilter !== 'All') {
              if (statusFilter === 'Paid') matchesStatus = u.payment_status === 'Paid';
              else if (statusFilter === 'Unpaid') matchesStatus = u.payment_status !== 'Paid';
              else matchesStatus = u.status === statusFilter;
          }
          return matchesSearch && matchesStatus;
      });
  };
  const filteredAttendees = getFilteredAttendees();

  const addQuestion = (target, speakerId = null) => { if(isFormLocked) return; const newQuestion = { id: Date.now(), type: 'rating', text: '' }; if (target === 'global') { setEvalConfig({ ...evalConfig, global: [...evalConfig.global, newQuestion] }); } else if (target === 'speaker' && speakerId) { const currentQuestions = evalConfig.speakers[speakerId] || []; setEvalConfig({ ...evalConfig, speakers: { ...evalConfig.speakers, [speakerId]: [...currentQuestions, newQuestion] } }); } };
  const updateQuestion = (target, index, field, value, speakerId = null) => { if(isFormLocked) return; if (target === 'global') { const updated = [...evalConfig.global]; updated[index][field] = value; setEvalConfig({ ...evalConfig, global: updated }); } else if (target === 'speaker' && speakerId) { const updated = [...(evalConfig.speakers[speakerId] || [])]; updated[index][field] = value; setEvalConfig({ ...evalConfig, speakers: { ...evalConfig.speakers, [speakerId]: updated } }); } };
  const removeQuestion = (target, index, speakerId = null) => { if(isFormLocked) return; if (target === 'global') { const updated = evalConfig.global.filter((_, i) => i !== index); setEvalConfig({ ...evalConfig, global: updated }); } else if (target === 'speaker' && speakerId) { const updated = evalConfig.speakers[speakerId].filter((_, i) => i !== index); setEvalConfig({ ...evalConfig, speakers: { ...evalConfig.speakers, [speakerId]: updated } }); } };
  const handleSaveForm = async () => { try { await api.post(`/events/${id}/feedback-form`, { questions: evalConfig }); setIsFormLocked(true); alert("Form Saved!"); } catch (err) { alert("Failed to save."); } };
  const getQuestionDetails = (key) => { const parts = key.split('_'); if (parts[0] === 'global') { const index = parseInt(parts[1]); return { label: evalConfig.global[index]?.text || "Unknown Question", type: evalConfig.global[index]?.type }; } if (parts[0] === 'speaker') { const speakerId = parts[1]; const index = parseInt(parts[2]); const speakerName = data.speakers.find(s => s.id == speakerId)?.name || "Unknown Speaker"; const qText = evalConfig.speakers[speakerId]?.[index]?.text || "Unknown Question"; return { label: `[${speakerName}] ${qText}`, type: evalConfig.speakers[speakerId]?.[index]?.type }; } if (key === 'final_comments') return { label: "Final Comments", type: 'text' }; return { label: key, type: 'text' }; };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 text-xl">LOADING MODULE...</div>;
  if (!data) return <div className="p-10 text-center text-red-400 font-bold text-xl">Event Not Found</div>;

  const { event, stats, speakers } = data;

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-800 relative">
      <header className="flex justify-between items-center px-12 py-6 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <div><button onClick={() => navigate('/events')} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 mb-1">← Back to Events</button><h1 className="text-4xl font-bold text-[#1e40af] uppercase tracking-tight">{event.title}</h1><div className="mt-2 flex items-center gap-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invite Code:</span><span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{event.invite_code}</span></div></div>
        <div className="flex items-center gap-6">
            <div className="flex gap-4">{['Overview', 'Attendance', 'Speakers', 'Evaluation', 'Scanner'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#1e293b] text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-white'}`}>{tab}</button>))}</div>
            <div className="h-10 w-px bg-slate-100 mx-2"></div>
            {user && (<div onClick={() => setIsProfileOpen(true)} className="flex items-center gap-4 text-right cursor-pointer hover:opacity-80 transition-opacity group"><div className="hidden sm:block"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500">Edit Profile</p><p className="text-lg font-bold text-[#1e40af] uppercase leading-none">{user.first_name} {user.last_name}</p></div><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-blue-50">{user.first_name.charAt(0)}</div></div>)}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
            
            {/* OVERVIEW TAB - RESTORED TO DETAILED VERSION */}
            {activeTab === 'Overview' && (
                 <div className="space-y-10">
                     <div className="bg-white p-10 rounded-[3rem] shadow-xl flex flex-col md:flex-row gap-10">
                        <div className="w-full md:w-1/3 h-64 bg-slate-100 rounded-[2rem] overflow-hidden">
                            {event.image ? <img src={STORAGE_URL + event.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">No Image</div>}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-4xl font-black text-[#1e40af] uppercase mb-4">{event.title}</h2>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Date</p><p className="text-xl font-bold text-slate-800">{event.schedule_date}</p></div>
                                <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</p><p className="text-xl font-bold text-slate-800">{event.location}</p></div>
                            </div>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">{event.description || "No description provided."}</p>
                        </div>
                     </div>
                     
                     <div className="bg-white p-10 rounded-[3rem] shadow-xl">
                        <h3 className="text-2xl font-black text-[#1e40af] uppercase mb-8">Event Statistics</h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                                <span className="block text-4xl font-black text-slate-800 mb-1">{stats.total_registered}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Registered</span>
                            </div>
                            <div className="p-6 bg-green-50 rounded-3xl border border-green-100 text-center">
                                <span className="block text-4xl font-black text-green-600 mb-1">{stats.total_present}</span>
                                <span className="text-[10px] font-black text-green-600/60 uppercase tracking-widest">Attended</span>
                            </div>
                            <div className="p-6 bg-red-50 rounded-3xl border border-red-100 text-center">
                                <span className="block text-4xl font-black text-red-600 mb-1">{stats.total_no_show}</span>
                                <span className="text-[10px] font-black text-red-600/60 uppercase tracking-widest">No Show</span>
                            </div>
                            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                                <span className="block text-4xl font-black text-blue-600 mb-1">{stats.total_paid}</span>
                                <span className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">Paid Participants</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-[#1e293b] rounded-3xl text-white flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Available Slots</p>
                                    <p className="text-4xl font-black">
                                        {Math.max(0, stats.capacity - (stats.slots_taken || 0))} <span className="text-lg text-slate-500">/ {stats.capacity}</span>
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-2">*Counts Paid/Confirmed only</p>
                                </div>
                                <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center font-black text-xl">
                                    {Math.round(((stats.slots_taken || 0) / stats.capacity) * 100)}%
                                </div>
                            </div>
                            <div className="p-8 bg-orange-50 rounded-3xl text-orange-900 flex justify-between items-center border border-orange-100">
                                <div>
                                    <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">Waitlist Status</p>
                                    <p className="text-4xl font-black text-orange-600">
                                        {stats.waitlist_count || 0} <span className="text-lg text-orange-400/60">/ {stats.waitlist_cap || 0}</span>
                                    </p>
                                    <p className="text-[10px] text-orange-400 mt-2">Cap is 10% of Total Slots</p>
                                </div>
                                <Icon path="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" className="w-12 h-12 text-orange-300" />
                            </div>
                        </div>
                     </div>
                 </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === 'Attendance' && (
                <div className="bg-white rounded-[3rem] shadow-xl p-10 min-h-[600px]">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h3 className="font-bold text-2xl text-[#1e40af] uppercase">Participant List</h3>
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="bg-slate-50 flex items-center px-4 py-3 rounded-2xl border border-slate-200"><Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-4 h-4 text-slate-400" /><input placeholder="Search name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent outline-none text-xs font-bold ml-3 w-40 md:w-64" /></div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold uppercase outline-none cursor-pointer hover:bg-slate-100"><option value="All">All Status</option><option value="Present">Present</option><option value="Absent">Absent</option><option value="Pending">Pending</option><option value="Waitlisted">Waitlisted</option><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option></select>
                            <button onClick={() => setIsWalkInOpen(true)} className="bg-[#1e293b] text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-blue-600 shadow-lg active:scale-95">+ Add Walk-in</button>
                            <button onClick={handleExportCSV} className="bg-green-50 text-green-600 px-4 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-green-100 border border-green-100" title="Export CSV"><Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b-2 border-slate-100"><th className="p-5 text-xs font-bold text-slate-400 uppercase">Participant</th><th className="p-5 text-xs font-bold text-slate-400 uppercase">Position</th><th className="p-5 text-xs font-bold text-slate-400 uppercase">Status</th><th className="p-5 text-xs font-bold text-slate-400 uppercase">Payment</th><th className="p-5 text-xs font-bold text-slate-400 uppercase text-right">Actions</th></tr></thead>
                            <tbody>
                                {filteredAttendees.length === 0 ? (<tr><td colSpan="5" className="p-10 text-center text-slate-300 font-bold uppercase">No participants found</td></tr>) : (
                                    filteredAttendees.map(u => (
                                        <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="p-5 font-bold text-slate-700 text-sm">{u.user.first_name} {u.user.last_name}<div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{u.user.email}</div></td>
                                            <td className="p-5"><span className="text-xs font-bold text-slate-600 uppercase">{u.position || "-"}</span></td>
                                            <td className="p-5"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${u.status === 'Present' ? 'bg-green-100 text-green-600' : u.status === 'Absent' ? 'bg-red-50 text-red-500' : u.status === 'Waitlisted' ? 'bg-orange-50 text-orange-500' : 'bg-slate-100 text-slate-500'}`}>{u.status}</span></td>
                                            <td className="p-5"><div className="flex flex-col gap-1"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase w-fit ${u.payment_status === 'Paid' || u.payment_status === 'Free' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>{u.payment_status}</span>{u.proof_of_payment && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[150px] truncate">Ref: {u.proof_of_payment}</span>}</div></td>
                                            <td className="p-5 flex justify-end gap-2">
                                                <button onClick={() => handleUpdateStatus(u.id, 'Present')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-200" title="Mark Present">✓</button>
                                                <button onClick={() => handleUpdateStatus(u.id, 'Absent')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-200" title="Mark Absent">✕</button>
                                                <button onClick={() => handleEditParticipantClick(u)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-200" title="Edit Details"><Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" className="w-4 h-4" /></button>
                                                {u.feedback && <button onClick={() => setSelectedFeedbackUser(u)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-200" title="View Feedback">?</button>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'Speakers' && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 <div id="speaker-form-container" className={`bg-white rounded-[3rem] shadow-xl p-10 h-fit border-2 ${speakerForm.id ? 'border-blue-200 bg-blue-50/50' : 'border-slate-50'}`}>
                     <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl text-[#1e40af] uppercase">Manage Speakers</h3></div>
                     <div className="flex bg-slate-100 p-1 rounded-xl mb-6"><button onClick={() => { setAddMode('existing'); cancelEditSpeaker(); }} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${addMode === 'existing' && !speakerForm.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Select Existing</button><button onClick={() => { setAddMode('new'); cancelEditSpeaker(); }} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${addMode === 'new' || speakerForm.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Create / Edit</button></div>
                     <div className="flex flex-col gap-4">
                         {addMode === 'existing' && !speakerForm.id && (<><select value={selectedExistingId} onChange={(e) => setSelectedExistingId(e.target.value)} className="bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-slate-100 focus:border-blue-500"><option value="">-- Select From Roster --</option>{availableSpeakers.filter(s => !speakers.find(evS => evS.id === s.id)).map(s => <option key={s.id} value={s.id}>{s.name} - {s.specialization}</option>)}</select><div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Topic for this Event</label><input placeholder="e.g. Opening Remarks" value={speakerForm.topic} onChange={e => setSpeakerForm({...speakerForm, topic: e.target.value})} className="bg-white p-4 rounded-2xl text-sm font-bold outline-none border-2 border-blue-100 focus:border-blue-500 shadow-sm" /></div><button onClick={handleAttachExisting} className="bg-[#1e293b] text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest mt-2 hover:bg-blue-600 shadow-lg transition-all active:scale-95">Attach Speaker</button></>)}
                         {(addMode === 'new' || speakerForm.id) && (<>{speakerForm.id && <div className="flex justify-between items-center bg-blue-100 p-3 rounded-xl mb-2"><span className="text-[10px] font-bold text-blue-600 uppercase">Editing: {speakerForm.name}</span><button onClick={cancelEditSpeaker} className="text-[10px] font-bold text-red-500 uppercase">Cancel</button></div>}<input placeholder="Name" value={speakerForm.name} onChange={e => setSpeakerForm({...speakerForm, name: e.target.value})} className="bg-white p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500 shadow-sm" /><input placeholder="Role / Title" value={speakerForm.specialization} onChange={e => setSpeakerForm({...speakerForm, specialization: e.target.value})} className="bg-white p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500 shadow-sm" /><div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Topic / Session Title</label><input placeholder="e.g. The Future of AI" value={speakerForm.topic} onChange={e => setSpeakerForm({...speakerForm, topic: e.target.value})} className="bg-white p-4 rounded-2xl text-sm font-bold outline-none border-2 border-blue-200 focus:border-blue-500 shadow-sm" /></div><input placeholder="Contact Email" value={speakerForm.contact_email} onChange={e => setSpeakerForm({...speakerForm, contact_email: e.target.value})} className="bg-white p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500 shadow-sm" /><textarea placeholder="Description" value={speakerForm.description} onChange={e => setSpeakerForm({...speakerForm, description: e.target.value})} className="bg-white p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500 h-28 resize-none shadow-sm" /><input type="file" onChange={e => setSpeakerForm({...speakerForm, photo: e.target.files[0]})} className="text-xs font-bold text-slate-500" /><button onClick={handleSaveSpeaker} className={`py-4 rounded-2xl font-bold text-sm uppercase tracking-widest mt-2 shadow-lg transition-all active:scale-95 ${speakerForm.id ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#1e293b] text-white hover:bg-black'}`}>{speakerForm.id ? "Update Speaker" : "Create & Add"}</button></>)}
                     </div>
                 </div>
                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 h-fit">{speakers.length === 0 && <div className="col-span-2 text-center text-slate-300 font-bold uppercase py-10">No speakers attached.</div>}{speakers.map(s => (<div key={s.id} onClick={() => setSelectedSpeaker(s)} className={`bg-white p-8 rounded-[3rem] shadow-lg flex gap-6 items-center border relative group cursor-pointer transition-all ${speakerForm.id === s.id ? 'border-blue-400 ring-4 ring-blue-100' : 'border-slate-50 hover:border-blue-200'}`}><div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => handleEditSpeaker(s, e)} className="text-blue-300 hover:text-blue-600 bg-blue-50 p-2 rounded-lg"><Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); handleDeleteSpeaker(s.id); }} className="text-red-300 hover:text-red-600 bg-red-50 p-2 rounded-lg"><Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" className="w-4 h-4" /></button></div><div className="w-20 h-20 bg-slate-200 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-blue-500 font-bold text-2xl">{s.photo_path ? <img src={STORAGE_URL + s.photo_path} alt={s.name} className="w-full h-full object-cover" /> : s.name.charAt(0)}</div><div className="flex-1 min-w-0"><h4 className="font-bold text-lg text-slate-800 truncate">{s.name}</h4><p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate mb-2">{s.specialization}</p><div className="bg-blue-50 px-3 py-1 rounded-lg inline-block border border-blue-100"><p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest truncate max-w-[120px]">Topic: {s.pivot?.topic || s.topic || "TBA"}</p></div></div></div>))}</div></div>
            )}

            {activeTab === 'Evaluation' && (
                <div className="space-y-8">
                    {isFormLocked ? (
                        <div className="bg-white rounded-[3rem] shadow-xl p-12 text-center">
                            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8"><Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-12 h-12" /></div>
                            <h3 className="text-3xl font-bold text-slate-800 uppercase mb-4">Form is Active</h3>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-10">The evaluation form has been created and is locked for editing.</p>
                            
                            <div className="bg-slate-50 p-8 rounded-[2rem] text-left max-w-2xl mx-auto border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-3">Configured Questions</h4>
                                <ul className="space-y-4 text-sm font-bold text-slate-600">
                                    {evalConfig.global.map((q, i) => (
                                        <li key={i}>• {q.text} <span className="text-slate-400">({q.type})</span></li>
                                    ))}
                                    {Object.keys(evalConfig.speakers).map(sid => {
                                        const sObj = speakers.find(s => s.id == sid);
                                        const sName = sObj?.name || "Unknown";
                                        const sTopic = sObj?.pivot?.topic || sObj?.topic || "General";
                                        return evalConfig.speakers[sid].map((q, i) => (
                                            <li key={`${sid}_${i}`} className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-blue-600 uppercase tracking-wider text-xs bg-blue-50 px-2 py-0.5 rounded">[{sName}]</span>
                                                    <span className="text-slate-400 text-[10px] uppercase tracking-widest">Topic: {sTopic}</span>
                                                </div>
                                                <span className="ml-2">{q.text} <span className="text-slate-400 text-xs">({q.type})</span></span>
                                            </li>
                                        ));
                                    })}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-[3rem] shadow-xl p-10">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                    <div><h3 className="font-bold text-2xl text-[#1e40af] uppercase">General Event Questions</h3></div>
                                    <button onClick={() => addQuestion('global')} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-100">+ Add</button>
                                </div>
                                <div className="space-y-4">
                                    {evalConfig.global.map((q, idx) => (
                                        <div key={idx} className="flex gap-4 items-center bg-[#f8fafc] p-4 rounded-2xl border border-slate-100">
                                            <select value={q.type} onChange={(e) => updateQuestion('global', idx, 'type', e.target.value)} className="bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase p-3 outline-none"><option value="rating">Rating (1-5)</option><option value="text">Text Answer</option></select>
                                            <input value={q.text} onChange={(e) => updateQuestion('global', idx, 'text', e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300" placeholder="Enter Question..." />
                                            <button onClick={() => removeQuestion('global', idx)} className="text-red-300 hover:text-red-500 font-bold px-3">X</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-[3rem] shadow-xl p-10">
                                <div className="mb-8 border-b border-slate-100 pb-6"><h3 className="font-bold text-2xl text-[#1e40af] uppercase">Speaker Specific Questions</h3></div>
                                <div className="grid grid-cols-1 gap-8">
                                    {speakers.map(s => (
                                        <div key={s.id} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg text-slate-700 uppercase">{s.name}</span>
                                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Topic: {s.pivot?.topic || s.topic || "TBA"}</span>
                                                </div>
                                                <button onClick={() => addQuestion('speaker', s.id)} className="bg-white text-slate-400 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-200">+ Add</button>
                                            </div>
                                            <div className="space-y-3">
                                                {(evalConfig.speakers[s.id] || []).map((q, idx) => (
                                                    <div key={idx} className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-slate-200">
                                                        <select value={q.type} onChange={(e) => updateQuestion('speaker', idx, 'type', e.target.value, s.id)} className="bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase p-3 outline-none"><option value="rating">Rating</option><option value="text">Text</option></select>
                                                        <input value={q.text} onChange={(e) => updateQuestion('speaker', idx, 'text', e.target.value, s.id)} className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700" />
                                                        <button onClick={() => removeQuestion('speaker', idx, s.id)} className="text-red-300 hover:text-red-500 font-bold px-3">X</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleSaveForm} className="w-full bg-[#1e293b] text-white py-5 rounded-[2rem] font-bold text-sm uppercase tracking-widest hover:bg-blue-800 shadow-xl transition-all active:scale-95">Save & Lock Configuration</button>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'Scanner' && (
                 <div className="bg-white rounded-[3rem] shadow-xl p-12 flex flex-col items-center min-h-[600px]">
                 <h3 className="text-3xl font-bold text-[#1e40af] uppercase mb-10">Ticket Scanner</h3>
                 {!scanResult ? (
                    <div className="flex flex-col items-center w-full max-w-md gap-10">
                        <div className="w-72 h-72 bg-black rounded-[2.5rem] overflow-hidden relative shadow-2xl border-4 border-slate-200">
                            {isScanning ? <Scanner onScan={handleWebcamScan} components={{ audio: false, finder: false }} styles={{ container: { width: "100%", height: "100%" }}} /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">Paused</div>}
                        </div>
                        <div className="w-full h-px bg-slate-100 relative my-2"><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs font-bold text-slate-300 uppercase tracking-widest">OR ENTER MANUALLY</span></div>
                        <form onSubmit={handleManualSubmit} className="flex w-full gap-3">
                            <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Ticket ID or Token" className="flex-1 bg-slate-50 p-5 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                            <button type="submit" className="bg-[#1e293b] text-white px-8 rounded-2xl font-bold uppercase text-xs">Check In</button>
                        </form>
                    </div>
                ) : (
                    <div className={`p-10 rounded-[2.5rem] text-center w-full max-w-sm animate-in zoom-in ${scanResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${scanResult.success ? 'bg-green-200' : 'bg-red-200'}`}><Icon path={scanResult.success ? "M4.5 12.75l6 6 9-13.5" : "M6 18L18 6M6 6l12 12"} className="w-12 h-12" /></div>
                        <h4 className="text-3xl font-bold uppercase mb-3">{scanResult.success ? "Verified!" : "Error"}</h4>
                        <p className="font-bold text-lg opacity-80">{scanResult.message}</p>
                        {scanResult.user && <div className="mt-6 bg-white/50 p-6 rounded-2xl"><p className="text-xs font-bold uppercase tracking-widest opacity-50">Participant</p><p className="text-xl font-bold">{scanResult.user.first_name} {scanResult.user.last_name}</p></div>}
                        <button onClick={resetScan} className="mt-10 bg-[#1e293b] text-white w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black shadow-lg">Scan Next</button>
                    </div>
                )}
            </div>
            )}

            {/* --- PARTICIPANT DETAILS MODAL --- */}
            {selectedParticipant && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in">
                        <h3 className="text-2xl font-bold text-[#1e40af] uppercase mb-1 text-center">Participant Details</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase text-center mb-6">{selectedParticipant.user.first_name} {selectedParticipant.user.last_name}</p>
                        
                        <form onSubmit={handleSaveParticipant} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Position / Affiliation</label>
                                <input placeholder="e.g. Student, Faculty, Guest" value={participantForm.position} onChange={(e) => setParticipantForm({...participantForm, position: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Payment Status</label>
                                <select value={participantForm.status} onChange={(e) => setParticipantForm({...participantForm, status: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500">
                                    <option value="Unpaid">Unpaid</option><option value="Paid">Paid</option><option value="Pending">Pending</option><option value="Free">Free</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Proof of Transaction / Ref No.</label>
                                <input placeholder="e.g. GCash Ref No. 123456" value={participantForm.proof} onChange={(e) => setParticipantForm({...participantForm, proof: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setSelectedParticipant(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- WALK-IN MODAL --- */}
            {isWalkInOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in">
                        <h3 className="text-2xl font-bold text-[#1e40af] uppercase mb-2 text-center">Register Walk-in</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase text-center mb-6">Creates account & Marks as Paid/Present</p>
                        <form onSubmit={handleWalkInSubmit} className="flex flex-col gap-3">
                            <input placeholder="First Name" required value={walkInData.first_name} onChange={(e) => setWalkInData({...walkInData, first_name: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                            <input placeholder="Last Name" required value={walkInData.last_name} onChange={(e) => setWalkInData({...walkInData, last_name: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                            <input placeholder="Email Address" type="email" required value={walkInData.email} onChange={(e) => setWalkInData({...walkInData, email: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                            <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsWalkInOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200">Cancel</button><button type="submit" className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl">Register</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 1: FEEDBACK ANSWERS --- */}
            {selectedFeedbackUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl p-10 animate-in zoom-in relative">
                        <button onClick={() => setSelectedFeedbackUser(null)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><Icon path="M6 18L18 6M6 6l12 12" /></button>
                        <div className="text-center mb-10">
                            <h3 className="text-2xl font-bold text-[#1e40af] uppercase">Participant Feedback</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">By: {selectedFeedbackUser.user.first_name} {selectedFeedbackUser.user.last_name}</p>
                        </div>
                        <div className="space-y-6">
                            {Object.entries(selectedFeedbackUser.feedback || {}).map(([key, answer]) => {
                                const details = getQuestionDetails(key);
                                return (
                                    <div key={key} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{details.label}</p>
                                        <p className="text-base font-bold text-slate-800">{details.type === 'rating' ? `★ ${answer} / 5` : answer}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: SPEAKER DETAILS --- */}
            {selectedSpeaker && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 animate-in zoom-in relative">
                        <button onClick={() => setSelectedSpeaker(null)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><Icon path="M6 18L18 6M6 6l12 12" /></button>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-32 h-32 bg-slate-100 rounded-full mb-8 overflow-hidden border-4 border-white shadow-lg">
                                {selectedSpeaker.photo_path ? (
                                    <img src={STORAGE_URL + selectedSpeaker.photo_path} alt={selectedSpeaker.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-4xl">{selectedSpeaker.name.charAt(0)}</div>
                                )}
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 uppercase tracking-tight">{selectedSpeaker.name}</h3>
                            <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-1">{selectedSpeaker.specialization}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Topic: {selectedSpeaker.topic || selectedSpeaker.pivot?.topic || "TBA"}</p>
                            <div className="w-full h-px bg-slate-100 mb-8"></div>
                            <div className="text-left w-full bg-slate-50 p-8 rounded-3xl border border-slate-100 max-h-48 overflow-y-auto">
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedSpeaker.description || "No description provided."}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* EDIT PROFILE / PASSWORD MODAL */}
            {isProfileOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-[#1e40af] uppercase text-center flex-1">{isPasswordMode ? "Change Password" : "Edit Profile"}</h3>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                            <button onClick={() => setIsPasswordMode(false)} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${!isPasswordMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Profile</button>
                            <button onClick={() => setIsPasswordMode(true)} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${isPasswordMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Security</button>
                        </div>
                        {isPasswordMode ? (
                            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                                <input type="password" placeholder="Current Password" value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                                <input type="password" placeholder="New Password" value={passwordData.new_password} onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                                <input type="password" placeholder="Confirm New Password" value={passwordData.new_password_confirmation} onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                                <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsProfileOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200">Cancel</button><button type="submit" className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600">Update</button></div>
                            </form>
                        ) : (
                            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                                <input placeholder="First Name" value={profileData.first_name} onChange={(e) => setProfileData({...profileData, first_name: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                                <input placeholder="Last Name" value={profileData.last_name} onChange={(e) => setProfileData({...profileData, last_name: e.target.value})} className="bg-[#f1f5f9] p-4 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" />
                                <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsProfileOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200">Cancel</button><button type="submit" className="flex-1 bg-[#1e293b] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600">Save</button></div>
                            </form>
                        )}
                        <button onClick={handleLogout} className="w-full text-center mt-6 text-xs font-bold text-red-400 uppercase tracking-widest hover:text-red-600">Log Out</button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default EventManage;