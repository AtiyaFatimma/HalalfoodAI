
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MessageSquare, 
  MapPin, 
  Camera, 
  Compass, 
  Menu, 
  X,
  Utensils,
  AlertCircle,
  ChevronRight,
  Info,
  ExternalLink
} from 'lucide-react';
import { AppView, ChatMessage, CertificationType } from './types';
import { findHalalRestaurants, analyzeIngredients, chatWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ text: string, grounding: any[] } | null>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
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
      const history = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      const aiResponse = await chatWithAI(userMsg.content, history);
      setChatMessages(prev => [...prev, { role: 'model', content: aiResponse || "I'm sorry, I couldn't process that.", timestamp: Date.now() }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setScanImage(reader.result as string);
      setIsScanning(true);
      setScanResult(null);
      try {
        const analysis = await analyzeIngredients(base64);
        setScanResult(analysis || "Could not analyze image.");
      } catch (err) {
        setScanResult("Error analyzing image. Please try again.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderHome = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <div className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
          <Utensils className="text-white w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">HalalFind AI</h1>
        <p className="text-lg text-slate-600 max-w-lg mx-auto">
          Your intelligent companion for Halal discovery, ingredient analysis, and dietary guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => setView('restaurants')}
          className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500 transition-all text-left group"
        >
          <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
            <Search className="text-emerald-600 w-6 h-6 group-hover:text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Find Nearby</h3>
          <p className="text-slate-500">Discover Halal certified restaurants around your current location.</p>
        </button>

        <button 
          onClick={() => setView('scanner')}
          className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500 transition-all text-left group"
        >
          <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
            <Camera className="text-emerald-600 w-6 h-6 group-hover:text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Scan Ingredients</h3>
          <p className="text-slate-500">Analyze food labels for Haram or Mushbooh ingredients in seconds.</p>
        </button>

        <button 
          onClick={() => setView('chat')}
          className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500 transition-all text-left group"
        >
          <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
            <MessageSquare className="text-emerald-600 w-6 h-6 group-hover:text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Dietary Advice</h3>
          <p className="text-slate-500">Ask about specific food categories, E-numbers, or certification bodies.</p>
        </button>

        <button 
          onClick={() => setView('travel')}
          className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500 transition-all text-left group"
        >
          <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
            <Compass className="text-emerald-600 w-6 h-6 group-hover:text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Travel Mode</h3>
          <p className="text-slate-500">Find Halal options and prayer times in unfamiliar cities worldwide.</p>
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
        <AlertCircle className="text-amber-600 w-6 h-6 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-amber-900 mb-1">Important Disclaimer</h4>
          <p className="text-amber-800 text-sm">
            AI analysis provides guidance only. Always double-check certifications and labels manually. Status of establishments may change without notice.
          </p>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto w-full bg-white shadow-xl overflow-hidden md:rounded-t-3xl border-x border-t border-slate-200">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
          <MessageSquare size={20} />
        </div>
        <div>
          <h2 className="font-bold">Halal AI Assistant</h2>
          <p className="text-xs text-slate-500">Specialized in Dietary Laws & Certification</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <p className="text-slate-400">Ask me anything about Halal food, certifications, or ingredients.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Is gelatin halal?", "Common haram E-numbers", "Certification in UK", "Best halal burger nearby"].map(q => (
                <button 
                  key={q} 
                  onClick={() => { setChatInput(q); }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {chatMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 flex gap-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex gap-2">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={isTyping}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2 rounded-xl shadow-sm transition-all"
          >
            <ChevronRight />
          </button>
        </div>
      </form>
    </div>
  );

  const renderRestaurants = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="text-emerald-600" /> Nearby Restaurants
        </h2>
        {location && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Info size={12} /> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </span>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for 'burger', 'kebab', 'pizza'..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          />
        </div>
        <button 
          type="submit"
          className="bg-emerald-600 text-white px-6 rounded-2xl hover:bg-emerald-700 transition-all font-medium"
        >
          Search
        </button>
      </form>

      {isSearching ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500">Consulting maps and certification databases...</p>
        </div>
      ) : results ? (
        <div className="space-y-6">
          <div className="prose prose-slate max-w-none bg-white p-6 rounded-3xl border border-slate-200 shadow-sm whitespace-pre-wrap">
            {results.text}
          </div>
          
          {results.grounding && results.grounding.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ExternalLink size={18} className="text-emerald-600" /> Map Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.grounding.map((chunk: any, i: number) => {
                  if (!chunk.maps) return null;
                  return (
                    <a 
                      key={i}
                      href={chunk.maps.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 transition-all flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="font-bold group-hover:text-emerald-600 transition-colors">{chunk.maps.title || "View on Maps"}</h4>
                        <p className="text-xs text-slate-400">Google Maps Grounding</p>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
          <Utensils className="mx-auto text-slate-300 w-12 h-12 mb-4" />
          <p className="text-slate-400">Search for restaurants above to see results.</p>
        </div>
      )}
    </div>
  );

  const renderScanner = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Camera className="text-emerald-600" /> Ingredient Analysis
      </h2>
      
      {!scanImage ? (
        <label className="block w-full cursor-pointer">
          <div className="border-4 border-dashed border-slate-200 bg-white rounded-3xl py-24 text-center hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
            <Camera className="mx-auto w-16 h-16 text-slate-300 mb-4 group-hover:text-emerald-500 group-hover:scale-110 transition-all" />
            <p className="text-xl font-bold text-slate-600 group-hover:text-emerald-700">Upload Label Photo</p>
            <p className="text-slate-400 max-w-xs mx-auto mt-2">Take a clear photo of the ingredients list on the back of the product packaging.</p>
          </div>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-700">Source Image</h3>
              <div className="relative group">
                <img src={scanImage} alt="Label" className="w-full rounded-2xl border border-slate-200 shadow-sm" />
                <button 
                  onClick={() => setScanImage(null)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-slate-700">Analysis Result</h3>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[200px] flex flex-col">
                {isScanning ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-sm">Identifying ingredients...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap">
                    {scanResult}
                  </div>
                )}
                
                {!isScanning && (
                   <label className="mt-6 flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer font-medium text-slate-600">
                     <Camera size={18} /> Scan Another
                     <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                   </label>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Utensils className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">HalalFind <span className="text-emerald-600">AI</span></span>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-1">
          {[
            { id: 'home', icon: Compass, label: 'Discover' },
            { id: 'restaurants', icon: MapPin, label: 'Nearby' },
            { id: 'scanner', icon: Camera, label: 'Analyze' },
            { id: 'chat', icon: MessageSquare, label: 'AI Support' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as AppView)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${view === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {view === 'home' && renderHome()}
        {view === 'chat' && renderChat()}
        {view === 'restaurants' && renderRestaurants()}
        {view === 'scanner' && renderScanner()}
        {view === 'travel' && (
           <div className="flex flex-col items-center justify-center py-24 text-center px-4">
             <Compass className="w-16 h-16 text-emerald-600 animate-pulse mb-6" />
             <h2 className="text-3xl font-bold mb-4">Travel Assistant Coming Soon</h2>
             <p className="text-slate-500 max-w-md">We're building advanced features for globe-trotters, including offline map support and local phrasebooks.</p>
             <button onClick={() => setView('home')} className="mt-8 text-emerald-600 font-bold hover:underline">Return to Home</button>
           </div>
        )}
      </main>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="absolute top-0 left-0 bottom-0 w-4/5 max-w-xs bg-white shadow-2xl flex flex-col p-6 space-y-6">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xl">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)}><X /></button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { id: 'home', icon: Compass, label: 'Discover' },
                { id: 'restaurants', icon: MapPin, label: 'Nearby Restaurants' },
                { id: 'scanner', icon: Camera, label: 'Ingredient Scanner' },
                { id: 'chat', icon: MessageSquare, label: 'AI Dietary Guidance' },
                { id: 'travel', icon: Compass, label: 'Travel Mode' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id as AppView); setIsSidebarOpen(false); }}
                  className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all ${view === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <item.icon size={20} />
                  <span className="font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer (Web only) */}
      <footer className="hidden md:block py-6 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-400">
          <p>© 2024 HalalFind AI. Built with Google Gemini for global halal transparency.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
