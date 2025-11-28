import React, { useState } from 'react';
import { ShapeType } from '../types';
import { Camera, Maximize, Minimize, Loader2 } from 'lucide-react';

interface UIOverlayProps {
  currentShape: ShapeType;
  onShapeChange: (s: ShapeType) => void;
  currentColor: string;
  onColorChange: (c: string) => void;
  loading: boolean;
  handData: { distance: number, isPresent: boolean, mode: string };
  toggleDebug: () => void;
  showDebug: boolean;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  currentShape, onShapeChange, currentColor, onColorChange, loading, handData, toggleDebug, showDebug 
}) => {
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shapes = Object.values(ShapeType);
  const colors = ['#FF0055', '#00FFFF', '#FFD700', '#55FF00', '#FFFFFF', '#AA00FF'];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tighter drop-shadow-md">
            Zen<span className="font-bold text-cyan-400">Particles</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1 max-w-[200px]">
            Use your hands to breathe life into the particles. 
            <br/>
            <span className="text-cyan-400">{handData.isPresent ? 
              (handData.mode === 'two-hands' ? 'Double Hand Control Active' : 'Single Hand Pinch Active') 
              : 'Waiting for hands...'}
            </span>
          </p>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={toggleFullscreen} 
            className="p-2 rounded-full border bg-black/50 text-white border-gray-700 hover:bg-gray-800 transition-colors backdrop-blur-md"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
            <button 
            onClick={toggleDebug} 
            className={`p-2 rounded-full border ${showDebug ? 'bg-white text-black border-white' : 'bg-black/50 text-white border-gray-700'} hover:bg-gray-800 transition-colors backdrop-blur-md`}
            title="Toggle Camera View"
            >
            <Camera size={20} />
          </button>
        </div>
      </div>

      {/* Main Controls - Bottom */}
      <div className="flex flex-col gap-4 pointer-events-auto items-center md:items-start w-full md:w-auto self-center md:self-auto">
        
        {/* Loading Indicator */}
        {loading && (
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-3 border border-gray-800 pointer-events-none">
                <Loader2 className="animate-spin text-cyan-400" size={24} />
                <span className="text-white font-mono text-sm">Generating Geometry with Gemini...</span>
            </div>
        )}

        {/* Hand Feedback Bar (Visualizing the invisible hand distance) */}
        <div className="w-full max-w-md bg-gray-900/50 backdrop-blur rounded-full h-1.5 mb-2 overflow-hidden border border-gray-800">
            <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-75 ease-out"
                style={{ width: `${handData.distance * 100}%`, opacity: handData.isPresent ? 1 : 0.3 }}
            />
        </div>

        {/* Control Panel */}
        <div className="bg-black/40 backdrop-blur-xl border border-gray-800 p-4 rounded-2xl flex flex-col gap-4 w-full md:w-[320px]">
          
          {/* Shape Selector */}
          <div>
             <label className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-2 block">Shape</label>
             <div className="grid grid-cols-4 gap-2">
                {shapes.map(shape => (
                    <button
                        key={shape}
                        onClick={() => onShapeChange(shape)}
                        className={`text-[10px] md:text-xs py-2 px-1 rounded-lg border transition-all ${currentShape === shape ? 'bg-white/10 border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:bg-white/5'}`}
                    >
                        {shape}
                    </button>
                ))}
             </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-2 block">Color</label>
             <div className="flex justify-between">
                {colors.map(c => (
                    <button 
                        key={c}
                        onClick={() => onColorChange(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${currentColor === c ? 'border-white scale-110 shadow-[0_0_10px_currentColor]' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UIOverlay;