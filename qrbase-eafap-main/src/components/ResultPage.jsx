import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const success = location.state?.success ?? true;

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-700 overflow-hidden">
      
      {/* HEADER */}
      <header className="flex justify-between items-center px-12 py-5 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 
          onClick={() => navigate("/")} 
          className="text-2xl font-black text-[#1e40af] tracking-tight cursor-pointer"
        >
          QRBase Meetings
        </h1>
        <nav className="hidden md:flex items-center gap-10">
          <div className="flex gap-8 text-sm font-bold items-center uppercase tracking-widest">
            <button 
              onClick={() => navigate("/home")} 
              className="text-blue-600 hover:text-gray-400 transition-colors bg-transparent border-none p-0 font-bold text-sm uppercase tracking-widest cursor-pointer outline-none"
            >
              Home
            </button>
            <a href="#" className="text-blue-600 hover:text-gray-400 transition-colors">Features</a>
            <a href="#" className="text-blue-600 hover:text-gray-400 transition-colors">How It Works</a>
          </div>

          <div className="flex gap-8 items-center border-l pl-8 border-gray-100">
            <button 
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-gray-400 transition-colors font-black text-sm uppercase tracking-widest outline-none bg-transparent border-none p-0 cursor-pointer"
            >
              Log In
            </button>
            <button 
              onClick={() => navigate("/")}
              className="bg-[#2563eb] text-white px-7 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-gray-500 transition-all active:scale-95"
            >
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex justify-center items-center px-4 py-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 flex flex-col items-center text-center w-full max-w-[460px] border border-white/50">
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#1e40af] tracking-tight mb-1">
              {success ? "Account Status" : "Registration Error"}
            </h2>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">
              {success ? "Welcome to the platform" : "Please try again"}
            </p>
          </div>

          <div className={`transition-all duration-700 transform ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} mb-10`}>
            {success ? (
              <div className="space-y-1">
                <p className="font-black text-[#1e40af] text-4xl uppercase tracking-tighter">Successfully</p>
                <p className="font-black text-[#2563eb] text-4xl uppercase tracking-tighter">Registered</p>
              </div>
            ) : (
              <p className="text-3xl font-black text-red-500 uppercase tracking-tighter">Registration Failed</p>
            )}
          </div>

          <div
            className={`w-32 h-32 rounded-[2rem] flex items-center justify-center mb-12 shadow-2xl shadow-blue-100 transition-all duration-1000 ${
              visible ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 rotate-12"
            } ${success ? "bg-green-50" : "bg-red-50"}`}
          >
            <span className={`text-6xl font-black ${success ? "text-green-500" : "text-red-500"}`}>
              {success ? "✓" : "✕"}
            </span>
          </div>

          <button
            onClick={() => navigate("/home")}
            className="w-full bg-[#2563eb] hover:bg-gray-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95"
          >
            Go to Dashboard
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 px-12 py-5 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
        <div>© 2026 QRBase Meetings</div>
        <nav className="flex gap-8 items-center">
          <button 
            onClick={() => navigate("/home")} 
            className="text-blue-600 hover:text-gray-400 transition-colors bg-transparent border-none p-0 font-bold text-[10px] uppercase tracking-widest cursor-pointer outline-none"
          >
            Home
          </button>
          <a href="#" className="text-blue-600 hover:text-gray-400 transition-colors">Terms</a>
          <a href="#" className="text-blue-600 hover:text-gray-400 transition-colors">Privacy</a>
        </nav>
      </footer>
    </div>
  );
}