import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Image as ImageIcon, Send, Download, RotateCcw, Trash2, History, Wand2, Timer, Zap, Palette, ArrowRight, Square, Monitor, Smartphone, Cpu } from 'lucide-react';
import { generateImage, enhancePrompt, estimateTimeLocal } from './services/ai';
import { GeneratedImage } from './types';

const CREATIVE_MESSAGES = [
  "Awakening the neural synapses...",
  "Calibrating chromatic weights...",
  "Sampling latent reality...",
  "Synthesizing visual geometry...",
  "Refining artistic fidelity...",
  "Finalizing spectral output...",
  "Polishing the canvas..."
];

const SUGGESTIONS = [
  "A futuristic cyberpunk city",
  "A majestic dragon flying over mountains",
  "Minimalist desert landscape",
  "A cute robot in a garden",
  "Abstract cosmic ocean"
];

const MODELS = [
  { id: 'gemini-2.5-flash-image', name: 'Lumina Fast', icon: Zap, description: 'Optimized for speed', est: 8 },
  { id: 'gemini-3.1-flash-image-preview', name: 'Lumina Creative', icon: Palette, description: 'High precision details', est: 15 }
];

const RATIOS = [
  { id: '1:1', name: 'Square', icon: Square, desc: 'Default' },
  { id: '16:9', name: 'Cinema', icon: Monitor, desc: 'Wide' },
  { id: '9:16', name: 'Story', icon: Smartphone, desc: 'Tall' }
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[0]);
  const [aiEstimate, setAiEstimate] = useState(12);
  const [isStuck, setIsStuck] = useState(false);
  
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('lumina-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lumina-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    // Only flag as "stuck" if it exceeds estimate by a significant margin (40s)
    if (timer > aiEstimate + 40 && isGenerating) {
      setIsStuck(true);
    } else {
      setIsStuck(false);
    }
  }, [timer, aiEstimate, isGenerating]);

  const startTimer = () => {
    setTimer(0);
    setIsStuck(false);
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (err) {
      console.error("Enhancement failed", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    
    // Efficiently calculate estimation locally to save API quota and time
    const estimate = estimateTimeLocal(prompt, selectedModel.id);
    setAiEstimate(estimate);
    
    startTimer();

    try {
      const url = await generateImage(prompt, selectedModel.id, selectedRatio.id);
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url,
        prompt: prompt.trim(),
        timestamp: Date.now(),
      };
      
      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
      setPrompt('');
    } catch (err: any) {
      setError(err.message || "Failed to generate image. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
      stopTimer();
    }
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `lumina-${prompt.slice(0, 20).replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your generation history?")) {
      setHistory([]);
      setCurrentImage(null);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentImage?.id === id) setCurrentImage(null);
  };

  const handleReset = () => {
    setIsGenerating(false);
    stopTimer();
    setError(null);
    setIsStuck(false);
  };

  return (
    <div className="min-h-screen bg-bento-bg flex flex-col">
      {/* Navigation Bar */}
      <header className="h-16 border-b border-bento-border flex items-center justify-between px-4 sm:px-8 bg-bento-bg/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 accent-gradient rounded-lg shadow-lg shadow-indigo-500/20" />
          <span className="font-bold text-lg sm:text-xl tracking-tighter">LUMINA<span className="text-indigo-500">.AI</span></span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
          <span className="text-white cursor-pointer transition-colors">Studio</span>
          <span className="hover:text-white cursor-pointer transition-colors">Gallery</span>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Gemini Powered</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 lg:p-8 bento-grid overflow-y-auto">
        
        {/* Left Side: Input and Settings */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Prompt Input Card */}
          <section className="bento-card flex-1 min-h-[200px] sm:min-h-[300px] relative">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-indigo-500">Text Prompt</label>
              <button
                onClick={handleEnhance}
                disabled={!prompt.trim() || isEnhancing || isGenerating}
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-400 transition-colors disabled:opacity-30 group"
              >
                {isEnhancing ? <RotateCcw size={12} className="animate-spin" /> : <Wand2 size={12} className="group-hover:rotate-12 transition-transform" />}
                {isEnhancing ? 'Enhancing...' : 'Magic Enhance'}
              </button>
            </div>
            
            <textarea
              placeholder="A futuristic neon city floating in a sea of clouds..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-transparent border-none text-white text-base sm:text-lg placeholder:text-zinc-700 resize-none outline-none font-sans min-h-[120px]"
            />
            
            <div className="mt-4 pt-4 border-t border-zinc-800/50 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="bg-zinc-900/50 text-zinc-500 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-tight border border-zinc-800/50 hover:border-zinc-600 hover:text-zinc-300 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* Model Selection Card */}
          <section className="bento-card">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-4 block">Select Engine</label>
            <div className="grid grid-cols-1 gap-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  disabled={isGenerating}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-all text-left group ${
                    selectedModel.id === m.id 
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-white' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedModel.id === m.id ? 'bg-indigo-500 text-white' : 'bg-zinc-800'}`}>
                    <m.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold flex items-center justify-between">
                      {m.name}
                      {m.id === 'gemini-2.5-flash-image' && (
                         <span className="text-[8px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded uppercase">Recommended</span>
                      )}
                    </div>
                    <div className="text-[10px] opacity-60">{m.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Aspect Ratio Card */}
          <section className="bento-card">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-4 block">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {RATIOS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRatio(r)}
                  disabled={isGenerating}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-2 group ${
                    selectedRatio.id === r.id 
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-white' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <r.icon size={16} className={`${selectedRatio.id === r.id ? 'text-indigo-500' : 'text-zinc-600'}`} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold">{r.name}</span>
                    <span className="text-[8px] opacity-40">{r.id}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Generate Button Card */}
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !prompt.trim()}
            className="bento-card accent-gradient cursor-pointer border-none flex items-center justify-center group active:scale-[0.98] disabled:opacity-50 disabled:scale-100 min-h-[80px]"
          >
            {isGenerating ? (
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="animate-spin text-white mb-1" size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{timer}s elapsed</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold tracking-tighter uppercase">Generate Image</span>
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            )}
          </button>
        </div>

        {/* Center/Right: Preview and History */}
        <div className="col-span-12 lg:col-span-8 bento-grid lg:h-full">
          {/* Large Preview Area */}
          <section className="bento-card col-span-12 row-span-6 bg-[#0a0a0a] min-h-[350px] sm:min-h-[400px] lg:min-h-0 p-0 relative group">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-8 z-20 overflow-hidden"
                >
                  {/* Film Grain/Noise Animated Overlay */}
                  <div className="noise-overlay" />
                  
                  <div className="relative creative-pulse scale-75 sm:scale-100">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-zinc-800/50 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                       <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min((timer / (aiEstimate + 20)) * 100, 95)}%` }}
                        className="absolute bottom-0 inset-x-0 bg-indigo-500/30"
                       />
                       <RotateCcw className="text-white/20 absolute inset-0 m-auto animate-spin-slow opacity-10" size={100} />
                       <ImageIcon className="text-indigo-400 relative z-10" size={32} />
                    </div>
                    
                    <svg className="absolute inset-x-[-10px] inset-y-[-10px] w-[150px] h-[150px] sm:w-[180px] sm:h-[180px] -rotate-90">
                      <motion.circle
                        cx="75" cy="75" r="70"
                        className="sm:hidden text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        initial={{ strokeDasharray: "440 440", strokeDashoffset: 440 }}
                        animate={{ strokeDashoffset: 440 - (440 * (Math.min(timer / (aiEstimate + 20), 0.98))) }}
                        transition={{ ease: "linear" }}
                      />
                      <motion.circle
                        cx="90" cy="90" r="85"
                        className="hidden sm:block text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        initial={{ strokeDasharray: "534 534", strokeDashoffset: 534 }}
                        animate={{ strokeDashoffset: 534 - (534 * (Math.min(timer / (aiEstimate + 20), 0.98))) }}
                        transition={{ ease: "linear" }}
                      />
                    </svg>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 text-center z-20 px-8">
                    <div className="flex items-center gap-4 px-6 py-2 rounded-2xl bg-zinc-900/80 border border-white/5 backdrop-blur-xl">
                       <div className="flex items-center gap-2">
                          <Timer size={14} className="text-indigo-400" />
                          <span className="text-2xl font-black font-mono text-white tracking-widest">{timer}s</span>
                       </div>
                       <div className="w-px h-4 bg-zinc-800" />
                       <div className="flex items-center gap-2">
                          <Cpu size={14} className="text-purple-400" />
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">AI Est: {aiEstimate}s</span>
                       </div>
                    </div>

                    <div className="flex flex-col gap-1 min-h-[60px]">
                      {isStuck ? (
                        <div className="flex flex-col items-center gap-2">
                           <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Engine timeout detected</p>
                           <button 
                             onClick={handleReset}
                             className="bg-red-500/20 text-red-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                           >
                             Cancel & Reset
                           </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/80 animate-pulse">
                             Quantum Rendering Protocol
                          </div>
                          
                          <AnimatePresence mode="wait">
                            <motion.div 
                              key={Math.floor(timer/3)}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 1.1 }}
                              className="text-sm text-zinc-300 font-medium italic"
                            >
                              {CREATIVE_MESSAGES[Math.floor(timer / 3) % CREATIVE_MESSAGES.length]}
                            </motion.div>
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                </motion.div>
              ) : currentImage ? (
                <motion.div 
                  key={currentImage.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full relative bg-black/40 flex items-center justify-center p-4 lg:p-8"
                >
                  <img 
                    src={currentImage.url} 
                    alt={currentImage.prompt}
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain shadow-2xl"
                  />
                  
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-xs sm:text-sm font-medium mb-4 line-clamp-2 pr-16 sm:pr-24">{currentImage.prompt}</p>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                      <button 
                        onClick={() => handleDownload(currentImage.url, currentImage.prompt)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-black px-3 sm:px-4 py-2 rounded-xl font-bold text-[10px] sm:text-xs hover:bg-zinc-200 transition-colors shadow-xl"
                      >
                        <Download size={14} className="sm:w-4 sm:h-4" />
                        Download
                      </button>
                      <button 
                         onClick={() => setPrompt(currentImage.prompt)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-900/80 backdrop-blur-md text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-[10px] sm:text-xs hover:bg-zinc-800 transition-colors border border-zinc-700"
                      >
                        <RotateCcw size={14} className="sm:w-4 sm:h-4" />
                        Remix
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform">
                    <ImageIcon size={32} className="text-zinc-700 sm:w-10 sm:h-10" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-800 uppercase tracking-[0.2em] mb-3 sm:mb-4">Awaiting Signal</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 max-w-[240px] sm:max-w-xs leading-relaxed italic">
                    "Every masterpiece begins with a single prompt. Enter yours to illuminate the canvas."
                  </p>
                </div>
              )}
            </AnimatePresence>
          </section>

          {/* History Sub-grid */}
          <section className="bento-card col-span-12 lg:col-span-8 overflow-hidden min-h-[140px]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Recent Stream</label>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] font-bold text-zinc-700 hover:text-red-500 transition-colors">CLEAR ALL</button>
              )}
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-4 scroll-hide scrollbar-thin scrollbar-thumb-zinc-800">
              {history.length > 0 ? (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer group"
                    onClick={() => setCurrentImage(item)}
                  >
                    <img src={item.url} alt="" className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-300" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg group-hover:flex hidden hover:bg-red-500 text-white"
                    >
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center text-[10px] text-zinc-700 uppercase font-black tracking-widest h-full border-2 border-dashed border-zinc-900 rounded-2xl">
                  Stream Empty
                </div>
              )}
            </div>
          </section>

          {/* Status Sub-card */}
          <section className="bento-card col-span-12 lg:col-span-4 bg-gradient-to-br from-zinc-900 to-black min-h-[120px]">
             <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                      <Zap size={20} />
                   </div>
                   <div className="min-w-0">
                      <div className="text-sm font-bold truncate">Turbo Active</div>
                      <div className="text-[10px] text-zinc-500 truncate">Gemini {selectedModel.name.split(' ')[1]}</div>
                   </div>
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
                   <span>SIGNAL STRENGTH</span>
                   <div className="flex gap-1">
                      <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                      <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                      <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                      <div className="w-1 h-3 bg-zinc-800 rounded-full" />
                   </div>
                </div>
             </div>
          </section>
        </div>
      </main>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">!</div>
            {error}
            <button onClick={() => setError(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
