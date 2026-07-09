import React, { useState, useEffect } from 'react';
import { Users, Send, MessageSquare, Trash2, Globe, Disc, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MessageRecord {
  id: string;
  author: string;
  instrument: string;
  region: string;
  content: string;
  created_at: string;
}

export default function BandMatching() {
  const [author, setAuthor] = useState<string>('');
  const [instrument, setInstrument] = useState<string>('보컬');
  const [region, setRegion] = useState<string>('홍대/합정');
  const [content, setContent] = useState<string>('');
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Custom toast and overlay modal states
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase
        .from('studio_community')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.warn('Using LocalStorage fallback for community matching messages:', err);
      const cached = localStorage.getItem('spotlight_community');
      if (cached) {
        setMessages(JSON.parse(cached));
      } else {
        // Seed default dummy recruitment posts to make it look alive initially!
        const defaultSeeds: MessageRecord[] = [
          {
            id: 'seed-1',
            author: '지미헨드릭스2세',
            instrument: '일렉기타',
            region: '홍대/합정',
            content: '이번주 토요일 Hapjeong Sound Flow Studio에서 블루스 잼 세션 하실 드러머, 베이시스트 한 분 모십니다! 펜더 무료 대여도 활용할 예정입니다.',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'seed-2',
            author: '용산드럼빌런',
            instrument: '드럼',
            region: '신촌/마포',
            content: '재즈/펑크 밴드 키보드 구인합니다. 연주 스펙트럼 넓으신 분 대환영!',
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
        ];
        localStorage.setItem('spotlight_community', JSON.stringify(defaultSeeds));
        setMessages(defaultSeeds);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    let subscription: any = null;
    if (supabase) {
      subscription = supabase
        .channel('studio_community_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'studio_community' },
          () => {
            loadMessages();
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim()) {
      showToast('닉네임과 내용을 모두 입력해 주세요.', 'error');
      return;
    }

    const newMessage = {
      author: author.trim(),
      instrument,
      region,
      content: content.trim(),
    };

    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase.from('studio_community').insert([newMessage]);
      if (error) throw error;
      setContent('');
      loadMessages();
      showToast('포스팅이 성공적으로 등록되었습니다!', 'success');
    } catch (err) {
      console.warn('Saving message to local storage fallback:', err);
      const cached = localStorage.getItem('spotlight_community');
      const parsed = cached ? JSON.parse(cached) : [];
      const localMessageRecord: MessageRecord = {
        id: Math.random().toString(36).substr(2, 9),
        ...newMessage,
        created_at: new Date().toISOString(),
      };
      const updated = [localMessageRecord, ...parsed];
      localStorage.setItem('spotlight_community', JSON.stringify(updated));
      setMessages(updated);
      setContent('');
      showToast('포스팅이 성공적으로 등록되었습니다! (로컬)', 'success');
    }
  };

  const deleteMessage = (id: string) => {
    setDeleteTargetId(id);
  };

  const executeDeleteMessage = async (id: string) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase.from('studio_community').delete().eq('id', id);
      if (error) throw error;
      loadMessages();
      showToast('포스팅이 성공적으로 삭제되었습니다.', 'success');
    } catch (err) {
      console.warn('Deleting message fallback:', err);
      const updated = messages.filter((m) => m.id !== id);
      localStorage.setItem('spotlight_community', JSON.stringify(updated));
      setMessages(updated);
      showToast('포스팅이 성공적으로 삭제되었습니다. (로컬)', 'success');
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      {/* Toast Alert Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border flex items-center gap-2 animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-600 border-emerald-500 text-white' 
            : 'bg-rose-600 border-rose-500 text-white'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* Delete Confirmation Overlay Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center animate-fade-in">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">게시글 삭제 확인</h4>
              <p className="text-xs text-slate-400 mt-1">이 게시글을 정말로 영구 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.</p>
            </div>
            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-400 border border-slate-850 font-bold text-xs transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => executeDeleteMessage(deleteTargetId)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List Area */}
      <div className="lg:col-span-7 bg-slate-900/40 border border-slate-900/80 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col justify-between min-h-[400px]">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">밴드 매칭 & 번개 합주 게시판</h3>
                <p className="text-xs text-slate-500">실시간 연동되는 합주 모임 피드에서 멤버를 찾거나 질문을 올려보세요.</p>
              </div>
            </div>
            <button
              onClick={loadMessages}
              className="p-2 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 hover:text-white transition"
              title="새로고침"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">아직 등록된 모임 글이 없습니다.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 bg-slate-950/80 border border-slate-850 rounded-2xl flex flex-col justify-between gap-2.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{msg.author}</span>
                      <span className="text-[9px] font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md">
                        {msg.instrument}
                      </span>
                      <span className="text-[9px] font-semibold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                        {msg.region}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1 rounded bg-slate-900 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 opacity-0 group-hover:opacity-100 transition absolute right-3.5 top-3.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pr-6">{msg.content}</p>
                  <span className="text-[9px] text-slate-600 self-end font-mono">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Writing Post Form */}
      <form
        onSubmit={handleSendMessage}
        className="lg:col-span-5 bg-slate-900/40 border border-slate-900/80 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col justify-between"
      >
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">합주실 구인구직 및 Q&A 올리기</h4>

          {/* Nickname */}
          <div>
            <label className="text-[11px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">닉네임</label>
            <input
              type="text"
              placeholder="예: 용산베이스마스터"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Instrument */}
            <div>
              <label className="text-[11px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">포지션</label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {['보컬', '일렉기타', '통기타', '베이스', '드럼', '키보드/신디', '기타 세션', '잡담/Q&A'].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="text-[11px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">희망 구역</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {['홍대/합정', '신촌/마포', '강남/논현', '성동/성수', '용산/이태원', '서울 전역'].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-[11px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">모집 내용 / 질문 내용</label>
            <textarea
              rows={3}
              placeholder="모집하고 싶은 밴드 음악 장르나 원하는 시간대, 혹은 합주실에 관한 궁금한 사항을 적어 주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 w-full px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          포스팅 전송하기
        </button>
      </form>
    </div>
  );
}
