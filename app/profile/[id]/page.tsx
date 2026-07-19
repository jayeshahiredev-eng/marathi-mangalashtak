'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
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

interface Profile {
  id: string;
  gender: string;
  full_name: string;
  date_of_birth: string;
  birth_time: string;
  rashi: string;
  gotra?: string;
  birth_place: string;
  complexion: string;
  height: string;
  religion_caste: string;
  education: string;
  profession: string;
  father_name: string;
  father_occupation: string;
  mother_name: string;
  siblings: string;
  village?: string;
  brothers_count?: number;
  sisters_count?: number;
  mother_aadhaar?: string;
  mother_relation?: string;
  expectations?: string;
  uncles_paternal: string;
  uncles_maternal: string;
  relatives: string;
  profile_pic_url?: string;
  avatar_url?: string;
  profile_id?: string;
  mobile_number?: string;
  address?: string;
  mama_surname?: string;
  is_premium?: boolean;
}

export default function ProfileDetails() {
  const router = useRouter();
  const params = useParams();
  const targetProfileId = params.id;

  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  
  const showMessage = (
    text: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setMessage({ text, type });
  
    setTimeout(() => {
      setMessage(null);
    }, 10000);
  };

  const [confirmBox, setConfirmBox] = useState<{
    text: string;
  } | null>(null);



  useEffect(() => {
    if (!targetProfileId) return;

    const fetchAllData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: myData } = await supabase
          .from('profiles')
          .select('id, is_premium, remaining_tokens, unlocked_contacts, mobile_number')
          .eq('id', user.id)
          .single();

        setMyProfile(myData);

        const unlockedList = myData?.unlocked_contacts || [];
        if (myData?.is_premium || unlockedList.includes(targetProfileId) || myData?.id === targetProfileId) {
          setIsUnlocked(true);
        }
      }

      const { data: targetData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetProfileId)
        .eq('is_approved', true)
        .single();

      if (!error && targetData) {
        setTargetProfile(targetData);
      }
      setLoading(false);
    };

    fetchAllData();
  }, [targetProfileId, router]);

  // 🪙 टोकन कमी करून संपर्क अनलॉक करण्याचे मुख्य फंक्शन
  const handleUnlockContact = async () => {
    if (!myProfile || !targetProfile) {
      showMessage('संपर्क पाहण्यासाठी लॉगिन करा.', 'error');
      return;
    }
  
    if (myProfile.is_premium) {
      setIsUnlocked(true);
      return;
    }
  
    const currentTokens = myProfile.remaining_tokens ?? 0;
  
    if (currentTokens <= 0) {
      const adminMobile = '919359915379';
      const msg = `मला या प्रोफाईलचा संपर्क हवा आहे. प्रोफाईल आयडी: ${targetProfile.profile_id || targetProfile.id}. माझा नंबर: ${myProfile.mobile_number || '-----'}`;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${adminMobile}&text=${encodeURIComponent(msg)}`;
      window.open(whatsappUrl, '_blank');
      return;
    }
  
    setConfirmBox({
      text: `या स्थळाची संपर्क माहिती बघायची आहे का?`,
    });
  
    return;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xl font-semibold text-gray-600 animate-pulse">बायोडेटा उघडत आहे...</p>
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl font-bold text-red-600 mb-4">क्षमस्व, हा बायोडेटा सापडला नाही.</p>
        <button onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))} className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold">
          मुख्य पानावर परत जा
        </button>
      </div>
    );
  }

  const val = (text?: string) => text?.trim() || '—';

  return (
    <div className={`${poppins.className} min-h-screen bg-slate-50 pb-12 text-gray-800 relative`}>
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center shadow-sm sticky top-0 z-40">
        {/* <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2 text-sm">
          ⬅️ मागे जा (Back)
        </button> */}
        
        <h1 className="text-xl font-bold text-orange-700 mx-auto">विस्तृत बायोडेटा पत्रक</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          
          {/* १. हेडर ब्लॉक */}
          <div className={`p-8 text-white ${targetProfile.gender === 'Female' ? 'bg-gradient-to-r from-rose-500 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-indigo-700'} flex flex-col sm:flex-row items-center gap-6`}>
            <div 
              onClick={() => (targetProfile.profile_pic_url || targetProfile.avatar_url) && setIsImageModalOpen(true)}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/30 bg-white/10 flex-shrink-0 shadow-lg cursor-pointer"
            >
              {(targetProfile.profile_pic_url || targetProfile.avatar_url) ? (
                <img src={targetProfile.profile_pic_url || targetProfile.avatar_url} alt={targetProfile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {targetProfile.gender === 'Female' ? '👩' : '👨'}
                </div>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start items-center">
                <span className="text-xs font-bold uppercase bg-white/25 px-3 py-1 rounded-full">
                  {targetProfile.gender === 'Female' ? 'वधू प्रवर्ग 👩' : 'वर प्रवर्ग 👨'}
                </span>
                {targetProfile.is_premium && (
                  <span className="text-xs font-bold bg-amber-400 text-amber-950 px-3 py-1 rounded-full shadow-sm">
                    👑 प्रीमियम मेंबर
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-bold mt-2">{val(targetProfile.full_name)}</h2>
              <div className="mt-2 inline-block bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-lg border border-white/30">
                अनुक्रमांक ID: {targetProfile.profile_id || '----'}
              </div>
            </div>
          </div>

          {/* माहितीचे ब्लॉक्स */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* २. वैयक्तिक तपशील */}
            <div>
              <h3 className="text-lg font-bold text-orange-600 border-b border-orange-100 pb-2 mb-4">✨ वैयक्तिक तपशील</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-[15px]">
                <p className="text-gray-600"><strong>नाव -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.full_name)}</span></p>
                <p className="text-gray-600"><strong>जन्म तारीख -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.date_of_birth)}</span></p>
                <p className="text-gray-600"><strong>जन्म वेळ -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.birth_time)}</span></p>
                <p className="text-gray-600"><strong>राशी -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.rashi)}</span></p>
                <p className="text-gray-600"><strong>उंची -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.height)}</span></p>
                <p className="text-gray-600"><strong>धर्म-जात -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.religion_caste)}</span></p>
              </div>
            </div>

            {/* ३. शिक्षण आणि नोकरी */}
            <div>
              <h3 className="text-lg font-bold text-orange-600 border-b border-orange-100 pb-2 mb-4">💼 शिक्षण आणि नोकरी</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-[15px]">
                <p className="text-gray-600"><strong>शिक्षण -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.education)}</span></p>
                <p className="text-gray-600"><strong>नोकरी/व्यवसाय -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.profession)}</span></p>
              </div>
            </div>

            {/* ४. कौटुंबिक तपशील */}
            <div>
              <h3 className="text-lg font-bold text-orange-600 border-b border-orange-100 pb-2 mb-4">👨‍👩‍👦 कौटुंबिक तपशील</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-[15px] mb-4">
                <p className="text-gray-600"><strong>पत्ता -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.address)}</span></p>
                <p className="text-gray-600"><strong>भावंडे -</strong> <span className="text-gray-900 font-semibold">{targetProfile.siblings ?? '—'}</span></p>
                <p className="text-gray-600"><strong>मामा -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.mama_surname)}</span></p>
                <p className="text-gray-600"><strong>नातेसंबंध -</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.relatives)}</span></p>
              </div>
            </div>

            {/* अपेक्षा सेक्शन */}
            <div>
              <h3 className="text-lg font-bold text-orange-600 border-b border-orange-100 pb-2 mb-4">🎯 अपेक्षा</h3>
              <div className="text-[15px] text-gray-700">
                {targetProfile.expectations ? (
                  <p className="whitespace-pre-wrap">{targetProfile.expectations}</p>
                ) : (
                  <p className="text-gray-500">—</p>
                )}
              </div>
            </div>

            {/* 🔒 ५. कस्टमाइज्ड पेवॉल आणि संपर्क ब्लॉक लॉजिक */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-orange-600 mb-4">📞 संपर्क आणि पत्ता माहिती</h3>
              {message && (
  <div
    className={`max-w-3xl mx-auto px-4 mt-4 mb-2`}
  >
    <div
      className={`p-4 rounded-2xl border text-sm font-semibold ${
        message.type === 'success'
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      {message.text}
    </div>
  </div>
)}

{confirmBox && (
  <div className="max-w-3xl mx-auto px-4 mt-4 mb-2">
    <div className="p-4 rounded-2xl border text-sm font-semibold bg-yellow-50 text-yellow-800 border-yellow-200">
      <div className="mb-3">
        {confirmBox.text}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setConfirmBox(null)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-xl text-xs"
        >
          नाही 
        </button>

        <button
          onClick={async () => {
            setConfirmBox(null);

            setActionLoading(true);
            try {
              const updatedTokens =
                (myProfile.remaining_tokens ?? 0) - 1;

              const updatedUnlockedContacts = [
                ...(myProfile.unlocked_contacts || []),
                targetProfile?.id,
              ];

              const { error } = await supabase
                .from('profiles')
                .update({
                  remaining_tokens: updatedTokens,
                  unlocked_contacts: updatedUnlockedContacts,
                })
                .eq('id', myProfile.id);

              if (error) throw error;

              setMyProfile((prev: any) => ({
                ...prev,
                remaining_tokens: updatedTokens,
                unlocked_contacts: updatedUnlockedContacts,
              }));

              setIsUnlocked(true);

              showMessage(
                "🎉 संपर्क यशस्वीरित्या अनलॉक झाला आहे!",
                "success"
              );
            } catch (err: any) {
              showMessage(
                "त्रुटी आली: " + err.message,
                "error"
              );
            } finally {
              setActionLoading(false);
            }
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
        >
          हो
        </button>
      </div>
    </div>
  </div>
)}
              
              {isUnlocked ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 text-[15px] animate-fade-in">
                  <p className="text-emerald-900 font-bold flex items-center gap-2">
                    ✅ माहिती अनलॉक झाली आहे {!myProfile?.is_premium && <span className="text-xs font-normal text-emerald-700"></span>}
                  </p>
                  <p className="text-gray-700">📱 <strong>मोबाईल नंबर:</strong> <a href={`tel:${targetProfile.mobile_number}`} className="text-blue-600 font-bold underline ml-1">{val(targetProfile.mobile_number)}</a></p>
                  <p className="text-gray-700">📍 <strong>पूर्ण पत्ता:</strong> <span className="text-gray-900 font-semibold">{val(targetProfile.address)}</span></p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center shadow-sm">
                  <p className="text-amber-900 font-semibold mb-2">🔒 संपर्क माहिती LOCK आहे</p>
                  
                  {/* 🌟 परफेक्ट लॉजिक: जर अनलॉक केलेल्या प्रोफाईल्स ५ पेक्षा कमी असतील आणि शिल्लक टोकन ५ किंवा कमी असतील तरच 'मोफत' दिसेल */}
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed"> सुरक्षिततेसाठी संपर्क क्रमांक लपवला आहे.
                    {/* सुरक्षिततेसाठी संपर्क क्रमांक लपवला आहे. तुम्ही {' '}
                    <strong className="text-sm font-mono text-orange-700 bg-white border border-orange-200 px-2 py-0.5 rounded">
                      {myProfile?.remaining_tokens ?? 0}
                    </strong>{' '}
                    {((myProfile?.unlocked_contacts?.length ?? 0) < 5 && (myProfile?.remaining_tokens ?? 0) <= 5) 
                      ? 'संपर्क मोफत' 
                      : 'संपर्क'}{' '}
                     बघू शकतात  */}
                  </p>

                  {/* <button 
                    onClick={handleUnlockContact}
                    disabled={actionLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow-md disabled:bg-gray-400"
                  >
                    {actionLoading ? 'अनलॉक होत आहे...' : 'संपर्क माहिती पहा 🚀'}
                  </button> */}

                <a
  href={`https://api.whatsapp.com/send?phone=919359915379&text=${encodeURIComponent(`मला या प्रोफाईलचा संपर्क हवा आहे. प्रोफाईल आयडी: ${targetProfile.profile_id || targetProfile.id}.`)}`}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-3 inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow-md"
>
  संपर्क मिळवा 
</a>

                  {/* 🌟 प्रिमियम खरेदीची ओळ फक्त अगदी सुरुवातीच्या नवीन फ्री युझर्सनाच दिसेल */}
                  {((myProfile?.unlocked_contacts?.length ?? 0) < 5 && (myProfile?.remaining_tokens ?? 0) <= 5) && (
                    <p className="text-[10px] text-gray-400 mt-2">
                      {/* किंवा अमर्यादित बायोडाटा पाहण्यासाठी प्रिमियम प्लॅन खरेदी करा. */}
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* फुल-स्क्रीन इमेज मोडल */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" onClick={() => setIsImageModalOpen(false)}>
          <img src={targetProfile.profile_pic_url || targetProfile.avatar_url || ''} alt={targetProfile.full_name} className="max-w-full max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}