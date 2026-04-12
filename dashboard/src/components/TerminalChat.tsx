import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLCIStore } from '../store/useLCIStore';

type Tab = 'CHAT' | 'CEREBELLUM';

export default function TerminalChat() {
  const [activeTab, setActiveTab] = useState<Tab>('CHAT');
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'lci'; text: string }[]>([]);
  const streamBuffer = useLCIStore((s) => s.streamBuffer);
  const clearStream = useLCIStore((s) => s.clearStream);
  const cerebellumLog = useLCIStore((s) => s.cerebellumLog);
  const isSpeaking = useLCIStore((s) => s.isSpeaking);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streamBuffer]);

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
    // In a real setup, this would emit to WebSocket
    // socket.emit('user_message', { message: input });
    setInput('');
  }, [input]);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[700px]">
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
          <div className="flex border-t border-white/5">
            <span className="text-neon-cyan text-xs px-3 py-2.5 select-none opacity-60">▸</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-xs text-gray-200 outline-none py-2.5 placeholder:text-gray-700"
            />
            <button
              onClick={handleSend}
              className="text-[10px] text-gray-600 hover:text-neon-cyan px-4 transition-colors uppercase tracking-wider"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
