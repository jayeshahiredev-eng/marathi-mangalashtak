'use client';

import React, { useCallback, useEffect, useState } from 'react';
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

interface Profile {
  id: string;
  short_name?: string;
  full_name?: string;
  gender?: string;
  date_of_birth?: string;
  religion?: string;
  religion_caste?: string;
  birth_place?: string;
  education?: string;
  profession?: string;
  height?: string;
  rashi?: string;
  city?: string;
  caste?: string;
  state?: string;
  profile_pic_url?: string;
  avatar_url?: string;
  is_profile_complete?: boolean;
  profile_id?: string;
  is_premium?: boolean;
}

const getProfilePhoto = (p: Profile) => p.profile_pic_url || p.avatar_url || null;
const getProfileName = (p: Profile) => p.full_name?.trim() || '—';
const getProfileCaste = (p: Profile) => p.caste?.trim() || p.religion?.trim() || p.religion_caste?.trim() || '—';
const getProfileCity = (p: Profile) => p.city?.trim() || p.birth_place?.trim() || '—';
const getProfileEducation = (p: Profile) => p.education?.trim() || '—';
const getProfileProfession = (p: Profile) => p.profession?.trim() || '—';
const getProfileHeight = (p: Profile) => p.height?.trim() || '—';
const getProfileRashi = (p: Profile) => p.rashi?.trim() || '—';



