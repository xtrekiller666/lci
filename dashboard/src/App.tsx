import AsciiFace from './components/AsciiFace';
import MindStream from './components/MindStream';
import Biometrics from './components/Biometrics';
import TerminalChat from './components/TerminalChat';
import ConfigPanel from './components/ConfigPanel';
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
  useWebSocket();

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Background: Kinetic ASCII Face */}
      <AsciiFace />

      {/* Subtle scan line effect */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)',
        }}
      />

      {/* Left: Mind Stream */}
      <MindStream />

      {/* Right: Biometrics */}
      <Biometrics />

      {/* Bottom Center: Terminal */}
      <TerminalChat />

      {/* Config Sidebar */}
      <ConfigPanel />

      {/* Top center title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <h1 className="text-[10px] uppercase tracking-[0.5em] text-gray-600">
          Life Companion Intelligence
        </h1>
      </div>
    </div>
  );
}
