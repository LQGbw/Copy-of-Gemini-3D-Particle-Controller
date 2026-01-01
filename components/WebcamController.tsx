import React, { useRef, useEffect, useState } from 'react';
import { analyzeFrame } from '../services/geminiService';
import { GestureType } from '../types';
import { Hand, Target, MousePointer2, Sparkles, AlertCircle } from 'lucide-react';

interface WebcamControllerProps {
  onGestureChange: (gesture: GestureType) => void;
}

export const WebcamController: React.FC<WebcamControllerProps> = ({ onGestureChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastGesture, setLastGesture] = useState<GestureType>(GestureType.None);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Start Webcam
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, frameRate: 30 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsStreaming(true);
            videoRef.current?.play();
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    startVideo();
  }, []);

  // Analysis Loop
  useEffect(() => {
    if (!isStreaming) return;

    const intervalId = setInterval(async () => {
      if (isAnalyzing || !videoRef.current || !canvasRef.current) return;

      setIsAnalyzing(true);

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Mirror the context so it feels natural to the user
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const base64Data = canvas.toDataURL('image/jpeg', 0.6); // Low quality for speed
          
          const result = await analyzeFrame(base64Data);
          
          setLastGesture(result.gesture);
          onGestureChange(result.gesture);
        }
      } catch (e) {
        console.error("Analysis loop error", e);
      } finally {
        setIsAnalyzing(false);
      }

    }, 800); // Check every 800ms

    return () => clearInterval(intervalId);
  }, [isStreaming, isAnalyzing, onGestureChange]);

  const getIconForGesture = (gesture: GestureType) => {
    switch (gesture) {
      case GestureType.OpenPalm: return <Hand className="w-12 h-12 text-cyan-400" />;
      case GestureType.ClosedFist: return <Target className="w-12 h-12 text-red-500" />;
      case GestureType.Pointing: return <MousePointer2 className="w-12 h-12 text-green-400" />;
      case GestureType.Victory: return <span className="text-4xl">✌️</span>;
      default: return <Sparkles className="w-12 h-12 text-blue-400 opacity-50" />;
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      
      {/* Schematic / Detection Visualizer */}
      <div className="relative group">
        {/* Container Frame */}
        <div className={`
          relative rounded-xl overflow-hidden border-2 shadow-2xl transition-all duration-300
          w-56 h-42 bg-black
          ${isAnalyzing ? 'border-yellow-400/50 shadow-yellow-900/20' : 'border-cyan-500/50 shadow-cyan-900/20'}
        `}>
          
          {/* Video Feed */}
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover transform -scale-x-100 opacity-80" 
            muted 
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Schematic Overlay - Visual Feedback of Detection */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            
            {/* Animated Ring */}
            <div className={`
              absolute w-24 h-24 rounded-full border-2 
              ${isAnalyzing ? 'border-dashed animate-spin-slow border-yellow-400/30' : 'scale-110 border-cyan-400/30 opacity-0'}
              transition-all duration-500
            `}></div>

            {/* Gesture Icon Overlay */}
            <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full border border-white/10 animate-fade-in-up">
              {getIconForGesture(lastGesture)}
            </div>
            
          </div>

          {/* Status Text Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-center">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
               {lastGesture.replace('_', ' ')}
            </span>
          </div>

        </div>

        {/* Floating Label */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-[10px] text-gray-400 px-2 py-0.5 rounded border border-gray-700">
          GEMINI VISION
        </div>
      </div>

    </div>
  );
};