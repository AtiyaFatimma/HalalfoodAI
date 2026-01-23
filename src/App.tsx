import React, { useState, useRef } from "react";
import { findHalalRestaurants, analyzeIngredients, chatWithAI } from "./geminiService";

export default function App() {
  const [tab, setTab] = useState<"restaurants" | "ingredients" | "chat">("restaurants");

  // Restaurant search
  const [query, setQuery] = useState("");
  const [restaurantResults, setRestaurantResults] = useState<string>("");
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  // Ingredient analysis
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredientResult, setIngredientResult] = useState("");
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Restaurant search handler
  const handleRestaurantSearch = async () => {
    if (!query.trim()) return;
    setLoadingRestaurants(true);
    setRestaurantResults("");
    
    try {
      const result = await findHalalRestaurants(query);
      if (result.error) {
        setRestaurantResults(`**Error:** ${result.error}`);
      } else {
        setRestaurantResults(result.summary || "No results found.");
      }
    } catch (err) {
      setRestaurantResults("**Error:** Search failed. Please try again.");
    }
    
    setLoadingRestaurants(false);
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setImagePreview(reader.result as string);
      setLoadingIngredients(true);
      
      const mimeType = file.type || 'image/jpeg';
      const result = await analyzeIngredients(base64, mimeType);
      setIngredientResult(result);
      setLoadingIngredients(false);
    };
    reader.readAsDataURL(file);
  };

  // Camera handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setUseCamera(true);
      }
    } catch (err) {
      alert("Camera access denied or not available. Please use file upload instead.");
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        const base64 = imageData.split(',')[1];
        
        setImagePreview(imageData);
        stopCamera();
        setLoadingIngredients(true);
        
        const result = await analyzeIngredients(base64, 'image/jpeg');
        setIngredientResult(result);
        setLoadingIngredients(false);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setUseCamera(false);
    }
  };

  // Chat handler
  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const newHistory = [...chatHistory, { role: "user", content: chatInput }];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);

    const response = await chatWithAI(chatInput, chatHistory);
    setChatHistory([...newHistory, { role: "model", content: response }]);
    setChatLoading(false);
  };

  // Helper to convert markdown bold to HTML
  const formatText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-green-600 mb-2">
            🕌 HalalFind AI
          </h1>
          <p className="text-center text-gray-600 text-sm">
            Your trusted halal food companion
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-6">
          {[
            { id: "restaurants", label: "🍽️ Restaurants" },
            { id: "ingredients", label: "📷 Scanner" },
            { id: "chat", label: "💬 Ask AI" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as any);
                if (t.id !== "ingredients") stopCamera();
              }}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all ${
                tab === t.id
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* RESTAURANT SEARCH */}
          {tab === "restaurants" && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Find Halal Restaurants</h2>
              <input
                type="text"
                placeholder="e.g., halal restaurants in London, best halal burgers..."
                className="w-full p-3 border-2 border-gray-300 rounded-lg mb-3 focus:border-green-500 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRestaurantSearch()}
              />
              <button
                onClick={handleRestaurantSearch}
                disabled={loadingRestaurants}
                className="w-full bg-green-600 text-white p-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {loadingRestaurants ? "Searching..." : "🔍 Search"}
              </button>

              {restaurantResults && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div 
                    className="prose prose-green max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatText(restaurantResults) }} 
                  />
                </div>
              )}
            </div>
          )}

          {/* INGREDIENT SCANNER */}
          {tab === "ingredients" && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ingredient Scanner</h2>
              
              <div className="flex gap-2 mb-4">
                <label className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-medium text-center cursor-pointer hover:bg-blue-700 transition-colors">
                  📁 Upload Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                
                {!useCamera ? (
                  <button
                    onClick={startCamera}
                    className="flex-1 bg-green-600 text-white p-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    📸 Use Camera
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex-1 bg-red-600 text-white p-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    ❌ Close Camera
                  </button>
                )}
              </div>

              {useCamera && (
                <div className="mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg shadow-md"
                  />
                  <button
                    onClick={capturePhoto}
                    className="w-full mt-2 bg-green-600 text-white p-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    📷 Capture Photo
                  </button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {imagePreview && !useCamera && (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full rounded-lg shadow-md mb-4" 
                />
              )}

              {loadingIngredients && (
                <p className="text-center text-gray-600 py-4">🔍 Analyzing ingredients...</p>
              )}

              {ingredientResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div 
                    className="prose prose-green max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatText(ingredientResult) }} 
                  />
                </div>
              )}
            </div>
          )}

          {/* CHAT */}
          {tab === "chat" && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ask About Halal Food</h2>
              
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                {chatHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Ask me anything about halal food, ingredients, or dietary guidelines!
                  </p>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-100 ml-8"
                          : "bg-green-100 mr-8"
                      }`}
                    >
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: formatText(msg.content) }} 
                      />
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="bg-green-100 mr-8 p-3 rounded-lg">
                    <p className="text-gray-600">🤔 Thinking...</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="Ask about halal food..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                />
                <button
                  onClick={handleChatSend}
                  disabled={chatLoading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Powered by Google Gemini AI
        </p>
      </div>
    </div>
  );
}
