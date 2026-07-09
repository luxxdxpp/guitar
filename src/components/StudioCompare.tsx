import React, { useState } from 'react';
import { Studio } from '../data/studios';
import { Scale, Check, X, ShieldCheck, Heart, AlertCircle } from 'lucide-react';

interface StudioCompareProps {
  studios: Studio[];
}

export default function StudioCompare({ studios }: StudioCompareProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 3) {
        setErrorMsg('최대 3개 합주실까지만 동시 비교가 가능합니다.');
        setTimeout(() => setErrorMsg(null), 3000);
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const compareList = studios.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="bg-slate-900/40 border border-slate-900/80 rounded-3xl p-5 md:p-6 shadow-2xl relative">
      {errorMsg && (
        <div className="absolute top-4 right-4 z-50 bg-rose-600 border border-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Scale className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">합주실 비교분석 엔진 (Compare Studios)</h3>
          <p className="text-xs text-slate-500">가격, 보유 장비, 악기 대여 메리트를 한눈에 비교해 보세요 (최대 3개)</p>
        </div>
      </div>

      {/* Select buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {studios.map((studio) => {
          const isSelected = selectedIds.includes(studio.id);
          return (
            <button
              key={studio.id}
              onClick={() => toggleSelect(studio.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isSelected
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSelected ? '✓ ' : '+ '}
              {studio.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {compareList.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-slate-950/40 border border-slate-900 border-dashed">
          <Scale className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-slate-400">위의 합주실 버튼을 선택하여 비교를 시작하세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {compareList.map((studio) => (
            <div
              key={studio.id}
              className="p-4 bg-slate-950/70 border border-slate-850 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h4 className="text-sm font-bold text-slate-100">{studio.name}</h4>
                  <button
                    onClick={() => toggleSelect(studio.id)}
                    className="text-slate-500 hover:text-rose-400 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Price */}
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">최소 시간당 가격</span>
                    <span className="text-slate-200 font-bold">
                      {Math.min(...studio.rooms.map((r) => r.pricePerHour)).toLocaleString()}원 ~
                    </span>
                  </div>

                  {/* Rating */}
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">이용 평점</span>
                    <span className="text-amber-400 font-bold">★ {studio.rating}</span>
                    <span className="text-slate-400 text-[10px] ml-1">({studio.reviewCount}개)</span>
                  </div>

                  {/* Region */}
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">지역</span>
                    <span className="text-slate-300">{studio.region}</span>
                  </div>

                  {/* Guitar Rental */}
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">기타 대여 품목</span>
                    {studio.hasGuitarRental ? (
                      <div className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>대여 가능 ({studio.rentInstruments.length}종)</span>
                      </div>
                    ) : (
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <X className="w-3.5 h-3.5" />
                        <span>자체 렌탈 없음</span>
                      </div>
                    )}
                  </div>

                  {/* Highlights / Advantages */}
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">핵심 특색</span>
                    <div className="flex flex-wrap gap-1">
                      {studio.advantages.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking simulation link helper */}
              <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-indigo-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  검증 필터 통과
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
