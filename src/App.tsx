import React, { useState } from "react";
import { findHalalRestaurants, analyzeIngredients, chatWithAI } from "./geminiService";

export default function App() {
  const [tab, setTab] = useState<"restaurants" | "ingredients" | "chat">("restaurants");

  // Restaurant search
  const [query, setQuery] = useState("");
  const [restaurantResults, setRestaurantResults] = useState<any>(null);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  // Ingredient analysis
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredientResult, setIngredientResult] = useState("");
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleRestaurantSearch = async () => {
    if (!query.trim()) return;
    setLoadingRestaurants(true);
    try {
      const result = await findHalalRestaurants(query);
      setRestaurantResults(result);
    } catch (err) {
      setRestaurantResults({ error: "Search failed. Try again." });
    }
    setLoadingRestaurants(false);
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setImagePreview(reader.result as string);
      setLoadingIngredients(true);
      const result = await analyzeIngredients(base64);
      setIngredientResult(result);
      setLoadingIngredients(false);
    };
    reader.readAsDataURL(file);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const newHistory = [...chatHistory, { role: "user", content: chatInput }];
    setChatHistory(newHistory);
    setChatLoading(true);

    const response = await chatWithAI(chatInput, newHistory);
    setChatHistory([...newHistory, { role: "model", content: response }]);

    setChatInput("");
    setChatLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center text-green-600 mb-6">
        HalalFind AI
      </h1>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-6">
        {["restaurants", "ingredients", "chat"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded ${
              tab === t ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
          >
            {t === "restaurants" && "Find Restaurants"}
            {t === "ingredients" && "Check Ingredients"}
            {t === "chat" && "Ask AI"}
          </button>
        ))}
      </div>

      {/* RESTAURANT SEARCH */}
      {tab === "restaurants" && (
        <div>
          <input
            type="text"
            placeholder="Search for halal food..."
            className="w-full p-3 border rounded mb-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={handleRestaurantSearch}
            className="w-full bg-green-600 text-white p-3 rounded"
          >
            Search
          </button>

          {loadingRestaurants && <p className="mt-4 text-center">Searching...</p>}

          {restaurantResults && (
            <div className="mt-4">
              <h2 className="font-bold text-lg mb-2">Results</h2>
              <p dangerouslySetInnerHTML={{ __html: restaurantResults.summary }} />

              <ul className="mt-3 space-y-3">
                {restaurantResults.restaurants?.map((r: any, i: number) => (
                  <li key={i} className="p-3 border rounded">
                    <p className="font-bold">{r.name}</p>
                    <p>{r.address}</p>
                    <p>{r.cuisine}</p>
                    <p className="text-green-700">{r.halalStatus}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* INGREDIENT ANALYSIS */}
      {tab === "ingredients" && (
        <div>
          <input type="file" accept="image/*" onChange={handleImageUpload} />

          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="mt-4 rounded shadow" />
          )}

          {loadingIngredients && <p className="mt-4">Analyzing...</p>}

          {ingredientResult && (
            <div
              className="mt-4 p-3 border rounded"
              dangerouslySetInnerHTML={{ __html: ingredientResult }}
            />
          )}
        </div>
      )}

      {/* CHAT */}
      {tab === "chat" && (
        <div>
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto border p-3 rounded">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded ${
                  msg.role === "user" ? "bg-gray-200" : "bg-green-100"
                }`}
              >
                <p dangerouslySetInnerHTML={{ __html: msg.content }} />
              </div>
            ))}
          </div>

          <input
            type="text"
            className="w-full p-3 border rounded mb-3"
            placeholder="Ask something..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />

          <button
            onClick={handleChatSend}
            className="w-full bg-green-600 text-white p-3 rounded"
          >
            Send
          </button>

          {chatLoading && <p className="mt-2 text-center">Thinking...</p>}
        </div>
      )}
    </div>
  );
}
