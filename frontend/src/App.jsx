import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Send, User, Mic, Type } from 'lucide-react';
import ChakraLoader from './components/ChakraLoader';

// ─── Ashoka Chakra SVG ────────────────────────────
const AshokaChakra = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="50" cy="50" r="45" />
    <circle cx="50" cy="50" r="8" fill="currentColor" />
    {Array.from({ length: 24 }).map((_, i) => (
      <line
        key={i} x1="50" y1="50"
        x2={50 + 45 * Math.cos((i * 15 * Math.PI) / 180)}
        y2={50 + 45 * Math.sin((i * 15 * Math.PI) / 180)}
      />
    ))}
  </svg>
);

// ─── Constants ────────────────────────────────────
const SUGGESTION_CHIPS = [
  "🗳️ How do I register to vote?",
  "📅 India's election timeline",
  "🏛️ How does ECI declare winners?",
  "🧾 What is NOTA?",
  "🏟️ Lok Sabha vs Rajya Sabha",
  "📜 Role of Indian political parties",
  "🔍 What is Model Code of Conduct?",
  "📊 How are seats allocated in India?"
];

const FONT_SIZES = { small: 13, default: 15, large: 17 };

// ─── Markdown processor ───────────────────────────
const processMarkdown = (text) => {
  let p = text;
  p = p.replace(/^(Background:|Key Features:|Key Points:|History:|Significance:|Objective:)/gm,
    '<span class="markdown-section-header">$1</span>');
  p = p.replace(/\b(BJP|INC|AAP|TMC|SP|BSP|DMK|NCP|RJD|JDU|CPI|CPM|ECI|EVM|VVPAT|NOTA|NDA|UPA)\b/g,
    '<span class="markdown-party-pill">$1</span>');
  p = p.replace(/\b((?:19|20)\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2})\b/g,
    '<span class="text-saffron-500 font-medium">$1</span>');
  p = p.replace(/^([\s]*[-*]\s+)(?![\*]{2})([\w\s]+?):/gm, '$1**$2:**');
  return p;
};

