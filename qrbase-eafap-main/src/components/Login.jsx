import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // Import your API configuration

function InputField({ id, type, placeholder, label, icon, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] font-black text-[#1e40af] ml-1 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500 group-focus-within:text-blue-700 transition-colors">
          <div className="flex items-center justify-center w-5 h-5">
            {React.cloneElement(icon, { className: "w-full h-full overflow-visible" })}
          </div>
        </div>
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          className="w-full bg-[#f1f5f9] border-2 border-slate-200 focus:border-[#2563eb] focus:bg-white text-sm text-gray-800 placeholder-gray-400 pl-12 pr-4 py-3 rounded-2xl shadow-sm outline-none transition-all duration-200"
        />
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/login', {
        email: email,
        password: password
      });

      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const role = response.data.user.role;
      
      // Redirect based on role (Note: role comes from backend, usually lowercase)
      if(role === 'organizer' || role === 'Organizer') {
          navigate("/dashboard");
      } else {
          navigate("/participant");
      }

    } catch (error) {
      console.error(error);
      alert("Login failed. Please check your credentials.");
    }
  };

  const EmailIcon = (
    <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );

  const LockIcon = (
    <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-700">
      
      {/* HEADER */}
      <header className="flex justify-between items-center px-12 py-5 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 onClick={() => navigate("/")} className="text-2xl font-black text-[#1e40af] tracking-tight cursor-pointer">
          QRBase Meetings
        </h1>
        <nav className="hidden md:flex items-center gap-10">
          <div className="flex gap-8 text-sm font-bold items-center uppercase tracking-widest">
            <button onClick={() => navigate("/home")} className="text-blue-600 hover:text-gray-400 transition-colors font-bold text-sm uppercase tracking-widest outline-none bg-transparent border-none p-0 cursor-pointer">Home</button>
            <a href="#" className="text-blue-600 hover:text-gray-400 transition-colors">Features</a>
            <a href="#" className="text-blue-600 hover:text-gray-400 transition-colors">How It Works</a>
          </div>
          
          <div className="flex gap-8 items-center border-l pl-8 border-gray-100">
            <button onClick={() => navigate("/login")} className="text-blue-600 hover:text-gray-400 transition-colors font-black text-sm uppercase tracking-widest outline-none bg-transparent border-none p-0 cursor-pointer">Log In</button>
            <button onClick={() => navigate("/")} className="bg-[#2563eb] text-white px-7 py-2.5 rounded-2xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-gray-500 transition-all active:scale-95">Sign Up</button>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-grow flex justify-center items-center px-4 py-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-[440px] border border-white/50">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#1e40af] tracking-tight mb-1">Welcome Back</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Log in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                label="Email Address" 
                icon={EmailIcon} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <InputField 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                label="Password" 
                icon={LockIcon} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button type="button" className="text-[11px] font-black text-blue-600 hover:text-gray-400 transition-colors uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer">
                  Forgot password?
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#2563eb] hover:bg-gray-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-[0.98]">
              Continue
            </button>
          </form>

          <div className="mt-10 text-center pt-6 border-t border-gray-50 flex flex-col items-center gap-2">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">New here?</p>
            <button onClick={() => navigate("/")} className="text-blue-600 font-black text-sm uppercase tracking-widest hover:text-gray-400 transition-colors outline-none bg-transparent border-none p-0 cursor-pointer">
              Create an account
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 px-12 py-5 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
        <div>© 2026 QRBase Meetings</div>
        <nav className="flex gap-8 items-center">
          <button onClick={() => navigate("/home")} className="text-blue-600 hover:text-gray-400 transition-colors bg-transparent border-none p-0 font-bold text-[10px] uppercase tracking-widest cursor-pointer outline-none">Home</button>
          <a href="#" className="text-blue-600 hover:text-gray-400 transition-colors">Terms</a>
          <a href="#" className="text-blue-600 hover:text-gray-400 transition-colors">Privacy</a>
        </nav>
      </footer>
    </div>
  );
}