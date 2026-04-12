import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLCIStore } from '../store/useLCIStore';

const AI_PROVIDERS = [
  { id: 'custom', name: 'Custom (Local)', url: 'http://localhost:1234/v1', models: ['gemma-2-9b-it', 'llama-3', 'mistral'] },
  { id: 'openai', name: 'OpenAI', url: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4-turbo'] },
  { id: 'google', name: 'Google (Gemini)', url: 'https://generativelanguage.googleapis.com/v1beta/openai/', models: ['gemini-1.5-flash', 'gemini-1.5-pro'] },
  { id: 'anthropic', name: 'Anthropic (Proxy)', url: 'https://api.anthropic.com/v1', models: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229'] },
  { id: 'deepseek', name: 'Deepseek', url: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'] }
];

export default function ConfigPanel() {
  const configOpen = useLCIStore((s) => s.configOpen);
  const toggleConfig = useLCIStore((s) => s.toggleConfig);
  const connected = useLCIStore((s) => s.connected);
  const connectionError = useLCIStore((s) => s.connectionError);
  const currentConfig = useLCIStore((s) => s.config);
  const setStoreConfig = useLCIStore((s) => s.setConfig);
  
  // Voice & TTS settings from store
  const voiceEnabled = useLCIStore((s) => s.voiceEnabled);
  const voicePersonality = useLCIStore((s) => s.voicePersonality);
  const ttsEngine = useLCIStore((s) => s.ttsEngine);
  const ttsDiaModel = useLCIStore((s) => s.ttsDiaModel);
  
  const setVoiceEnabled = useLCIStore((s) => s.setVoiceEnabled);
  const setVoicePersonality = useLCIStore((s) => s.setVoicePersonality);
  const setTtsEngine = useLCIStore((s) => s.setTtsEngine);
  const setTtsDiaModel = useLCIStore((s) => s.setTtsDiaModel);

  const [providerId, setProviderId] = useState('custom');
  const [modelName, setModelName] = useState(currentConfig.modelName);
  const [apiKey, setApiKey] = useState(currentConfig.apiKey);
  const [endpoint, setEndpoint] = useState(currentConfig.endpoint);
  const [rebooting, setRebooting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync internal state if store changes elsewhere
  useEffect(() => {
    setModelName(currentConfig.modelName);
    setApiKey(currentConfig.apiKey);
    setEndpoint(currentConfig.endpoint);
    
    const matched = AI_PROVIDERS.find(p => p.url === currentConfig.endpoint);
    if (matched) setProviderId(matched.id);
    else setProviderId('custom');
  }, [currentConfig]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setProviderId(pId);
    
    const prov = AI_PROVIDERS.find(p => p.id === pId);
    if (prov) {
      setEndpoint(prov.url);
      if (!prov.models.includes(modelName)) {
        setModelName(prov.models[0]);
      }
    }
  };

  const currentProviderConfig = AI_PROVIDERS.find(p => p.id === providerId) || AI_PROVIDERS[0];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { voiceEnabled, voicePersonality, ttsEngine, ttsDiaModel } = useLCIStore.getState();
      const res = await fetch('http://localhost:3000/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          modelName, apiKey, endpoint, 
          voiceEnabled, voicePersonality, ttsEngine, ttsDiaModel 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStoreConfig(data.config);
      }
    } catch (e) {
      console.error('Config save failed:', e);
    }
    setTimeout(() => setSaving(false), 800);
  };

  const handleReboot = async () => {
    setRebooting(true);
    try {
      await fetch('http://localhost:3000/api/reboot', { method: 'POST' });
    } catch (e) {
      console.error('Reboot failed:', e);
    }
    setTimeout(() => setRebooting(false), 3000);
  };

  return (
    <>
      <button
        onClick={toggleConfig}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 glass-panel px-1.5 py-6 text-[10px] text-gray-600 hover:text-white transition-colors rounded-l-lg rounded-r-none border-r-0"
        style={{ writingMode: 'vertical-rl' }}
      >
        ⚙ CONFIG
      </button>

      <AnimatePresence>
        {configOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleConfig}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 z-50 glass-panel rounded-l-xl p-6 flex flex-col"
              style={{ borderRight: 'none', borderRadius: '16px 0 0 16px' }}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-medium text-white">LCI Configuration</h2>
                {/* Connection Indicator */}
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-neon-cyan animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[9px] uppercase tracking-wider text-gray-500">
                    {connected ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mb-6">Runtime core logic settings.</p>

              {connectionError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-4">
                  <p className="text-[9px] text-red-400 leading-tight">Error: {connectionError}</p>
                </div>
              )}

              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Provider Dropdown */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1.5">AI Provider</label>
                  <select
                    value={providerId}
                    onChange={handleProviderChange}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan/50 appearance-none transition-colors"
                  >
                    {AI_PROVIDERS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Model Dropdown / Input */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1.5">Model</label>
                  {providerId === 'custom' ? (
                    <input
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan/50 transition-colors"
                      placeholder="e.g. gemma-3-4b"
                    />
                  ) : (
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan/50 appearance-none transition-colors"
                    >
                      {currentProviderConfig.models.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* API Key */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1.5">API Key</label>
                  <input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    type="password"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan/50 transition-colors"
                    placeholder="sk-..."
                  />
                </div>

                {/* Endpoint URL */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1.5">Endpoint URL</label>
                  <input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    disabled={providerId !== 'custom'}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none transition-colors ${
                      providerId !== 'custom' ? 'text-gray-500 cursor-not-allowed opacity-50' : 'text-gray-200 focus:border-neon-cyan/50'
                    }`}
                  />
                </div>

                {/* Voice & Audio Settings */}
                <div className="pt-3 mt-3 border-t border-white/5">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-3">Voice & Audio</h3>
                  
                  {/* Voice Toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] text-gray-500">Voice Feedback</label>
                    <button
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`w-10 h-5 rounded-full transition-all relative ${
                        voiceEnabled
                          ? 'bg-neon-cyan/30 border border-neon-cyan/50'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                        voiceEnabled
                          ? 'right-0.5 bg-neon-cyan'
                          : 'left-0.5 bg-gray-600'
                      }`} />
                    </button>
                  </div>

                  {/* TTS Engine */}
                  <div className="mb-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1.5">TTS Engine</label>
                    <select
                      value={ttsEngine || 'browser'}
                      onChange={(e) => setTtsEngine(e.target.value as 'browser' | 'dia')}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan/50 appearance-none transition-colors"
                    >
                      <option value="browser">🌐 Browser Native Engine (Fast)</option>
                      <option value="dia">🎙 Dia HD AI (Requires Local GPU)</option>
                    </select>
                  </div>

                  {/* Dia Custom Model Path */}
                  {ttsEngine === 'dia' && (
                    <div className="mb-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-neon-cyan/70 block mb-1.5 font-bold">Dia Model ID/Path</label>
                      <input
                        value={ttsDiaModel}
                        onChange={(e) => setTtsDiaModel(e.target.value)}
                        className="w-full bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan transition-colors"
                        placeholder="nari-labs/Dia-1.6B-0626"
                      />
                      <p className="text-[9px] text-gray-500 mt-1 pl-1">HuggingFace repo or local 'models/...' path</p>
                    </div>
                  )}

                  {/* Voice Personality */}
                  <div className="mb-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1.5">Voice Personality</label>
                    <select
                      value={voicePersonality}
                      onChange={(e) => setVoicePersonality(e.target.value as 'analytical' | 'organic')}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan/50 appearance-none transition-colors"
                    >
                      <option value="organic">🧬 Organic (Emotion-Driven)</option>
                      <option value="analytical">🤖 Analytical (Flat/Robotic)</option>
                    </select>
                  </div>

                  {/* STT Status */}
                  <div className="w-full py-2.5 text-[10px] text-center uppercase tracking-wider text-neon-cyan/70 bg-neon-cyan/5 border border-neon-cyan/10 rounded-lg">
                    🎙 Microphone STT Active (In Chat)
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all rounded-lg scroll-m-1 ${
                      saving 
                        ? 'border-neon-cyan/10 bg-neon-cyan/5 text-neon-cyan/50 cursor-wait' 
                        : 'border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10'
                    }`}
                  >
                    {saving ? 'Applying...' : 'Apply Details'}
                  </button>
                  <p className="text-[9px] text-gray-600 text-center mt-2 px-1">
                    Some providers (Anthropic) may require a proxy if they do not natively support the OpenAI protocol.
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5">
                <button
                  onClick={handleReboot}
                  disabled={rebooting}
                  className={`w-full py-3 text-[10px] uppercase tracking-[0.2em] rounded-lg font-bold transition-all ${
                    rebooting
                      ? 'bg-red-900/30 text-red-400 cursor-wait'
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {rebooting ? '⟳ Rebooting...' : '⚡ Reboot LCI Core'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
