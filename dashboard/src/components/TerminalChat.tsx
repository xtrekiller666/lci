import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLCIStore } from '../store/useLCIStore';
import { io } from 'socket.io-client';
import { MicrophoneInput } from '../audio/MicrophoneInput';

const socket = io('ws://localhost:3000', { transports: ['websocket'] });

type Tab = 'CHAT' | 'CEREBELLUM';

export default function TerminalChat() {
  const [activeTab, setActiveTab] = useState<Tab>('CHAT');
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'lci'; text: string }[]>([]);
  const streamBuffer = useLCIStore((s) => s.streamBuffer);
  const clearStream = useLCIStore((s) => s.clearStream);
  const cerebellumLog = useLCIStore((s) => s.cerebellumLog);
  const isSpeaking = useLCIStore((s) => s.isSpeaking);
  
  const pendingAuthority = useLCIStore((s) => s.pendingAuthority);
  const setPendingAuthority = useLCIStore((s) => s.setPendingAuthority);
  
  const isListening = useLCIStore((s) => s.isListening);
  const setIsListening = useLCIStore((s) => s.setIsListening);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize Microphone
  useEffect(() => {
    const mic = MicrophoneInput.getInstance();
    
    mic.onListeningChange = (listening) => {
      setIsListening(listening);
    };

    mic.onTranscript = (text, isFinal) => {
      if (isFinal) {
        socket.emit('user_message', { message: text });
        setChatHistory((h) => [...h, { role: 'user', text }]);
      } else {
        // Show interim in input box
        setInput(text);
      }
    };

    return () => mic.stop();
  }, [setIsListening]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streamBuffer, input]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cerebellumLog]);

  // When stream ends, commit to history
  useEffect(() => {
    if (!isSpeaking && streamBuffer.length > 0) {
      setChatHistory((h) => [...h, { role: 'lci', text: streamBuffer }]);
      clearStream();
    }
  }, [isSpeaking, streamBuffer, clearStream]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    setChatHistory((h) => [...h, { role: 'user', text: input }]);
    socket.emit('user_message', { message: input });
    setInput('');
  }, [input]);

  const handleAuthority = (approved: boolean) => {
    socket.emit('authority_response', { approved });
    setPendingAuthority(null);
  };

  const handleMicToggle = () => {
    const mic = MicrophoneInput.getInstance();
    if (!mic.isSupported) {
      alert("Microphone input is not supported in this browser.");
      return;
    }
    
    if (isListening) {
      mic.stop();
      setInput('');
    } else {
      mic.start();
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[700px]">
      <AnimatePresence>
        {pendingAuthority && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-4 glass-panel border-red-500/30 p-4 rounded-xl flex flex-col items-center gap-3 backdrop-blur-xl shadow-2xl shadow-red-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse border border-red-500/40">
                <span className="text-red-500 font-bold text-xs italic">!</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest leading-none mb-1">Cerebellum Authority Required</h3>
                <p className="text-[10px] text-gray-500">Operation is outside the restricted workspace bounds.</p>
              </div>
            </div>
            
            <div className="w-full bg-black/40 rounded-lg p-3 font-mono text-[10px] border border-white/5 space-y-1">
              <div className="flex gap-2">
                <span className="text-gray-600">ACTION:</span>
                <span className="text-neon-cyan">{pendingAuthority.command}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">TARGET:</span>
                <span className="text-gray-400 truncate max-w-[450px]">{pendingAuthority.path}</span>
              </div>
            </div>

            <div className="flex gap-4 w-full pt-1">
              <button
                onClick={() => handleAuthority(false)}
                className="flex-1 py-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              >
                Deny
              </button>
              <button
                onClick={() => handleAuthority(true)}
                className="flex-[1.5] py-2 bg-red-500/10 border border-red-500/40 text-red-500 text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-red-500/20 shadow-lg shadow-red-500/5 transition-all"
              >
                Authorize Execution
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="glass-panel overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-white/5">
          {(['CHAT', 'CEREBELLUM'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-[10px] uppercase tracking-[0.25em] transition-all ${
                activeTab === tab
                  ? 'text-white bg-white/5 border-b border-neon-cyan'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              [{tab}]
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="h-52 overflow-y-auto p-3">
          {activeTab === 'CHAT' ? (
            <div className="space-y-2 text-xs">
              {chatHistory.map((msg, i) => (
                <div key={i} className={msg.role === 'user' ? 'text-neon-cyan' : 'text-gray-300'}>
                  <span className="text-gray-600 mr-1">{msg.role === 'user' ? 'YOU>' : 'LCI>'}</span>
                  {msg.text}
                </div>
              ))}
              {streamBuffer && (
                <div className="text-gray-300">
                  <span className="text-gray-600 mr-1">LCI&gt;</span>
                  {streamBuffer}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="text-neon-cyan"
                  >
                    ▌
                  </motion.span>
                </div>
              )}
              {isListening && input && (
                <div className="text-gray-500 italic">
                  YOU&gt; {input}...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          ) : (
            <div className="space-y-0.5 text-[10px] text-gray-500 font-mono">
              {cerebellumLog.map((entry, i) => (
                <div key={i} className={entry.includes('ERROR') ? 'text-neon-red' : entry.includes('SUCCESS') ? 'text-green-500' : ''}>
                  {entry}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>

        {/* Input (Chat tab only) */}
        {activeTab === 'CHAT' && (
          <div className="flex items-center border-t border-white/5 pr-1">
            <span className="text-neon-cyan text-xs pl-3 pr-2 py-2.5 select-none opacity-60">▸</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening..." : "Type a message..."}
              disabled={isListening}
              className="flex-1 bg-transparent text-xs text-gray-200 outline-none py-2.5 placeholder:text-gray-700 disabled:opacity-50"
            />
            
            {/* Mic Toggle */}
            <button
              onClick={handleMicToggle}
              className={`p-2 mx-1 rounded-full transition-all flex items-center justify-center ${
                isListening 
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse'
                  : 'bg-transparent text-gray-600 hover:bg-white/5 hover:text-white'
              }`}
              title="Toggle Voice Input"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
            </button>

            <button
              onClick={handleSend}
              disabled={isListening}
              className="text-[10px] text-gray-600 hover:text-neon-cyan px-3 py-2 transition-colors uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
