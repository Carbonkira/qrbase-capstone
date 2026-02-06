import React from 'react';
import { useNavigate } from 'react-router-dom';

const QRAttendanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible">
    <path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <rect x="7" y="7" width="3" height="3" />
    <rect x="14" y="14" width="3" height="3" />
  </svg>
);

const OnlineRegistrationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible">
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
  </svg>
);

const DigitalFeedbackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const VerifiedCertificatesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { title: "QR Attendance", icon: <QRAttendanceIcon /> },
    { title: "Online Registration", icon: <OnlineRegistrationIcon /> },
    { title: "Digital Feedback", icon: <DigitalFeedbackIcon /> },
    { title: "Verified Certificates", icon: <VerifiedCertificatesIcon /> },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-slate-700 flex flex-col">
      
      {/* Header */}
      <header className="flex justify-between items-center px-12 py-5 bg-white shadow-sm sticky top-0 z-50">
        <h1 className="text-2xl font-black text-[#1e40af] tracking-tight cursor-pointer" onClick={() => navigate('/home')}>
          QRBase Meetings
        </h1>
        <nav className="hidden md:flex items-center gap-10">
          <div className="flex gap-8 text-sm font-bold items-center uppercase tracking-widest">
            <button 
              onClick={() => navigate('/home')} 
              className="text-blue-600 hover:text-gray-400 transition-colors bg-transparent border-none p-0 font-bold text-sm uppercase tracking-widest cursor-pointer outline-none"
            >
              Home
            </button>
            <a href="#features" className="text-blue-600 hover:text-gray-400 transition-colors">Features</a>
            <a href="#how-it-works" className="text-blue-600 hover:text-gray-400 transition-colors">How It Works</a>
          </div>
          <div className="flex gap-8 items-center border-l pl-8 border-gray-100">
            <button 
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-gray-400 transition-colors font-black text-sm uppercase tracking-widest outline-none bg-transparent border-none p-0 cursor-pointer"
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/')}
              className="bg-[#2563eb] text-white px-7 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-gray-500 transition-all active:scale-95"
            >
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 flex justify-center">
        <div className="w-full max-w-5xl bg-[#2563eb] rounded-[3.5rem] p-16 md:p-24 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
          
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[1.05] tracking-tight">
            QR-Based Event <br/> <span className="text-blue-200">Attendance & Feedback</span>
          </h2>
          <p className="text-xl md:text-2xl text-blue-50 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
            The all-in-one solution to automate registration, tracking, and certification for professional academic gatherings.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <button 
              onClick={() => navigate('/')}
              className="bg-white text-[#2563eb] px-14 py-5 rounded-2xl text-xl font-black shadow-xl hover:bg-blue-50 transition-all active:scale-95"
            >
              Get Started
            </button>
            <button className="bg-transparent border-2 border-white/40 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-white/10 transition-all">
              Register for Event
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#1e40af] mb-4 tracking-tight uppercase">Core Features</h2>
            <div className="h-1.5 w-20 bg-[#2563eb] mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {features.map((feature, index) => (
              <div key={index} className="group bg-white p-12 rounded-[3rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
                <div className="mb-8 h-12 flex items-center justify-center transition-transform group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-[#1e40af] group-hover:text-blue-600 transition-colors tracking-tight">
                  {feature.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section id="how-it-works" className="px-12 py-24 bg-white/50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-[#1e40af] mb-4 tracking-tight uppercase">How It Works</h2>
            <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">Experience the ease of QRBase Meetings</p>
          </div>

          <div className="relative group mx-auto max-w-4xl aspect-video bg-slate-100 rounded-[4rem] shadow-2xl flex items-center justify-center border-[16px] border-white overflow-hidden">
             <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors duration-500"></div>
             <button className="relative z-10 w-28 h-28 bg-[#2563eb] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.5)] group-hover:scale-110 transition-transform duration-500">
                <div className="w-0 h-0 border-t-[20px] border-t-transparent border-l-[35px] border-l-white border-b-[20px] border-b-transparent ml-3"></div>
             </button>
             <div className="absolute bottom-10 text-xs font-black text-[#1e40af] tracking-[0.4em] uppercase opacity-40">Play Demo Video</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 px-12 py-16 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-[#1e40af] mb-2 tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
              QRBase Meetings
            </h2>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">© 2026 QRBase Meetings</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-[12px] font-black items-center uppercase tracking-[0.2em]">
            <button 
              onClick={() => navigate('/home')} 
              className="text-blue-600 hover:text-gray-400 transition-colors bg-transparent border-none p-0 font-bold uppercase tracking-[0.2em] cursor-pointer outline-none"
            >
              Home
            </button>
            <a href="#features" className="text-blue-600 hover:text-gray-400 transition-colors">Features</a>
            <a href="#" className="text-blue-600 hover:text-gray-400 transition-colors">Contact</a>
            <a href="#" className="text-blue-600 hover:text-gray-400 transition-colors">Privacy</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;