import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, Environment, ContactShadows, Float } from '@react-three/drei';
import { useLCIStore } from '../store/useLCIStore';
import { SpeechEngine } from '../audio/SpeechEngine';

function VoiceAura() {
  const auraRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null!);

  useFrame(() => {
    if (!auraRef.current || !materialRef.current) return;

    const engine = SpeechEngine.getInstance();
    const amplitude = engine.getAmplitude();

    // Pulse the aura scale and opacity with voice amplitude
    const baseScale = 2.8;
    const pulseScale = baseScale + amplitude * 0.8;
    auraRef.current.scale.set(pulseScale, pulseScale, pulseScale);

    // Glow intensity: idle = very faint, speaking = vivid
    materialRef.current.opacity = 0.02 + amplitude * 0.08;
  });

  return (
    <mesh ref={auraRef} position={[0, 0.5, -1]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#00e5ff"
        transparent
        opacity={0.02}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function PremiumDigitalFace() {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF('/models/femalehead.glb');
  
  const chemicals = useLCIStore((s) => s.chemicals);
  const isSpeaking = useLCIStore((s) => s.isSpeaking);

  // Deep clone and stylize the model, compute bounds to center perfectly
  const stylizedScene = useMemo(() => {
    const cloned = scene.clone(true);
    
    // Calculate boundaries and auto-center
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Scale to fit screen flawlessly
    const scale = 3.5 / maxDim;
    cloned.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    cloned.scale.set(scale, scale, scale);

    // Apply premium digital/holographic material
    const digitalMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#aaaaaa"),
      metalness: 0.8,
      roughness: 0.3,
      envMapIntensity: 1.5,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      wireframe: false,
    });

    cloned.traverse((child) => {
      // @ts-ignore
      if (child.isMesh) {
         // @ts-ignore
         child.material = digitalMaterial;
      }
    });

    return cloned;
  }, [scene]);

  // Track last sync time for drift detection
  const lastSyncRef = useRef(performance.now());

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const now = performance.now();

    // 1. Cortisol Jitter (High Frequency vibration with high stress)
    const jitterIntensity = chemicals.cortisol * 0.04;
    if (chemicals.cortisol > 0.3) {
      groupRef.current.position.x = (Math.random() - 0.5) * jitterIntensity;
      groupRef.current.position.z = (Math.random() - 0.5) * jitterIntensity;
    } else {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.15);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, 0.15);
    }

    // 2. Audio-Driven Lip-Sync (replaces blind sine wave)
    const engine = SpeechEngine.getInstance();
    const amplitude = engine.getAmplitude(); // 0.0–1.0 from FFT or synthetic

    if (isSpeaking || engine.isSpeaking) {
      // Sync Guard: Check drift between AudioContext and render clock
      const drift = now - lastSyncRef.current;
      const useLerp = drift < 150; // If less than 150ms drift, smooth interpolation
      lastSyncRef.current = now;

      // Jaw movement: Y-scale driven by audio amplitude
      const targetStretch = 1.0 + amplitude * 0.12;
      if (useLerp) {
        const currentScaleY = groupRef.current.scale.y;
        groupRef.current.scale.set(1, THREE.MathUtils.lerp(currentScaleY, targetStretch, 0.4), 1);
      } else {
        // Snap (drift too high, skip lerp to resync)
        groupRef.current.scale.set(1, targetStretch, 1);
      }

      // Subtle jaw offset (pulls chin down with amplitude)
      const jawOffset = amplitude * 0.05;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        0.5 - jawOffset,
        0.3
      );
    } else {
      // Return to rest position smoothly
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.5, 0.1);
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 1.0, 0.15);
      groupRef.current.scale.x = 1;
      groupRef.current.scale.z = 1;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {/* Float adds a magical, weightless breathing effect */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <primitive object={stylizedScene} />
      </Float>
    </group>
  );
}

export default function AsciiFace() {
  return (
    <div className="absolute inset-0 z-0 bg-[#050505]" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, toneMappingExposure: 1.2 }}
      >
        <Environment preset="studio" />
        
        {/* Dramatic Lighting Setup */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[0, 5, 5]} intensity={1.5} color="#ffffff" />
        <spotLight position={[-5, 5, -5]} intensity={2.0} color="#00e5ff" /> {/* Cyan rim light */}
        <spotLight position={[5, 0, -5]} intensity={1.5} color="#ffffff" /> 

        {/* Voice Aura: Glows with speech amplitude */}
        <VoiceAura />

        <PremiumDigitalFace />

        {/* Soft shadow grounding */}
        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
      </Canvas>

      <div 
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          filter: 'contrast(120%) brightness(120%) grayscale(1)'
        }}
      />
    </div>
  );
}
