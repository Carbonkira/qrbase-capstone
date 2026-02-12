import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect based on role
      if (response.data.user.role === 'organizer') {
        navigate("/dashboard");
      } else {
        navigate("/participant");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login failed.");
    }
  };

  // Icons
  const EmailIcon = (<svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>);
  const LockIcon = (<svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-800 overflow-hidden">
      
      {/* HEADER (Clean, No Nav Links) */}
      <header className="flex justify-center md:justify-start items-center px-12 py-8 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 className="text-4xl font-black text-[#1e40af] tracking-tight cursor-default">
          QRBase Meetings
        </h1>
      </header>

      <main className="flex-grow flex justify-center items-center px-6 py-4">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-12 w-full max-w-[480px] border-4 border-white/50">
          
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-[#1e40af] tracking-tight mb-2">Welcome Back</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs font-black text-[#1e40af] ml-2 uppercase tracking-widest">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500 group-focus-within:text-blue-700 transition-colors">
                  <div className="w-5 h-5">{EmailIcon}</div>
                </div>
                <input id="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required className="w-full bg-[#f1f5f9] border-2 border-slate-200 focus:border-[#2563eb] focus:bg-white text-sm font-bold text-gray-800 placeholder-gray-400 pl-12 pr-4 py-4 rounded-2xl shadow-sm outline-none transition-all duration-200" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-xs font-black text-[#1e40af] ml-2 uppercase tracking-widest">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500 group-focus-within:text-blue-700 transition-colors">
                  <div className="w-5 h-5">{LockIcon}</div>
                </div>
                <input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required className="w-full bg-[#f1f5f9] border-2 border-slate-200 focus:border-[#2563eb] focus:bg-white text-sm font-bold text-gray-800 placeholder-gray-400 pl-12 pr-4 py-4 rounded-2xl shadow-sm outline-none transition-all duration-200" />
              </div>
            </div>

            <button type="submit" className="w-full bg-[#1e293b] hover:bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-[0.98]">
              Log In
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t-2 border-gray-50 flex flex-col items-center gap-3">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Don't have an account?</p>
            <button onClick={() => navigate("/signup")} className="text-blue-600 font-black text-sm uppercase tracking-widest hover:text-blue-800 transition-colors bg-transparent border-none p-0 outline-none cursor-pointer">
              Create Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}