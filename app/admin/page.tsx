'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Noto_Sans_Devanagari } from 'next/font/google';

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

interface UserProfile {
  id: string;
  profile_id: string;
  full_name: string;
  mobile_number: string;
  username: string;
  is_approved: boolean;
  is_premium: boolean;
  remaining_tokens: number;
  gender: string;
  created_at: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // आकडेवारी स्टेट्स
  const [stats, setStats] = useState({ total: 0, approved: 0, premium: 0 });

  // 🚨 १. ॲडमिन चेकिंग लॉजिक
  useEffect(() => {
    const checkAdminAccess = async () => {
      setCheckingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // ⚠️ येथे तुझा स्वतःचा मुख्य युझरनेम किंवा ईमेल आयडी टाक भावा!
      // सध्या आपण साईन-अप वेळी बनवलेले फेक ईमेल किंवा तुझा युझरनेम चेक करत आहोत.
      const adminEmail = user.email || '';
      
      // जर ईमेलमध्ये 'admin' असेल किंवा तुझा ठराविक ईमेल असेल तरच ॲक्सेस मिळेल
      if (adminEmail.includes('admin') || adminEmail === 'jayesh_madhukar_ahire_5379@marathimangalashtak.com') {
        setIsAdmin(true);
        fetchAdminData();
      } else {
        setIsAdmin(false);
      }
      setCheckingAuth(false);
    };

    checkAdminAccess();
  }, [router]);

  // २. सर्व डेटाबेस प्रोफाईल्स आणणे
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allProfiles = data || [];
      setProfiles(allProfiles);

