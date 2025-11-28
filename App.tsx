import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import HandTracker from './components/HandTracker';
import ParticleSystem from './components/ParticleSystem';
import UIOverlay from './components/UIOverlay';
import { getShapePoints, generateMathShape } from './services/geminiService';
import { ShapeType, HandData } from './types';

function App() {
  // State
  const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.SPHERE);
  // Initialize with a math shape immediately so the user sees something while API loads
  const [points, setPoints] = useState<number[]>(() => generateMathShape(ShapeType.SPHERE, 2500));
  const [color, setColor] = useState<string>('#00FFFF');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [handData, setHandData] = useState<HandData>({ distance: 0, isPresent: false, mode: 'none' });
  const [showDebug, setShowDebug] = useState<boolean>(false);

  // Shape Change Handler
  useEffect(() => {
    let isMounted = true;
    const loadPoints = async () => {
      setIsLoading(true);
      try {
        // First set math shape immediately for responsiveness if switching to simple types
        if ([ShapeType.SPHERE, ShapeType.CUBE, ShapeType.HEART].includes(currentShape)) {
             const immediatePoints = generateMathShape(currentShape, 2500);
             setPoints(immediatePoints);
             setIsLoading(false);
             return;
        }

        const generatedPoints = await getShapePoints(currentShape, 2500); 
        if (isMounted) {
            setPoints(generatedPoints);
        }
      } catch (e) {
        console.error("Failed to load shape", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadPoints();
    return () => { isMounted = false; };
  }, [currentShape]);

  // Hand Update Handler
  const handleHandUpdate = useCallback((data: HandData) => {
    setHandData(data);
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }} gl={{ antialias: false, toneMappingExposure: 1.5 }}>
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 5, 20]} />
            
            {/* Lights - Replacing Environment to avoid CDN fetch errors */}
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4444ff" />
            <directionalLight position={[0, 5, 5]} intensity={1} />

            <Suspense fallback={null}>
               <ParticleSystem 
                  points={points} 
                  color={color} 
                  handDistance={handData.distance} 
                  handPresent={handData.isPresent}
               />
               <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            </Suspense>

            <EffectComposer enableNormalPass={false}>
                <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
            </EffectComposer>

            <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                autoRotate={!handData.isPresent} 
                autoRotateSpeed={0.5}
            />
        </Canvas>
      </div>

      {/* Hand Tracking Logic */}
      <HandTracker onHandUpdate={handleHandUpdate} showDebug={showDebug} />

      {/* UI Overlay */}
      <UIOverlay 
        currentShape={currentShape}
        onShapeChange={setCurrentShape}
        currentColor={color}
        onColorChange={setColor}
        loading={isLoading}
        handData={handData}
        toggleDebug={() => setShowDebug(prev => !prev)}
        showDebug={showDebug}
      />

    </div>
  );
}

export default App;