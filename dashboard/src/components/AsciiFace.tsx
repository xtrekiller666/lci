import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, Environment, ContactShadows, Float } from '@react-three/drei';
import { useLCIStore } from '../store/useLCIStore';

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

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    
    // Biometric Reaction Mapping
    const jitterStr = chemicals.cortisol > 0.6 ? (chemicals.cortisol - 0.6) * 0.05 : 0;
    const smoothJitterX = jitterStr > 0 ? (Math.sin(t * 40)) * jitterStr : 0;
    const smoothJitterY = jitterStr > 0 ? (Math.cos(t * 45)) * jitterStr : 0;
    
    // Smooth, non-deforming idle animation + Cortisol tremble
    groupRef.current.position.x = smoothJitterX;
    groupRef.current.position.y = 0.5 + smoothJitterY; // Base elevation is 0.5
    
    // Rotate slightly on idle for organic feel
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.08;
    groupRef.current.rotation.z = Math.sin(t * 0.2) * 0.015;

    // Simulate "speaking" via slight vertical bouncing without warping the geometry
    if (isSpeaking) {
      groupRef.current.position.y += Math.sin(t * 20) * 0.015;
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
