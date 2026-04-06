'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Banknote, Package, TrendingUp, Users, MoreHorizontal, ChevronRight, BarChart3, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function SellerDashboard() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  // Mock data for the draft
  const activeOrders = [
    { id: "ORD-8821", service: "Professional Logo Design", status: "In Progress", buyer: "Sarah J.", price: 45, commission: 9, deadline: "2d left" }
  ];

  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark">
      {/* Revenue & Stats Header */}
      <div className="bg-brand-dark text-white pt-20 pb-32 px-6 shadow-2xl rounded-b-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          <div className="md:col-span-2">
            <h1 className="text-5xl font-black mb-6 tracking-tight leading-tight">Seller <span className="text-brand-primary">Command</span></h1>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
                 <Banknote className="w-6 h-6 text-green-400 mb-4" />
                 <span className="block text-3xl font-black mb-1">$2,450.00</span>
                 <span className="block text-[10px] font-black uppercase text-brand-secondary tracking-widest leading-none">Net Income</span>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
                 <Package className="w-6 h-6 text-brand-primary mb-4" />
                 <span className="block text-3xl font-black mb-1">12</span>
                 <span className="block text-[10px] font-black uppercase text-brand-secondary tracking-widest leading-none">Active Gigs</span>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl hidden lg:block">
                 <TrendingUp className="w-6 h-6 text-brand-secondary mb-4" />
                 <span className="block text-3xl font-black mb-1">98%</span>
                 <span className="block text-[10px] font-black uppercase text-brand-secondary tracking-widest leading-none">Completion Rate</span>
              </div>
            </div>
          </div>
          <div className="bg-brand-primary text-brand-dark p-8 rounded-[2.5rem] flex flex-col justify-between shadow-2xl group hover:-translate-y-2 transition-all cursor-pointer">
            <BarChart3 className="w-10 h-10 mb-8" />
            <div>
              <p className="text-5xl font-black mb-2 tracking-tighter italic">Ready</p>
              <p className="text-xs font-black uppercase tracking-widest opacity-60">to withdraw funds</p>
            </div>
            <ChevronRight className="mt-8 self-end transition-transform group-hover:translate-x-2" />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 -mt-16 pb-24 space-y-12">
        {/* Order Queue */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Package className="text-brand-primary" /> Active Queue
            </h2>
            <Link href="/services/new" className="px-5 py-2.5 bg-brand-primary text-white hover:bg-brand-secondary transition-all rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Create New Gig
            </Link>
          </div>
          
          {activeOrders.map((order) => (
            <div key={order.id} className="bg-white p-8 rounded-3xl shadow-sm border border-brand-secondary/5 group hover:shadow-xl transition-all cursor-pointer">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                <div className="md:col-span-2">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center text-brand-primary">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest tracking-[2px]">{order.id}</span>
                      <h3 className="text-xl font-bold text-brand-dark group-hover:text-brand-primary transition-colors mt-1">{order.service}</h3>
                      <p className="text-sm font-medium text-brand-primary mt-1">Client: <span className="font-bold">{order.buyer}</span></p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center md:border-l border-brand-light px-0 md:px-8">
                  <div className="text-left">
                    <span className="block text-[10px] font-black text-brand-secondary uppercase tracking-widest leading-none mb-1">Gig Net</span>
                    <span className="text-2xl font-black italic text-brand-primary">${order.price - order.commission}</span>
                    <span className="block text-[10px] text-red-500 font-bold opacity-50">Tax: ${order.commission}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-black text-brand-secondary uppercase tracking-widest leading-none mb-1">Deadline</span>
                    <span className="text-xl font-bold text-brand-dark">{order.deadline}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                   <button className="flex-1 py-4 bg-brand-dark text-white hover:bg-brand-primary transition-all rounded-2xl font-black text-xs uppercase tracking-widest">Deliver Now</button>
                   <button className="w-14 h-14 border border-brand-light hover:bg-brand-light rounded-2xl flex items-center justify-center transition-all"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Gig Manager Snapshot */}
        <section className="bg-white/50 border border-brand-secondary/10 p-10 rounded-[3rem]">
          <h2 className="text-2xl font-black mb-10 flex items-center gap-2"><BarChart3 className="text-brand-primary" /> Gig Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Total Views", value: "1,240", change: "+12%" },
              { label: "Conversion", value: "4.2%", change: "+0.3%" },
              { label: "Active Orders", value: "3", change: "Stable" },
              { label: "Canceled", value: "0", change: "None" }
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 bg-white rounded-3xl shadow-sm border border-brand-secondary/5">
                <span className="block text-3xl font-black mb-1">{stat.value}</span>
                <span className="block text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-2">{stat.label}</span>
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{stat.change}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
