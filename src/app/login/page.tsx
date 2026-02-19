'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Eye, EyeOff, Loader2, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Identity verification failed');
      }

      localStorage.setItem('user', JSON.stringify(data.user));

      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-inter border-y-[12px] border-brand-indigo/10">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-indigo/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-violet/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.35)_1px,transparent_0)] [background-size:22px_22px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1100px] flex flex-col lg:flex-row items-center gap-20 p-8">

        {/* Left Side: Editorial Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 space-y-8 hidden lg:block"
        >
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full backdrop-blur-xl">
            <Zap size={14} className="text-brand-indigo fill-brand-indigo" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">ScholasticOS 2.0 Identity</span>
          </div>

          <h1 className="text-7xl font-black text-white leading-[0.9] tracking-tighter italic font-plus-jakarta">
            Institutional <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-indigo to-brand-violet">Intelligence.</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-md font-medium leading-relaxed tracking-tight">
            Secure access to the world&apos;s most advanced school orchestration engine. Unified, fast, and remarkably beautiful.
          </p>

          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="space-y-2">
              <p className="text-4xl font-black text-white italic">2.4k</p>
              <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Global Clusters</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-black text-white italic">99.9%</p>
              <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Uptime Precision</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="glass-dark p-12 rounded-[3.5rem] shadow-premium border border-white/5 relative group">
            {/* Status Indicator */}
            <div className="absolute top-8 right-8 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Shield Active</span>
            </div>

            <div className="mb-12">
              <div className="w-16 h-16 bg-premium-gradient rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-brand-indigo/40 ring-4 ring-white/5">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter italic font-plus-jakarta">Welcome Back.</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Verify credentials to continue.</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3"
                >
                  <div className="shrink-0 mt-0.5">
                    <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-black">!</div>
                  </div>
                  <p className="text-rose-200 text-xs font-bold tracking-tight">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Access Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/50 focus:border-transparent transition-all font-medium text-sm"
                  placeholder="ex: admin@eskooly.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Security Key</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/50 focus:border-transparent transition-all font-medium text-sm pr-14"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors p-2"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 px-6 bg-white text-slate-950 font-black rounded-2xl shadow-xl shadow-white/5 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    Authenticate System
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck size={12} />
                End-to-End Encrypted Tunnel
              </p>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 px-6 py-4 glass-dark rounded-3xl border border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
              Demo: <span className="text-white/60">admin@eskooly.com</span> / <span className="text-white/60">admin123</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Decorative Waveform */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-indigo to-transparent opacity-20"></div>
    </div>
  );
}
