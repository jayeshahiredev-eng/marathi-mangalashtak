'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Noto_Sans_Devanagari, Yatra_One } from 'next/font/google';
import imageCompression from 'browser-image-compression'; // 🌟 इमेज कॉम्प्रेस करण्यासाठी लायब्ररी इम्पोर्ट केली

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

const marathiBody = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-marathi-body',
});

const marathiDisplay = Yatra_One({
  subsets: ['devanagari', 'latin'],
  weight: '400',
  variable: '--font-marathi-display',
});

export default function ProfileSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 🌟 व्हॉट्सॲप पॉप-अपसाठी नवीन स्टेट्स
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [generatedProfileId, setGeneratedProfileId] = useState('');

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

  // फॉर्म स्टेट्स
  const [formData, setFormData] = useState({
    gender: '',
    fullName: '',
    mobileNumber: '', 
    address: '', // 🌟 नवीन अनिवार्य फील्ड
    dateOfBirth: '',
    birthTime: '',
    rashi: '',
    gotra: '',
    complexion: '',
    height: '',
    religionCaste: '',
    education: '',
    profession: '',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    siblings: '',
    unclesPaternal: '',
    unclesMaternal: '',
    relatives: '',
  });

  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingProfilePicUrl, setExistingProfilePicUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const loadSavedProfile = async () => {
      setProfileLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'gender, full_name, mobile_number, address, date_of_birth, birth_time, rashi, gotra, complexion, height, religion_caste, education, profession, father_name, father_occupation, mother_name, siblings, uncles_paternal, uncles_maternal, relatives, profile_pic_url, profile_id, id'
        )
        .eq('id', user.id)
        .single();

      if (!error && data) {
        const dob = data.date_of_birth
          ? String(data.date_of_birth).split('T')[0]
          : '';

        const cleanDash = (val: string | null) => (val === '—' ? '' : (val ?? ''));

        setFormData({
          gender: data.gender ?? '',
          fullName: cleanDash(data.full_name),
          mobileNumber: cleanDash(data.mobile_number),
          address: cleanDash(data.address), // 🌟 डेटाबेसमधून लोड करणे
          dateOfBirth: dob,
          birthTime: cleanDash(data.birth_time),
          rashi: cleanDash(data.rashi),
          gotra: cleanDash(data.gotra),
          complexion: cleanDash(data.complexion),
          height: cleanDash(data.height),
          religionCaste: cleanDash(data.religion_caste),
          education: cleanDash(data.education),
          profession: cleanDash(data.profession),
          fatherName: cleanDash(data.father_name),
          fatherOccupation: cleanDash(data.father_occupation),
          motherName: cleanDash(data.mother_name),
          siblings: cleanDash(data.siblings),
          unclesPaternal: cleanDash(data.uncles_paternal),
          unclesMaternal: cleanDash(data.uncles_maternal),
          relatives: cleanDash(data.relatives),
        });

        if (data.profile_pic_url) {
          setExistingProfilePicUrl(data.profile_pic_url);
          setPreviewUrl(data.profile_pic_url);
        }
      }

      setProfileLoading(false);
    };

    loadSavedProfile();
  }, [router]);

  const handleBiodataParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const parsedFile = e.target.files[0];
    setScanning(true);

    const apiFormData = new FormData();
    apiFormData.append('file', parsedFile);

    try {
      const res = await fetch('/api/parse-biodata', {
        method: 'POST',
        body: apiFormData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const detail = result.error || `सर्व्हर एरर (${res.status})`;
        showMessage(
          `बायोडाटा वाचता आला नाही.पुन्हा प्रयत्न करा ${detail}`,
          'error'
        );
        return;
      }

      if (result.data) {
        setFormData(prev => ({
          ...prev,
          ...result.data,
          fullName: result.data.fullName?.replace(/\d+/g, '') || '',
          mobileNumber: result.data.mobileNumber || prev.mobileNumber,
          address: result.data.address || prev.address, // 🌟 AI कडून आलेला पत्ता सेट केला
        }));
        showMessage(
          'बायोडाटा यशस्वीरित्या स्कॅन झाला! 🪄 कृपया तपासा.',
          'success'
        );
      } else {
        showMessage(
          'बायोडाटा वाचता आला नाही. कृपया स्पष्ट फाईल अपलोड करा.',
          'error'
        );
      }
    } catch (err) {
      showMessage(
        'स्कॅनिंग दरम्यान त्रुटी आली.',
        'error'
      );
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  // 🌟 इमेज कॉम्प्रेस करण्यासाठी अपडेटेड फंक्शन
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        
        setLoading(true); // कॉम्प्रेस होईपर्यंत सबमिट बटन डिसेबल राहील
        
        const compressedFile = await imageCompression(originalFile, options);
        
        setImage(compressedFile);
        setPreviewUrl(URL.createObjectURL(compressedFile));
        console.log(`मूळ साईझ: ${originalFile.size / 1024} KB | कॉम्प्रेस केलेली साईझ: ${compressedFile.size / 1024} KB`);
        
      } catch (error) {
        console.error("Image compression error:", error);
        setImage(originalFile);
        setPreviewUrl(URL.createObjectURL(originalFile));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderSelect = (selectedGender: 'Male' | 'Female') => {
    setFormData(prev => ({ ...prev, gender: selectedGender }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    // 🚨 कडक मॅंडेटरी व्हॅलिडेशन चेक्स (आता मोबाईल नंबर आणि पत्त्यासह)
    if (!previewUrl && !image) {
      showMessage("कृपया आपला प्रोफाइल फोटो अपलोड करा!", "error");
      return;
    }
    
    if (!formData.gender) {
      showMessage("कृपया 'वर' किंवा 'वधू' प्रवर्ग निवडा!", "error");
      return;
    }
    
    if (!formData.fullName.trim()) {
      showMessage("कृपया नाव टाका!", "error");
      return;
    }
    
    if (
      !formData.mobileNumber.trim() ||
      formData.mobileNumber.length < 10
    ) {
      showMessage(
        "कृपया अचूक १० अंकी मोबाईल नंबर टाका!",
        "error"
      );
      return;
    }
    
    if (!formData.address.trim()) {
      showMessage(
        "कृपया आपला पत्ता/गाव टाका!",
        "error"
      );
      return;
    }
    
    if (!formData.dateOfBirth) {
      showMessage(
        "कृपया जन्म तारीख निवडा!",
        "error"
      );
      return;
    }
    
    if (!formData.height.trim()) {
      showMessage("कृपया उंची टाका!", "error");
      return;
    }
    
    if (!formData.religionCaste.trim()) {
      showMessage(
        "कृपया धर्म-जात टाका!",
        "error"
      );
      return;
    }
    
    if (!formData.education.trim()) {
      showMessage(
        "कृपया शिक्षण टाका!",
        "error"
      );
      return;
    }
    
    if (!formData.profession.trim()) {
      showMessage(
        "कृपया नोकरी/व्यवसाय टाका!",
        "error"
      );
      return;
    }
    
    if (!formData.fatherName.trim()) {
      showMessage(
        "कृपया वडिलांचे नाव टाका!",
        "error"
      );
      return;
    }
    
    if (!formData.fatherOccupation.trim()) {
      showMessage(
        "कृपया वडिलांचा व्यवसाय टाका!",
        "error"
      );
      return;
    }
    
    if (!formData.motherName.trim()) {
      showMessage(
        "कृपया आईचे नाव टाका!",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      let profilePicUrl = existingProfilePicUrl ?? '';

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(fileName);
        
        profilePicUrl = urlData.publicUrl;
      }

      const fallbackDash = (val: string) => (val.trim() === '' ? '—' : val.trim());

      // 🌟 डेटाबेस अपडेट
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          gender: formData.gender,
          full_name: formData.fullName.trim(),
          mobile_number: formData.mobileNumber.trim(),
          address: formData.address.trim(), // 🌟 पत्ता सेव्ह
          date_of_birth: formData.dateOfBirth,
          height: formData.height.trim(),
          religion_caste: formData.religionCaste.trim(),
          education: formData.education.trim(),
          profession: formData.profession.trim(),
          father_name: formData.fatherName.trim(),
          father_occupation: formData.fatherOccupation.trim(),
          mother_name: formData.motherName.trim(),
          
          birth_time: fallbackDash(formData.birthTime),
          rashi: fallbackDash(formData.rashi),
          gotra: fallbackDash(formData.gotra),
          complexion: fallbackDash(formData.complexion),
          siblings: fallbackDash(formData.siblings),
          uncles_paternal: fallbackDash(formData.unclesPaternal),
          uncles_maternal: fallbackDash(formData.unclesMaternal),
          relatives: fallbackDash(formData.relatives),
          
          profile_pic_url: profilePicUrl,
          is_profile_complete: true
        })
        .eq('id', userId)
        .select('id, profile_id') // 🌟 ५ अंकी आयडी जनरेट करण्यासाठी डेटा परत मिळवणे
        .single();

      if (updateError) throw updateError;

      // 🌟 ५ अंकी युनिक आयडी मिळवण्याचे लॉजिक (profile_id नसेल तर id चे शेवटचे ५ अक्षरे)
      const rawId = updateData?.profile_id || updateData?.id || userId;
      const cleanId = String(rawId).replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase();
      
      setGeneratedProfileId(cleanId);
      setLoading(false);
      setShowApprovalModal(true); // 🚀 व्हॅलिडेशन आणि सेव्ह झाल्यावर पॉप-अप दाखवणे

    } catch (error: any) {
      showMessage(
        `त्रुटी आली: ${error.message}`,
        'error'
      );
      setLoading(false);
    }
  };

  // 🌟 व्हॅलिडेशन आणि व्हॅट्सॲप रिडायरेक्शन फंक्शन
  const handleWhatsAppRedirect = () => {
    const adminMobile = "919359915379"; // 📢 येथे तुमचा मुख्य ॲडमिन नंबर टाका (कंट्री कोडसह)
    const message = `नमस्कार, माझा मराठी मंगलाष्टक आयडी [${generatedProfileId}] हा आहे. कृपया माझे खाते मंजूर (Approve) करावे.`;
    const encodedMessage = encodeURIComponent(message);
    
    // व्हॅट्सॲप ओपन करणे
    window.open(`https://wa.me/${adminMobile}?text=${encodedMessage}`, '_blank');
    
    // पॉप-अप बंद करून होम पेजवर पाठवणे
    setShowApprovalModal(false);
    router.push('/');
  };

  // 🔄 फक्त व्हॉट्सॲपवर क्लिक केल्यावरच पुढे जाता येईल, डायरेक्ट क्लोज बंद!

const handleModalClose = () => {
  showMessage(
    "कृपया आधी व्हॉट्सॲपवर आयडी पाठवा 🚀",
    "error"
  );
  router.push('/');
};
  const inputClass =
    'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition disabled:opacity-60';
  const labelClass = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div lang="mr" className={`${poppins.className} min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col text-gray-800 relative`}>
    <header className="bg-white border-b border-gray-100 py-6 px-4 text-center shadow-sm sticky top-0 z-40 shrink-0">
      <div className="max-w-7xl mx-auto relative">
        
        <h1 className="text-3xl font-bold text-orange-600 antialiased tracking-normal">
          मराठी मंगलाष्टक 💍
        </h1>
        <p className="text-gray-500 text-xs mt-1">महाराष्ट्रातील अग्रगण्य डिजिटल मॅट्रिमोनी प्लॅटफॉर्म</p>

        <div className="mt-3 inline-block bg-slate-50 border border-slate-100 rounded-full px-4 py-1">
          <p className="text-xs text-gray-500 font-medium">
            स्टार <span className="text-red-500 font-bold">*</span> चिन्हांकित फील्ड्स भरणे अनिवार्य आहे.
          </p>
          {message && (
  <div
    className={`mx-auto mt-4 mb-2 max-w-3xl p-4 rounded-2xl border text-sm font-semibold ${
      message.type === 'success'
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-red-50 text-red-700 border-red-200'
    }`}
  >
    {message.text}
  </div>
)}
        </div>

      </div>
    </header>

      <main className="flex-1 w-full overflow-x-hidden">
      
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
          {profileLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-600">
              <p className="text-lg font-semibold animate-pulse">आपला बायोडाटा लोड होत आहे...</p>
            </div>
          ) : (
          <>
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-2xl font-bold sm:text-4xl lg:text-5xl font-[family-name:var(--font-marathi-display)] text-gray-750 leading-tight">📋 लग्नाचा बायोडाटा फॉर्म</p>
          </div>

          <section className="mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl border-2 border-dashed border-orange-300 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 p-5 sm:p-8 text-center shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800 mb-3">⚡ झटपट बायोडाटा ऑटो-फिल (AI Scanner)</div>
            <input type="file" accept="image/*,application/pdf" onChange={handleBiodataParse} disabled={scanning} id="ai-parser" className="hidden" />
            <label htmlFor="ai-parser" className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:bg-orange-700 ${scanning ? 'pointer-events-none opacity-70' : ''}`}>
              {scanning ? '🤖 AI बायोडाटा वाचत आहे...' : '📁 जुना बायोडाटा निवडा (PDF/Image)'}
            </label>
          </section>

          <form onSubmit={handleSubmit} className="relative space-y-6 sm:space-y-8 pb-28 sm:pb-8">
            
            <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-8">
              <h2 className="text-lg font-bold text-orange-700 mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm">१</span>
                माझा प्रोफाईल फोटो (Photo) <span className="text-red-500">*</span>
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                <div className="relative shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-full border-4 border-orange-100 shadow-lg ring-2 ring-orange-200" />
                  ) : (
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-orange-50 to-rose-50 border-2 border-dashed border-orange-300 flex flex-col items-center justify-center text-orange-400">
                      <span className="text-4xl mb-1">📷</span>
                      <span className="text-xs font-semibold text-orange-600/80">फोटो अनिवार्य</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full text-center sm:text-left">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 hover:bg-orange-700 transition w-full sm:w-auto">
                    <span>फोटो निवडा</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                  </label>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-8">
              <h2 className="text-lg font-bold text-orange-700 mb-5 sm:mb-6 flex items-center gap-2 border-b border-orange-100 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm">२</span>
                👤 वैयक्तिक तपशील
              </h2>

              <div className="mb-6 space-y-2">
                <label className={labelClass}>नोंदणी कोणासाठी आहे? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button type="button" onClick={() => handleGenderSelect('Male')} className={`p-4 rounded-xl border-2 font-bold text-sm transition flex items-center justify-center gap-3 ${formData.gender === 'Male' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100' : 'border-gray-200 bg-white text-gray-600 hover:bg-slate-50'}`}>
                    <span className="text-xl">👨</span> वर (Male)
                  </button>
                  <button type="button" onClick={() => handleGenderSelect('Female')} className={`p-4 rounded-xl border-2 font-bold text-sm transition flex items-center justify-center gap-3 ${formData.gender === 'Female' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm shadow-rose-100' : 'border-gray-200 bg-white text-gray-600 hover:bg-slate-50'}`}>
                    <span className="text-xl">👩</span> वधू (Female)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                <div className="sm:col-span-2 xl:col-span-1">
                  <label className={labelClass}>नाव <span className="text-red-500">*</span></label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>मोबाईल नंबर <span className="text-red-500">*</span></label>
                  <input type="tel" name="mobileNumber" placeholder="उदा. 98765*****" maxLength={10} value={formData.mobileNumber} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                
                <div className="sm:col-span-2 xl:col-span-1">
                  <label className={labelClass}>पूर्ण पत्ता / सध्याचे ठिकाण (गांव, तालुका, जिल्हा) <span className="text-red-500">*</span></label>
                  <input type="text" name="address" placeholder="उदा. मु.पो. दाभाडी, तालुका मालेगाव, जिल्हा नाशिक" value={formData.address} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>जन्म तारीख <span className="text-red-500">*</span></label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>जन्म वेळ <span className="text-gray-400 font-medium">(ऐच्छिक)</span></label>
                  <input type="text" name="birthTime" placeholder="उदा. दुपारी ०३:४५" value={formData.birthTime} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>राशी <span className="text-gray-400 font-medium">(ऐच्छिक)</span></label>
                  <input type="text" name="rashi" placeholder="उदा. सिंह" value={formData.rashi} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>गोत्र <span className="text-gray-400 font-medium">(ऐच्छिक)</span></label>
                  <input type="text" name="gotra" placeholder="उदा. भारद्वाज" value={formData.gotra} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>वर्ण <span className="text-gray-400 font-medium">(ऐच्छिक)</span></label>
                  <input type="text" name="complexion" placeholder="उदा. गोरा / गव्हाळ" value={formData.complexion} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>उंची <span className="text-red-500">*</span></label>
                  <input type="text" name="height" placeholder="उदा. ५ फूट ६ इंच" value={formData.height} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>धर्म-जात <span className="text-red-500">*</span></label>
                  <input type="text" name="religionCaste" placeholder="उदा. हिंदू - मराठा" value={formData.religionCaste} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>शिक्षण <span className="text-red-500">*</span></label>
                  <input type="text" name="education" placeholder="उदा. BE Computer" value={formData.education} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
                <div className="sm:col-span-2 xl:col-span-2">
                  <label className={labelClass}>नोकरी/व्यवसाय आणि उत्पन्न <span className="text-red-500">*</span></label>
                  <input type="text" name="profession" placeholder="उदा. सॉफ्टवेअर इंजिनिअर - ६ LPA" value={formData.profession} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl sm:rounded-3xl border border-orange-100 shadow-sm p-5 sm:p-8 bg-gradient-to-b from-orange-50/40 to-white">
              <h2 className="text-lg font-bold text-orange-700 mb-5 sm:mb-6 flex items-center gap-2 border-b border-orange-200/80 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm">३</span>
                👨‍👩‍👦 कौटुंबिक तपशील
              </h2>
              <div className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className={labelClass}>वडिलांचे नाव <span className="text-red-500">*</span></label>
                    <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                  </div>
                  <div>
                    <label className={labelClass}>वडिलांचा व्यवसाय <span className="text-red-500">*</span></label>
                    <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                  </div>
                  <div>
                    <label className={labelClass}>आईचे नाव <span className="text-red-500">*</span></label>
                    <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                  </div>
                  <div>
                    <label className={labelClass}>भाऊ/बहीण <span className="text-gray-400 font-medium">(ऐच्छिक)</span></label>
                    <input type="text" name="siblings" value={formData.siblings} onChange={handleInputChange} className={inputClass} disabled={scanning} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>काकाश्री <span className="text-gray-400 font-medium">(ऐच्छिक)</span></label>
                  <textarea name="unclesPaternal" rows={3} onChange={handleInputChange} value={formData.unclesPaternal} className={`${inputClass} resize-y min-h-[88px]`} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>मामा <span className="text-gray-400 font-medium">(ऐच्छिक)</span></label>
                  <textarea name="unclesMaternal" rows={3} onChange={handleInputChange} value={formData.unclesMaternal} className={`${inputClass} resize-y min-h-[88px]`} disabled={scanning} />
                </div>
                <div>
                  <label className={labelClass}>नातेसंबंध <span className="text-gray-400 font-medium">(ऐच्छिक)</span></label>
                  <textarea name="relatives" rows={3} onChange={handleInputChange} value={formData.relatives} className={`${inputClass} resize-y min-h-[88px]`} disabled={scanning} />
                </div>
              </div>
            </section>

            <button type="submit" disabled={loading || scanning} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl shadow-lg transition disabled:bg-gray-400 text-lg">
              {loading ? 'बायोडाटा जतन होत आहे...' : 'बायोडाटा सबमिट करा 💾'}
            </button>
          </form>
          </>
          )}
        </div>
      </main>

      {/* 🚀 व्हॅट्सॲप अप्रूव्हल आणि टोकन सिस्टीम सुंदर पॉप-अप (Modal) */}
{/* 🚀 व्हॅट्सॲप अप्रूव्हल कडक सिस्टीम पॉप-अप (Strict Modal) */}
{showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-gray-100 animate-scale-up">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner animate-bounce">
              🔒
            </div>
            <h3 className="text-2xl font-[family-name:var(--font-marathi-display)] text-gray-900 mb-2">
              खाते मंजुरी आवश्यक आहे!
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              तुमची माहिती सुरक्षित जतन केली आहे. पण जोपर्यंत तुमचे खाते मंजूर होत नाही, तोपर्यंत तुम्हाला इतरांचे बायोडाटा दिसणार नाहीत.
            </p>
            
            {/* ५ अंकी ठळक आयडी बॉक्स */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border-2 border-dashed border-orange-300 mb-6">
              <span className="block text-xs uppercase tracking-widest text-orange-600 font-bold mb-1">तुमचा प्रोफाईल आयडी</span>
              <span className="text-4xl font-mono font-black text-amber-700 tracking-wider">
                {generatedProfileId}
              </span>
            </div>

            {/* फक्त व्हॅट्सॲपवर पाठवण्याचा एकमेव पर्याय */}
            <div className="space-y-3">
              <button
                onClick={handleWhatsAppRedirect}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[16px] font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-100 transition animate-pulse"
              >
                <span>व्हॉट्सॲपवर आयडी पाठवून खाते सुरू करा 🚀 येथे दाबा</span>
              </button>
              
              <p className="text-[11px] text-gray-400 font-medium">
                🛡️ ॲडमिन कडून अप्रूव्हल मिळाल्यानंतरच पुढील स्क्रीन सुरू होईल.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}