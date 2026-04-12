import { motion } from 'framer-motion';
import { useLCIStore } from '../store/useLCIStore';

const chemicalConfig = [
  { key: 'dopamine' as const,  label: 'DOP', color: '#facc15', glow: 'glow-yellow' },
  { key: 'serotonin' as const, label: 'SER', color: '#22d3ee', glow: 'glow-cyan' },
  { key: 'cortisol' as const,  label: 'COR', color: '#ef4444', glow: 'glow-red' },
  { key: 'oxytocin' as const,  label: 'OXY', color: '#f472b6', glow: 'glow-pink' },
];

function ChemicalBar({ label, value, color, glow }: { label: string; value: number; color: string; glow: string }) {
  const pct = Math.round(value * 100);
  const isHigh = value > 0.7;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] w-7 text-gray-500 font-medium">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
        <motion.div
          className={`h-full rounded-full ${isHigh ? glow : ''}`}
          style={{ backgroundColor: color }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        />
      </div>
      <span className="text-[9px] w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function Biometrics() {
  const chemicals = useLCIStore((s) => s.chemicals);
  const relationship = useLCIStore((s) => s.relationship);
  const status = useLCIStore((s) => s.status);
  const persona = useLCIStore((s) => s.persona);
  const connected = useLCIStore((s) => s.connected);

  return (
    <div className="absolute right-4 top-4 bottom-48 w-64 z-20 flex flex-col gap-3 pointer-events-none">
      {/* Chemicals */}
      <div className="glass-panel p-4">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">
          NEUROCHEMISTRY
        </h3>
        <div className="space-y-2.5">
          {chemicalConfig.map((c) => (
            <ChemicalBar
              key={c.key}
              label={c.label}
              value={chemicals[c.key]}
              color={c.color}
              glow={c.glow}
            />
          ))}
        </div>
      </div>

      {/* Relationship */}
      <div className="glass-panel p-4">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">
          BOND
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Trust</span>
            <span className="text-neon-cyan">{relationship.trust_score}/100</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-neon-cyan rounded-full"
              animate={{ width: `${relationship.trust_score}%` }}
              transition={{ type: 'spring', stiffness: 60 }}
            />
          </div>

          <div className="flex justify-between text-[10px] mt-2">
            <span className="text-gray-500">Closeness</span>
            <span className="text-neon-pink">{relationship.closeness_level}/100</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-neon-pink rounded-full"
              animate={{ width: `${relationship.closeness_level}%` }}
              transition={{ type: 'spring', stiffness: 60 }}
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="glass-panel p-4">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
          STATUS
        </h3>
        <div className="space-y-1.5 text-[10px]">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-gray-400">{connected ? 'Online' : 'Offline'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">State</span>
            <span className={status === 'Dreaming' ? 'text-purple-400' : 'text-gray-300'}>{status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Persona</span>
            <span className="text-neon-yellow">{persona}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
