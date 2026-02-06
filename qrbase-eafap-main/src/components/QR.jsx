import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../api';

const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const QR = () => {
  const navigate = useNavigate();
  const [scanStep, setScanStep] = useState('initial');
  const [scannedData, setScannedData] = useState(null);

  // Auto-transition for visual effects
  useEffect(() => {
    if (scanStep === 'verified') {
      const timer = setTimeout(() => setScanStep('success'), 1200);
      return () => clearTimeout(timer);
    }
  }, [scanStep]);

  const handleScan = async (result) => {
    if (result && result.length > 0) {
      const qrValue = result[0].rawValue;
      
      try {
        setScanStep('verifying'); // Visual loading state
        
        // Call Backend to Mark Attendance
        const response = await api.post('/attendance/scan', {
          qr_code: qrValue
        });

        // If success:
        setScannedData(response.data.message); // e.g. "Checked in: John Doe"
        setScanStep('verified');

      } catch (error) {
        console.error(error);
        alert("Scan Failed: " + (error.response?.data?.message || "Invalid QR Code"));
        setScanStep('initial'); // Reset so they can try again
      }
    }
  };

  // ORGANIZER SIDEBAR LINKS
  const sidebarLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Events", path: "/events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { name: "Team", path: "/role", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { name: "Attendance", path: "/attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { name: "Scanner", path: "/qr", icon: "M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" }
  ];

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-700 overflow-hidden relative">
      
      {/* HEADER */}
      <header className="flex justify-between items-center px-12 py-5 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 onClick={() => navigate('/dashboard')} className="text-2xl font-black text-[#1e40af] tracking-tight cursor-pointer">QRBase Meetings</h1>
        <nav className="hidden md:flex items-center gap-10">
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-blue-600 hover:text-gray-400 transition-colors text-sm font-black uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer">Log Out</button>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <aside className="group absolute inset-y-0 left-0 z-20 flex flex-col justify-between w-20 hover:w-64 bg-[#1e293b] transition-all duration-300 m-4 rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-2 p-4 mt-2">
            {sidebarLinks.map((link) => (
              <button 
                key={link.name} 
                onClick={() => navigate(link.path)} 
                className={`flex items-center w-full py-3.5 px-3 rounded-2xl transition-all ${link.path === "/qr" ? "bg-[#2563eb] text-white" : "text-slate-400 hover:bg-[#2563eb] hover:text-white"}`}
              >
                <div className="min-w-[24px] flex justify-center"><Icon path={link.icon} /></div>
                <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity font-black text-[11px] uppercase tracking-widest whitespace-nowrap">{link.name}</span>
              </button>
            ))}
          </div>
          <div className="p-4 mb-2">
            <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="flex items-center w-full py-3.5 px-3 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all">
              <div className="min-w-[24px] flex justify-center"><Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></div>
              <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity font-black text-[11px] uppercase tracking-widest whitespace-nowrap">Log Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 ml-24 p-8 flex items-center justify-center overflow-y-auto">
          <div className="max-w-md w-full flex flex-col gap-6">
            <div className="px-4 text-center">
              <h2 className="text-3xl font-black text-[#1e40af] tracking-tight uppercase leading-none">Attendance</h2>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Scanner Portal</span>
            </div>

            <section className="bg-white rounded-[2.5rem] shadow-xl p-10 flex flex-col items-center justify-center text-center min-h-[440px]">
              
              {/* STAGE 1: INITIAL */}
              {scanStep === 'initial' && (
                <div className="animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Icon path="M12 4v1m6 11h2m-6 0h-2v4" className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Ready to Scan</h3>
                  <p className="text-[11px] font-medium text-slate-400 max-w-[240px] mx-auto mb-8 leading-relaxed">
                    Position the participant's QR code within the viewfinder.
                  </p>
                  <button 
                    onClick={() => setScanStep('scanning')}
                    className="bg-[#1e293b] text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                  >
                    Open Camera
                  </button>
                </div>
              )}

              {/* STAGE 2: SCANNING (ACTUAL CAMERA) */}
              {scanStep === 'scanning' && (
                <div className="w-full animate-in zoom-in duration-300">
                   <div className="relative w-64 h-64 mx-auto bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-2xl">
                      <Scanner 
                          onScan={handleScan}
                          onError={(error) => console.log(error)}
                          components={{ audio: false, finder: false }}
                          styles={{ container: { width: "100%", height: "100%" }}}
                      />
                   </div>
                   <button 
                    onClick={() => setScanStep('initial')}
                    className="mt-6 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-700 transition-colors"
                   >
                     Cancel Scan
                   </button>
                </div>
              )}

              {/* STAGE 3: VERIFIED */}
              {scanStep === 'verified' && (
                <div className="animate-in fade-in zoom-in duration-300">
                  <h3 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Verified</h3>
                </div>
              )}

              {/* STAGE 4: SUCCESS */}
              {scanStep === 'success' && (
                <div className="flex flex-col items-center text-center animate-in slide-in-from-bottom-8 duration-700">
                   <div className="w-24 h-24 mb-6 text-green-500">
                      <Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-full h-full" />
                   </div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-snug">Check-In Successful!</h3>
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                       {scannedData || "User Marked as Present"}
                   </p>
                   <button 
                    onClick={() => setScanStep('initial')}
                    className="mt-10 bg-[#1e293b] text-white py-3 px-10 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-md"
                   >
                     Scan Next
                   </button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QR;