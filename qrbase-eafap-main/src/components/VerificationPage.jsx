import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VerificationPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", ""]);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length <= 1) {
      const newCode = [...code];
      newCode[idx] = val;
      setCode(newCode);

      if (val && idx < 4) {
        const nextInput = document.getElementById(`code-${idx + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      const prevInput = document.getElementById(`code-${idx - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.every((digit) => digit !== "")) {
      navigate("/result");
    } else {
      alert("Please enter the full 5-digit code");
    }
  };

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
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 w-full max-w-[440px] border border-white/50 text-center">
          
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#1e40af] tracking-tight mb-1">
              Verify Email
            </h2>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Enter 5-Digit Code</p>
          </div>

          <p className="text-sm text-gray-500 font-medium mb-8">
            We've sent a verification code to your email address. Please enter it below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-center gap-3">
              {code.map((num, idx) => (
                <input
                  key={idx}
                  id={`code-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={num}
                  onChange={(e) => handleChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-12 h-14 rounded-2xl bg-[#f8fafc] border-2 border-transparent focus:border-[#2563eb] focus:bg-white text-[#1e40af] text-2xl font-black text-center shadow-sm outline-none transition-all duration-200"
                  placeholder="-"
                />
              ))}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                className="w-full bg-[#2563eb] hover:bg-gray-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95"
              >
                Verify Account
              </button>
              
              <button 
                type="button"
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-gray-400 transition-colors bg-transparent border-none p-0 cursor-pointer outline-none"
              >
                Resend Code
              </button>
            </div>
          </form>
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