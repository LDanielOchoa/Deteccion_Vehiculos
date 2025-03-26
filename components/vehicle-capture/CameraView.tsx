import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  RefreshCw, 
  AlertCircle, 
  ZoomIn, 
  ZoomOut, 
  Expand, 
  Smartphone,
  Camera,
  X 
} from "lucide-react";
import { SIDES, SIDE_ICONS } from "@/constants/vehicle-capture";
import type { Orientation } from "@/types/vehicle-capture";

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isLoading: boolean;
  cameraError: string | null;
  showPreview: boolean;
  showGuides: boolean;
  vehicleDetected: boolean;
  zoomLevel: number;
  orientation: Orientation;
  showZoomControls: boolean;
  onRetryCamera: () => void;
  onToggleGuides: () => void;
  onToggleFullscreen: () => void;
  onToggleZoomControls: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (value: number[]) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onScreenTap: () => void;
  currentSide: number;
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  canvasRef,
  isLoading,
  cameraError,
  showPreview,
  showGuides,
  vehicleDetected,
  zoomLevel,
  orientation,
  showZoomControls,
  onRetryCamera,
  onToggleGuides,
  onToggleFullscreen,
  onToggleZoomControls,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onScreenTap,
  currentSide,
}) => {
  const [showHint, setShowHint] = useState(true);

  // Hide hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-xl border border-green-800/20"
      onClick={onScreenTap}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label="Vista de cámara"
    >
      {/* Video container with zoom handling */}
      <div className="relative w-full h-full">
        <motion.div
          animate={{ 
            scale: zoomLevel,
            transition: { type: "spring", stiffness: 300, damping: 30 }
          }}
          className="w-full h-full"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ 
              willChange: 'transform',
              transformOrigin: 'center'
            }}
            aria-label="Transmisión de cámara en vivo"
          />
        </motion.div>

        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          aria-hidden="true"
        />

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900/95 to-emerald-900/95 backdrop-blur-sm z-20"
            >
              <div className="flex flex-col items-center">
                <RefreshCw className="w-12 h-12 text-green-400 animate-spin mb-4" />
                <p className="text-green-200 text-sm font-medium">Iniciando cámara...</p>
                <div className="mt-4 w-48 h-1.5 bg-green-800/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                    animate={{
                      x: ['-100%', '100%']
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: 'linear'
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera error state */}
        <AnimatePresence>
          {cameraError && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900/95 to-red-800/95 backdrop-blur-sm z-20"
            >
              <div className="flex flex-col items-center text-center p-6">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <p className="text-white text-lg font-medium mb-2">Error de cámara</p>
                <p className="text-red-200 text-sm mb-6 max-w-xs">{cameraError}</p>
                <Button 
                  onClick={onRetryCamera} 
                  className="bg-white text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Reintentar conexión de cámara"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera guides */}
        {showGuides && !isLoading && !showPreview && !cameraError && (
          <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute inset-[15%] border-2 ${
                vehicleDetected ? 'border-green-400/30' : 'border-red-400/30'
              } rounded-lg transition-colors duration-300`}
            />
            {['tl', 'tr', 'bl', 'br'].map((corner) => (
              <motion.div
                key={corner}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`absolute ${corner === 'tl' ? 'top-[15%] left-[15%]' : 
                  corner === 'tr' ? 'top-[15%] right-[15%]' : 
                  corner === 'bl' ? 'bottom-[15%] left-[15%]' : 
                  'bottom-[15%] right-[15%]'} w-6 h-6 border-2 ${
                  vehicleDetected ? 'border-green-400/50' : 'border-red-400/50'
                } ${corner === 'tl' ? 'rounded-tl-lg border-t border-l' : 
                  corner === 'tr' ? 'rounded-tr-lg border-t border-r' : 
                  corner === 'bl' ? 'rounded-bl-lg border-b border-l' : 
                  'rounded-br-lg border-b border-r'}`}
              />
            ))}
          </div>
        )}

        {/* Side indicator */}
        {!isLoading && !showPreview && !cameraError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {SIDE_ICONS[SIDES[currentSide] as keyof typeof SIDE_ICONS]}
                  </span>
                </div>
                <span className="text-white text-sm font-medium">{SIDES[currentSide]}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Orientation indicator */}
        {!isLoading && !showPreview && !cameraError && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-4 right-4 z-10"
          >
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: orientation === "landscape" ? 90 : 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <Smartphone className="w-4 h-4 text-white" />
                </motion.div>
                <span className="text-white text-xs font-medium">
                  {orientation === "landscape" ? "Horizontal" : "Vertical"}
                </span>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};