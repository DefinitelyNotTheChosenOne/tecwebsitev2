'use client';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Shield, AlertTriangle, MessageSquare, ExternalLink, 
  Scale, CheckCircle, PlusCircle, ArrowRight, Brain, RefreshCcw,
  BarChart3, Users, Activity
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth');
      } else {
        supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
            setIsLoading(false);
          });
      }
    });
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
        <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-brand-secondary">Verifying High Command Credentials...</p>
      </div>
    );
  }


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

      {/* Analytics Snapshot - Interactive Launchpads */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
        {[
          { label: "Active Disputes", value: "3", icon: AlertTriangle, color: "text-red-400", path: "/admin/moderation" },
          { label: "Flagged Content", value: "12", icon: Shield, color: "text-brand-primary", path: "/admin/moderation" },
          { label: "Pending Escrow", value: "₱4,240", icon: CheckCircle, color: "text-green-400", path: "/admin/escrow" },
          { label: "Marketplace Tax", value: "20%", icon: Activity, color: "text-zinc-500", path: "#" },
        ].map((stat, i) => (
          <Link 
            key={i} 
            href={stat.path}
            className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl hover:bg-white/10 hover:border-brand-primary/50 transition-all group"
          >
             <stat.icon className={`w-8 h-8 mb-6 ${stat.color} group-hover:scale-110 transition-transform`} />
             <div className="flex items-end justify-between">
                <div>
                   <span className="block text-4xl font-black mb-1 text-white">{stat.value}</span>
                   <span className="block text-xs font-bold text-brand-secondary uppercase tracking-widest">{stat.label}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-brand-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
             </div>
          </Link>
        ))}
      </div>

      {/* Admin Action Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
      >
        <Link href="/admin/subjects" className="p-8 bg-brand-primary hover:bg-brand-secondary transition-all rounded-[2.5rem] flex items-center justify-between group shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
               <PlusCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="block text-xl font-black text-white">Deploy Subject</span>
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest leading-none">Add Categories</span>
            </div>
          </div>
          <ArrowRight className="w-8 h-8 text-white/40 group-hover:translate-x-2 transition-transform" />
        </Link>

        <Link href="/admin/users" className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between group backdrop-blur-xl hover:bg-white/10 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
               <Users className="w-8 h-8 text-brand-primary" />
            </div>
            <div>
              <span className="block text-xl font-black">User Registry</span>
              <span className="text-brand-secondary text-xs font-bold uppercase tracking-widest leading-none">Status & Strikes</span>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-brand-secondary" />
        </Link>

        <Link href="/support" className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between group backdrop-blur-xl hover:bg-white/10 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
               <MessageSquare className="w-8 h-8 text-brand-primary" />
            </div>
            <div>
              <span className="block text-xl font-black">Support Command</span>
              <span className="text-brand-secondary text-xs font-bold uppercase tracking-widest leading-none">Live Inquiries</span>
            </div>
          </div>
          <ExternalLink className="w-6 h-6 text-brand-secondary" />
        </Link>
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

      {/* Global Intelligence - Real-time Analytics Engine */}
      <section className="mt-20">
         <h2 className="text-2xl font-black flex items-center gap-3 mb-10">
            <BarChart3 className="text-brand-primary" /> Global Intelligence
         </h2>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl relative overflow-hidden group">
               <div className="flex items-center justify-between mb-12">
                  <div>
                     <span className="text-[10px] font-black tracking-[4px] text-brand-secondary uppercase">Volumetric Throughput</span>
                     <h3 className="text-3xl font-black text-white mt-1">Transaction Velocity</h3>
                  </div>
                  <div className="text-right">
                     <span className="text-green-400 font-black text-lg flex items-center gap-2 justify-end">
                        +14.2% <ArrowRight className="w-4 h-4 -rotate-45" />
                     </span>
                     <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Last 24 Hours</span>
                  </div>
               </div>
               
               {/* Mock Graph UI */}
               <div className="h-48 w-full flex items-end gap-2 px-2 pb-2 border-b border-white/5">
                  {[40, 65, 45, 90, 65, 80, 100, 85, 95, 70, 85, 110, 90, 120].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.05, duration: 1 }}
                      className="flex-1 bg-gradient-to-t from-brand-primary/40 to-brand-primary rounded-t-sm"
                    />
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-[9px] font-black text-white/20 uppercase tracking-[2px]">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:59</span>
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl">
               <span className="text-[10px] font-black tracking-[4px] text-brand-secondary uppercase">Live System Access</span>
               <h3 className="text-3xl font-black text-white mt-1 mb-10">Daily Active Users</h3>
               
               <div className="space-y-8">
                  {[
                    { type: "Student Terminals", count: "1,240", percent: 65 },
                    { type: "Tutor Terminals", count: "482", percent: 25 },
                    { type: "System Admin", count: "14", percent: 10 },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-3">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{stat.type}</span>
                          <span className="text-sm font-black text-white">{stat.count}</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.percent}%` }}
                            transition={{ delay: 0.5 + (i * 0.2), duration: 1 }}
                            className="h-full bg-brand-primary"
                          />
                       </div>
                    </div>
                  ))}
               </div>

               <div className="mt-12 p-6 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl">
                  <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest leading-relaxed">
                     System load at <span className="text-white">42% Capacity</span>. No latency spikes detected in the last <span className="text-white">60 minutes</span>.
                  </p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
