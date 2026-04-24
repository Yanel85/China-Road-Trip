'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Search, MapPin, Check, Wand2, Trash2 } from 'lucide-react';
import { POIData, RouteData } from '@/types';
import { useLocalRoutes } from '@/hooks/useLocalRoutes';

export default function CustomRouteCreator({ buttonClassName }: { buttonClassName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'endpoints' | 'middlepoints' | 'naming'>('endpoints');
  const [name, setName] = useState('');
  const [allPois, setAllPois] = useState<POIData[]>([]);
  const [startPoi, setStartPoi] = useState<POIData | null>(null);
  const [endPoi, setEndPoi] = useState<POIData | null>(null);
  const [selectedPois, setSelectedPois] = useState<POIData[]>([]);
  const [startSearch, setStartSearch] = useState('');
  const [endSearch, setEndSearch] = useState('');
  const [focusedInput, setFocusedInput] = useState<'start' | 'end' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { saveRoute } = useLocalRoutes();

  useEffect(() => {
    if (isOpen) {
      fetch('/api/pois')
        .then(res => res.json())
        .then(data => setAllPois(data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const generateMiddlePois = async () => {
    if (!startPoi || !endPoi) return;
    setIsGenerating(true);
    
    // Skip middlepoints and go straight to naming
    setSelectedPois([startPoi, endPoi]);
    setStep('naming');
    setIsGenerating(false);
  };

  const handleSave = () => {
    if (!name || selectedPois.length < 2) return;

    const newRoute: RouteData = {
      id: `custom-${Date.now()}`,
      title: name,
      status: '自定义',
      distance: 0,
      tags: ['自定义'],
      season: ['春', '夏', '秋', '冬'],
      routeSequence: selectedPois.map(p => p.poiId),
      cover: 'https://picsum.photos/seed/custom/800/600',
      isCustom: true
    };

    saveRoute(newRoute);
    setIsOpen(false);
    setStep('endpoints');
    setName('');
    setStartPoi(null);
    setEndPoi(null);
    setSelectedPois([]);
  };

  const filteredPois = allPois.filter(p => {
    const match = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.poiId.toLowerCase().includes(searchQuery.toLowerCase());
    return match;
  }).slice(0, 30);

  const reset = () => {
    setIsOpen(false);
    setStep('endpoints');
    setStartPoi(null);
    setEndPoi(null);
    setSelectedPois([]);
    setName('');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={buttonClassName || "fixed bottom-24 right-4 z-50 bg-black text-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center flex-col gap-0.5 hover:scale-105 active:scale-95 transition-all border border-white/20"}
      >
        <Plus size={buttonClassName ? 20 : 24} />
        <span className={buttonClassName ? "text-sm font-bold tracking-wide" : "text-[10px] font-bold"}>
          {buttonClassName ? "创建路线" : "创建"}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={reset}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white rounded-t-[32px] z-[101] flex flex-col max-h-[92vh] overflow-hidden shadow-2xl"
            >
              <div className="p-6 flex-shrink-0 border-b border-gray-100 bg-white">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">规划我的路线</h2>
                    <p className="text-xs text-gray-400 font-medium">Step {step === 'endpoints' ? '1' : '2'} of 2</p>
                  </div>
                  <button onClick={reset} className="p-2 bg-gray-100 rounded-full text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                {step === 'endpoints' && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                       <div className="relative">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">起点</label>
                          <div className={`mt-1 flex items-center bg-gray-50 rounded-xl border ${focusedInput === 'start' ? 'border-brand ring-1 ring-brand/30' : startPoi ? 'border-brand bg-brand/5 text-brand' : 'border-gray-100'}`}>
                             <Search className="ml-3 text-gray-400" size={16} />
                             <input 
                               type="text"
                               placeholder="搜索并选择起点..."
                               value={focusedInput === 'start' ? startSearch : (startPoi?.title || '')}
                               onFocus={() => { setFocusedInput('start'); setStartSearch(''); }}
                               onBlur={() => setFocusedInput(null)}
                               onChange={(e) => setStartSearch(e.target.value)}
                               className="w-full pl-2 pr-4 py-3 bg-transparent outline-none text-sm font-bold text-gray-900"
                             />
                             {startPoi && <Check size={16} className="mr-4 text-brand" />}
                          </div>
                          {focusedInput === 'start' && startSearch.trim().length > 0 && (
                             <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-64 overflow-y-auto no-scrollbar">
                                {allPois.filter(p => p.title.toLowerCase().includes(startSearch.toLowerCase()) || p.poiId.toLowerCase().includes(startSearch.toLowerCase())).slice(0, 30).map(poi => (
                                    <button 
                                      key={poi.poiId}
                                      onMouseDown={(e) => {
                                         e.preventDefault();
                                         setStartPoi(poi);
                                         setFocusedInput(null);
                                      }}
                                      className="w-full text-left p-3 hover:bg-brand/5 border-b border-gray-50 flex items-center justify-between"
                                    >
                                      <div><div className="font-bold text-gray-800 text-sm">{poi.title}</div><div className="text-[10px] text-gray-400">{poi.type}</div></div>
                                    </button>
                                ))}
                             </div>
                          )}
                       </div>

                       <div className="relative">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">终点</label>
                          <div className={`mt-1 flex items-center bg-gray-50 rounded-xl border ${focusedInput === 'end' ? 'border-brand ring-1 ring-brand/30' : endPoi ? 'border-brand bg-brand/5 text-brand' : 'border-gray-100'}`}>
                             <Search className="ml-3 text-gray-400" size={16} />
                             <input 
                               type="text"
                               placeholder="搜索并选择终点..."
                               value={focusedInput === 'end' ? endSearch : (endPoi?.title || '')}
                               onFocus={() => { setFocusedInput('end'); setEndSearch(''); }}
                               onBlur={() => setFocusedInput(null)}
                               onChange={(e) => setEndSearch(e.target.value)}
                               className="w-full pl-2 pr-4 py-3 bg-transparent outline-none text-sm font-bold text-gray-900"
                             />
                             {endPoi && <Check size={16} className="mr-4 text-brand" />}
                          </div>
                          {focusedInput === 'end' && endSearch.trim().length > 0 && (
                             <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-64 overflow-y-auto no-scrollbar">
                                {allPois.filter(p => p.title.toLowerCase().includes(endSearch.toLowerCase()) || p.poiId.toLowerCase().includes(endSearch.toLowerCase())).slice(0, 30).map(poi => (
                                    <button 
                                      key={poi.poiId}
                                      onMouseDown={(e) => {
                                         e.preventDefault();
                                         setEndPoi(poi);
                                         setFocusedInput(null);
                                      }}
                                      className="w-full text-left p-3 hover:bg-brand/5 border-b border-gray-50 flex items-center justify-between"
                                    >
                                      <div><div className="font-bold text-gray-800 text-sm">{poi.title}</div><div className="text-[10px] text-gray-400">{poi.type}</div></div>
                                    </button>
                                ))}
                             </div>
                          )}
                       </div>
                    </div>
                  </div>
                )}

                {step === 'naming' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">给你的路线起个名字</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="例如：2026年夏季新疆深度游" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-brand focus:bg-white rounded-2xl outline-none transition-all text-lg font-black text-gray-900"
                    />
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">规划结果预览 (起点和终点)</p>
                      <div className="flex flex-wrap items-center gap-2 max-h-32 overflow-y-auto no-scrollbar">
                        {selectedPois.map((p, i) => (
                          <div key={p.poiId} className="flex items-center">
                            <span className="text-[11px] font-bold text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                              {p.title}
                            </span>
                            {i < selectedPois.length - 1 && <span className="text-gray-300 mx-1">→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border-t border-gray-100">
                {step === 'endpoints' && (
                  <button 
                    onClick={generateMiddlePois}
                    disabled={!startPoi || !endPoi || isGenerating}
                    className="w-full h-14 bg-brand text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand/20 disabled:opacity-30 transition-all uppercase tracking-widest text-sm"
                  >
                    {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Wand2 size={20} />}
                    <span>下一步: 命名路线</span>
                  </button>
                )}
                {step === 'naming' && (
                  <button 
                    onClick={handleSave}
                    disabled={!name || selectedPois.length < 2}
                    className="w-full h-14 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-gray-900/20 disabled:opacity-30 transition-all uppercase tracking-widest text-sm"
                  >
                    <Check size={20} />
                    <span>完成并保存</span>
                  </button>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