// ─── App ──────────────────────────────────────────
function App() {
  // ── Messages state ──
  const [messages, setMessages] = useState([{
    role: 'assistant',
    parts: [{ text: "Jai Hind! I'm Chunav AI — your non-partisan guide to India's election process. No jargon, no spin, just facts.\n\nTo get started, tell me what you'd like to understand, or choose a topic below:" }],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // ── Startup loader state ──
  const [showLoader, setShowLoader] = useState(true);

  // ── Theme state ──
  const [theme, setTheme] = useState(() => localStorage.getItem('eg-theme') || 'dark');
  const [themeClicked, setThemeClicked] = useState(() => !!localStorage.getItem('theme_clicked'));

  // ── Startup loader auto-dismiss ──
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  // ── Font size state ──
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('eg-fontsize');
    return saved ? Number(saved) : FONT_SIZES.default;
  });

  // ── Language state ──
  const [currentLang, setCurrentLang] = useState('en'); // 'en' | 'hi'
  const [voiceLang, setVoiceLang] = useState('en-IN');

  // ── Hint banner state ──
  const [hintVisible, setHintVisible] = useState(() => !localStorage.getItem('hint_shown'));

  // ── Toast state ──
  const [toast, setToast] = useState(null);

  // ── Voice state ──
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  // ── Apply theme to body ──
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('eg-theme', theme);
  }, [theme]);

  // ── Auto-hide hint banner after 4s ──
  useEffect(() => {
    if (hintVisible) {
      const t = setTimeout(() => {
        setHintVisible(false);
        localStorage.setItem('hint_shown', 'true');
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [hintVisible]);

  // ── Auto-clear toast after 2s ──
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2200);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ── Language change helper ──
  const switchLang = (lang) => {
    setCurrentLang(lang);
    setVoiceLang(lang === 'hi' ? 'hi-IN' : 'en-IN');
    setMessages(prev => [prev[0]]); // keep only greeting, clear history
    setToast(lang === 'hi' ? '🌐 Switched to हिंदी' : '🌐 Switched to English');
  };

  // ── Apply font size to CSS variable ──
  useEffect(() => {
    document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);
    localStorage.setItem('eg-fontsize', fontSize);
  }, [fontSize]);

  // ── Scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Speech Recognition setup ──
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = voiceLang;
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setInput(transcript);
      };
    }
  }, []);

  // ── Update recognition language ──
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = voiceLang;
    }
  }, [voiceLang]);

  const toggleMic = () => {
    if (!speechSupported) {
      alert('Voice input not supported. Please use Google Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // ── Send message ──
  const handleSend = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      parts: [{ text: textToSend.trim() }],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const historyForApi = [...messages, userMessage].map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: msg.parts
      }));

      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForApi, language: currentLang }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        parts: [{ text: data.reply }],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        parts: [{ text: "⚠️ Sorry, I'm having trouble connecting. Please try again." }],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const placeholder = currentLang === 'hi'
    ? 'चुनावों के बारे में पूछें...'
    : 'Ask about Indian elections, voting, or registration...';

  // ── Markdown components ──
  const markdownComponents = {
    p: ({ node, children }) => {
      const textContent = Array.isArray(children) ? children.join('') : String(children);
      if (textContent.includes('💡 Quick Fact'))
        return <div className="markdown-quick-fact">{children}</div>;
      if (textContent.includes('👉 Want to go deeper?')) {
        const topics = textContent.split(':').pop().split(',').map(t => t.trim());
        return (
          <div className="markdown-go-deeper">
            <span>👉 Want to go deeper? Ask me about:</span>
            <div className="flex flex-col gap-1.5 mt-1 ml-4">
              {topics.map((topic, i) => (
                <button key={i} onClick={() => handleSend(topic)}>{topic}</button>
              ))}
            </div>
          </div>
        );
      }
      if (textContent.includes('Got more questions?'))
        return <div className="markdown-end-msg">❓ <span className="animate-pulse-icon">{children}</span></div>;
      if (textContent.startsWith('📌'))
        return <div className="markdown-topic-header">{children}</div>;
      return <p>{children}</p>;
    },
    ol: ({ children }) => <ol className="list-none ml-0 space-y-2 mt-2 mb-4">{children}</ol>,
    li: ({ index, children }) => (
      <li className="markdown-step-card flex items-start">
        <span className="markdown-step-badge">{typeof index === 'number' ? index + 1 : '•'}</span>
        <span>{children}</span>
      </li>
    )
  };

  return (
    <>
      <ChakraLoader isLoading={showLoader} theme={theme} />
      <div className="app-shell flex flex-col h-screen relative overflow-hidden text-text-body font-sans">
        {/* Floating Orbs (dark theme only) */}
        <div className="orb orb-saffron" />
        <div className="orb orb-green" />
        <div className="orb orb-navy" />

        {/* Background Dot Pattern + Vignette */}
        <div className="absolute inset-0 chat-bg-pattern z-0 pointer-events-none" />
        <div className="absolute inset-0 vignette-overlay z-0 pointer-events-none" />

        {/* Warm gradient overlay for dark theme */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(255,153,51,0.06) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(19,136,8,0.04) 0%, transparent 60%)'
          }}
        />

        {/* Ashoka Chakra Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <AshokaChakra className="w-[600px] h-[600px] text-white opacity-[0.04]" />
        </div>

        {/* ── HEADER ── */}
        <header className="app-header backdrop-blur-md z-10 relative shadow-lg">
          <div className="p-3 px-4 flex items-center justify-between border-b border-saffron-500/15">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="logo-circle header-chakra text-ashoka-navy animate-spin-slow bg-white rounded-full p-1 shadow-[0_0_15px_rgba(255,153,51,0.2)] flex-shrink-0">
                <AshokaChakra className="w-7 h-7" />
              </div>
              <div>
                <h1
                  className="text-[19px] font-bold tracking-wide font-display text-text-body leading-tight"
                  style={{ textShadow: '0 0 20px rgba(255,153,51,0.4)' }}
                >
                  Chunav AI
                </h1>
                <p className="hindi-sub text-[11px] text-saffron-500/70 font-hindi tracking-wide">
                  भारत का निष्पक्ष चुनाव सहायक
                </p>
              </div>
            </div>

            {/* Right: Controls — 3 pills */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">

              {/* 🎨 Theme pill */}
              <div className="control-pill">
                <span className="control-label">🎨 Theme{!themeClicked ? ' ✨' : ''}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    className={`theme-btn theme-btn-dark ${theme === 'dark' ? 'active' : ''}`}
                    data-tooltip="Dark Mode"
                    onClick={() => { setTheme('dark'); if (!themeClicked) { setThemeClicked(true); localStorage.setItem('theme_clicked', 'true'); } }}
                  />
                  <button
                    className={`theme-btn theme-btn-tiranga ${theme === 'tiranga' ? 'active' : ''}`}
                    data-tooltip="Tiranga Mode"
                    onClick={() => { setTheme('tiranga'); if (!themeClicked) { setThemeClicked(true); localStorage.setItem('theme_clicked', 'true'); } }}
                  />
                </div>
              </div>

              {/* 🌐 Language pill */}
              <div className="control-pill">
                <span className="control-label">🌐 Lang</span>
                <div className="flex items-center gap-1">
                  <button
                    className={`lang-btn ${currentLang === 'en' ? 'active' : 'inactive'}`}
                    data-tooltip="Voice input in English"
                    onClick={() => switchLang('en')}
                  >EN</button>
                  <span className="text-white/20 text-xs">|</span>
                  <button
                    className={`lang-btn ${currentLang === 'hi' ? 'active' : 'inactive'}`}
                    data-tooltip="हिंदी में बोलें"
                    onClick={() => switchLang('hi')}
                  >हि</button>
                </div>
              </div>

              {/* A- A+ pill */}
              <div className="control-pill">
                <span className="control-label"><Type size={10} className="inline mr-0.5" />Size</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setFontSize(FONT_SIZES.small)} className={`font-size-btn text-[10px] ${fontSize === FONT_SIZES.small ? 'active' : 'inactive'}`}>A-</button>
                  <button onClick={() => setFontSize(FONT_SIZES.default)} className={`font-size-btn text-[12px] ${fontSize === FONT_SIZES.default ? 'active' : 'inactive'}`}>A</button>
                  <button onClick={() => setFontSize(FONT_SIZES.large)} className={`font-size-btn text-[14px] ${fontSize === FONT_SIZES.large ? 'active' : 'inactive'}`}>A+</button>
                </div>
              </div>
            </div>

            {/* Mobile: ⚙️ settings button */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full text-lg border border-saffron-500/30"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              onClick={() => setToast('Use desktop for all controls')}
            >⚙️</button>
          </div>

          {/* Hint banner */}
          {hintVisible && (
            <div className="hint-banner">
              💡 Tip: Switch to हिंदी 🌐 or change theme 🎨 using controls top-right
            </div>
          )}

          {/* Tricolor Stripe */}
          <div className="flex h-[4px] w-full">
            <div className="w-1/3 bg-saffron-500" />
            <div className="w-1/3 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            <div className="w-1/3 bg-green-500" />
          </div>
        </header>

        {/* Chat area fade overlay — hides messages behind input bar */}
        <div className="input-fade pointer-events-none" />

        {/* ── CHAT AREA ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto flex flex-col gap-6 z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" style={{ paddingBottom: '185px' }}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col gap-1.5 animate-fade-in-up ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex gap-3 w-full md:max-w-[90%] max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse ml-auto' : 'flex-row mr-auto'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-saffron-500 text-white' : 'surface-card border border-saffron-500/20 text-saffron-500'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <AshokaChakra className="w-4 h-4" />}
                </div>

                {/* Bubble + Timestamp */}
                <div className="flex flex-col gap-1 w-full">
                  <div
                    className={`rounded-2xl p-5 shadow-lg overflow-hidden w-fit ${msg.role === 'user' ? 'user-bubble ml-auto' : 'ai-bubble markdown-body'}`}
                    style={{
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      ...(msg.role === 'user'
                        ? { background: 'linear-gradient(135deg,#FF9933,#e8851a)', color: 'white', fontWeight: 500, boxShadow: '0 4px 15px rgba(255,153,51,0.3)' }
                        : { backgroundColor: 'var(--color-surface, #0d1b35)', border: '1px solid rgba(255,153,51,0.2)', borderLeft: '3px solid #FF9933' }
                      )
                    }}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                    ) : (
                      <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                        {processMarkdown(msg.parts[0].text)}
                      </ReactMarkdown>
                    )}
                  </div>
                  <span className={`timestamp-text text-[10px] font-sans text-white/25 w-full block ${msg.role === 'user' ? 'text-right pr-1' : 'text-left pl-1'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>

              {/* Suggestion Chips */}
              {index === 0 && msg.role === 'assistant' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-11 mt-3 w-full md:max-w-[85%]">
                  {SUGGESTION_CHIPS.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(chip)}
                      className="chip-btn text-left surface-card hover:bg-saffron-500/10 border-l-[3px] border-l-saffron-500 border border-saffron-500/15 rounded-lg px-4 py-2.5 text-sm text-saffron-500 transition-all hover:translate-x-1 shadow-sm font-medium"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 flex-row animate-fade-in-up">
              <div className="flex-shrink-0 w-8 h-8 rounded-full surface-card border border-saffron-500/20 text-saffron-500 flex items-center justify-center shadow-lg">
                <AshokaChakra className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-2">
                <div
                  className="flex items-center gap-3 surface-card border border-saffron-500/20 px-5 py-4 shadow-lg w-fit"
                  style={{ borderRadius: '18px 18px 18px 4px', borderLeft: '3px solid #FF9933' }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-saffron-500 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-saffron-500 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-saffron-500 rounded-full typing-dot" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-[11px] text-text-muted italic">Chunav AI is thinking...</span>
                  <AshokaChakra className="w-3 h-3 text-ashoka-navy animate-spin-slow bg-white/80 rounded-full p-[1px]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* ── INPUT AREA — fixed above footer ── */}
        <footer className="input-footer z-[100] fixed left-0 right-0 px-4 pb-3 pt-2" style={{ bottom: '90px' }}>
          <div className="max-w-4xl mx-auto flex flex-col gap-2">

            {/* Listening indicator */}
            {isListening && (
              <div className="flex items-center justify-center gap-2 animate-fade-in-up">
                <span className="text-[12px] text-red-400 font-medium animate-pulse-icon">● Listening...</span>
                <span className="text-[11px] text-text-muted">Speak now</span>
              </div>
            )}

            {/* Input Pill */}
            <div className="input-pill w-full relative flex items-center rounded-[50px] p-2 border-[2px] border-transparent animate-border-glow focus-within:border-[rgba(255,153,51,0.8)] focus-within:shadow-[0_0_0_3px_rgba(255,153,51,0.15),0_0_40px_rgba(255,153,51,0.2)] transition-all duration-300"
              style={{
                background: 'rgba(13,27,53,0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 0 1px rgba(255,153,51,0.1), 0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(255,153,51,0.05)'
              }}
            >
              {/* Mic Button */}
              <button
                onClick={toggleMic}
                title={!speechSupported ? 'Use Chrome for voice input' : isListening ? 'Stop listening' : 'Start voice input'}
                className="flex-shrink-0 p-2.5 ml-1 transition-all duration-200 rounded-full"
                style={{
                  color: isListening ? '#FF9933' : speechSupported ? 'rgba(255,153,51,0.5)' : 'rgba(255,255,255,0.2)',
                  ...(isListening ? { animation: 'micPulse 1.2s infinite' } : {})
                }}
              >
                <Mic size={20} />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-white font-sans text-[15px] placeholder-white/30 border-none outline-none px-2 h-[44px]"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="flex-shrink-0 flex items-center justify-center h-[44px] w-[44px] rounded-full ml-2 mr-0.5 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#FF9933,#e07820)', boxShadow: '0 4px 15px rgba(255,153,51,0.5)' }}
              >
                <Send size={18} className="ml-[2px]" />
              </button>
            </div>
          </div>
        </footer>

        {/* Toast */}
        {toast && <div className="toast">{toast}</div>}

        {/* ── PRODUCT FOOTER ── */}
        <div className="app-footer">
          {/* Tricolor stripe */}
          <div className="footer-stripe" />

          {/* Main row */}
          <div className="footer-inner">

            {/* Left — Brand */}
            <div className="footer-brand">
              <div className="footer-logo">
                <AshokaChakra className="w-6 h-6 text-saffron-500" />
              </div>
              <div className="footer-brand-text">
                <span className="footer-app-name">Chunav AI</span>
                <span className="footer-tagline">भारत का निष्पक्ष चुनाव सहायक</span>
              </div>
            </div>

            {/* Center — Links */}
            <div className="footer-links">
              <a href="https://eci.gov.in" target="_blank" rel="noreferrer" className="footer-link">
                🏙️ ECI Official
              </a>
              <span className="footer-divider">·</span>
              <a href="https://voters.eci.gov.in" target="_blank" rel="noreferrer" className="footer-link">
                🗼️ Voter Portal
              </a>
              <span className="footer-divider">·</span>
              <span className="footer-helpline">
                📞 Helpline: <strong>1950</strong>
              </span>
            </div>


          </div>

          {/* Copyright line */}
          <div className="footer-copy">
            Made By Tanmay Patil for Bharat  ·  Not affiliated with ECI  · Always verify info at eci.gov.in
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
