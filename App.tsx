
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MessageSquare, 
  MapPin, 
  Camera, 
  Compass, 
  X,
  Utensils,
  AlertCircle,
  ChevronRight,
  Send,
  RefreshCw,
  Navigation,
  Globe,
  Trash2,
  Barcode,
  Type as TypeIcon,
  CheckCircle2
} from 'lucide-react';
import { AppView, ChatMessage } from './types';
import { findHalalRestaurants, analyzeIngredients, chatWithAI } from './services/geminiService';

// Professional text renderer that replaces basic markdown with styled components
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  // Handle both **bold** and simple plain text
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <div className="leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ summary: string, restaurants: any[], grounding: any[] } | null>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'barcode' | 'text' | null>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied")
      );
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setResults(null);
    setView('restaurants');
    try {
      const data = await findHalalRestaurants(searchQuery, location || undefined);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);
    try {
      const history = chatMessages.slice(-6).map(m => ({ role: m.role, parts: [{ text: m.content }] }));
      const aiResponse = await chatWithAI(userMsg.content, history);
      setChatMessages(prev => [...prev, { role: 'model', content: aiResponse || "I apologize, I cannot provide an answer at this moment.", timestamp: Date.now() }]);
    } catch (err) { console.error(err); } finally { setIsTyping(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'barcode' | 'text') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanMode(mode);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setScanImage(reader.result as string);
      setIsScanning(true);
      setScanResult(null);
      try {
        const analysis = await analyzeIngredients(base64);
        setScanResult(analysis);
      } catch (err) { setScanResult("Analysis failed. Please try a clearer photo."); } finally { setIsScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  const NavItem = ({ id, icon: Icon, label }: { id: AppView, icon: any, label: string }) => (
    <button 
      onClick={() => setView(id)}
      className={`flex flex-col items-center justify-center flex-1 py-2 transition-all active:scale-90 ${view === id ? 'text-emerald-600' : 'text-slate-400'}`}
    >
      <div className={`p-2 rounded-2xl ${view === id ? 'bg-emerald-50 shadow-sm' : 'bg-transparent'}`}>
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-bold mt-1 uppercase tracking-widest">{label}</span>
    </button>
  );

  const renderHome = () => (
    <div className="pb-36 animate-in fade-in duration-500 px-6 pt-12 space-y-10">
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-400 w-20 h-20 rounded-[1.8rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 rotate-6 hover:rotate-0 transition-transform duration-500">
          <Utensils className="text-white w-10 h-10 -rotate-6" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">HalalFind <span className="text-emerald-600">AI</span></h1>
          <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mt-1">Smart Dietary Verification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setView('restaurants')} 
          className="relative overflow-hidden group bg-emerald-600 h-44 rounded-[2.5rem] p-8 shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
            <Search size={120} />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full text-left text-white">
            <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-md">
              <Search size={28} />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">Discover Halal</p>
              <p className="text-emerald-100 text-sm font-medium opacity-80 mt-1">Find the best verified dining nearby</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setView('scanner')} 
          className="relative overflow-hidden group bg-slate-900 h-44 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
            <Camera size={120} />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full text-left text-white">
            <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-md">
              <Camera size={28} />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">Halal Scanner</p>
              <p className="text-slate-400 text-sm font-medium opacity-80 mt-1">Scan labels & ingredients instantly</p>
            </div>
          </div>
        </button>
      </div>

      <button 
        onClick={() => setView('chat')} 
        className="w-full bg-white border border-slate-100 p-6 rounded-[2.2rem] flex items-center justify-between active:scale-[0.98] transition-all shadow-lg group"
      >
        <div className="flex items-center gap-5 text-left">
          <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
            <MessageSquare size={26} />
          </div>
          <div>
            <p className="font-extrabold text-slate-900 text-lg">AI Expert Consult</p>
            <p className="text-slate-400 text-xs font-medium mt-0.5 uppercase tracking-wider">Islamic Dietary Guidance</p>
          </div>
        </div>
        <ChevronRight size={24} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="bg-amber-50/50 backdrop-blur-sm border border-amber-100/50 p-5 rounded-3xl flex gap-4">
        <AlertCircle size={22} className="text-amber-500 shrink-0" />
        <p className="text-[10px] font-bold text-amber-800 leading-normal uppercase tracking-widest opacity-80">
          AI data is provided for informational purposes. Physical certificates remain the ultimate verification source.
        </p>
      </div>
    </div>
  );

  const renderRestaurants = () => (
    <div className="pb-36 px-6 pt-12 space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Search</h2>
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm flex items-center gap-1.5 ${location ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
          <MapPin size={12} /> {location ? "GPS Active" : "No Signal"}
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cuisine, city, or name..."
          className="w-full pl-14 pr-4 py-5 bg-white border border-slate-200 rounded-3xl shadow-sm focus:ring-8 focus:ring-emerald-500/5 focus:outline-none transition-all font-bold text-slate-800"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={24} />
      </form>

      {isSearching ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-8">
          <div className="w-12 h-12 border-[6px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Analyzing Global Halal Data</p>
        </div>
      ) : results ? (
        <div className="space-y-8">
          <div className="px-2 text-slate-500 text-sm font-semibold border-l-4 border-emerald-500 pl-4 py-1">
            <FormattedText text={results.summary} />
          </div>
          <div className="grid grid-cols-1 gap-6">
            {results.restaurants.map((res, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <h3 className="font-black text-xl text-slate-900 leading-tight">{res.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg flex items-center gap-1.5">
                        <Utensils size={12} /> {res.cuisine}
                      </span>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border shrink-0 shadow-sm ${res.halalStatus.toLowerCase().includes('cert') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                    {res.halalStatus}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{res.description}</p>
                <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 truncate max-w-[70%] uppercase tracking-tighter">
                    <MapPin size={14} className="shrink-0 text-slate-300" /> {res.address}
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(res.name + ' ' + res.address)}`} 
                    target="_blank" 
                    className="bg-slate-900 text-white p-3 rounded-[1.2rem] shadow-xl active:scale-90 transition-all"
                  >
                    <Navigation size={20} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-white border border-slate-100 rounded-[3rem] shadow-inner">
          <p className="text-slate-300 font-black text-xs uppercase tracking-[0.4em]">Search Initiated</p>
        </div>
      )}
    </div>
  );

  const renderScanner = () => (
    <div className="pb-36 px-6 pt-12 space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Scanner</h2>
        <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-blue-100 shadow-sm">
          Vision AI Active
        </div>
      </div>
      
      {!scanImage ? (
        <div className="space-y-4">
          <label className="block w-full cursor-pointer">
            <div className="relative overflow-hidden group bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] py-16 text-center shadow-xl shadow-blue-100 active:scale-[0.98] transition-all flex flex-col items-center">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform"><Barcode size={100} /></div>
              <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 shadow-2xl">
                <Barcode size={32} className="text-white" />
              </div>
              <p className="text-lg font-black text-white uppercase tracking-widest">Scan Barcode</p>
              <p className="text-blue-100 text-xs mt-2 opacity-80 px-10">Quick product lookup by UPC/EAN</p>
            </div>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileUpload(e, 'barcode')} className="hidden" />
          </label>

          <label className="block w-full cursor-pointer">
            <div className="relative overflow-hidden group bg-white border-2 border-slate-100 rounded-[2.5rem] py-16 text-center shadow-sm active:scale-[0.98] transition-all flex flex-col items-center">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 transition-transform"><TypeIcon size={100} /></div>
              <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <TypeIcon size={32} className="text-slate-400" />
              </div>
              <p className="text-lg font-black text-slate-900 uppercase tracking-widest">Scan Ingredients</p>
              <p className="text-slate-400 text-xs mt-2 opacity-80 px-10">Read text directly from labels</p>
            </div>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileUpload(e, 'text')} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative h-56 w-full overflow-hidden rounded-[2.5rem] border-4 border-white shadow-2xl">
            <img src={scanImage} alt="Analysis Target" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <button 
              onClick={() => { setScanImage(null); setScanResult(null); setScanMode(null); }} 
              className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-xl active:scale-90 transition-transform"
            >
              <X size={20} />
            </button>
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Scan Mode</p>
              <p className="text-xl font-black capitalize tracking-tight">{scanMode} Analysis</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[200px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
            {isScanning ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="w-12 h-12 border-[6px] border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Deciphering {scanMode === 'barcode' ? 'Product Code' : 'Chemical Data'}</p>
              </div>
            ) : (
              <div className="text-slate-700 font-semibold leading-relaxed">
                <FormattedText text={scanResult || ""} />
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => { setScanImage(null); setScanResult(null); setScanMode(null); }}
              className="flex-1 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest cursor-pointer py-5 border-2 border-slate-100 bg-white rounded-2xl active:bg-slate-50 transition-colors"
            >
              Reset Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-[100dvh] bg-white animate-in slide-in-from-bottom-4 duration-500">
      <div className="px-6 py-6 border-b border-slate-50 flex items-center justify-between sticky top-0 z-10 bg-white/95 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200"><MessageSquare size={22} /></div>
          <div>
            <h2 className="font-black text-slate-900 text-base tracking-tight leading-none">AI Dietary Expert</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Knowledge Active</span>
            </div>
          </div>
        </div>
        <button onClick={() => setChatMessages([])} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-48">
        {chatMessages.length === 0 && (
          <div className="text-center py-24 space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <MessageSquare size={40} className="text-slate-200" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Ask anything about</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['E-Numbers', 'Fiqh Laws', 'Haram Items', 'Ingredients'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        {chatMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-${m.role === 'user' ? 'right' : 'left'}-4 duration-300`}>
            <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-sm font-semibold shadow-sm ${m.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-100' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50'}`}>
              <FormattedText text={m.content} />
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-50 rounded-3xl px-6 py-4 flex gap-1.5 shadow-sm border border-slate-100">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 fixed bottom-24 left-0 right-0 z-[110]">
        <form onSubmit={handleSendMessage} className="max-w-xl mx-auto bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-[2.5rem] shadow-2xl p-2 flex items-center gap-2 ring-8 ring-slate-100/50">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Search dietary guidance..."
            className="flex-1 bg-transparent border-none py-3 px-6 focus:outline-none text-sm font-black text-slate-800 placeholder:text-slate-300"
          />
          <button type="submit" className="bg-slate-900 text-white p-4 rounded-full shadow-2xl active:scale-90 transition-all">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col text-slate-900 overflow-hidden select-none">
      <main className="flex-1 overflow-y-auto">
        {view === 'home' && renderHome()}
        {view === 'restaurants' && renderRestaurants()}
        {view === 'scanner' && renderScanner()}
        {view === 'chat' && renderChat()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t border-slate-100 px-6 py-4 flex items-center justify-between shadow-[0_-15px_50px_rgba(0,0,0,0.08)] z-[200] safe-bottom">
        <NavItem id="home" icon={Compass} label="Home" />
        <NavItem id="restaurants" icon={MapPin} label="Nearby" />
        <NavItem id="scanner" icon={Camera} label="Scanner" />
        <NavItem id="chat" icon={MessageSquare} label="Expert" />
      </nav>
      <style>{`
        .safe-bottom { padding-bottom: calc(env(safe-area-inset-bottom) + 14px); }
        input::placeholder { color: #cbd5e1; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.15em; opacity: 0.6; }
      `}</style>
    </div>
  );
};

export default App;
