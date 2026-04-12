import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLCIStore } from '../store/useLCIStore';

function AsciiSphere() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const chemicals = useLCIStore((s) => s.chemicals);
  const isSpeaking = useLCIStore((s) => s.isSpeaking);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2.2, 6), []);
  const originalPositions = useMemo(() => {
    const pos = geometry.attributes.position;
    return Float32Array.from(pos.array);
  }, [geometry]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const ox = originalPositions[i * 3];
      const oy = originalPositions[i * 3 + 1];
      const oz = originalPositions[i * 3 + 2];

      let scale = 1.0;
      let jitter = 0;

      // Cortisol > 0.7: aggressive jitter
      if (chemicals.cortisol > 0.7) {
        jitter = (Math.random() - 0.5) * 0.15 * chemicals.cortisol;
      }

      // Dopamine > 0.7: expand and wave
      if (chemicals.dopamine > 0.7) {
        scale = 1.0 + Math.sin(t * 0.8 + i * 0.1) * 0.08 * chemicals.dopamine;
      }

      // Serotonin: gentle breathing
      const breath = Math.sin(t * 0.4) * 0.02 * chemicals.serotonin;

      // Speaking: Y-axis lip-sync wobble
      const speak = isSpeaking ? Math.sin(t * 12 + i * 0.5) * 0.04 : 0;

      positions.setXYZ(
        i,
        ox * scale + jitter,
        oy * scale + speak + breath,
        oz * scale + jitter * 0.5
      );
    }
    positions.needsUpdate = true;

    // Slow rotation
    meshRef.current.rotation.y = t * 0.08;
    meshRef.current.rotation.x = Math.sin(t * 0.15) * 0.1;
  });

  // Color based on dominant chemical
  const color = useMemo(() => {
    if (chemicals.cortisol > 0.7) return '#ef4444';
    if (chemicals.dopamine > 0.7) return '#facc15';
    if (chemicals.oxytocin > 0.6) return '#f472b6';
    return '#22d3ee';
  }, [chemicals]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

export default function AsciiFace() {
  return (
    <div className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#22d3ee" />
        <pointLight position={[-5, -3, 3]} intensity={0.5} color="#f472b6" />
        <AsciiSphere />
      </Canvas>

      {/* ASCII overlay text effect */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ mixBlendMode: 'overlay', opacity: 0.06 }}
      >
        <pre className="text-[8px] leading-[8px] text-white font-mono whitespace-pre overflow-hidden">
          {generateAsciiGrid(80, 40)}
        </pre>
      </div>
    </div>
  );
}

function generateAsciiGrid(cols: number, rows: number): string {
  const chars = '@#%*+=-:. ';
  let grid = '';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dist = Math.sqrt(Math.pow(x - cols / 2, 2) + Math.pow(y - rows / 2, 2));
      const norm = Math.min(1, dist / (cols / 2));
      const idx = Math.floor(norm * (chars.length - 1));
      grid += chars[idx];
    }
    grid += '\n';
  }
  return grid;
}
