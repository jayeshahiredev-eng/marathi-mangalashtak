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

  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [generatedCredentials, setGeneratedCredentials] = useState<{
    profileId: string;
    password: string;
  } | null>(null);

  // 5 digit profile id + password
  const generateCredentials = (mobile: string) => {
    const lastFourDigits = mobile.slice(-4) || '1234';

    const profileId = String(
      Math.floor(10000 + Math.random() * 90000)
    );

    const password =
      `Mng@${lastFourDigits}${Math.floor(
        10 + Math.random() * 90
      )}`;

    return { profileId, password };
  };

  // SIGN UP
  const handleSignUp = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (whatsappNumber.length < 10) {
      alert(
        'कृपया १० अंकी वैध व्हॉट्सॲप नंबर टाका.'
      );
      return;
    }

    setLoading(true);

    const { profileId, password } =
      generateCredentials(whatsappNumber);

    try {
      const fakeEmail =
        `${profileId}@marathimangalashtak.com`;

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } =
          await supabase
            .from('profiles')
            .upsert(
              {
                id: authData.user.id,
                full_name: fullName,
                mobile_number: whatsappNumber,
                profile_id: profileId,

                is_profile_complete: false,
                is_approved: false,
                is_premium: false,
                remaining_tokens: 5,

                date_of_birth: '2000-01-01',
                gender: 'Male',

                city: '',
                caste: '',
                education: '',
                profession: '',

                generated_username:
                  profileId,
              },
              {
                onConflict: 'id',
              }
            );

        if (profileError)
          throw profileError;

        setGeneratedCredentials({
          profileId,
          password,
        });
      }
    } catch (error: any) {
      alert(
        `नोंदणी करताना त्रुटी आली: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // LOGIN
  const handleSignIn = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !loginUsername.trim() ||
      !loginPassword
    ) {
      alert(
        'कृपया लॉगिन आयडी आणि पासवर्ड टाका.'
      );
      return;
    }

    setLoading(true);

    try {
      const cleanProfileId =
        loginUsername.trim();

      const fakeEmail =
        `${cleanProfileId}@marathimangalashtak.com`;

      const { error } =
        await supabase.auth.signInWithPassword(
          {
            email: fakeEmail,
            password: loginPassword,
          }
        );

      if (error) throw error;

      alert(
        'लॉगइन यशस्वी झाले! 🎉'
      );

      window.location.href = '/';
    } catch {
      alert(
        'लॉगिन अपयशी: आयडी किंवा पासवर्ड चुकीचा आहे.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${poppins.className} min-h-screen bg-slate-50 flex items-center justify-center p-4 text-gray-800`}
    >
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

        <h2 className="text-3xl font-bold text-center text-orange-600 mb-1">
          मराठी मंगलाष्टक 💍
        </h2>

        <p className="text-center text-gray-400 text-xs mb-8">
          रेशीमगाठी जुळवण्याचे हक्काचे ठिकाण
        </p>

        {generatedCredentials ? (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl space-y-4">
            <div className="text-center text-amber-800 font-bold text-sm">
              🎉 नोंदणी यशस्वी झाली आहे!
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-100 space-y-2 text-xs">
              <p>
                🆔 <strong>तुमचा लॉगिन आयडी:</strong>{' '}
                <span className="text-sm font-mono font-bold text-gray-900 select-all">
                  {generatedCredentials.profileId}
                </span>
              </p>

              <p>
                🔒 <strong>तुमचा पासवर्ड:</strong>{' '}
                <span className="text-sm font-mono font-bold text-gray-900 select-all">
                  {generatedCredentials.password}
                </span>
              </p>
            </div>

            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-[11px] font-bold leading-relaxed border border-red-100">
              ⚠️ महत्त्वाची सूचना: कृपया वरील 'लॉगिन आयडी' आणि 'पासवर्ड'
              तुमच्या मोबाईलमध्ये स्क्रीनशॉट काढून घ्या.
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
                className={`flex-1 suppressHydrationWarning py-2 text-xs font-bold rounded-lg transition ${
                  isSignUp
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                नवीन नोंदणी (Register)
              </button>

              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 suppressHydrationWarning py-2 text-xs font-bold rounded-lg transition ${
                  !isSignUp
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                लॉगिन (Login)
              </button>
            </div>

            {isSignUp ? (
              <form
                onSubmit={handleSignUp}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    पूर्ण नाव
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="उदा. रोहन विलास पाटील"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    className="w-full p-3 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    व्हॉट्सॲप नंबर (WhatsApp Number)
                  </label>

                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="उदा. 9876543210"
                    value={whatsappNumber}
                    onChange={(e) =>
                      setWhatsappNumber(
                        e.target.value.replace(
                          /[^0-9]/g,
                          ''
                        )
                      )
                    }
                    className="w-full p-3 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-3 rounded-xl text-xs shadow-md transition pt-3.5 disabled:opacity-50"
                >
                  {loading
                    ? 'नोंदणी होत आहे...'
                    : 'खाते तयार करा (पासवर्ड जनरेट करा) 🚀'}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleSignIn}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    लॉगिन आयडी (Login ID)
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="उदा. 54321"
                    value={loginUsername}
                    onChange={(e) =>
                      setLoginUsername(
                        e.target.value
                      )
                    }
                    className="w-full p-3 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    पासवर्ड (Password)
                  </label>

                  <input
                    type="password"
                    required
                    placeholder="तुमचा जनरेट झालेला पासवर्ड टाका"
                    value={loginPassword}
                    onChange={(e) =>
                      setLoginPassword(
                        e.target.value
                      )
                    }
                    className="w-full p-3 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold p-3 rounded-xl text-xs shadow-md transition pt-3.5"
                >
                  {loading
                    ? 'लॉगिन होत आहे...'
                    : 'सुरक्षित लॉगिन करा 🔑'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}