import React, { useState, useEffect } from 'react';
import { Studio } from '../data/studios';
import { Calendar, Clock, Guitar, CreditCard, Sparkles, AlertCircle, Trash2, CalendarCheck, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookingSimulatorProps {
  studios: Studio[];
}

interface BookingRecord {
  id: string;
  studio_name: string;
  room_name: string;
  booking_date: string;
  booking_time: string;
  instrument_rented: string;
  total_price: number;
  created_at: string;
}

export default function BookingSimulator({ studios }: BookingSimulatorProps) {
  const [selectedStudio, setSelectedStudio] = useState<Studio>(studios[0]);
  const [selectedRoom, setSelectedRoom] = useState<any>(studios[0].rooms[0]);
  const [bookingDate, setBookingDate] = useState<string>('2026-07-08');
  const [bookingTime, setBookingTime] = useState<string>('19:00');
  const [rentInstrument, setRentInstrument] = useState<string>('없음');
  const [duration, setDuration] = useState<number>(2);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Custom toast and cancel confirmation overlay states
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync studio rooms when studio changes
  useEffect(() => {
    if (selectedStudio?.rooms?.[0]) {
      setSelectedRoom(selectedStudio.rooms[0]);
    }
    if (selectedStudio?.hasGuitarRental && selectedStudio?.rentInstruments && selectedStudio.rentInstruments.length > 0) {
      setRentInstrument(selectedStudio.rentInstruments[0].name);
    } else {
      setRentInstrument('없음');
    }
  }, [selectedStudio]);

  // Load bookings from Supabase/LocalStorage
  const loadBookings = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase
        .from('studio_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.warn('Using LocalStorage fallback for bookings:', err);
      const cached = localStorage.getItem('spotlight_bookings');
      if (cached) {
        setBookings(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();

    // Subscribe to booking changes for real-time sync if supabase is ready
    let subscription: any = null;
    if (supabase) {
      subscription = supabase
        .channel('studio_bookings_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'studio_bookings' },
          () => {
            loadBookings();
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

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const roomPrice = selectedRoom?.pricePerHour || 0;
    const totalPrice = roomPrice * duration;

    const newBooking = {
      studio_name: selectedStudio?.name || '',
      room_name: selectedRoom?.name || '',
      booking_date: bookingDate,
      booking_time: bookingTime,
      instrument_rented: rentInstrument,
      total_price: totalPrice,
    };

    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase.from('studio_bookings').insert([newBooking]);
      if (error) throw error;
      
      // Force reload if subscription didn't trigger immediately
      loadBookings();
      showToast('예약이 성공적으로 완료되었습니다!', 'success');
    } catch (err) {
      console.warn('Saving to local storage due to connection fallback:', err);
      // Fallback
      const cached = localStorage.getItem('spotlight_bookings');
      const parsed = cached ? JSON.parse(cached) : [];
      const localBookingRecord: BookingRecord = {
        id: Math.random().toString(36).substr(2, 9),
        ...newBooking,
        created_at: new Date().toISOString(),
      };
      const updated = [localBookingRecord, ...parsed];
      localStorage.setItem('spotlight_bookings', JSON.stringify(updated));
      setBookings(updated);
      showToast('예약이 성공적으로 완료되었습니다! (로컬 모드 저장됨)', 'success');
    }
  };

  const deleteBooking = (id: string) => {
    setCancelTargetId(id);
  };

  const executeDeleteBooking = async (id: string) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase.from('studio_bookings').delete().eq('id', id);
      if (error) throw error;
      loadBookings();
      showToast('예약이 성공적으로 취소되었습니다.', 'success');
    } catch (err) {
      console.warn('Deleting from local storage fallback:', err);
      const updated = bookings.filter((b) => b.id !== id);
      localStorage.setItem('spotlight_bookings', JSON.stringify(updated));
      setBookings(updated);
      showToast('예약이 성공적으로 취소되었습니다. (로컬)', 'success');
    } finally {
      setCancelTargetId(null);
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

      {/* Booking Cancel Confirmation Overlay Modal */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center animate-fade-in">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <CalendarCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">합주실 예약 취소 확인</h4>
              <p className="text-xs text-slate-400 mt-1">선택하신 합주실 예약을 취소하시겠습니까? 로컬 또는 클라우드 DB에서 실시간 제거됩니다.</p>
            </div>
            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setCancelTargetId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-400 border border-slate-850 font-bold text-xs transition"
              >
                아니오
              </button>
              <button
                type="button"
                onClick={() => executeDeleteBooking(cancelTargetId)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                취소하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Booking Form */}
      <form
        onSubmit={handleBooking}
        className="lg:col-span-7 bg-slate-900/40 border border-slate-900/80 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col justify-between"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">원클릭 실시간 예약 시뮬레이터</h3>
              <p className="text-xs text-slate-500">시간을 지정하고, 검증된 무료 렌탈 장비까지 포함하여 가상 예약을 진행해 보세요.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Choose Studio */}
            <div>
              <label className="text-[11px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">합주실 선택</label>
              <select
                value={selectedStudio?.id || ''}
                onChange={(e) => {
                  const s = studios.find((x) => x.id === e.target.value);
                  if (s) setSelectedStudio(s);
                }}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {studios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Choose Room */}
            <div>
              <label className="text-[11px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">방(Room) 선택</label>
              <select
                value={selectedRoom?.name || ''}
                onChange={(e) => {
                  const r = selectedStudio?.rooms?.find((x) => x.name === e.target.value);
                  if (r) setSelectedRoom(r);
                }}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {selectedStudio?.rooms?.map((r, idx) => (
                  <option key={idx} value={r.name}>
                    {r.name} ({r.pricePerHour.toLocaleString()}원/h)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Date */}
            <div>
              <label className="text-[11px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">날짜</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-[11px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">시작 시간</label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-[11px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">이용 시간</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6].map((h) => (
                  <option key={h} value={h}>
                    {h}시간
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Instrument Rental */}
          <div>
            <label className="text-[11px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">무료 대여 장비 선택</label>
            <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-850 rounded-xl">
              <Guitar className="w-5 h-5 text-indigo-400" />
              <div className="flex-grow">
                {selectedStudio?.hasGuitarRental ? (
                  <select
                    value={rentInstrument}
                    onChange={(e) => setRentInstrument(e.target.value)}
                    className="w-full bg-transparent border-none text-xs text-slate-200 focus:outline-none"
                  >
                    {selectedStudio?.rentInstruments?.map((inst, idx) => (
                      <option key={idx} value={inst.name} className="bg-slate-950">
                        {inst.name} (무료 대여)
                      </option>
                    ))}
                    <option value="없음" className="bg-slate-950">
                      악기 대여 안함
                    </option>
                  </select>
                ) : (
                  <p className="text-xs text-slate-500 font-semibold">이 합주실은 무료 악기 대여를 진행하지 않습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="mt-6 pt-5 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">합계 시뮬레이션</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-100">{((selectedRoom?.pricePerHour || 0) * duration).toLocaleString()}</span>
              <span className="text-xs text-slate-400">원</span>
              {rentInstrument !== '없음' && (
                <span className="text-[10px] text-emerald-400 font-bold ml-2 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  악기 무료혜택 적용됨
                </span>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            예약 신청 완료하기
          </button>
        </div>
      </form>

      {/* Booking List Status */}
      <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900/80 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">나의 예약 현황 ({bookings.length})</h4>

        {bookings.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center py-10 text-center">
            <Calendar className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-400 leading-relaxed">아직 등록된 예약이 없습니다.<br />왼쪽 폼에서 새 예약을 진행해 보세요.</p>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto max-h-[300px] space-y-2 pr-1 custom-scrollbar">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-200 truncate">{booking.studio_name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                      {booking.room_name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-500">
                    <span>📅 {booking.booking_date}</span>
                    <span>⏰ {booking.booking_time}</span>
                    {booking.instrument_rented !== '없음' && (
                      <span className="text-emerald-400 font-medium">🎸 {booking.instrument_rented}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200 whitespace-nowrap">
                    {booking.total_price.toLocaleString()}원
                  </span>
                  <button
                    onClick={() => deleteBooking(booking.id)}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-rose-500/10 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/20 opacity-40 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
