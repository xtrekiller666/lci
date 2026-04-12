import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLCIStore } from '../store/useLCIStore';

export default function ConfigPanel() {
  const configOpen = useLCIStore((s) => s.configOpen);
  const toggleConfig = useLCIStore((s) => s.toggleConfig);

  const [modelName, setModelName] = useState('gpt-4o');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('http://localhost:1234/v1');
  const [rebooting, setRebooting] = useState(false);

  const handleReboot = async () => {
    setRebooting(true);
    try {
      await fetch('/api/reboot', { method: 'POST' });
    } catch (e) {
      console.error('Reboot failed:', e);
    }
    setTimeout(() => setRebooting(false), 3000);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleConfig}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 glass-panel px-1.5 py-6 text-[10px] text-gray-600 hover:text-white transition-colors rounded-l-lg rounded-r-none border-r-0"
        style={{ writingMode: 'vertical-rl' }}
      >
        ⚙ CONFIG
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {configOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleConfig}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 z-50 glass-panel rounded-l-xl p-6 flex flex-col"
              style={{ borderRight: 'none', borderRadius: '16px 0 0 16px' }}
            >
              <h2 className="text-sm font-medium text-white mb-1">LCI Configuration</h2>
              <p className="text-[10px] text-gray-500 mb-6">Runtime settings for your companion.</p>

              <div className="space-y-5 flex-1">
                {/* Model */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1.5">Model Name</label>
                  <input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan/50 transition-colors"
                    placeholder="gpt-4o, gemma-3, llama..."
                  />
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

                {/* Endpoint */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1.5">Endpoint URL</label>
                  <input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-neon-cyan/50 transition-colors"
                    placeholder="http://localhost:1234/v1"
                  />
                </div>

                {/* Save */}
                <button className="w-full py-2 text-[10px] uppercase tracking-[0.2em] text-neon-cyan border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan/10 transition-colors">
                  Apply Settings
                </button>
              </div>

              {/* Reboot */}
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
