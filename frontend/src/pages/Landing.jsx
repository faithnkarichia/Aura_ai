import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mic, Calendar, Folder, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-brand-ink">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-ink rounded-lg flex items-center justify-center">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Aura AI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/auth" className="text-sm font-medium hover:opacity-70 transition-opacity">Login</Link>
          <Link to="/auth?mode=signup" className="bg-brand-ink text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-brand-ink/90 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-muted text-xs font-semibold uppercase tracking-wider mb-6">
            The Future of Meetings
          </span>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9]">
            Capture every word.<br />
            <span className="text-brand-accent">Understand</span> every detail.
          </h1>
          <p className="text-xl text-brand-ink/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Aura AI records, transcribes, and summarizes your meetings in real-time. 
            Sync with your calendar and manage your knowledge effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=signup" className="w-full sm:w-auto bg-brand-ink text-white px-8 py-4 rounded-full text-lg font-medium hover:scale-105 transition-transform flex items-center justify-center gap-2">
              Start Recording Free <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-medium border border-brand-border hover:bg-brand-muted transition-colors">
              Watch Demo
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-brand-muted">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Mic className="w-6 h-6" />}
              title="Crystal Clear Recording"
              description="High-fidelity audio capture for meetings of any size, from 1-on-1s to large boardrooms."
            />
            <FeatureCard 
              icon={<Sparkles className="w-6 h-6" />}
              title="AI Transcription"
              description="Powered by advanced LLMs to provide near-perfect transcriptions with speaker identification."
            />
            <FeatureCard 
              icon={<Calendar className="w-6 h-6" />}
              title="Calendar Sync"
              description="Automatically syncs recordings with your Google or Outlook calendar events."
            />
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-12">Trusted by modern teams</h2>
        <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale">
          <div className="text-2xl font-black">GOOGLE</div>
          <div className="text-2xl font-black">STRIPE</div>
          <div className="text-2xl font-black">AIRBNB</div>
          <div className="text-2xl font-black">NOTION</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-brand-border">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-6 text-sm text-brand-ink/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>© 2026 Aura AI. All rights reserved.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-brand-ink">Privacy Policy</a>
            <a href="#" className="hover:text-brand-ink">Terms of Service</a>
            <a href="#" className="hover:text-brand-ink">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-8 bg-white rounded-3xl border border-brand-border hover:shadow-xl transition-all group">
      <div className="w-12 h-12 bg-brand-muted rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-accent group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-brand-ink/60 leading-relaxed">{description}</p>
    </div>
  );
}
