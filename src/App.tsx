import React, { useState, useEffect } from 'react';
import { 
  INITIAL_STUDIOS, 
  Studio, 
  Review, 
  RentableInstrument 
} from './data/studios';
import StudioInteriorExplorer from './components/StudioInteriorExplorer';
import StudioMap from './components/StudioMap';
import StudioCompare from './components/StudioCompare';
import BookingSimulator from './components/BookingSimulator';
import BandMatching from './components/BandMatching';
import { 
  StudioDatabaseService, 
  UserProfile, 
  isSupabaseConfigured 
} from './lib/supabase';
import { 
  Music, 
  Sparkles, 
  MapPin, 
  Phone, 
  Star, 
  CheckCircle, 
  Plus, 
  ArrowRight, 
  Search, 
  Database, 
  Lock, 
  User, 
  LogOut, 
  ChevronRight, 
  SlidersHorizontal, 
  X, 
  Info, 
  Guitar, 
  Dribbble, 
  AlertCircle,
  Clock
} from 'lucide-react';

export default function App() {
  // Application Data States
  const [studios, setStudios] = useState<Studio[]>(INITIAL_STUDIOS);
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(INITIAL_STUDIOS[0]);
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [onlyGuitarRental, setOnlyGuitarRental] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time Reviews State
  const [activeReviews, setActiveReviews] = useState<Review[]>(INITIAL_STUDIOS[0].reviews);

  // Auth States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string>('');

  // Gemini AI Summary States
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  // Info Modals
  const [dbModalOpen, setDbModalOpen] = useState<boolean>(false);

  // New Review Form State
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewContent, setNewReviewContent] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Advanced Lab Tabs
  const [activeLabTab, setActiveLabTab] = useState<'booking' | 'matching' | 'compare'>('booking');

  // Load user session on mount
  useEffect(() => {
    const user = StudioDatabaseService.getSessionUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Update reviews of selected studio and subscribe to real-time additions
  useEffect(() => {
    if (!selectedStudio) return;

    // Load initial combined reviews (Default static data + Supabase / Local database ones)
    const localDbReviews = StudioDatabaseService.getReviews(selectedStudio.id);
    const combinedReviews = [...localDbReviews, ...selectedStudio.reviews];
    
    // Sort reviews by date descending (or ID descending)
    const sorted = combinedReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setActiveReviews(sorted);

    // Reset AI summary when studio changes
    setAiSummary('');
    setAiError('');

    // Subscribe to real-time review additions for this studio
    const unsubscribe = StudioDatabaseService.subscribeToReviews(selectedStudio.id, (newReview) => {
      setActiveReviews((prev) => {
        // Prevent duplicate append
        if (prev.some((r) => r.id === newReview.id)) return prev;
        return [newReview, ...prev];
      });

      // Also dynamically update the studio review counts
      setStudios((prevStudios) =>
        prevStudios.map((st) => {
          if (st.id === selectedStudio.id) {
            return {
              ...st,
              reviewCount: st.reviewCount + 1,
            };
          }
          return st;
        })
      );
    });

    return () => {
      unsubscribe();
    };
  }, [selectedStudio]);

  // Handle Review Submission
  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudio) return;
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (!newReviewContent.trim()) return;

    try {
      const author = currentUser.email.split('@')[0];
      const addedReview = await StudioDatabaseService.addReview(
        selectedStudio.id,
        author,
        newReviewRating,
        newReviewContent
      );

      // Reset Form and trigger alert
      setNewReviewContent('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error adding review:', err);
    }
  };

  // Handle Authentication submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail.trim()) {
      setAuthError('이메일 주소를 입력해주세요.');
      return;
    }

    try {
      if (authMode === 'signup') {
        const { user, error } = await StudioDatabaseService.signUp(authEmail);
        if (error) {
          setAuthError(error.message);
          return;
        }
        setCurrentUser(user);
        setAuthModalOpen(false);
      } else {
        const { user, error } = await StudioDatabaseService.signIn(authEmail);
        if (error) {
          setAuthError(error.message);
          return;
        }
        setCurrentUser(user);
        setAuthModalOpen(false);
      }
      setAuthEmail('');
    } catch (err: any) {
      setAuthError(err.message || '인증 과정 중 에러가 발생했습니다.');
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await StudioDatabaseService.signOut();
    setCurrentUser(null);
  };

  // Call Gemini API to get a review summary
  const generateAiReviewSummary = async () => {
    if (!selectedStudio) return;
    setAiLoading(true);
    setAiError('');
    setAiSummary('');

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioName: selectedStudio.name,
          reviews: activeReviews,
          advantages: selectedStudio.advantages,
          rentInstruments: selectedStudio.rentInstruments,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gemini 서버 처리 중 문제가 발생했습니다.');
      }
      setAiSummary(data.summary);
    } catch (err: any) {
      console.error('AI Summary failed:', err);
      setAiError(err.message || 'Gemini API 호출에 실패했습니다. API 키 및 연결 구성을 확인해주세요.');
    } finally {
      setAiLoading(false);
    }
  };

  // Filter Studios based on state
  const filteredStudios = studios.filter((studio) => {
    const matchRegion = selectedRegion === 'All' || studio.region === selectedRegion;
    const matchGuitar = !onlyGuitarRental || studio.hasGuitarRental;
    const matchSearch =
      studio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studio.advantages.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      studio.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRegion && matchGuitar && matchSearch;
  });

  // Custom parser to format raw Markdown from Gemini to gorgeous JSX
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headers: ### or ##
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="text-sm font-bold text-slate-100 mt-4 mb-2 flex items-center gap-1.5 border-b border-slate-800 pb-1">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ') || line.startsWith('# ')) {
        const cleanHeader = line.replace(/^(##|#)\s+/, '');
        return (
          <h3 key={index} className="text-base font-extrabold text-rose-400 mt-5 mb-2.5 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-rose-400 animate-pulse" />
            {cleanHeader}
          </h3>
        );
      }
      // Bullets
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.replace(/^[-*]\s+/, '');
        // Highlight bold in line
        const formattedContent = parseBoldText(content);
        return (
          <li key={index} className="ml-4 text-xs text-slate-300 leading-relaxed list-disc mb-1.5 marker:text-rose-400">
            {formattedContent}
          </li>
        );
      }
      // Normal Line
      if (line.trim() === '') return <div key={index} className="h-2" />;
      return (
        <p key={index} className="text-xs text-slate-400 leading-relaxed mb-1.5">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  // Turn **bold text** into styled bold spans
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-slate-100 font-semibold">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500/30 selection:text-rose-200">
      
      {/* Top Glassmorphic Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-900 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-lg shadow-rose-500/20">
              <Music className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  STUDIO SPOTLIGHT
                </h1>
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-rose-400 px-2 py-0.5 rounded-full font-semibold font-mono">
                  SEOUL v1.2
                </span>
              </div>
              <p className="text-[11px] text-slate-400">네이버 지도 기반 서울 밴드 합주실 & 수퍼베이스 실시간 대시보드</p>
            </div>
          </div>

          {/* Controls & Connection Status */}
          <div className="flex flex-wrap items-center gap-3 md:self-center">
            
            {/* Supabase Status Button */}
            <button
              onClick={() => setDbModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span>{isSupabaseConfigured ? '수퍼베이스 연결 완료' : '로컬 샌드박스 활성'}</span>
            </button>

            {/* User Auth widget */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.email.split('@')[0]}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="로그아웃"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold transition shadow-md shadow-rose-500/10"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>로그인 / 가입</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        
        {/* Intro Alert in Sandbox Mode */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/15 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-300">실시간 데이터베이스가 데모(Sandbox) 모드로 동작 중입니다</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  현재 실제 수퍼베이스(Supabase) API 환경변수가 비어있어, 브라우저의 LocalStorage를 통해 로그인과 실시간 리뷰 데이터 갱신을 정밀하게 모뮬레이션하고 있습니다. 우측 상단의 수퍼베이스 버튼을 클릭하여 실제 클라우드와 연결하는 방법을 확인하세요.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDbModalOpen(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 underline shrink-0 cursor-pointer"
            >
              간편 연결 가이드 보기
            </button>
          </div>
        )}

        {/* Filters and Search Panel */}
        <div className="bg-slate-900/40 border border-slate-900/80 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
          
          {/* Quick Search */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="합주실 이름, 장비, 태그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <span className="text-xs text-slate-400 font-medium shrink-0 mr-1 hidden sm:inline">지역 필터:</span>
            {['All', 'Hongdae', 'Hapjeong', 'Gangnam', 'Sinchon', 'Seongsu'].map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                  selectedRegion === region
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/35 font-bold'
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {region === 'All' ? '전체 서울' : region}
              </button>
            ))}
          </div>

          {/* Instrument Rental Filter */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={onlyGuitarRental}
                onChange={(e) => setOnlyGuitarRental(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 peer-checked:after:bg-rose-500 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-rose-500/10 peer-checked:border-rose-500/40"></div>
              <span className="ml-2.5 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Guitar className="w-3.5 h-3.5 text-rose-400" />
                기타/악기 대여 가능만 보기
              </span>
            </label>
          </div>

        </div>

        {/* Dashboard Grid (Map on top/left, details on right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: MAP & LIST OF STUDIOS */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Interactive Studio Map */}
            <StudioMap
              studios={filteredStudios}
              selectedStudio={selectedStudio}
              onSelectStudio={(studio) => setSelectedStudio(studio)}
            />

            {/* Studio Interior & Acoustic Simulator Container */}
            <div className="w-full">
              <StudioInteriorExplorer
                studios={filteredStudios}
                selectedStudio={selectedStudio}
                onSelectStudio={(studio) => setSelectedStudio(studio)}
              />
            </div>

            {/* Filtered Studios Cards List */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-rose-400" />
                  조건 부합 합주실 ({filteredStudios.length}개 발견)
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">Seoul, South Korea</span>
              </div>

              {filteredStudios.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/20 border border-slate-900/60">
                  <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">조건에 맞는 합주실이 존재하지 않습니다</p>
                  <p className="text-xs text-slate-500 mt-1">지역 필터나 기타 대여 가능여부 체크박스를 해제해 보세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredStudios.map((studio) => {
                    const isSelected = selectedStudio?.id === studio.id;
                    return (
                      <div
                        key={studio.id}
                        onClick={() => setSelectedStudio(studio)}
                        className={`group cursor-pointer rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-rose-500/[0.03] border-rose-500/40 shadow-lg shadow-rose-500/5 ring-1 ring-rose-500/20'
                            : 'bg-slate-900/40 border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/60'
                        }`}
                      >
                        <div>
                          {/* Image Thumbnail */}
                          <div className="w-full h-28 rounded-xl overflow-hidden mb-3 relative bg-slate-950">
                            <img
                              src={studio.image}
                              alt={studio.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] bg-slate-950/80 border border-slate-800 text-rose-400 font-bold tracking-tight">
                              {studio.region === 'Hongdae' ? '홍대' : studio.region === 'Hapjeong' ? '합정' : studio.region === 'Gangnam' ? '강남' : studio.region === 'Sinchon' ? '신촌' : '성수'}
                            </div>
                            
                            {studio.hasGuitarRental && (
                              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-emerald-950/90 border border-emerald-500/30 text-emerald-400 font-bold">
                                <Guitar className="w-3 h-3" />
                                악기 대여 지원
                              </div>
                            )}
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-100 group-hover:text-rose-400 transition">
                              {studio.name}
                            </h4>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                            {studio.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-900/80 flex items-center justify-between text-[11px]">
                          {/* Rating & Review counts */}
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-200">{studio.rating}</span>
                            <span className="text-slate-500">({studio.reviewCount})</span>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center gap-0.5 text-rose-400 font-semibold group-hover:translate-x-1 transition-transform">
                            <span>상세분석</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDE: SELECTED STUDIO DETAILS, INSTRUMENTS & AI REVIEWS */}
          <div className="lg:col-span-5">
            {selectedStudio ? (
              <div className="bg-slate-900/30 border border-slate-900/80 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col gap-6 sticky top-24">
                
                {/* Header info */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold tracking-tight">
                      {selectedStudio.region.toUpperCase()} AREA
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <strong>{selectedStudio.rating}</strong> / 5.0 ({selectedStudio.reviewCount}개의 후기)
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-slate-100">{selectedStudio.name}</h2>
                  
                  <div className="flex flex-col gap-1.5 mt-3 text-xs text-slate-400 font-medium">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedStudio.address}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{selectedStudio.tel}</span>
                    </p>
                  </div>
                </div>

                {/* Cover Photo */}
                <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-950 relative border border-slate-800">
                  <img
                    src={selectedStudio.image}
                    alt={selectedStudio.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-2">
                      {selectedStudio.description}
                    </p>
                  </div>
                </div>

                {/* Pros/Advantages Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudio.advantages.map((adv, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      <CheckCircle className="w-3 h-3 text-rose-400" />
                      {adv}
                    </span>
                  ))}
                </div>

                {/* Rooms and Prices Grid */}
                <div className="border-t border-slate-900/80 pt-5">
                  <h3 className="text-xs font-bold text-slate-400 mb-3 tracking-widest uppercase">합주실 보유 룸 및 이용 요금</h3>
                  <div className="flex flex-col gap-2.5">
                    {selectedStudio.rooms.map((room, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-100">{room.name}</span>
                            <span className="text-[10px] text-slate-500">정원 {room.capacity}명</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {room.gear.slice(0, 3).map((g, gi) => (
                              <span key={gi} className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-800">
                                {g}
                              </span>
                            ))}
                            {room.gear.length > 3 && <span className="text-[9px] text-slate-600 font-semibold px-1">+ {room.gear.length - 3}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-sm font-extrabold text-rose-400">
                            {room.pricePerHour.toLocaleString()}원
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block">/ 시간당</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* INSTRUMENT RENTAL SPECIFICS ("기타 및 악기 대여 안내") */}
                <div className="border-t border-slate-900/80 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                      <Guitar className="w-4 h-4 text-rose-400" />
                      기타 및 악기 렌탈 세부정보
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 font-semibold">
                      현장 렌탈 가능
                    </span>
                  </div>

                  {selectedStudio.rentInstruments.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-900 text-center text-xs text-slate-500">
                      이 합주실은 별도의 악기 렌탈을 등록하지 않았습니다. (기본 룸 앰프/드럼 기본 셋은 포함되어 있습니다)
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {selectedStudio.rentInstruments.map((inst, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-900 hover:border-slate-850 rounded-xl flex items-center justify-between gap-3 transition">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <Guitar className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-200">{inst.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.25 rounded font-bold ${
                                  inst.type === 'guitar' 
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' 
                                    : inst.type === 'bass' 
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10'
                                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                                }`}>
                                  {inst.type === 'guitar' ? '일렉기타' : inst.type === 'bass' ? '일렉베이스' : inst.type === 'keyboard' ? '신디' : '기타악기'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">{inst.description}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-bold text-slate-200">
                              {inst.pricePerHour === 0 ? (
                                <span className="text-emerald-400 font-extrabold">무료 대여</span>
                              ) : (
                                `${inst.pricePerHour.toLocaleString()}원/시간`
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* GEMINI AI REVIEW ANALYZER & SUMMARIZER */}
                <div className="border-t border-slate-900/80 pt-5">
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-950 to-rose-950/20 border border-rose-500/15 shadow-inner">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                          <Sparkles className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Gemini AI 실시간 평판 분석기</h4>
                          <p className="text-[10px] text-slate-500">축적된 유저 리뷰 및 렌탈 메리트를 심층 요약합니다</p>
                        </div>
                      </div>
                      
                      {!aiSummary && !aiLoading && (
                        <button
                          onClick={generateAiReviewSummary}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>분석 시작</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* AI Loading State */}
                    {aiLoading && (
                      <div className="py-6 flex flex-col items-center justify-center gap-2.5">
                        <div className="relative flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin"></div>
                          <Sparkles className="w-3.5 h-3.5 text-rose-400 absolute animate-pulse" />
                        </div>
                        <p className="text-xs text-rose-300 font-semibold font-mono animate-pulse">리뷰 및 악기대여 메리트 심층 요약 중...</p>
                        <p className="text-[10px] text-slate-500">Gemini v3.5-flash 모델이 답변을 정밀 조립하고 있습니다.</p>
                      </div>
                    )}

                    {/* AI Error State */}
                    {aiError && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-red-500/20 text-red-400 text-xs flex gap-2 items-start leading-relaxed">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">분석 실패:</span> {aiError}
                        </div>
                      </div>
                    )}

                    {/* AI Summary Display */}
                    {aiSummary && (
                      <div className="mt-2 p-3 bg-slate-950/80 border border-slate-900 rounded-xl max-h-72 overflow-y-auto scrollbar-thin">
                        <div className="flex justify-between items-center mb-2.5 border-b border-slate-900 pb-2">
                          <span className="text-[10px] text-rose-400 font-bold font-mono tracking-widest uppercase flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                            GEMINI 3.5 FLASH REPORT
                          </span>
                          <button
                            onClick={generateAiReviewSummary}
                            className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                          >
                            보고서 다시 생성
                          </button>
                        </div>
                        <div className="space-y-1 text-slate-300 text-xs">
                          {renderMarkdown(aiSummary)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* REAL-TIME REVIEWS FEED & ADD REVIEW */}
                <div className="border-t border-slate-900/80 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-rose-400" />
                      실시간 방문 후기 ({activeReviews.length})
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      수퍼베이스 채널 연결됨
                    </span>
                  </div>

                  {/* Add Review Form */}
                  <form onSubmit={handleAddReviewSubmit} className="mb-4 p-3.5 bg-slate-950/80 border border-slate-900 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">리뷰 남기기</span>
                      
                      {/* Rating selection stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReviewRating(star)}
                            className="focus:outline-none"
                          >
                            <Star className={`w-4 h-4 transition ${
                              star <= newReviewRating 
                                ? 'fill-amber-400 text-amber-400 hover:scale-110' 
                                : 'text-slate-700 hover:text-slate-500'
                            }`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        placeholder={currentUser ? "연주 장비나 사운드, 기타 대여 메리트 등에 대한 솔직한 후기를 남겨주세요." : "로그인 후 실시간 후기를 직접 입력하실 수 있습니다."}
                        disabled={!currentUser}
                        value={newReviewContent}
                        onChange={(e) => setNewReviewContent(e.target.value)}
                        className="w-full h-16 p-2 bg-slate-900 border border-slate-800 focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 rounded-xl text-xs text-slate-200 placeholder-slate-600 outline-none resize-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      {submitSuccess ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                          ✓ 실시간 데이터베이스에 업로드되었습니다!
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">실시간 채널을 통해 다른 합주자들에게 즉시 전파됩니다.</span>
                      )}

                      <button
                        type="submit"
                        disabled={!currentUser || !newReviewContent.trim()}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-rose-400 hover:text-rose-300 border border-slate-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>리뷰 등록</span>
                      </button>
                    </div>
                  </form>

                  {/* Reviews List */}
                  <div className="flex flex-col gap-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                    {activeReviews.length === 0 ? (
                      <p className="text-center text-xs text-slate-600 py-4">아직 등록된 후기가 없습니다. 첫 번째 리뷰어가 되어보세요!</p>
                    ) : (
                      activeReviews.map((review) => (
                        <div key={review.id} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex flex-col gap-1 transition duration-200 hover:bg-slate-950/60">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200">{review.user}</span>
                            <span className="text-[10px] text-slate-500 font-medium font-mono">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed mt-1">{review.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-slate-900/10 border border-slate-900/60">
                <MapPin className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">조회할 합주실을 선택해주세요</p>
                <p className="text-xs text-slate-500 mt-1">지도의 핀을 누르거나 목록에서 카드를 골라보세요.</p>
              </div>
            )}
          </div>

        </div>

        {/* Spotlight Advanced Lab */}
        <div className="mt-16 border-t border-slate-900/80 pt-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-500 tracking-widest bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md">
                Spotlight Advanced Lab
              </span>
              <h2 className="text-xl font-extrabold text-slate-100 mt-2.5">스포트라이트 합주 연주자 연구소</h2>
              <p className="text-xs text-slate-400 mt-1">예약 시뮬레이션, 실시간 밴드 구인, 그리고 합주실 기능 다중 비교까지 한 번에 즐겨보세요.</p>
            </div>
            
            {/* Lab Tabs */}
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-850 gap-1 self-start">
              <button
                onClick={() => setActiveLabTab('booking')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeLabTab === 'booking'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                📅 간편 예약 & 렌탈 시뮬
              </button>
              <button
                onClick={() => setActiveLabTab('matching')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeLabTab === 'matching'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                ⚡ 실시간 밴드 매칭 피드
              </button>
              <button
                onClick={() => setActiveLabTab('compare')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeLabTab === 'compare'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                ⚖️ 합주실 기능 다중 비교
              </button>
            </div>
          </div>

          {/* Tab Render */}
          <div className="transition-all duration-300">
            {activeLabTab === 'booking' && <BookingSimulator studios={studios} />}
            {activeLabTab === 'matching' && <BandMatching />}
            {activeLabTab === 'compare' && <StudioCompare studios={studios} />}
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 mt-16 bg-slate-950 px-4 py-8 text-center text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Studio Spotlight. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 transition cursor-pointer">Acoustic Simulator v1</span>
            <span className="hover:text-slate-400 transition cursor-pointer">Supabase Realtime v2</span>
            <span className="hover:text-slate-400 transition cursor-pointer">Gemini AI Engine</span>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-100">
                {authMode === 'signin' ? '수퍼베이스 로그인' : '수퍼베이스 간편가입'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === 'signin' ? '가입된 이메일 주소를 사용해 로그인하세요.' : '이메일 주소를 입력하여 간편하게 가입하세요.'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">이메일 주소</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="yourname@domain.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 rounded-xl text-xs text-slate-200 placeholder-slate-600 outline-none transition"
                  />
                </div>
              </div>

              {authError && (
                <p className="text-xs text-red-400 leading-relaxed bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl font-medium">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                {authMode === 'signin' ? '인증 및 로그인' : '새 계정 생성'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-950 text-center text-xs">
              {authMode === 'signin' ? (
                <p className="text-slate-400">
                  아직 회원이 아니신가요?{' '}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                  >
                    간편 가입하기
                  </button>
                </p>
              ) : (
                <p className="text-slate-400">
                  이미 계정이 있으신가요?{' '}
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                  >
                    로그인하기
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DATABASE CONFIGURATION INFO DIALOG */}
      {dbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin">
            <button
              onClick={() => setDbModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex gap-3 items-center mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-100">수퍼베이스(Supabase) 연동 가이드</h3>
                <p className="text-xs text-slate-500">실시간 데이터베이스와 인증을 즉시 Cloud Run에 활성화하세요</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <p className="font-bold text-slate-200 mb-1">1단계: 환경 변수 등록</p>
                <p className="text-slate-400 mb-2">
                  AI Studio의 우측 상단 <strong>Settings &gt; Secrets</strong> 패널에서 다음 두 환경변수를 추가해 주세요:
                </p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-[11px] text-rose-400 space-y-1 select-all">
                  <p>VITE_SUPABASE_URL = "https://your-project-id.supabase.co"</p>
                  <p>VITE_SUPABASE_ANON_KEY = "your-anon-role-key"</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-200 mb-1">2단계: SQL 스키마 실행 (Supabase SQL Editor)</p>
                <p className="text-slate-400 mb-2">
                  수퍼베이스 대시보드의 SQL Editor에 아래 쿼리를 입력해 테이블을 생성해 주세요:
                </p>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-400 overflow-x-auto select-all">
{`-- [기존 테이블 삭제하고 새로 시작할 때만 아래 3줄 주석 해제 후 실행]
-- drop table if exists public.reviews cascade;
-- drop table if exists public.studio_bookings cascade;
-- drop table if exists public.studio_community cascade;

-- 1. 실시간 밴드 합주실 리뷰 테이블 생성 (이미 존재하는 경우 생성하지 않음)
create table if not exists public.reviews (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  studio_id text not null,
  user_name text not null,
  rating integer not null,
  content text not null
);

-- 2. 실시간 예약 테이블 생성 (이미 존재하는 경우 생성하지 않음)
create table if not exists public.studio_bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  studio_name text not null,
  room_name text not null,
  booking_date text not null,
  booking_time text not null,
  instrument_rented text not null,
  total_price integer not null
);

-- 3. 실시간 구인구직/Q&A 테이블 생성 (이미 존재하는 경우 생성하지 않음)
create table if not exists public.studio_community (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  author text not null,
  instrument text not null,
  region text not null,
  content text not null
);

-- 실시간 복제(Realtime) 게시 활성화 (처음 한 번만 추가)
-- 만약 이미 등록되어 에러가 난다면 이 부분은 실행하지 않으셔도 괜찮습니다.
-- alter publication supabase_realtime add table public.reviews;
-- alter publication supabase_realtime add table public.studio_bookings;
-- alter publication supabase_realtime add table public.studio_community;`}
                </pre>
              </div>

              <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/15">
                <p className="font-bold text-rose-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  실시간 연동이 좋은 이유
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  환경변수를 연결하면 <strong>Supabase의 PostgreSQL Realtime Engine</strong>이 작동하여, 여러 사용자가 서로 다른 기기에서 남긴 합주실 후기가 별도의 페이지 새로고침 없이 <strong>0.1초 만에 지도와 후기창에 동기화</strong>됩니다.
                </p>
              </div>
            </div>

            <button
              onClick={() => setDbModalOpen(false)}
              className="w-full mt-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              닫기 및 돌아가기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
