import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSystemProps {
  points: number[];
  color: string;
  handDistance: number; // 0 to 1
  handPresent: boolean;
}

const dummy = new THREE.Object3D();
const tempPos = new THREE.Vector3();

const ParticleSystem: React.FC<ParticleSystemProps> = ({ points, color, handDistance, handPresent }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = Math.floor(points.length / 3);
  
  // Create particle geometry and material once
  const { geometry, material } = useMemo(() => {
    // Increased radius from 0.015 to 0.025 for better visibility
    const geo = new THREE.IcosahedronGeometry(0.025, 0); 
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.2,
      metalness: 0.8,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.8, // Increased intensity
      toneMapped: false
    });
    return { geometry: geo, material: mat };
  }, [color]);

  useFrame((state) => {
    if (!meshRef.current || count === 0) return;
    
    const time = state.clock.getElapsedTime();
    const targetScale = handPresent ? 0.5 + (handDistance * 2.5) : 1 + Math.sin(time * 0.5) * 0.2; 
    const explosionFactor = handPresent ? Math.max(0, handDistance - 0.8) * 5 : 0; 
    
    // Smooth rotation
    meshRef.current.rotation.y += 0.002;
    meshRef.current.rotation.z = Math.sin(time * 0.2) * 0.1;

    let idx = 0;
    for (let i = 0; i < count; i++) {
      // Target position from shape data
      const tx = points[idx];
      const ty = points[idx + 1];
      const tz = points[idx + 2];
      
      // Base Position
      tempPos.set(tx, ty, tz);
      
      // Apply Scale (Hand Control)
      tempPos.multiplyScalar(targetScale);
      
      // Apply Noise/Movement
      const noise = Math.sin(i * 0.5 + time) * 0.05;
      tempPos.addScalar(noise);

      // Explosion/Scatter effect at high hand distance
      if (explosionFactor > 0) {
          // Explode outwards from center
          const dir = tempPos.clone().normalize();
          tempPos.add(dir.multiplyScalar(explosionFactor * (0.5 + Math.random() * 0.5)));
      }

      dummy.position.copy(tempPos);
      
      // Scale individual particles
      const pScale = 1 + Math.sin(i * 0.1 + time * 2) * 0.3;
      dummy.scale.set(pScale, pScale, pScale);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      idx += 3;
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // If no points, return null to avoid rendering empty mesh artifacts
  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export default ParticleSystem;