import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { 
  Shield, AlertTriangle, MessageSquare, ExternalLink, 
  Scale, CheckCircle, PlusCircle, ArrowRight, Brain 
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  // 1. Server-Side Role Protection
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white p-10 text-center">
        <Shield className="w-24 h-24 text-red-500 mb-8 animate-pulse drop-shadow-[0_0_50px_rgba(239,68,68,0.5)]" />
        <h1 className="text-6xl font-black mb-4 tracking-tighter uppercase italic">Access Denied</h1>
        <p className="text-brand-secondary/60 font-black tracking-[4px] uppercase text-xs border-y border-white/10 py-4 max-w-sm">
          Marketplace High Command Permissions Required.
        </p>
        <div className="mt-12 flex gap-4">
          <a href="/" className="px-8 py-4 bg-white/5 border border-white/5 hover:bg-white/10 transition-all rounded-2xl font-black uppercase text-xs tracking-widest leading-none">Marketplace</a>
        </div>
      </div>
    );
  }

  // 2. Fetch Active Disputes (Mock Data/Fetch)
  const disputes = [
    {
      id: "DT-9942",
      orderId: "ORD-1234",
      service: { title: "Mobile UI Design", description: "Minimalist mobile app UI design for fintech startup with 10 screens." },
      buyer: "Sarah J.",
      seller: "Artem S.",
      reason: "Deliverable didn't include the source Figma file as promised in description.",
      history: [
        { sender: "Sarah J.", content: "Hey, can you please send the Figma link? It's not in the zip." },
        { sender: "Artem S.", content: "Figma link is extra. My description says PDF and JPG only." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans p-12 overflow-x-hidden">
      <AdminHeader adminName={profile?.full_name || 'System Admin'} />

      {/* Analytics Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
        {[
          { label: "Active Disputes", value: "3", icon: AlertTriangle, color: "text-red-400" },
          { label: "Flagged Content", value: "12", icon: Shield, color: "text-brand-primary" },
          { label: "Pending Escrow", value: "$4,240", icon: CheckCircle, color: "text-green-400" },
          { label: "Marketplace Tax", value: "20%", icon: CheckCircle, color: "text-zinc-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
             <stat.icon className={`w-8 h-8 mb-6 ${stat.color}`} />
             <span className="block text-4xl font-black mb-1">{stat.value}</span>
             <span className="block text-xs font-bold text-brand-secondary uppercase tracking-widest">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Admin Action Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-6 mb-20"
      >
        <Link href="/services/new" className="flex-1 p-8 bg-brand-primary hover:bg-brand-secondary transition-all rounded-[2.5rem] flex items-center justify-between group shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
               <PlusCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="block text-xl font-black text-white">Create New Service</span>
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest leading-none">Add Gigs to Marketplace</span>
            </div>
          </div>
          <ArrowRight className="w-8 h-8 text-white/40 group-hover:translate-x-2 transition-transform" />
        </Link>

        <div className="flex-1 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between group backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
               <MessageSquare className="w-8 h-8 text-brand-primary" />
            </div>
            <div>
              <span className="block text-xl font-black">Support Command</span>
              <span className="text-brand-secondary text-xs font-bold uppercase tracking-widest leading-none">3 Pending Inquiries</span>
            </div>
          </div>
          <ExternalLink className="w-6 h-6 text-brand-secondary" />
        </div>
      </motion.div>

      {/* Main Command Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Dispute Resolution UI */}
        <div className="space-y-12">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Scale className="text-brand-primary" /> Active Disputes
          </h2>
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white/5 border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="flex justify-between items-start mb-8">
                 <div>
                   <span className="text-[10px] font-black tracking-[4px] text-brand-primary uppercase">ID: {dispute.id}</span>
                   <h3 className="text-2xl font-bold mt-1 line-clamp-1">{dispute.service.title}</h3>
                 </div>
                 <div className="px-4 py-1.5 bg-red-400/10 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-400/20">
                   Requires Review
                 </div>
               </div>
               <div className="p-6 bg-brand-dark/50 rounded-2xl border border-white/5 mb-8">
                 <p className="text-sm leading-relaxed text-zinc-400 font-medium line-clamp-2">"{dispute.reason}"</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <button className="py-4 bg-white/5 hover:bg-green-500 hover:text-brand-dark transition-all font-black rounded-xl text-[10px] uppercase tracking-widest border border-white/10">Release Funds</button>
                 <button className="py-4 bg-white/5 hover:bg-red-500 transition-all font-black rounded-xl text-[10px] uppercase tracking-widest border border-white/10">Refund Buyer</button>
               </div>
            </div>
          ))}
        </div>

        {/* Live Support Feed (Admin to User) */}
        <div className="space-y-12">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Brain className="text-brand-primary" /> Support Command Center
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-xl">
            <div className="p-10 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-primary border-4 border-brand-dark shadow-xl" />
                  <div>
                    <span className="block font-black text-lg">Intel Feed: Active Users</span>
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" /> Connection Established
                    </span>
                  </div>
               </div>
               <button className="text-[10px] font-black uppercase tracking-widest text-brand-secondary hover:text-white transition-colors">Archive Session</button>
            </div>
            
            <div className="p-10 h-[400px] overflow-y-auto space-y-8 no-scrollbar">
               {/* This section will now map over live messages from Supabase */}
               <div className="flex flex-col items-start max-w-[85%]">
                  <span className="text-[10px] font-black uppercase text-brand-secondary mb-2 ml-1">Transmission Detected</span>
                  <div className="p-6 bg-white/5 rounded-3xl rounded-tl-none border border-white/5 text-sm font-medium leading-relaxed shadow-sm">
                    High Command, I am unable to verify my seller credentials. The system is rejecting my ID upload.
                  </div>
               </div>

               <div className="flex flex-col items-end max-w-[85%] ml-auto">
                  <span className="text-[10px] font-black uppercase text-brand-primary mb-2 mr-1">You (Administrator)</span>
                  <div className="p-6 bg-brand-primary text-brand-dark rounded-3xl rounded-tr-none text-sm font-black leading-relaxed shadow-[0_15px_30px_-10px_rgba(82,109,130,0.4)]">
                    System Override: ID manual review initiated. Please remain active in this secure tunnel for confirmation.
                  </div>
               </div>
            </div>
            
            <div className="p-8 bg-black/20 border-t border-white/10">
               <div className="relative group">
                  <input 
                    className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all placeholder-brand-secondary/40" 
                    placeholder="Enter command to transmit to user terminal..." 
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 bg-brand-primary text-brand-dark font-black rounded-xl text-xs uppercase tracking-widest shadow-xl hover:bg-brand-secondary hover:text-white transition-all transform active:scale-95">
                    Transmit
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