      // आकडेवारी कॅल्क्युलेट करा
      const approvedCount = allProfiles.filter(p => p.is_approved).length;
      const premiumCount = allProfiles.filter(p => p.is_premium).length;
      setStats({
        total: allProfiles.length,
        approved: approvedCount,
        premium: premiumCount
      });
    } catch (err: any) {
      alert('डेटा लोड करताना त्रुटी: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ३. खाते मंजूर / नामंजूर करणे (Approve Toggle)
  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      // लोकल स्टेट अपडेट
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_approved: !currentStatus } : p));
      setStats(prev => ({ ...prev, approved: currentStatus ? prev.approved - 1 : prev.approved + 1 }));
    } catch (err: any) {
      alert('अपडेट अयशस्वी: ' + err.message);
    }
  };

  // ४. प्रीमियम स्टेटस देणे / काढणे (Premium Toggle)
  const togglePremium = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_premium: !currentStatus } : p));
      setStats(prev => ({ ...prev, premium: currentStatus ? prev.premium - 1 : prev.premium + 1 }));
    } catch (err: any) {
      alert('प्रीमियम अपडेट अयशस्वी: ' + err.message);
    }
  };

  // ५. टोकन्स वाढवणे (+5 Tokens)
  const addTokens = async (id: string, currentTokens: number) => {
    const newTokens = (currentTokens || 0) + 5;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ remaining_tokens: newTokens })
        .eq('id', id);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === id ? { ...p, remaining_tokens: newTokens } : p));
      alert('🎉 ५ टोकन्स यशस्वीरित्या जोडले गेले!');
    } catch (err: any) {
      alert('टोकन वाढवताना त्रुटी: ' + err.message);
    }
  };

  // सर्च फिल्टर लॉजिक
  const filteredProfiles = profiles.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.full_name?.toLowerCase().includes(query) ||
      p.profile_id?.toLowerCase().includes(query) ||
      p.mobile_number?.includes(query) ||
      p.username?.toLowerCase().includes(query)
    );
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="animate-pulse font-semibold">ॲडमीन सुरक्षा तपासत आहे...</p>
      </div>
    );
  }

  // 🔒 जर युझर ॲडमिन नसेल तर सरळ नो-एन्ट्री दाखवा
  if (!isAdmin) {
    return (
      <div className={`${devanagari.className} min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 text-white`}>
        <span className="text-6xl mb-4">🚫</span>
        <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied / प्रवेश निषिद्ध</h1>
        <p className="text-gray-400 text-sm max-w-sm mb-6">तुम्हाला या गुप्त ॲडमिन पॅनलमध्ये प्रवेश करण्याची परवानगी नाही.</p>
        <button onClick={() => router.push('/')} className="bg-orange-600 px-6 py-2 rounded-xl font-bold text-sm">
          मुख्य पानावर जा
        </button>
      </div>
    );
  }

  return (
    <div className={`${devanagari.className} min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8`}>
      
      {/* हेडर */}
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-amber-500 flex items-center gap-2">
            ⚙️ मराठी मंगलाष्टक ॲडमिन पॅनल
          </h1>
          <p className="text-xs text-slate-400 mt-1">येथून तुम्ही थेट मंजुरी, प्रिमियम आणि टोकन्स नियंत्रित करू शकता.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAdminData} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition">
            🔄 रिफ्रेश डेटा
          </button>
          <button onClick={() => router.push('/')} className="bg-orange-600 hover:bg-orange-700 text-xs font-bold px-4 py-2.5 rounded-xl text-white transition">
            🏠 होम पेजला जा
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        
        {/* आकडेवारी कार्ड्स */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/60 shadow-sm">
            <span className="block text-xs font-bold text-slate-400 uppercase">एकूण नोंदणी</span>
            <span className="text-3xl font-black text-white mt-1 block">{stats.total} बायोडाटा</span>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/60 shadow-sm">
            <span className="block text-xs font-bold text-slate-400 uppercase">मंजूर खाती (Approved)</span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block">{stats.approved} युझर्स</span>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/60 shadow-sm">
            <span className="block text-xs font-bold text-slate-400 uppercase">👑 प्रीमियम युझर्स</span>
            <span className="text-3xl font-black text-amber-400 mt-1 block">{stats.premium} युझर्स</span>
          </div>
        </div>

        {/* सर्च बार सेक्शन */}
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/60">
          <input
            type="text"
            placeholder="🔍 नाव, ५ अंकी ID, मोबाईल नंबर किंवा युझरनेमने जोडीदार शोधा..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
          />
        </div>

        {/* मुख्य टेबल ग्रिड / लिस्ट */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-amber-500">युझर व्यवस्थापन यादी ({filteredProfiles.length})</h3>
          </div>

          {loading ? (
            <p className="p-12 text-center text-slate-400 font-medium animate-pulse">डेटाबेस लोड होत आहे...</p>
          ) : filteredProfiles.length === 0 ? (
            <p className="p-12 text-center text-slate-500 font-medium">एकही युझर सापडला नाही. 🔍</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">युझर माहिती / ID</th>
                    <th className="p-4">संपर्क / युझरनेम</th>
                    <th className="p-4 text-center">मंजुरी (Approval)</th>
                    <th className="p-4 text-center">प्रीमियम स्टेटस</th>
                    <th className="p-4 text-center">शिल्लक टोकन्स</th>
                    <th className="p-4 text-center">ॲक्शन्स</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-sm">
                  {filteredProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-700/30 transition">
                      
                      {/* नाव आणि आयडी */}
                      <td className="p-4">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          {p.full_name || '—'} 
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${p.gender === 'Female' ? 'bg-rose-900/40 text-rose-300' : 'bg-blue-900/40 text-blue-300'}`}>
                            {p.gender === 'Female' ? 'वधू' : 'वर'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">ID: <span className="text-amber-500 font-bold">{p.profile_id || '—'}</span></div>
                      </td>

                      {/* संपर्क माहिती */}
                      <td className="p-4">
                        <div className="text-slate-200 font-semibold">{p.mobile_number || '—'}</div>
                        <div className="text-xs text-slate-500 font-mono">User: {p.username || '—'}</div>
                      </td>

                      {/* अप्रूव्हल स्टेटस */}
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${p.is_approved ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                          {p.is_approved ? '✅ मंजूर (Live)' : '⏳ प्रलंबित'}
                        </span>
                      </td>

                      {/* प्रीमियम स्टेटस */}
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${p.is_premium ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}>
                          {p.is_premium ? '👑 PREMIUM' : 'Free User'}
                        </span>
                      </td>

                      {/* शिल्लक टोकन्स */}
                      <td className="p-4 text-center font-mono font-bold text-slate-200">
                        🪙 {p.remaining_tokens ?? 0}
                      </td>

                      {/* ॲक्शन बटन्स */}
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          
                          {/* १. अप्रूव्हल बटन */}
                          <button
                            onClick={() => toggleApproval(p.id, p.is_approved)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${p.is_approved ? 'bg-red-900/60 hover:bg-red-900 text-red-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                          >
                            {p.is_approved ? 'Reject' : 'Approve ✅'}
                          </button>

                          {/* २. प्रीमियम बटन */}
                          <button
                            onClick={() => togglePremium(p.id, p.is_premium)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${p.is_premium ? 'bg-slate-900 text-amber-400 hover:bg-slate-950 border border-amber-500/40' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'}`}
                          >
                            {p.is_premium ? 'Remove Premium' : 'Give Premium 👑'}
                          </button>

                          {/* ३. टोकन वाढवणे */}
                          <button
                            onClick={() => addTokens(p.id, p.remaining_tokens)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          >
                            +5 Tokens 🪙
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}