import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
  showDebug?: boolean;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate, showDebug = false }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);

  // Initialize MediaPipe
  useEffect(() => {
    let isMounted = true;

    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        if (!isMounted) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
        
        if (isMounted) {
          setLandmarker(handLandmarker);
          console.log("HandLandmarker initialized successfully");
        }
      } catch (error) {
        console.error("Failed to initialize MediaPipe HandLandmarker:", error);
      }
    };
    
    initLandmarker();
    
    return () => { isMounted = false; };
  }, []);

  // Frame Loop
  const detect = () => {
    if (webcamRef.current && webcamRef.current.video && landmarker) {
      const video = webcamRef.current.video;
      if (video.readyState !== 4) {
          requestRef.current = requestAnimationFrame(detect);
          return;
      }

      const startTimeMs = performance.now();
      try {
        const results = landmarker.detectForVideo(video, startTimeMs);

        // --- Logic to calculate "Spread" ---
        let distance = 0.5; // Default middle
        let mode: HandData['mode'] = 'none';
        let isPresent = false;

        if (results.landmarks && results.landmarks.length > 0) {
          isPresent = true;
          
          if (results.landmarks.length === 2) {
            // Two hands detected: Calculate distance between index finger tips (landmark 8)
            mode = 'two-hands';
            const hand1 = results.landmarks[0][8]; // Index tip
            const hand2 = results.landmarks[1][8]; // Index tip
            
            // Euclidean distance (normalized x,y coordinates)
            const dx = hand1.x - hand2.x;
            const dy = hand1.y - hand2.y;
            const rawDist = Math.sqrt(dx * dx + dy * dy);
            
            // Map raw distance (usually 0.1 to 0.8) to 0-1 scale
            // Clamp between 0.05 and 0.8
            distance = Math.min(Math.max((rawDist - 0.05) / 0.75, 0), 1);
          } else {
            // One hand detected: Calculate distance between Thumb(4) and Index(8)
            mode = 'one-hand';
            const hand = results.landmarks[0];
            const thumb = hand[4];
            const index = hand[8];
            
            const dx = thumb.x - index.x;
            const dy = thumb.y - index.y;
            const rawDist = Math.sqrt(dx * dx + dy * dy);
            
            // One hand pinch is usually 0.02 to 0.25
            distance = Math.min(Math.max((rawDist - 0.02) / 0.23, 0), 1);
          }
        }

        onHandUpdate({ distance, isPresent, mode });

        // Debug Drawing
        if (showDebug && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const drawingUtils = new DrawingUtils(ctx);
            for (const landmarks of results.landmarks) {
              drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS);
              drawingUtils.drawLandmarks(landmarks, { radius: 3, color: '#00FF00' });
            }
          }
        }
      } catch (e) {
        console.warn("Detection error:", e);
      }
    }
    requestRef.current = requestAnimationFrame(detect);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(detect);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [landmarker, onHandUpdate]); // Dependencies

  return (
    <div className={`absolute top-4 right-4 z-50 rounded-lg overflow-hidden border border-gray-700 shadow-lg ${showDebug ? 'block' : 'opacity-0 pointer-events-none'}`} style={{ width: 160, height: 120 }}>
       <Webcam
        ref={webcamRef}
        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror
        mirrored
        screenshotFormat="image/jpeg"
      />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" />
    </div>
  );
};

export default HandTracker;