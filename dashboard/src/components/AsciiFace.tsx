import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { useLCIStore } from '../store/useLCIStore';

function DensePointCloudFace() {
  const pointsRef = useRef<THREE.Points>(null!);
  const { nodes } = useGLTF('/models/femalehead.glb');
  
  const chemicals = useLCIStore((s) => s.chemicals);
  const isSpeaking = useLCIStore((s) => s.isSpeaking);

  // Surface sampling for ultra-high detail
  const { origPos, origColors, bbox } = useMemo(() => {
    let sourceMesh: THREE.Mesh | null = null;
    
    // Find the primary mesh
    Object.values(nodes).forEach(n => {
       // @ts-ignore
       if (n.isMesh && !sourceMesh) sourceMesh = n;
    });

    if (!sourceMesh) return { origPos: new Float32Array(), origColors: new Float32Array(), bbox: null };

    // Standardize scale to prevent "too huge" issues
    sourceMesh.geometry.computeBoundingBox();
    const box = sourceMesh.geometry.boundingBox!;
    const maxDim = Math.max(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z
    );
    
    // Scale everything down so the face fits well in a 3-unit box
    const scaleFactor = 3.0 / maxDim;
    sourceMesh.geometry.scale(scaleFactor, scaleFactor, scaleFactor);
    
    // Auto-center and permanently fix the rotation so the normals match camera view
    sourceMesh.geometry.center();
    sourceMesh.geometry.rotateY(Math.PI);
    sourceMesh.geometry.computeBoundingBox(); // Recompute after scale and center
    
    const newBox = sourceMesh.geometry.boundingBox!;

    // Generate dense point cloud
    const sampler = new MeshSurfaceSampler(sourceMesh).build();
    const pointCount = 80000;
    
    const positions: number[] = [];
    const colors: number[] = [];
    const tempPosition = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();
    const lightDir = new THREE.Vector3(0, 0.2, 1).normalize();

    let count = 0;
    let attempts = 0;
    while (count < pointCount && attempts < pointCount * 2) {
      sampler.sample(tempPosition, tempNormal);
      attempts++;
      
      positions.push(tempPosition.x, tempPosition.y, tempPosition.z);
      
      // Calculate false lighting to give depth and shading to the dots
      const dot = Math.max(0, tempNormal.dot(lightDir));
      const brightness = dot * 0.8 + 0.2; // 20% Ambient, 80% Diffuse
      colors.push(brightness, brightness, brightness);
      
      count++;
    }

    return {
      origPos: new Float32Array(positions),
      origColors: new Float32Array(colors),
      bbox: newBox,
    };
  }, [nodes]);

  // Create geometry once
  const pointGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(origPos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(origColors, 3));
    return geom;
  }, [origPos, origColors]);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !bbox || origPos.length === 0) return;
    const t = clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position;
    
    const height = bbox.max.y - bbox.min.y;
    // Lower 35% is approximately the jaw and mouth
    const midY = bbox.min.y + height * 0.35; 
    
    // Speech articulation logic
    const mouthOpen = isSpeaking ? (Math.sin(t * 15) * 0.5 + 0.5) * 0.04 * height : 0;
    
    // Biometric modifiers
    const jitter = chemicals.cortisol > 0.6 ? (Math.random() - 0.5) * 0.05 * chemicals.cortisol : 0;
    const pulse = 1.0 + (chemicals.dopamine > 0.6 ? Math.sin(t * 2) * 0.02 * (chemicals.dopamine - 0.6) : 0);

    for (let i = 0; i < origPos.length / 3; i++) {
        const ox = origPos[i * 3];
        let oy = origPos[i * 3 + 1];
        const oz = origPos[i * 3 + 2];

        if (isSpeaking && oy < midY) {
            const influence = (midY - oy) / (midY - bbox.min.y);
            oy -= mouthOpen * (influence * influence);
        }

        pos.setXYZ(i, ox * pulse + jitter, oy * pulse + jitter, oz * pulse);
    }
    pos.needsUpdate = true;

    // Gentle hover
    pointsRef.current.position.y = Math.sin(t * 0.5) * 0.1 - 1.0; // Offset down slightly
    pointsRef.current.rotation.y = Math.sin(t * 0.2) * 0.05;
  });

  if (origPos.length === 0) return null;

  return (
    <group scale={[0.35, 0.35, 0.35]} position={[0, 1.0, 0]}>
      <points ref={pointsRef} geometry={pointGeometry}>
        <pointsMaterial 
          size={0.012} // Very fine dots for detail
          vertexColors={true}
          transparent 
          opacity={0.8} 
          sizeAttenuation={true} 
        />
      </points>
    </group>
  );
}

export default function AsciiFace() {
  return (
    <div className="absolute inset-0 z-0 bg-[#0a0a0a]" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <DensePointCloudFace />
      </Canvas>

      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          filter: 'contrast(160%) brightness(100%) grayscale(1)'
        }}
      />
    </div>
  );
}
