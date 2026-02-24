import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; 

// Reusable Input Field with Bigger Fonts
function InputField({ id, type, placeholder, label, icon, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-black text-[#1e40af] ml-2 uppercase tracking-widest">
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
          className="w-full bg-[#f1f5f9] border-2 border-slate-200 focus:border-[#2563eb] focus:bg-white text-sm font-bold text-gray-800 placeholder-gray-400 pl-12 pr-4 py-4 rounded-2xl shadow-sm outline-none transition-all duration-200"
        />
      </div>
    </div>
  );
}

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "User" 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role: role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await api.post('/register', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        role: formData.role
      });

      alert("Account created successfully! Please log in.");
      navigate("/login");

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Registration failed.");
    }
  };

  // Icons
  const UserIcon = (<svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" /></svg>);
  const EmailIcon = (<svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>);
  const LockIcon = (<svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
  const ShieldIcon = (<svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>);

  return (
    <div className="h-screen flex flex-col bg-[#e9eff6] font-sans text-slate-800 overflow-hidden">
      
      {/* HEADER */}
      <header className="flex justify-center md:justify-start items-center px-12 py-8 bg-white shadow-sm sticky top-0 z-50 shrink-0">
        <h1 className="text-4xl font-black text-[#1e40af] tracking-tight cursor-default">
          QRBase Meetings
        </h1>
      </header>

      <main className="flex-grow flex justify-center items-center px-6 py-4 overflow-y-auto">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-12 w-full max-w-[500px] border-4 border-white/50 my-auto">
          
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-[#1e40af] tracking-tight mb-2">Create Account</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Join the Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector */}
            <div className="bg-slate-100 p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black text-[#1e40af] uppercase tracking-widest ml-2">I am a:</span>
              <div className="flex gap-6 mr-2">
                {['Organizer', 'User'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="accountType" 
                      checked={formData.role === type}
                      onChange={() => handleRoleChange(type)}
                      className="w-5 h-5 accent-[#2563eb]" 
                    />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-[#2563eb] transition-colors">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField id="firstName" type="text" placeholder="First Name" label="First Name" icon={UserIcon} value={formData.firstName} onChange={handleChange} />
              <InputField id="lastName" type="text" placeholder="Last Name" label="Last Name" icon={UserIcon} value={formData.lastName} onChange={handleChange} />
            </div>

            <InputField id="email" type="email" placeholder="name@example.com" label="Email Address" icon={EmailIcon} value={formData.email} onChange={handleChange} />

            <div className="grid grid-cols-2 gap-4">
              <InputField id="password" type="password" placeholder="••••••••" label="Password" icon={LockIcon} value={formData.password} onChange={handleChange} />
              <InputField id="confirmPassword" type="password" placeholder="••••••••" label="Confirm" icon={ShieldIcon} value={formData.confirmPassword} onChange={handleChange} />
            </div>

            <div className="flex items-center gap-3 px-2 py-2">
              <input type="checkbox" id="terms" required className="w-5 h-5 accent-[#2563eb]" />
              <label htmlFor="terms" className="text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer">
                I agree to the <span className="text-blue-600 hover:text-gray-500 transition-colors underline">Terms & Conditions</span>
              </label>
            </div>

            <button type="submit" className="w-full bg-[#1e293b] hover:bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-[0.98]">
              Create Account
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t-2 border-gray-50 flex flex-col items-center gap-3">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Already have an account?</p>
            <button onClick={() => navigate("/login")} className="text-blue-600 font-black text-sm uppercase tracking-widest hover:text-blue-800 transition-colors bg-transparent border-none p-0 outline-none cursor-pointer">
              Log In
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}