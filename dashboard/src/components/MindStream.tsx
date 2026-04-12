import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLCIStore } from '../store/useLCIStore';

export default function MindStream() {
  const thought = useLCIStore((s) => s.currentThought);
  const sparks = useLCIStore((s) => s.memorySparks);
  const removeSpark = useLCIStore((s) => s.removeMemorySpark);

  // Auto-remove sparks after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      sparks.forEach((s) => {
        if (now - s.timestamp > 5000) removeSpark(s.id);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sparks, removeSpark]);

  return (
    <div className="absolute left-4 top-4 bottom-48 w-72 z-20 flex flex-col gap-3 pointer-events-none">
      {/* Thoughts */}
      <div className="glass-panel p-4 flex-shrink-0">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
          LCI_THOUGHTS
        </h3>
        <motion.p
          key={thought}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-gray-300 leading-relaxed"
        >
          {thought}
        </motion.p>
      </div>

      {/* Memory Sparks */}
      <div className="glass-panel p-4 flex-1 overflow-hidden">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">
          MEMORY_SPARKS
        </h3>
        <div className="space-y-2">
          <AnimatePresence>
            {sparks.map((spark) => (
              <motion.div
                key={spark.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.4 }}
                className={`text-[10px] px-2 py-1.5 rounded border ${
                  spark.type === 'episodic'
                    ? 'border-neon-cyan/30 text-neon-cyan/80'
                    : 'border-neon-yellow/30 text-neon-yellow/80'
                }`}
              >
                <span className="opacity-50 mr-1">[{spark.type[0].toUpperCase()}]</span>
                {spark.title}
              </motion.div>
            ))}
          </AnimatePresence>
          {sparks.length === 0 && (
            <p className="text-[10px] text-gray-600 italic">No recent recalls...</p>
          )}
        </div>
      </div>
    </div>
  );
}
