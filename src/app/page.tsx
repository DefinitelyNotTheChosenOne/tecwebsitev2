'use client';
import React, { useEffect, useState } from "react";
import { Search, Code, Video, TerminalSquare, BookOpen, PenTool, Mic, Share2, Palette, Monitor, Music as MusicIcon, Building2, User, UserCircle, Briefcase, PlusCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const fallbackServices = [
  { title: "Website Development", category: "Programming", description: "Custom, responsive sites", price: 150 },
  { title: "Video Editing", category: "Video", description: "Professional cut & effects", price: 50 },
  { title: "Software Development", category: "Programming", description: "Robust applications", price: 300 },
];

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [dbServices, setDbServices] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase.from('services').select('*').limit(8);
    if (!error && data) setDbServices(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const displayServices = dbServices.length > 0 ? dbServices : fallbackServices;

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark font-sans selection:bg-brand-primary selection:text-white">
      
      {/* Navigation Layer */}
      <nav className="sticky top-0 z-50 bg-brand-dark text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-brand-light text-brand-dark rounded-xl flex items-center justify-center font-black text-xl italic tracking-tighter shadow-inner group-hover:scale-105 transition-transform">
              f<span className="text-brand-primary font-sans lowercase not-italic">.</span>
            </div>
            <span className="text-2xl font-black tracking-tight hidden sm:block">
              freelance<span className="text-brand-secondary">hub</span>
            </span>
          </Link>
          
          <div className="hidden lg:flex flex-1 max-w-xl mx-8 relative">
            <input 
              type="text" 
              placeholder="What service are you looking for today?" 
              className="w-full py-3 px-5 pr-12 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-white placeholder-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-light transition-all"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-primary rounded-full hover:bg-brand-secondary transition-colors text-brand-dark">
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm font-semibold">
            {!session ? (
              <Link href="/auth" className="px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary transition-all rounded-full font-bold">
                Join Now
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/services/new" className="flex items-center gap-2 text-brand-secondary hover:text-white transition-colors group">
                  <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> Post Service
                </Link>
                <div className="h-4 w-px bg-white/10" />
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Category Subnav */}
        <div className="bg-brand-primary text-brand-light/80 text-xs md:text-sm font-medium overflow-x-auto no-scrollbar border-t border-brand-dark">
          <div className="max-w-7xl mx-auto px-6 py-3 flex gap-6 whitespace-nowrap">
            <span className="hover:text-white cursor-pointer transition-colors block">Graphics & Design</span>
            <span className="hover:text-white cursor-pointer transition-colors block">Programming & Tech</span>
            <span className="hover:text-white cursor-pointer transition-colors block">Digital Marketing</span>
            <span className="hover:text-white cursor-pointer transition-colors block">Video & Animation</span>
            <span className="hover:text-white cursor-pointer transition-colors block">AI Services</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 w-full overflow-hidden flex flex-col items-center">
        <div className="w-full bg-brand-dark py-24 pb-32 px-6 relative flex justify-center items-center rounded-b-[3rem] shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          
          <div className="max-w-4xl relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
              Find the perfect <i className="text-brand-secondary font-serif font-medium">freelance</i> services for your business
            </h1>
            
            <p className="max-w-2xl mx-auto text-brand-secondary text-lg mb-10 font-medium">
              Join thousands of experts in website development, AI and creativity.
            </p>

            <div className="lg:hidden w-full max-w-xl mx-auto relative">
              <input 
                type="text" 
                placeholder="Search for any service..." 
                className="w-full py-4 px-6 pr-14 rounded-full bg-white text-brand-dark shadow-xl focus:outline-none focus:ring-4 focus:ring-brand-primary/50"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-brand-primary rounded-full hover:bg-brand-primary/90 text-white transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Services Grid Section */}
        <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 pb-32 w-full">
          <div className="flex items-center justify-between mb-8 text-brand-dark">
            <h2 className="text-2xl md:text-3xl font-black">Latest Premium Services</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayServices.map((service, i) => {
              return (
                <div 
                  key={i} 
                  className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-2xl border border-brand-secondary/20 hover:border-brand-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div className="mb-4">
                    <div className="w-full h-32 bg-brand-light group-hover:bg-brand-dark text-brand-primary group-hover:text-white flex items-center justify-center transition-colors shadow-sm mb-4 rounded-xl">
                      <Code className="w-10 h-10" />
                    </div>
                    <span className="text-[10px] uppercase font-black text-brand-secondary tracking-widest">{service.category}</span>
                    <h3 className="text-lg font-bold text-brand-dark group-hover:text-brand-primary transition-colors leading-tight line-clamp-2 mt-1">
                      {service.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-bold text-brand-primary/60">Starting at</span>
                    <span className="text-xl font-black text-brand-dark">${service.price}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Footer Banner */}
      <footer className="bg-brand-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div>
            <h2 className="text-3xl font-black mb-2">A whole world of freelance talent at your fingertips</h2>
            <p className="text-brand-light font-medium">The best for every budget. Highly skilled. Always on time.</p>
          </div>
          {!session && (
            <Link href="/auth" className="px-8 py-4 bg-white text-brand-dark font-black tracking-wide rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all">
              Join FreelanceHub
            </Link>
          )}
        </div>
      </footer>
      
    </div>
  );
}


