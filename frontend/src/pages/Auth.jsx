import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, User, Github } from 'lucide-react';
import { api } from '../services/api';

export default function Auth({ setUser }) {
  const [searchParams] = useSearchParams();
  const isSignup = searchParams.get('mode') === 'signup';
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      let data;
  
      if (isSignup) {
        // REGISTER
        data = await api.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      } else {
        // LOGIN
        data = await api.login({
          email: formData.email,
          password: formData.password
        });
      }
  
      // assuming your backend returns: { access_token, user }
      localStorage.setItem('aura_token', data.access_token);
      localStorage.setItem('aura_user', JSON.stringify(data.user));
  
      setUser(data.user);
  
      navigate('/dashboard');
  
    } catch (error) {
      alert(error.message); // simple error handling
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-muted p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-brand-border"
      >
        <div className="p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-brand-ink rounded-2xl flex items-center justify-center">
              <Sparkles className="text-white w-6 h-6" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-2">
            {isSignup ? 'Create account' : 'Welcome back'}
          </h2>
          <p className="text-brand-ink/50 text-center mb-8">
            {isSignup ? 'Start your AI meeting journey today' : 'Continue where you left off'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-ink/30" />
                <input 
                  type="text" 
                  placeholder="Full Name"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-brand-muted rounded-2xl border-none focus:ring-2 focus:ring-brand-accent transition-all outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-ink/30" />
              <input 
                type="email" 
                placeholder="Email Address"
                required
                className="w-full pl-12 pr-4 py-4 bg-brand-muted rounded-2xl border-none focus:ring-2 focus:ring-brand-accent transition-all outline-none"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-ink/30" />
              <input 
                type="password" 
                placeholder="Password"
                required
                className="w-full pl-12 pr-4 py-4 bg-brand-muted rounded-2xl border-none focus:ring-2 focus:ring-brand-accent transition-all outline-none"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button className="w-full bg-brand-ink text-white py-4 rounded-2xl font-bold hover:bg-brand-ink/90 transition-all active:scale-[0.98]">
              {isSignup ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-brand-ink/40 font-semibold">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 border border-brand-border rounded-2xl hover:bg-brand-muted transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 border border-brand-border rounded-2xl hover:bg-brand-muted transition-colors">
              <Github className="w-5 h-5" />
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          <p className="text-center mt-8 text-sm text-brand-ink/50">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => navigate(`/auth?mode=${isSignup ? 'login' : 'signup'}`)}
              className="text-brand-ink font-bold hover:underline"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
