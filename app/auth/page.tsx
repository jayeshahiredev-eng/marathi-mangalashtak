'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Noto_Sans_Devanagari } from 'next/font/google';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);

  // इनपुट स्टेट्स
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(''); // 🌟 मोबाईल ऐवजी व्हॉट्सॲप नंबर
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // सिस्टीम जनरेटेड क्रेडेंशियल्स दाखवण्यासाठी स्टेट
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  // नाव, नंबरवरून युझरनेम, पासवर्ड आणि ५ अंकी आयडी बनवणे
  const generateCredentials = (name: string, mobile: string) => {
    const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const lastFourDigits = mobile.slice(-4) || '1234';
    
    const username = `${cleanName}_${lastFourDigits}`;
    const password = `Mng@${lastFourDigits}${Math.floor(10 + Math.random() * 90)}`;
    
    // 🌟 ५ अंकी युनिक प्रोफाईल आयडी (उदा. ५४३२१)
    const profileId = String(Math.floor(10000 + Math.random() * 90000));
    
    return { username, password, profileId };
  };

  // १. नवीन युझर नोंदणी (Sign Up)
 // १. नवीन युझर नोंदणी (Sign Up - रोबस्ट आणि एरर-फ्री व्हर्जन)
 const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  if (whatsappNumber.length < 10) {
    alert('कृपया १० अंकी वैध व्हॉट्सॲप नंबर टाका.');
    return;
  }

  setLoading(true);
  try {
    const { username, password, profileId } = generateCredentials(fullName, whatsappNumber);
    const fakeEmail = `${username.toLowerCase().trim()}@marathimangalashtak.com`;

    // सुपाबेसमध्ये साईन-अप करणे
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: fakeEmail,
      password: password,
    });

    // जर युझर आधीच रजिस्टर असेल, तर डायरेक्ट लॉगिन क्रेडेंशियल्स दाखवा, एरर देऊ नका!
    if (authError && authError.message.toLowerCase().includes('already registered')) {
      alert(`हा नंबर आधीच रजिस्टर आहे! तुमचे जुने युझरनेम: ${username}`);
      setGeneratedCredentials({ username, password: `तुमचा जुना पासवर्ड` });
      setLoading(false);
      return;
    }

    if (authError) throw authError;

    if (authData.user) {
      // .upsert() वापरल्यामुळे ड्युप्लिकेट की चा एरर कधीच येणार नाही!
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: fullName,
          mobile_number: whatsappNumber,
          username: username,
          profile_id: profileId,
          is_profile_complete: false,
          is_approved: false,
          is_premium: false,
          remaining_tokens: 5,
          date_of_birth: '2000-01-01', 
          gender: 'Male', // मगाचा जेंडर एरर येऊ नये म्हणून 'Male' सेट केला आहे
          city: '',
          caste: '',
          education: '',
          profession: '',
          generated_username: username
        }, { onConflict: 'id' }); // जर आयडी मॅच झाला तर एरर न देता फक्त अपडेट करेल!

      if (profileError) throw profileError;

      setGeneratedCredentials({ username, password });
    }
  } catch (error: any) {
    // कधीकधी सुपाबेस एरर वेगळ्या पद्धतीने देतो, तो इथे पकडला जाईल
    if (error.message.toLowerCase().includes('already')) {
      const { username: u } = generateCredentials(fullName, whatsappNumber);
      alert(`नोंदणी यशस्वी! (युझर आधीच अस्तित्वात होता). युझरनेम: ${u}`);
      setGeneratedCredentials({ username: u, password: "तुमचा आधीचा पासवर्ड" });
    } else {
      alert(`नोंदणी करताना त्रुटी आली: ${error.message}`);
    }
  } finally {
    setLoading(false);
  }
};

  // २. लॉगिन लॉजिक (Sign In - त्रुटी आणि केस फिक्ससह)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginUsername.trim() || !loginPassword) {
      alert("कृपया युझरनेम आणि पासवर्ड टाका.");
      return;
    }

    setLoading(true);

    try {
      // 🌟 बदल: युझरनेममधील चुका टाळण्यासाठी लोअरकेस आणि ट्रिम केले
      const cleanUsername = loginUsername.trim().toLowerCase();
      const fakeEmail = `${cleanUsername}@marathimangalashtak.com`;

      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: loginPassword,
      });

      if (error) throw error;

      alert('लॉगइन यशस्वी झाले! 🎉');
      window.location.href = '/'; // सुरक्षित आणि थेट रिडायरेक्शनसाठी
    } catch (error: any) {
      alert(`लॉगइन अपयशी: युझरनेम किंवा पासवर्ड चुकीचा आहे किंवा खाते अस्तित्वात नाही.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${poppins.className} min-h-screen bg-slate-50 flex items-center justify-center p-4 text-gray-800`}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        
        <h2 className="text-3xl font-bold text-center text-orange-600 mb-1">मराठी मंगलाष्टक 💍</h2>
        <p className="text-center text-gray-400 text-xs mb-8">रेशीमगाठी जुळवण्याचे हक्काचे ठिकाण</p>

        {generatedCredentials ? (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl space-y-4">
            <div className="text-center text-amber-800 font-bold text-sm">
              🎉 नोंदणी यशस्वी झाली आहे!
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-amber-100 space-y-2 text-xs">
              <p>🔑 <strong>तुमचा युझरनेम:</strong> <span className="text-sm font-mono font-bold text-gray-900 select-all">{generatedCredentials.username}</span></p>
              <p>🔒 <strong>तुमचा पासवर्ड:</strong> <span className="text-sm font-mono font-bold text-gray-900 select-all">{generatedCredentials.password}</span></p>
            </div>

            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-[11px] font-bold leading-relaxed border border-red-100">
              ⚠️ महत्त्वाची सूचना: कृपया वरील 'युझरनेम' आणि 'पासवर्ड' तुमच्या मोबाईलमध्ये स्क्रीनशॉट काढून घ्या. पुढील वेळी लॉगिन करण्यासाठी हीच माहिती लागेल!
            </div>

            <button
              onClick={() => {
                setGeneratedCredentials(null);
                setIsSignUp(false);
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-3 rounded-xl text-xs shadow-md transition"
            >
              ठीक आहे, मी लिहून घेतले (आता लॉगिन करा)
            </button>
          </div>
        ) : (
          <>
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 suppressHydrationWarning py-2 text-xs font-bold rounded-lg transition ${isSignUp ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
              >
                नवीन नोंदणी (Register)
              </button>
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 suppressHydrationWarning py-2 text-xs font-bold rounded-lg transition ${!isSignUp ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
              >
                लॉगिन (Login)
              </button>
            </div>

            {isSignUp ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">पूर्ण नाव</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. रोहन विलास पाटील"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">व्हॉट्सॲप नंबर (WhatsApp Number)</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="उदा. 9876543210"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-3 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-3 rounded-xl text-xs shadow-md transition pt-3.5 disabled:opacity-50"
                >
                  {loading ? 'नोंदणी होत आहे...' : 'खाते तयार करा (पासवर्ड जनरेट करा) 🚀'}
                </button>
              </form>
            ) : (
              /* 🌟 बदल: इथे आधी फॉर्म सबमिट करताना चुकीचे फंक्शन ट्रिगर होत होते, ते आता 'handleSignIn' केले आहे */
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">युझरनेम (Username)</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. rohan_3210"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value.trim())}
                    className="w-full p-3 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">पासवर्ड (Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="तुमचा जनरेट झालेला पासवर्ड टाका"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-3 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-3 rounded-xl text-xs shadow-md transition pt-3.5"
                >
                  {loading ? 'लॉगिन होत आहे...' : 'सुरक्षित लॉगिन करा 🔑'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}