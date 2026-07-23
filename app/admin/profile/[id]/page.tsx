'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Poppins } from 'next/font/google';

const poppins = Poppins({ subsets: ['latin'], weight: ['400','600','700'] });

export default function AdminProfileView() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (!error && data) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [profileId]);

  const val = (v?: any) => v ?? '—';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="animate-pulse text-gray-600">प्रोफाईल लोड करत आहे...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-bold">प्रोफाइल सापडले नाही.</p>
      </div>
    );
  }

  return (
    <div className={`${poppins.className} min-h-screen bg-slate-50 text-gray-800 p-6`}>
      <header className="max-w-3xl mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
          {profile.profile_pic_url || profile.avatar_url ? (
            <img src={profile.profile_pic_url || profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">{profile.gender === 'Female' ? '👩' : '👨'}</div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold">{val(profile.full_name)}</h1>
          <div className="text-sm text-gray-500 mt-1">ID: <span className="font-mono text-gray-700">{val(profile.profile_id)}</span></div>
          <div className="mt-2 text-xs text-gray-600">{profile.is_premium ? '👑 प्रीमियम' : ''} {profile.is_approved ? '' : '⏳ प्रलंबित'}</div>
        </div>

        <div className="ml-auto">
          <button onClick={() => (window.history.length > 1 ? router.back() : router.push('/admin'))} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm">परत जा</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6">
        <section>
          <h3 className="text-lg font-bold text-orange-600 mb-3">वैयक्तिक माहिती</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <div><strong>नाव:</strong> {val(profile.full_name)}</div>
            <div><strong>लघूनाव:</strong> {val(profile.short_name)}</div>
            <div><strong>लिंग:</strong> {val(profile.gender)}</div>
            <div><strong>जन्म तारीख:</strong> {val(profile.date_of_birth)}</div>
            <div><strong>वय:</strong> {profile.date_of_birth ? Math.abs(new Date(Date.now() - new Date(profile.date_of_birth).getTime()).getUTCFullYear() - 1970) + ' वर्षे' : '—'}</div>
            <div><strong>जन्म वेळ:</strong> {val(profile.birth_time)}</div>
            <div><strong>जन्म ठिकाण:</strong> {val(profile.birth_place)}</div>
            <div><strong>उंची:</strong> {val(profile.height)}</div>
            <div><strong>रंगरूप:</strong> {val(profile.complexion)}</div>
            <div><strong>धर्म/जात:</strong> {val(profile.religion_caste)}</div>
            <div><strong>गोत्र:</strong> {val(profile.gotra)}</div>
            <div><strong>राशी:</strong> {val(profile.rashi)}</div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-orange-600 mb-3">शिक्षण आणि नोकरी</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <div><strong>शिक्षण:</strong> {val(profile.education)}</div>
            <div><strong>व्यवसाय:</strong> {val(profile.profession)}</div>
            <div><strong>पत्ता:</strong> {val(profile.address)}</div>
            <div><strong>मोबाईल नंबर:</strong> {val(profile.mobile_number)}</div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-orange-600 mb-3">कौटुंबिक तपशील</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <div><strong>वडिलांचे नाव:</strong> {val(profile.father_name)}</div>
            <div><strong>वडिलांचा व्यवसाय:</strong> {val(profile.father_occupation)}</div>
            <div><strong>आईचे नाव:</strong> {val(profile.mother_name)}</div>
            <div><strong>भाऊ संख्या:</strong> {val(profile.brothers_count)}</div>
            <div><strong>बहीण संख्या:</strong> {val(profile.sisters_count)}</div>
            <div><strong>मामा/मावशी आडनाव:</strong> {val(profile.uncles_maternal)}</div>
            <div><strong>पिता वडिलांचे काका:</strong> {val(profile.uncles_paternal)}</div>
            <div><strong>नातेवाईक:</strong> {val(profile.relatives)}</div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-orange-600 mb-3">इतर</h3>
          <div className="text-sm text-gray-700">
            <p><strong>अपेक्षा:</strong></p>
            <p className="whitespace-pre-wrap">{val(profile.expectations)}</p>
            <p className="mt-2"><strong>प्रीमियम स्थिती:</strong> {profile.is_premium ? 'होय' : 'नाही'}</p>
            <p><strong>मंजुरी स्थिती:</strong> {profile.is_approved ? 'मंजूर' : 'प्रलंबित'}</p>
          </div>
        </section>
          <section>
        <h3 className="text-lg font-bold text-orange-600 mb-3">
        📋 शेअर करण्यासाठी तयार संदेश
        </h3>

        <textarea
        readOnly
        value={`💍 *मराठी मंगलाष्टक - विवाह परिचय*

        👤 *नाव:* ${val(profile.full_name)}
        🆔 *प्रोफाईल आयडी:* ${val(profile.profile_id)}
        🎂 *वय:* ${
        profile.date_of_birth
          ? Math.abs(
              new Date(Date.now() - new Date(profile.date_of_birth).getTime()).getUTCFullYear() - 1970
            ) + ' वर्षे'
          : '—'
        }
        👨 *वडिलांचे नाव:* ${val(profile.father_name)}
        🎓 *शिक्षण:* ${val(profile.education)}
        💼 *व्यवसाय:* ${val(profile.profession)}
        📏 *उंची:* ${val(profile.height)}
        🕉 *धर्म / जात:* ${val(profile.religion_caste)}
        🌟 *राशी:* ${val(profile.rashi)}

        🏡 *पत्ता:*
        ${val(profile.address)}

        📞 *संपर्क क्रमांक:*
        ${val(profile.mobile_number)}

        ━━━━━━━━━━━━━━━━━━
        अधिक माहितीसाठी संपर्क करा.
        मराठी मंगलाष्टक 💍`}
        className="w-full h-80 rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm font-mono"
        />

        <button
        onClick={() =>
        navigator.clipboard.writeText(`💍 *मराठी मंगलाष्टक - विवाह परिचय*

        👤 *नाव:* ${val(profile.full_name)}
        🆔 *प्रोफाईल आयडी:* ${val(profile.profile_id)}
        🎂 *वय:* ${
            profile.date_of_birth
              ? Math.abs(
                  new Date(Date.now() - new Date(profile.date_of_birth).getTime()).getUTCFullYear() - 1970
                ) + ' वर्षे'
              : '—'
          }
        👨 *वडिलांचे नाव:* ${val(profile.father_name)}
        🎓 *शिक्षण:* ${val(profile.education)}
        💼 *व्यवसाय:* ${val(profile.profession)}
        📏 *उंची:* ${val(profile.height)}
        🕉 *धर्म / जात:* ${val(profile.religion_caste)}
        🌟 *राशी:* ${val(profile.rashi)}

        🏡 *पत्ता:*
        ${val(profile.address)}

        📞 *संपर्क क्रमांक:*
        ${val(profile.mobile_number)}

        ━━━━━━━━━━━━━━━━━━
        अधिक माहितीसाठी संपर्क करा.
        मराठी मंगलाष्टक 💍`)
        }
        className="mt-3 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold"
        >
        📋 संदेश कॉपी करा
        </button>
        </section>
        
      </main>
    </div>
  );
}
