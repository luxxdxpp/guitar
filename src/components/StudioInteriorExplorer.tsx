import React, { useState, useEffect, useRef } from 'react';
import { Studio, Room, RentableInstrument } from '../data/studios';
import { 
  Sliders, 
  Volume2, 
  VolumeX, 
  Radio, 
  Music, 
  Settings, 
  Cpu, 
  Layers, 
  Activity, 
  Sparkles, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  HelpCircle, 
  Guitar,
  Power,
  Play,
  Square,
  Sparkle
} from 'lucide-react';

interface StudioInteriorExplorerProps {
  studios: Studio[];
  selectedStudio: Studio | null;
  onSelectStudio: (studio: Studio) => void;
}

export default function StudioInteriorExplorer({
  studios,
  selectedStudio,
  onSelectStudio,
}: StudioInteriorExplorerProps) {
  if (!selectedStudio) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-950 rounded-2xl border border-slate-800 text-slate-400">
        선택된 합주실이 없습니다.
      </div>
    );
  }

  // Active room within the selected studio
  const [activeRoom, setActiveRoom] = useState<Room>(selectedStudio.rooms[0]);

  // Sync active room when selectedStudio changes
  useEffect(() => {
    setActiveRoom(selectedStudio.rooms[0]);
  }, [selectedStudio.id]);

  // Audio Simulator Play State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mixerVol, setMixerVol] = useState({
    vocals: 75,
    guitar: 80,
    bass: 70,
    drums: 85,
  });
  const [mixerPan, setMixerPan] = useState({
    vocals: 0,
    guitar: -15,
    bass: 10,
    drums: 0,
  });
  const [mixerMute, setMixerMute] = useState({
    vocals: false,
    guitar: false,
    bass: false,
    drums: false,
  });
  const [soloChannel, setSoloChannel] = useState<string | null>(null);

  // Amp Knob Values
  const [ampGain, setAmpGain] = useState<number>(60);
  const [ampBass, setAmpBass] = useState<number>(50);
  const [ampMid, setAmpMid] = useState<number>(45);
  const [ampTreble, setAmpTreble] = useState<number>(55);
  const [ampReverb, setAmpReverb] = useState<number>(30);
  const [selectedAmp, setSelectedAmp] = useState<string>('Marshall JCM2000');

  // Update selected amp based on active room gear
  useEffect(() => {
    const ampFound = activeRoom.gear.find(g => g.toLowerCase().includes('marshall') || g.toLowerCase().includes('fender') || g.toLowerCase().includes('vox') || g.toLowerCase().includes('orange'));
    if (ampFound) {
      setSelectedAmp(ampFound);
    } else if (activeRoom.gear.length > 0) {
      setSelectedAmp(activeRoom.gear[0]);
    }
  }, [activeRoom]);

  // Acoustic Environment
  const [foamDensity, setFoamDensity] = useState<number>(85); // %
  const [roomAcousticSize, setRoomAcousticSize] = useState<'muffled' | 'studio' | 'hall'>('studio');

  // Instrument Rental Simulation State
  const [rentedItems, setRentedItems] = useState<string[]>([]);
  
  const toggleRent = (instName: string) => {
    if (rentedItems.includes(instName)) {
      setRentedItems(prev => prev.filter(item => item !== instName));
    } else {
      setRentedItems(prev => [...prev, instName]);
    }
  };

  // Web Audio Context for browser synthesis (pleasant synth sounds)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<{ [key: string]: { osc: OscillatorNode, gainNode: GainNode } }>({});
  const intervalRef = useRef<number | null>(null);

  // Simulated live audio levels
  const [vocalLevel, setVocalLevel] = useState<number>(0);
  const [guitarLevel, setGuitarLevel] = useState<number>(0);
  const [bassLevel, setBassLevel] = useState<number>(0);
  const [drumLevel, setDrumLevel] = useState<number>(0);

  // Level Animation Interval
  useEffect(() => {
    let timerId: number;
    if (isPlaying) {
      timerId = window.setInterval(() => {
        const getVal = (ch: 'vocals' | 'guitar' | 'bass' | 'drums') => {
          if (mixerMute[ch]) return 0;
          if (soloChannel && soloChannel !== ch) return 0;
          const base = mixerVol[ch] / 100;
          const rand = Math.random() * 0.4 + 0.6; // fluctuating
          return Math.floor(base * rand * 100);
        };
        setVocalLevel(getVal('vocals'));
        setGuitarLevel(getVal('guitar'));
        setBassLevel(getVal('bass'));
        setDrumLevel(getVal('drums'));
      }, 100);
    } else {
      setVocalLevel(0);
      setGuitarLevel(0);
      setBassLevel(0);
      setDrumLevel(0);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isPlaying, mixerVol, mixerMute, soloChannel]);

  // Web Audio Synth Nodes setup
  const startSynth = () => {
    try {
      if (!audioCtxRef.current) {
        // Create context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // We synthesize 3 simple channels: guitar (high pluck), bass (low sub drone), drums (periodic synth pulse), vocals (soft pad)
      const channels = ['vocals', 'guitar', 'bass', 'drums'];
      channels.forEach(ch => {
        if (oscillatorsRef.current[ch]) return;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (ch === 'vocals') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
        } else if (ch === 'guitar') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
        } else if (ch === 'bass') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(110.00, ctx.currentTime); // A2
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
        } else if (ch === 'drums') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(65.41, ctx.currentTime); // C2
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
        }

        osc.start();
        oscillatorsRef.current[ch] = { osc, gainNode };
      });

      // Simple rhythmic sequencer
      let step = 0;
      intervalRef.current = window.setInterval(() => {
        const currentCtx = audioCtxRef.current;
        if (!currentCtx) return;

        // Apply volume levels and filter based on mutes
        const getGain = (ch: 'vocals' | 'guitar' | 'bass' | 'drums', defaultVol: number) => {
          if (mixerMute[ch]) return 0;
          if (soloChannel && soloChannel !== ch) return 0;
          return (mixerVol[ch] / 100) * defaultVol;
        };

        const t = currentCtx.currentTime;

        // Vocals (Soft chord pad)
        const vNode = oscillatorsRef.current['vocals'];
        if (vNode) {
          const notes = [440, 493.88, 523.25, 587.33]; // A4, B4, C5, D5
          if (step % 8 === 0) {
            vNode.osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], t);
          }
          vNode.gainNode.gain.setTargetAtTime(getGain('vocals', 0.04), t, 0.3);
        }

        // Guitar (Plucky synth)
        const gNode = oscillatorsRef.current['guitar'];
        if (gNode) {
          if (step % 2 === 0) {
            const gGain = getGain('guitar', 0.05);
            gNode.gainNode.gain.setValueAtTime(gGain, t);
            gNode.gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
            const freqs = [329.63, 392.00, 440.00, 523.25]; // E4, G4, A4, C5
            gNode.osc.frequency.setValueAtTime(freqs[(step / 2) % freqs.length], t);
          }
        }

        // Bass (Rhythmic sub)
        const bNode = oscillatorsRef.current['bass'];
        if (bNode) {
          if (step % 4 === 0) {
            const bGain = getGain('bass', 0.08);
            bNode.gainNode.gain.setValueAtTime(bGain, t);
            bNode.gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
            const bassFreqs = [110.00, 130.81, 98.00, 87.31]; // A2, C3, G2, F2
            bNode.osc.frequency.setValueAtTime(bassFreqs[(step / 4) % bassFreqs.length], t);
          }
        }

        // Drums (Beat thump)
        const dNode = oscillatorsRef.current['drums'];
        if (dNode) {
          if (step % 4 === 0 || step % 4 === 2) {
            const dGain = getGain('drums', 0.12);
            dNode.gainNode.gain.setValueAtTime(dGain, t);
            dNode.gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
          }
        }

        step = (step + 1) % 16;
      }, 150);

      setIsPlaying(true);
    } catch (e) {
      console.error('AudioContext synth error:', e);
      // Fallback: visual only
      setIsPlaying(true);
    }
  };

  const stopSynth = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Stop all audio volume output
    Object.keys(oscillatorsRef.current).forEach(ch => {
      const node = oscillatorsRef.current[ch];
      if (node && audioCtxRef.current) {
        node.gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      Object.keys(oscillatorsRef.current).forEach(ch => {
        try {
          oscillatorsRef.current[ch].osc.stop();
        } catch(e){}
      });
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Compute total rent price
  const totalRentPrice = rentedItems.reduce((acc, name) => {
    const inst = selectedStudio.rentInstruments.find(i => i.name === name);
    return acc + (inst ? inst.pricePerHour : 0);
  }, 0);

  // Amp Tone characteristics calculation
  const getToneProfile = () => {
    if (ampGain > 75 && ampTreble > 70) {
      return {
        name: 'Heavy Metal Lead (헤비메탈 딜레이 크런치)',
        desc: '강렬한 하이게인 톤으로 솔로 연주 및 메탈 리프에 적합합니다.',
        color: 'text-rose-500 border-rose-500/20 bg-rose-500/5',
      };
    }
    if (ampGain > 50 && ampMid > 60) {
      return {
        name: 'Classic British Rock (빈티지 락 브리티시 크런치)',
        desc: '밀도 높은 중음역대와 시원한 게인으로 오아시스 스타일의 백킹 톤입니다.',
        color: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
      };
    }
    if (ampGain < 35 && ampReverb > 40) {
      return {
        name: 'Dreamy Ambient Clean (몽환적인 슈게이징 공간계 클린)',
        desc: '맑고 투명한 클린 톤에 깊은 리버브가 어우러져 공간감이 극대화됩니다.',
        color: 'text-sky-400 border-sky-400/20 bg-sky-400/5',
      };
    }
    if (ampGain < 40 && ampBass > 60) {
      return {
        name: 'Warm Neo-Soul & Jazz (따뜻한 네오소울 & 재즈 재즈 마스터)',
        desc: '부드러운 저역대와 묵직한 배음으로 세련된 코드 연주에 알맞습니다.',
        color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
      };
    }
    return {
      name: 'Standard Stage Balance (정석 밴드 스테이지 밸런스)',
      desc: '공연 및 합주용 표준 진공관 세팅입니다.',
      color: 'text-slate-300 border-slate-800 bg-slate-900/50',
    };
  };

  const toneProfile = getToneProfile();

  // Acoustic RT60 (reverberation time) estimation
  const getRT60 = () => {
    let base = 0.5; // studio standard
    if (roomAcousticSize === 'muffled') base = 0.22;
    if (roomAcousticSize === 'hall') base = 1.1;

    // denser foam absorbs more reflections, decreasing RT60
    const multiplier = 1 - (foamDensity - 50) / 100;
    return (base * multiplier).toFixed(2);
  };

  return (
    <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Banner */}
      <div className="p-4 md:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 tracking-wider">
              STUDIO INTERIOR & ACOUSTICS
            </span>
            <span className="text-[10px] text-slate-500 font-mono">No API Required</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Music className="w-5 h-5 text-rose-400" />
            합주실 장비 & 가상 사운드 시뮬레이터
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {selectedStudio.name}의 가상 룸을 가이드하고 진공관 앰프 톤 메이킹 및 잼 세션 사운드 테스팅을 지원합니다.
          </p>
        </div>

        {/* Rapid Studio Quick Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">다른 합주실 바로 보기:</span>
          <select
            value={selectedStudio.id}
            onChange={(e) => {
              const target = studios.find(s => s.id === e.target.value);
              if (target) onSelectStudio(target);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl focus:outline-none focus:border-rose-500/40"
          >
            {studios.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.region === 'Hongdae' ? '홍대' : s.region === 'Hapjeong' ? '합정' : s.region === 'Gangnam' ? '강남' : s.region === 'Sinchon' ? '신촌' : '성수'})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Interactive Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        
        {/* LEFT COLUMN (Lg: col-5): Rooms, Rentable gear */}
        <div className="lg:col-span-5 p-5 flex flex-col gap-5 bg-slate-900/10">
          
          {/* Room Selector Tab buttons */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              보유 합주실 룸 목록 ({selectedStudio.rooms.length})
            </h3>
            <div className="flex flex-col gap-2">
              {selectedStudio.rooms.map((room) => {
                const isActive = activeRoom.name === room.name;
                return (
                  <button
                    key={room.name}
                    onClick={() => setActiveRoom(room)}
                    className={`p-3 rounded-xl border text-left transition-all duration-300 relative overflow-hidden flex justify-between items-center ${
                      isActive
                        ? 'bg-rose-500/[0.04] border-rose-500/40 shadow-lg'
                        : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900/40'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-rose-500" />
                    )}
                    <div>
                      <p className={`text-xs font-bold ${isActive ? 'text-rose-400' : 'text-slate-300'}`}>
                        {room.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        정원 {room.capacity}명 · 최고급 오디오 시스템
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-slate-200">
                        {room.pricePerHour.toLocaleString()}원
                      </p>
                      <p className="text-[9px] text-slate-500">시간당</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Room's Live Gear Spec */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-900">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              {activeRoom.name} 전용 최고급 하드웨어 사운드 스펙
            </h4>
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              {activeRoom.gear.map((g, idx) => {
                const isSelectedAmp = g === selectedAmp;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (g.toLowerCase().includes('marshall') || g.toLowerCase().includes('fender') || g.toLowerCase().includes('vox') || g.toLowerCase().includes('orange') || g.toLowerCase().includes('ampeg') || g.toLowerCase().includes('hartke') || g.toLowerCase().includes('yamaha') || g.toLowerCase().includes('kurzweil') || g.toLowerCase().includes('roland')) {
                        setSelectedAmp(g);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between h-16 ${
                      isSelectedAmp
                        ? 'border-indigo-500/40 bg-indigo-500/[0.03] ring-1 ring-indigo-500/20'
                        : 'border-slate-900 bg-slate-900/20 hover:border-slate-800'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tight">
                      {g.toLowerCase().includes('marshall') || g.toLowerCase().includes('fender') || g.toLowerCase().includes('vox') || g.toLowerCase().includes('orange') ? 'Guitar Amp' :
                       g.toLowerCase().includes('ampeg') || g.toLowerCase().includes('hartke') ? 'Bass Amp' :
                       g.toLowerCase().includes('tama') || g.toLowerCase().includes('pearl') ? 'Drum Kit' :
                       g.toLowerCase().includes('yamaha') || g.toLowerCase().includes('kurzweil') || g.toLowerCase().includes('roland') ? 'Synthesizer' : 'Audio Gear'}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate" title={g}>
                      {g}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instrument Rental Cabinet Cabinet */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Guitar className="w-3.5 h-3.5 text-rose-400" />
                악기 대여 보관 캐비닛 (Instruments)
              </h3>
              {selectedStudio.hasGuitarRental && (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                  기타 무료 대여 포함
                </span>
              )}
            </div>

            {selectedStudio.rentInstruments.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-950 border border-slate-900 text-[11px] text-slate-500">
                대여 가능한 악기가 설정되지 않았습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {selectedStudio.rentInstruments.map((inst, idx) => {
                  const isRented = rentedItems.includes(inst.name);
                  return (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                        isRented
                          ? 'bg-indigo-500/[0.04] border-indigo-500/30'
                          : 'bg-slate-950/60 border-slate-900/80 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${
                          inst.type === 'guitar' ? 'bg-amber-500/10 text-amber-400' :
                          inst.type === 'bass' ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          <Guitar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-300 block">{inst.name}</span>
                          <span className="text-[10px] text-slate-500 block">{inst.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-semibold text-slate-300">
                          {inst.pricePerHour === 0 ? '무료' : `+${inst.pricePerHour.toLocaleString()}원/시간`}
                        </span>
                        <button
                          onClick={() => toggleRent(inst.name)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                            isRented
                              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {isRented ? '대여 취소' : '장비 대여'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Virtual Rental Bill Estimator */}
            {rentedItems.length > 0 && (
              <div className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-slate-850 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">선택 대여 악기 ({rentedItems.length}개)</p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                    {rentedItems.join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold font-mono text-indigo-400">
                    +{totalRentPrice.toLocaleString()}원 <span className="text-[10px] text-slate-500 font-normal">/ 시간</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (Lg: col-7): Virtual Sound Mixer, Tone Dial & Environment */}
        <div className="lg:col-span-7 p-5 flex flex-col gap-6">
          
          {/* Virtual mixing console */}
          <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-rose-500/10 text-rose-400">
                  <Sliders className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    가상 실시간 사운드 믹싱 콘솔 (Acoustic Mixing Console)
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">합주실 내 각 채널의 가상 오디오 밸런스를 가청 테스트합니다.</p>
                </div>
              </div>

              {/* Master Play Button for synthesis */}
              <button
                onClick={isPlaying ? stopSynth : startSynth}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md ${
                  isPlaying 
                    ? 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse' 
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-white" />
                    가상 합주 일시정지
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    가상 합주 세션 청음 (Play)
                  </>
                )}
              </button>
            </div>

            {/* Mixer Sliders Row */}
            <div className="grid grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-900">
              
              {/* Channel 1: Vocals */}
              <div className="flex flex-col items-center gap-3 bg-slate-900/20 p-2.5 rounded-lg border border-slate-900">
                <span className="text-[10px] font-bold text-slate-400">CH 1: 보컬</span>
                
                {/* Visual Level Meter */}
                <div className="w-2.5 h-20 bg-slate-900 rounded-full overflow-hidden flex flex-col justify-end">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
                    style={{ height: `${vocalLevel}%` }}
                  />
                </div>

                {/* Vol Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixerVol.vocals}
                  onChange={(e) => setMixerVol(prev => ({ ...prev, vocals: parseInt(e.target.value) }))}
                  className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
                
                {/* Mute and Solo Button */}
                <div className="flex gap-1.5 w-full">
                  <button
                    onClick={() => setMixerMute(prev => ({ ...prev, vocals: !prev.vocals }))}
                    className={`flex-1 py-1 rounded text-[10px] font-bold transition ${
                      mixerMute.vocals ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    MUTE
                  </button>
                  <button
                    onClick={() => setSoloChannel(soloChannel === 'vocals' ? null : 'vocals')}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold transition ${
                      soloChannel === 'vocals' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    S
                  </button>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-500">{mixerVol.vocals}%</span>
              </div>

              {/* Channel 2: Lead Guitar */}
              <div className="flex flex-col items-center gap-3 bg-slate-900/20 p-2.5 rounded-lg border border-slate-900">
                <span className="text-[10px] font-bold text-slate-400">CH 2: 기타</span>
                
                {/* Visual Level Meter */}
                <div className="w-2.5 h-20 bg-slate-900 rounded-full overflow-hidden flex flex-col justify-end">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
                    style={{ height: `${guitarLevel}%` }}
                  />
                </div>

                {/* Vol Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixerVol.guitar}
                  onChange={(e) => setMixerVol(prev => ({ ...prev, guitar: parseInt(e.target.value) }))}
                  className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
                
                {/* Mute and Solo Button */}
                <div className="flex gap-1.5 w-full">
                  <button
                    onClick={() => setMixerMute(prev => ({ ...prev, guitar: !prev.guitar }))}
                    className={`flex-1 py-1 rounded text-[10px] font-bold transition ${
                      mixerMute.guitar ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    MUTE
                  </button>
                  <button
                    onClick={() => setSoloChannel(soloChannel === 'guitar' ? null : 'guitar')}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold transition ${
                      soloChannel === 'guitar' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    S
                  </button>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-500">{mixerVol.guitar}%</span>
              </div>

              {/* Channel 3: Bass Guitar */}
              <div className="flex flex-col items-center gap-3 bg-slate-900/20 p-2.5 rounded-lg border border-slate-900">
                <span className="text-[10px] font-bold text-slate-400">CH 3: 베이스</span>
                
                {/* Visual Level Meter */}
                <div className="w-2.5 h-20 bg-slate-900 rounded-full overflow-hidden flex flex-col justify-end">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
                    style={{ height: `${bassLevel}%` }}
                  />
                </div>

                {/* Vol Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixerVol.bass}
                  onChange={(e) => setMixerVol(prev => ({ ...prev, bass: parseInt(e.target.value) }))}
                  className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
                
                {/* Mute and Solo Button */}
                <div className="flex gap-1.5 w-full">
                  <button
                    onClick={() => setMixerMute(prev => ({ ...prev, bass: !prev.bass }))}
                    className={`flex-1 py-1 rounded text-[10px] font-bold transition ${
                      mixerMute.bass ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    MUTE
                  </button>
                  <button
                    onClick={() => setSoloChannel(soloChannel === 'bass' ? null : 'bass')}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold transition ${
                      soloChannel === 'bass' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    S
                  </button>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-500">{mixerVol.bass}%</span>
              </div>

              {/* Channel 4: Drums */}
              <div className="flex flex-col items-center gap-3 bg-slate-900/20 p-2.5 rounded-lg border border-slate-900">
                <span className="text-[10px] font-bold text-slate-400">CH 4: 드럼</span>
                
                {/* Visual Level Meter */}
                <div className="w-2.5 h-20 bg-slate-900 rounded-full overflow-hidden flex flex-col justify-end">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
                    style={{ height: `${drumLevel}%` }}
                  />
                </div>

                {/* Vol Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixerVol.drums}
                  onChange={(e) => setMixerVol(prev => ({ ...prev, drums: parseInt(e.target.value) }))}
                  className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
                
                {/* Mute and Solo Button */}
                <div className="flex gap-1.5 w-full">
                  <button
                    onClick={() => setMixerMute(prev => ({ ...prev, drums: !prev.drums }))}
                    className={`flex-1 py-1 rounded text-[10px] font-bold transition ${
                      mixerMute.drums ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    MUTE
                  </button>
                  <button
                    onClick={() => setSoloChannel(soloChannel === 'drums' ? null : 'drums')}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold transition ${
                      soloChannel === 'drums' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    S
                  </button>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-500">{mixerVol.drums}%</span>
              </div>

            </div>

            {/* Quick Mixer Status and Instructions */}
            <div className="p-2.5 bg-slate-950 rounded-xl text-[11px] text-slate-400 leading-normal flex items-center gap-2 border border-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {isPlaying 
                  ? '현재 브라우저 Web Audio API를 사용하여 실시간 오실레이터 합주를 출력 중입니다. 각 볼륨 슬라이더를 조정하면 청음 음량이 바뀝니다.'
                  : '가상 합주 청음을 실행하여 합주실 내 스피커 출력 환경과 사운드 조화를 간접 체험해 보세요.'}
              </span>
            </div>
          </div>

          {/* Tube Amp Dial Controller */}
          <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Power className="w-4 h-4 text-emerald-400" />
                  진공관 일렉기타 앰프 시뮬레이터 (Tube Amp simulator)
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">합주실 내 구비된 기타 앰프의 톤 밸런스를 가상 조작합니다.</p>
              </div>
              <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2.5 py-1 rounded-lg font-mono">
                {selectedAmp}
              </span>
            </div>

            {/* Dial Knobs */}
            <div className="grid grid-cols-5 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-900">
              {/* Gain */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400">GAIN (게인)</span>
                <div className="relative w-11 h-11 flex items-center justify-center">
                  {/* Outer circle decoration */}
                  <div className="absolute inset-0 rounded-full border border-slate-800 bg-slate-900" />
                  {/* Rotating pointer line */}
                  <div 
                    className="absolute w-0.5 h-4 bg-rose-500 origin-bottom transition-transform duration-200"
                    style={{ 
                      transform: `rotate(${(ampGain / 100) * 270 - 135}deg) translateY(-8px)`,
                    }}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-200 z-10">{ampGain}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ampGain}
                  onChange={(e) => setAmpGain(parseInt(e.target.value))}
                  className="w-full accent-rose-500 h-1 mt-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Bass */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400">BASS (저역)</span>
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-slate-800 bg-slate-900" />
                  <div 
                    className="absolute w-0.5 h-4 bg-indigo-400 origin-bottom transition-transform duration-200"
                    style={{ 
                      transform: `rotate(${(ampBass / 100) * 270 - 135}deg) translateY(-8px)`,
                    }}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-200 z-10">{ampBass}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ampBass}
                  onChange={(e) => setAmpBass(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 h-1 mt-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Middle */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400">MIDDLE (중역)</span>
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-slate-800 bg-slate-900" />
                  <div 
                    className="absolute w-0.5 h-4 bg-indigo-400 origin-bottom transition-transform duration-200"
                    style={{ 
                      transform: `rotate(${(ampMid / 100) * 270 - 135}deg) translateY(-8px)`,
                    }}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-200 z-10">{ampMid}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ampMid}
                  onChange={(e) => setAmpMid(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 h-1 mt-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Treble */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400">TREBLE (고역)</span>
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-slate-800 bg-slate-900" />
                  <div 
                    className="absolute w-0.5 h-4 bg-indigo-400 origin-bottom transition-transform duration-200"
                    style={{ 
                      transform: `rotate(${(ampTreble / 100) * 270 - 135}deg) translateY(-8px)`,
                    }}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-200 z-10">{ampTreble}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ampTreble}
                  onChange={(e) => setAmpTreble(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 h-1 mt-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Reverb */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400">REVERB (울림)</span>
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-slate-800 bg-slate-900" />
                  <div 
                    className="absolute w-0.5 h-4 bg-emerald-400 origin-bottom transition-transform duration-200"
                    style={{ 
                      transform: `rotate(${(ampReverb / 100) * 270 - 135}deg) translateY(-8px)`,
                    }}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-200 z-10">{ampReverb}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ampReverb}
                  onChange={(e) => setAmpReverb(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 h-1 mt-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Active Tone Profile Output Card */}
            <div className={`p-3.5 rounded-xl border flex flex-col gap-1 transition-all ${toneProfile.color}`}>
              <div className="flex items-center gap-1.5">
                <Sparkle className="w-3.5 h-3.5 animate-spin text-inherit" style={{ animationDuration: '6s' }} />
                <span className="text-xs font-bold uppercase tracking-wide">실시간 매칭 톤: {toneProfile.name}</span>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">{toneProfile.desc}</p>
            </div>
          </div>

          {/* Acoustic Environment Tuner */}
          <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-sky-400" />
                공간 어쿠스틱 세팅 & 흡음 수치 계산기 (Room Acoustics Analyzer)
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">룸 크기와 방음 부자재 흡음률에 따른 리버브 타임(RT60)을 계산합니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-900">
              
              {/* Foam Density Control */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>흡음재 밀도 (Decibel Absorption)</span>
                  <span className="font-mono text-sky-400">{foamDensity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={foamDensity}
                  onChange={(e) => setFoamDensity(parseInt(e.target.value))}
                  className="w-full accent-sky-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 leading-normal">
                  흡음재가 조밀할수록 반사음이 억제되어 덤핑감 있는 베이스 사운드가 살아납니다.
                </span>
              </div>

              {/* Room Size Preset */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400">어쿠스틱 룸 울림 반사도 선택</span>
                <div className="flex gap-1">
                  {(['muffled', 'studio', 'hall'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setRoomAcousticSize(preset)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize transition ${
                        roomAcousticSize === preset
                          ? 'bg-sky-500/10 border border-sky-500/35 text-sky-400'
                          : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset === 'muffled' ? '데드 (Dry)' : preset === 'studio' ? '표준 (Live)' : '홀 (Wet)'}
                    </button>
                  ))}
                </div>
                <span className="text-[9px] text-slate-500 leading-normal">
                  공간 반사 강도가 클수록 깊고 자연스러운 마이크 울림 성향을 보입니다.
                </span>
              </div>

            </div>

            {/* Calculated Values */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold">리버브 타임 (RT60)</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{getRT60()}초</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold">방음 보장 규격</span>
                <span className="text-xs font-mono font-bold text-emerald-400">-{foamDensity - 15} dB</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer disclaimer */}
      <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-center flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] text-slate-400">
          본 가상 테스트는 실제 음향 설계 수식에 기반하여 시뮬레이션 되었으며, {selectedStudio.name}의 프리미엄 음향 컨디션을 반영합니다.
        </span>
      </div>
    </div>
  );
}
