'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, ShieldAlert, ShieldCheck, 
  MoreHorizontal, ArrowLeft, RefreshCcw, Filter,
  Ban, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function UserRegistry() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push('/auth');
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data?.role !== 'admin') return router.push('/');
          fetchUsers();
        });
    });
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <RefreshCcw className="w-12 h-12 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-12">
      <header className="flex items-center justify-between mb-16">
        <div>
           <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-brand-secondary hover:text-white transition-colors mb-4 uppercase text-xs font-black tracking-widest group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Dashboard
           </Link>
           <h1 className="text-5xl font-black tracking-tight">User <span className="text-brand-primary">Registry</span></h1>
           <p className="text-brand-secondary font-medium uppercase tracking-[4px] text-[10px] mt-2">Active Surveillance & Account Management</p>
        </div>
        <div className="flex gap-4">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary group-focus-within:text-brand-primary transition-colors" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl w-80 text-sm focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all"
              />
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* User List Table */}
        <div className="xl:col-span-2 space-y-4">
           <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-brand-secondary">Identity</th>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-brand-secondary">Role</th>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-brand-secondary">Strikes</th>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-brand-secondary">Status</th>
                       <th className="p-6"></th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        onClick={() => setSelectedUser(user)}
                        className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer ${selectedUser?.id === user.id ? 'bg-brand-primary/5' : ''}`}
                      >
                         <td className="p-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center font-black text-brand-primary">
                                  {user.full_name?.charAt(0) || 'U'}
                               </div>
                               <div>
                                  <p className="font-bold text-sm">{user.full_name || 'Anonymous'}</p>
                                  <p className="text-[10px] text-brand-secondary font-mono">{user.email}</p>
                               </div>
                            </div>
                         </td>
                         <td className="p-6 text-xs font-black uppercase tracking-tighter italic">
                            <span className={user.role === 'admin' ? 'text-red-400' : 'text-brand-secondary'}>{user.role}</span>
                         </td>
                         <td className="p-6">
                            <div className="flex gap-1">
                               {[1, 2, 3].map(i => (
                                 <div key={i} className={`w-2 h-2 rounded-full ${i <= (user.strikes || 0) ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/10'}`} />
                               ))}
                            </div>
                         </td>
                         <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.is_banned ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                               {user.is_banned ? 'Deauthorized' : 'Active'}
                            </span>
                         </td>
                         <td className="p-6 text-right">
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                               <MoreHorizontal className="w-5 h-5 text-brand-secondary" />
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* User Intel Panel */}
        <div className="xl:col-span-1">
           <AnimatePresence mode="wait">
              {selectedUser ? (
                <motion.div 
                  key={selectedUser.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl h-fit sticky top-12"
                >
                   <div className="text-center mb-8">
                      <div className="w-24 h-24 rounded-3xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mx-auto mb-6">
                         <Shield className="w-12 h-12 text-brand-primary" />
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">{selectedUser.full_name}</h2>
                      <p className="text-brand-secondary text-[10px] font-black uppercase tracking-[3px] mt-2">ID: {selectedUser.id.substring(0, 16)}...</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                         <span className="block text-xs font-black text-brand-secondary uppercase tracking-widest mb-1">Sessions</span>
                         <span className="text-xl font-black">14</span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                         <span className="block text-xs font-black text-brand-secondary uppercase tracking-widest mb-1">Reviews</span>
                         <span className="text-xl font-black">4.9/5</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <button className="w-full py-4 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/40 text-red-400 font-black rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                         <ShieldAlert className="w-4 h-4" /> Issue Logic Strike
                      </button>
                      <button className={`w-full py-4 ${selectedUser.is_banned ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-brand-dark font-black rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3`}>
                         {selectedUser.is_banned ? <><ShieldCheck className="w-4 h-4" /> Authorize Account</> : <><Ban className="w-4 h-4" /> Revoke System Access</>}
                      </button>
                   </div>
                </motion.div>
              ) : (
                <div className="bg-white/5 border border-white/5 border-dashed rounded-[3rem] p-20 text-center flex flex-col items-center justify-center opacity-40">
                   <Users className="w-16 h-16 mb-6 text-brand-secondary" />
                   <p className="text-xs font-black uppercase tracking-widest">Select target for surveillance</p>
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
