import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, AlertCircle, Check, MessageSquare, Loader2 } from 'lucide-react';
import { ChatMessage, Product } from '../types';
import { USD_TO_IQD } from '../data';

interface AIAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProductToCart: (product: Product) => void;
  products: Product[];
  exchangeRate?: number;
}

const PRESET_PROMPTS = [
  { label: '💡 كم سبوت لايت أحتاج لصالة 4×5 م؟', text: 'أريد حساب عدد السبوتات المناسبة ومسافاتها لصالة بمساحة 4 في 5 أمتار.' },
  { label: '⚡ حماية السبلت من وطنية العراق', text: 'شنو تنصحني اشتري علمود احمي السبلت مالتي من تقلبات كهرباء الوطنية والخصخصة بالعراق؟' },
  { label: '🏡 أفضل إضاءة لواجهة البيت', text: 'شنو أفضل إنارة ترشحوها إلي علمود تزيين واجهة البيت من الخارج وتتحمل المطر والحر العالي؟' },
  { label: '📱 مفتاح لمس ذكي', text: 'اريد اعرف مواصفات مفاتيح اللمس الذكية اللي عندكم وشلون اتحكم بيها بالموبايل.' }
];

export default function AIAdvisor({ isOpen, onClose, onAddProductToCart, products, exchangeRate }: AIAdvisorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'يا هلا بيك عيوني! أنا مستشار نيوسرام الذكي لمهندسي الإنارة والكهرباء. 💡\nشنو حاب نصمم أو نختار اليوم لبيتكم؟ تكدر تسألني عن حساب الإضاءة المناسبة للغرف، أو ترشيح الأجهزة الكهربائية وتوصيلها، وتدلل!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const chatHistoryForAPI = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: chatHistoryForAPI }),
      });

      if (!response.ok) {
        throw new Error('فشل في الاتصال بمستشار الذكاء الاصطناعي');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'عذراً عيوني، حدث خطأ أثناء معالجة طلبك.',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً عيوني! صار عندي تداخل بالشبكة، تكدر تتأكد من الاتصال بالإنترنت وترسل رسالتك مرة ثانية؟ أو تطلب مباشرة عن طريق الواتساب عبر الرقم 07866080020.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const findProductByName = (text: string): Product | undefined => {
    // Look for product names inside assistant response to offer direct cart buttons
    return products.find(p => text.includes(p.name) || (p.englishName && text.toLowerCase().includes(p.englishName.toLowerCase())));
  };

  return (
    <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div 
        className="bg-[#FFFDF0] rounded-3xl w-full max-w-2xl h-[82vh] flex flex-col shadow-2xl overflow-hidden border-2 border-amber-500"
        id="ai-advisor-modal"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="bg-[#FEF08A] text-stone-950 px-6 py-4.5 flex items-center justify-between border-b-2 border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-600 to-yellow-500 rounded-xl text-stone-950 shadow-md">
              <Bot className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                مستشار نيو سرام الذكي
                <span className="text-[10px] font-sans bg-amber-600 text-white px-2.5 py-0.5 rounded-full border border-amber-500 uppercase font-black">AI Helper</span>
              </h3>
              <p className="text-xs text-stone-700 font-bold">مهندس الإنارة والكهرباء الافتراضي لخدمتك عيوني</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-stone-800 transition-colors cursor-pointer"
            id="close-ai-advisor"
          >
            <X className="w-4 h-4 font-black" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent space-y-5">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 font-black flex items-center justify-center shrink-0 border border-amber-600">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className="space-y-2">
                <div 
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-amber-500 text-stone-950 font-black rounded-tr-none border border-amber-600' 
                      : 'bg-white text-stone-900 rounded-tl-none border-2 border-yellow-400 font-bold'
                  }`}
                >
                  {msg.content}
                </div>
                
                {/* Embedded product recommendation card inside Assistant response */}
                {msg.role === 'assistant' && findProductByName(msg.content) && (
                  (() => {
                    const matchedProd = findProductByName(msg.content)!;
                    return (
                      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mr-1 shadow-sm">
                        <div className="flex items-center gap-3">
                          <img 
                            src={matchedProd.image} 
                            alt={matchedProd.name} 
                            className="w-12 h-12 rounded-xl object-cover border-2 border-yellow-400 bg-white shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h4 className="text-xs font-black text-stone-900">{matchedProd.name}</h4>
                            <p className="text-xs font-black text-amber-700 mt-1">
                              {((matchedProd.priceUSD || 0) * (exchangeRate || USD_TO_IQD)).toLocaleString()} د.ع
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onAddProductToCart(matchedProd)}
                          className="bg-amber-500 hover:bg-amber-600 text-stone-950 text-[11px] font-black px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-sm"
                        >
                          إضافة للسلة 🛍️
                        </button>
                      </div>
                    );
                  })()
                )}
                
                <span className="text-[9px] text-stone-500 font-bold block px-1">
                  {msg.timestamp.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-[85%] ml-auto">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 font-black flex items-center justify-center shrink-0 border border-amber-600 animate-bounce">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white text-stone-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 border-2 border-yellow-400 shadow-sm font-bold">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span className="font-black">جاري دراسة التفاصيل والرد عيوني...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preset chips for quick questions */}
        {messages.length === 1 && (
          <div className="px-6 py-3.5 bg-[#FEF9C3] border-t border-amber-500/20 overflow-x-auto whitespace-nowrap flex gap-2 scrollbar-none">
            {PRESET_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt.text)}
                className="inline-flex shrink-0 items-center gap-1.5 bg-white hover:bg-amber-500/10 border-2 border-yellow-400 hover:border-amber-500 text-xs text-stone-800 font-bold px-3.5 py-2 rounded-full transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {prompt.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Footer */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="p-4 bg-[#FEF08A] border-t-2 border-amber-500/30 flex gap-2.5"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="اسألني أي شيء عن الإنارة وتوزيعها، أو الأجهزة المنزلية..."
            className="flex-1 bg-white focus:bg-amber-50/20 border-2 border-yellow-400 focus:border-amber-500 rounded-2xl px-4.5 py-3 text-xs sm:text-sm outline-none text-stone-900 font-bold transition-all placeholder:text-stone-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 text-stone-950 disabled:text-stone-500 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border border-amber-600/30"
            id="send-ai-message"
          >
            <span>إرسال</span>
            <Send className="w-3.5 h-3.5 transform rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
}
