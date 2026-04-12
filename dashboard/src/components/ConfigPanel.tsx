import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLCIStore } from '../store/useLCIStore';

export default function ConfigPanel() {
  const configOpen = useLCIStore((s) => s.configOpen);
  const toggleConfig = useLCIStore((s) => s.toggleConfig);
  const connected = useLCIStore((s) => s.connected);
  const connectionError = useLCIStore((s) => s.connectionError);
  const currentConfig = useLCIStore((s) => s.config);
  const setStoreConfig = useLCIStore((s) => s.setConfig);

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
  }, [currentConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:3000/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName, apiKey, endpoint }),
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
              <p className="text-[10px] text-gray-500 mb-6">Runtime settings for your companion.</p>

              {connectionError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-4">
                  <p className="text-[9px] text-red-400 leading-tight">Error: {connectionError}</p>
                </div>
              )}

              <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1.5">Model Name</label>
                  <input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan/50 transition-colors"
                    placeholder="gpt-4o, gemma-3, llama..."
                  />
                </div>

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

                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1.5">Endpoint URL</label>
                  <input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan/50 transition-colors"
                    placeholder="http://localhost:1234/v1"
                  />
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className={`w-full py-2 text-[10px] uppercase tracking-[0.2em] border transition-all rounded-lg scroll-m-1 ${
                    saving 
                      ? 'border-neon-cyan/10 bg-neon-cyan/5 text-neon-cyan/50 cursor-wait' 
                      : 'border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10'
                  }`}
                >
                  {saving ? 'Applying...' : 'Apply Settings'}
                </button>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <button
                  onClick={handleReboot}
                  disabled={rebooting}
                  className={`w-full py-3 text-xs uppercase tracking-[0.15em] rounded-lg font-medium transition-all ${
                    rebooting
                      ? 'bg-red-900/30 text-red-400 cursor-wait'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50'
                  }`}
                >
                  {rebooting ? '⟳ Rebooting...' : '⚡ Reboot LCI'}
                </button>
                <p className="text-[9px] text-gray-600 text-center mt-2">
                  Full system restart. All active sessions will end.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