export default function Home() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const showMessage = (
    text: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setMessage({ text, type });
  
    setTimeout(() => {
      setMessage(null);
    }, 10000);
  };
  
  // सुरक्षा स्टेट्स
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [myProfileId, setMyProfileId] = useState<string>('');

  // फिल्टर स्टेट्स
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [restoredFromSession, setRestoredFromSession] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  
  const [confirmBox, setConfirmBox] = useState<{
    text: string;
    onConfirm: () => void;
  } | null>(null);

  // लॉगिन असलेल्या युझरची माहिती (पब्लिक पान — लॉगिन अनिवार्य नाही)
  useEffect(() => {
    const checkUserSessionAndProfile = async () => {
      setAuthChecking(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setCurrentUserId(null);
        setIsApproved(false);
        setAuthChecking(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_profile_complete, is_approved, profile_id, id')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        setAuthChecking(false);
        return;
      }

      if (!profile.is_profile_complete) {
        router.push('/profile-setup');
        return;
      }

      const cleanId = profile.profile_id || String(profile.id).replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase();
      setMyProfileId(cleanId);
      setIsApproved(!!profile.is_approved);
      setAuthChecking(false);
    };

    checkUserSessionAndProfile();
  }, [router]);

  const toggleFavorite = async (profileId: string) => {
    if (!currentUserId) {
      showMessage('आवडलेले जतन करण्यासाठी प्रथम लॉगिन करा.', 'error');
      return;
    }

    const alreadySaved = favorites.includes(profileId);

    if (alreadySaved) {
      await supabase.from('favorites').delete().eq('user_id', currentUserId).eq('profile_id', profileId);
      setFavorites((prev) => prev.filter((id) => id !== profileId));
      if (showFavoritesOnly && favorites.length === 1) {
        setShowFavoritesOnly(false);
      }
    } else {
      await supabase.from('favorites').insert({ user_id: currentUserId, profile_id: profileId });
      setFavorites((prev) => [...prev, profileId]);
    }
  };

  const fetchProfiles = useCallback(async (pageNumber = 0) => {
    if (pageNumber === 0) setLoading(true);
    setFetchError(null);

    try {
      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_approved', true)
        .order('is_premium', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        setFetchError(error.message);
        return;
      }

      const allData = data ?? [];
      const list = currentUserId
        ? allData.filter((p) => p.id !== currentUserId)
        : allData;

      setProfiles((prev) => {
        return pageNumber === 0 ? list : [...prev, ...list];
      });

      setHasMore(allData.length === PAGE_SIZE);
    } catch (err) {
      setFetchError('प्रोफाइल लोड करता आले नाहीत.');
    } finally {
      if (pageNumber === 0)       setLoading(false);
    }
  }, [currentUserId]);

  const searchProfiles = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);

    let searchQuery = supabase
      .from('profiles')
      .select('*')
      .eq('is_approved', true)
      .or(`full_name.ilike.%${query}%,profile_id.ilike.%${query}%`)
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false });

    if (currentUserId) {
      searchQuery = searchQuery.neq('id', currentUserId);
    }

    const { data, error } = await searchQuery;

    if (!error && data) {
      setFilteredProfiles(data);
    }

    setLoading(false);
  }, [currentUserId]);

  const fetchFavorites = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('favorites')
      .select('profile_id')
      .eq('user_id', currentUserId);

    if (!error && data) {
      setFavorites(data.map((f) => f.profile_id));
    }
  };

  // Save current home state and scroll, then navigate to profile
  const navigateToProfile = (profileId: string) => {
    try {
      const state = {
        profiles,
        filteredProfiles,
        page,
        hasMore,
        genderFilter,
        searchQuery,
        showFavoritesOnly,
        favorites,
      };
      sessionStorage.setItem('marriage_home_state', JSON.stringify(state));
      sessionStorage.setItem('marriage_home_scroll', String(window.scrollY || window.pageYOffset || 0));
    } catch (e) {
      // ignore
    }

    router.push(`/profile/${profileId}`);
  };

  useEffect(() => {
    if (!authChecking) {
      const saved = sessionStorage.getItem('marriage_home_state');
      if (saved) {
        try {
          const s = JSON.parse(saved);
          // restore minimal state
          if (s.profiles) setProfiles(s.profiles);
          if (s.filteredProfiles) setFilteredProfiles(s.filteredProfiles);
          if (typeof s.page === 'number') setPage(s.page);
          if (typeof s.hasMore === 'boolean') setHasMore(s.hasMore);
          if (s.genderFilter) setGenderFilter(s.genderFilter);
          if (s.searchQuery) setSearchQuery(s.searchQuery);
          if (typeof s.showFavoritesOnly === 'boolean') setShowFavoritesOnly(s.showFavoritesOnly);
          if (s.favorites) setFavorites(s.favorites);
          setRestoredFromSession(true);

          // restore scroll after a tick
          const savedScroll = Number(sessionStorage.getItem('marriage_home_scroll') || 0);
          if (savedScroll) {
            requestAnimationFrame(() => {
              window.scrollTo(0, savedScroll);
            });
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      if (!saved) {
        fetchProfiles(0);
      }

      if (currentUserId && isApproved) {
        fetchFavorites();
      }
    }
  }, [authChecking, currentUserId, isApproved, fetchProfiles]);

  // // फिल्टर्स मॅनेजमेंट
  // useEffect(() => {
  //   let result = profiles;

  //   if (genderFilter !== 'All') {
  //     result = result.filter((p) => p.gender === genderFilter);
  //   }

  //   if (searchQuery.trim() !== '') {
  //     const query = searchQuery.toLowerCase();
  //     result = result.filter((p) => {
  //       const haystack = [p.full_name, p.profile_id].filter(Boolean).join(' ').toLowerCase();
  //       return haystack.includes(query);
  //     });
  //   }

  //   if (showFavoritesOnly) {
  //     result = result.filter((p) => favorites.includes(p.id));
  //   }

  //   setFilteredProfiles(result);
  // }, [genderFilter, searchQuery, showFavoritesOnly, favorites, profiles]);

  useEffect(() => {

    if (searchQuery.trim() !== "") {
      searchProfiles(searchQuery);
      return;
    }
  
    let result = profiles;
  
    if (genderFilter !== "All") {
      result = result.filter(
        (p) => p.gender === genderFilter
      );
    }
  
    if (showFavoritesOnly) {
      result = result.filter((p) =>
        favorites.includes(p.id)
      );
    }
  
    setFilteredProfiles(result);
  
  }, [
    searchQuery,
    genderFilter,
    showFavoritesOnly,
    favorites,
    profiles,
    searchProfiles
  ]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-gray-500 font-semibold animate-pulse">खाते तपासत आहे...</p>
      </div>
    );
  }

  // 🔒 लॉगिन केलेला पण अजून मंजूर न केलेला युझर
  if (currentUserId && !isApproved) {
    const adminMobile = "919307130226";
    const message = `नमस्कार, माझा मराठी मंगलाष्टक आयडी [${myProfileId}] हा आहे. कृपया माझे खाते मंजूर (Approve) करावे.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${adminMobile}?text=${encodeURIComponent(message)}`;

    return (
      <div className={`${devanagari.className} min-h-screen bg-slate-100 flex flex-col justify-between text-gray-800`}>
        <header className="bg-white border-b border-gray-200 py-5 px-4 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-orange-600">मराठी मंगलाष्टक 💍</h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl border border-gray-100">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
              🔒
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">खाते मंजुरी प्रलंबित आहे!</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              तुमचा बायोडाटा सुरक्षित जतन केला आहे. सुरक्षिततेसाठी ॲडमिन कडून प्रोफाईल व्हेरीफाय व्हायला १५ मिनिटे लागतात. कृपया प्रतीक्षा करा.
            </p>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border-2 border-dashed border-orange-200 mb-6">
              <span className="block text-xs uppercase tracking-widest text-orange-600 font-bold mb-1">तुमचा प्रोफाईल आयडी</span>
              <span className="text-3xl font-mono font-black text-amber-700 tracking-wider">{myProfileId}</span>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-4 px-6 rounded-xl shadow-lg transition"
            >
              व्हॉट्सॲपवर आयडी पाठवून खाते सुरू करा 🚀
            </a>
            <button
  onClick={async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      window.location.href = '/';
    } else {
      showMessage("लॉगआऊट करताना त्रुटी आली.", "error");
    }
  }}
  className="mt-4 text-xs font-bold text-red-500 hover:underline"
>
  🚪 लॉगआऊट करा
</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`${poppins.className} min-h-screen bg-slate-50 text-gray-800`} suppressHydrationWarning>
    <header className="bg-white border-b border-gray-100 py-6 px-4 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-orange-600 antialiased tracking-normal">
        मराठी मंगलाष्टक 💍
      </h1>
      <p className="text-gray-500 text-xs mt-1">महाराष्ट्रातील अग्रगण्य डिजिटल मॅट्रिमोनी प्लॅटफॉर्म</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4">
        {/* नवीन वधू/वर नोंदणी — WhatsApp */}
        <section className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 sm:p-8 mb-2 text-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            वधूवराची नोंदणी करायची आहे?
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-lg mx-auto">
            WhatsApp वर संपर्क करा.
            <br />
            आम्ही तुमची संपूर्ण नोंदणी विनामूल्य करून देऊ.
          </p>
          <a
            href="https://wa.me/919307130226?text=नमस्कार,%20मला%20मराठी%20मंगलाष्टक%20मध्ये%20नोंदणी%20करायची%20आहे."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition text-xs"
          >
            <img src="/whatsapplogo.png" alt="WhatsApp" className="w-4 h-4" />
            WhatsApp वर नोंदणी करा
          </a>
          
        </section>
      {message && (
  <div className="max-w-3xl mx-auto px-4 mb-4">
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
  <div className="max-w-3xl mx-auto px-4 mb-4">
    <div className="bg-white border border-orange-200 rounded-2xl p-5 shadow-md text-center">
      <p className="text-sm font-semibold text-gray-800 mb-4">
        {confirmBox.text}
      </p>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => confirmBox.onConfirm()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-xl text-sm font-bold"
        >
          हो
        </button>

        <button
          onClick={() => setConfirmBox(null)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-xl text-sm font-bold"
        >
          नाही
        </button>
      </div>
    </div>
  </div>
)}
        {/* फिल्टर सेक्शन */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-2 space-y-4">
          <div className="w-full">
            <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase">
              नाव किंवा प्रोफाईल ID (ID) टाईप करा
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="उदा. अमित, ID: 12345..."
              className="w-full p-3 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
    

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50 center">
            <button
              onClick={() => { setGenderFilter('All'); setShowFavoritesOnly(false); }}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition ${genderFilter === 'All' && !showFavoritesOnly ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 text-gray-600'}`}
            >
              सर्व एकत्र 
            </button>
            <button
              onClick={() => { setGenderFilter('Female'); setShowFavoritesOnly(false); }}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition ${genderFilter === 'Female' && !showFavoritesOnly ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-gray-600'}`}
            >
              👩 वधू 
            </button>
            <button
              onClick={() => { setGenderFilter('Male'); setShowFavoritesOnly(false); }}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition ${genderFilter === 'Male' && !showFavoritesOnly ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-gray-600'}`}
            >
              👨 वर 
            </button>
            {/* <button
              onClick={async () => {
                if (!showFavoritesOnly && favorites.length === 0) {
                  showMessage(
                    "तुम्ही अजून कोणतेही प्रोफाइल लाईक केलेले नाही.",
                    "error"
                  );
                  return;
                }
                setShowFavoritesOnly(!showFavoritesOnly);
              }}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition ${showFavoritesOnly ? 'bg-red-500 text-white shadow-sm' : 'bg-red-50 text-red-600 border border-red-100'}`}
            >
              {showFavoritesOnly ? '❤️ फक्त आवडलेले दाखवत आहे' : `❤️ आवडलेले (${favorites.length})`}
            </button> */}
          </div>
        </div>
<div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 mb-2">
  <p className="text-center text-sm text-gray-600 font-medium">
  ⭐ सर्वात वर दिसण्यासाठी प्रीमियम घ्या
</p>           
          </div>
        {loading && profiles.length === 0 && (
          <p className="text-center text-gray-500 font-medium animate-pulse py-12">बायोडेटा शोधत आहे...</p>
        )}



        {/* प्रोफाइल ग्रिड */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => navigateToProfile(profile.id)}
              className={`bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition flex flex-col justify-between border-2 ${
                profile.is_premium ? 'border-amber-400 bg-gradient-to-b from-amber-50/20 to-white shadow-amber-100' : 'border-gray-100'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4 border-b border-gray-50 pb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border border-gray-200 flex-shrink-0 shadow-sm relative">
                    {getProfilePhoto(profile) ? (
                      <img src={getProfilePhoto(profile)!} alt={getProfileName(profile)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-orange-50">
                        {profile.gender === 'Female' ? '👩' : '👨'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${profile.gender === 'Female' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>
                        {profile.gender === 'Female' ? 'वधू' : 'वर'}
                      </span>
                      {profile.profile_id && (
                        <span className="inline-block px-2 py-0.5 text-[10px] text-gray-400 font-mono bg-gray-50 rounded">
                          ID: {profile.profile_id}
                        </span>
                      )}
                      {/* 👑 प्रीमियम युझर बॅज */}
                      {profile.is_premium && (
                        <span className="inline-block px-2 py-0.5 text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full animate-pulse shadow-sm">
                          👑 प्रीमियम
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 tracking-tight mt-1">{getProfileName(profile)}</h3>
                  </div>
                  
                  {/* <button
  onClick={(e) => {
    e.stopPropagation();
    toggleFavorite(profile.id);
  }}
  className="text-2xl hover:scale-110 transition flex-shrink-0"
>
  {favorites.includes(profile.id) ? '❤️' : '🤍'}
</button> */}
                </div>

                <div className="space-y-2 text-xs text-gray-600">
                  <p>🎂 <strong>वय:</strong> {profile.date_of_birth ? Math.abs(new Date(Date.now() - new Date(profile.date_of_birth).getTime()).getUTCFullYear() - 1970) + " वर्षे" : '—'}</p>
                  <p>📏 <strong>उंची:</strong> {getProfileHeight(profile)}</p>
                  <p>🕉️ <strong>धर्म-जात:</strong> {getProfileCaste(profile)}</p>
                  <p>🎓 <strong>शिक्षण:</strong> {getProfileEducation(profile)}</p>
                  <p>💼 <strong>व्यवसाय:</strong> {getProfileProfession(profile)}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-gray-50">
                <button
                  onClick={() => navigateToProfile(profile.id)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs tracking-wide transition text-center shadow-sm"
                >
                  🔍 संपूर्ण बायोडेटा व संपर्क पहा
                </button>
              </div>
            </div>
          ))}
        </div>

        {hasMore && filteredProfiles.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={async () => {
                const nextPage = page + 1;
                setLoadingMore(true);
                await fetchProfiles(nextPage);
                setPage(nextPage);
                setLoadingMore(false);
              }}
              disabled={loadingMore}
              className="px-6 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {loadingMore ? 'लोड होत आहे...' : 'आणखी पहा'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}