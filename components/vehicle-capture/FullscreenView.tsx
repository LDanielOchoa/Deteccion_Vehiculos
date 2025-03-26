import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  RefreshCw, 
  AlertCircle, 
  Camera, 
  ZoomIn, 
  ZoomOut, 
  Minimize, 
  X, 
  Maximize, 
  CheckCircle 
} from "lucide-react";
import { SIDES, SIDE_ICONS } from "@/constants/vehicle-capture";

interface FullscreenViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isLoading: boolean;
  cameraError: string | null;
  showPreview: boolean;
  showGuides: boolean;
  vehicleDetected: boolean;
  zoomLevel: number;
  onRetryCamera: () => void;
  onToggleGuides: () => void;
  onToggleFullscreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (value: number[]) => void;
  onTakePhoto: () => void;
  currentSide: number;
}

export const FullscreenView: React.FC<FullscreenViewProps> = ({
  videoRef,
  canvasRef,
  isLoading,
  cameraError,
  showPreview,
  showGuides,
  vehicleDetected,
  zoomLevel,
  onRetryCamera,
  onToggleGuides,
  onToggleFullscreen,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onTakePhoto,
  currentSide,
}) => {
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Handle double tap to zoom
  const handleDoubleTap = (e: React.TouchEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      if (zoomLevel > 1) {
        onZoomChange([1]); // Reset zoom
      } else {
        onZoomChange([1.8]); // Zoom to 1.8x
      }
      e.preventDefault();
    }
    setLastTapTime(currentTime);
  };

  // Auto-hide zoom controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showZoomControls) {
      timeout = setTimeout(() => {
        setShowZoomControls(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [showZoomControls]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Video container with zoom handling */}
        <div 
          className="relative w-full h-full"
          onTouchStart={handleDoubleTap}
          onClick={() => setShowZoomControls(true)}
        >
          {/* Video with zoom transform */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
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
                className="w-full h-full object-contain"
                style={{ 
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center',
                  willChange: 'transform'
                }}
              />
            </motion.div>
          </div>

          {/* Canvas overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />

          {/* Loading state */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/90 z-20"
              >
                <div className="flex flex-col items-center">
                  <RefreshCw className="w-12 h-12 text-green-400 animate-spin mb-4" />
                  <p className="text-green-200 text-sm font-medium">Iniciando cámara...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera error state */}
          <AnimatePresence>
            {cameraError && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 flex items-center justify-center bg-black/90 z-20"
              >
                <div className="flex flex-col items-center text-center p-6">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                  <p className="text-white text-lg font-medium mb-2">Error de cámara</p>
                  <p className="text-red-200 text-sm mb-6 max-w-xs">{cameraError}</p>
                  <Button onClick={onRetryCamera} variant="secondary">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera guides */}
          {showGuides && !isLoading && !showPreview && !cameraError && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute inset-[15%] border-2 ${
                  vehicleDetected ? 'border-green-400/30' : 'border-red-400/30'
                } rounded-lg transition-colors duration-300`}
              />
              {/* Guide corners */}
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

          {/* Zoom controls */}
          <AnimatePresence>
            {showZoomControls && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30"
              >
                <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onZoomOut}
                    disabled={zoomLevel <= 1}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </Button>

                  <Slider
                    value={[zoomLevel]}
                    min={1}
                    max={2.6}
                    step={0.1}
                    onValueChange={onZoomChange}
                    className="w-40 sm:w-48"
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onZoomIn}
                    disabled={zoomLevel >= 2.6}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Capture button */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <Button
                onClick={onTakePhoto}
                className={`rounded-full w-16 h-16 ${
                  vehicleDetected 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                } text-white shadow-lg`}
                disabled={!vehicleDetected}
              >
                <Camera className="h-7 w-7" />
              </Button>
            </motion.div>

            {vehicleDetected && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-green-400"
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [1, 0.5, 1] 
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 2 
                }}
              />
            )}
          </motion.div>

          {/* Controls header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleFullscreen}
              className="bg-black/50 hover:bg-black/70 text-white"
            >
              <Minimize className="w-4 h-4 mr-2" />
              Salir
            </Button>

            <div className="flex gap-2">
              {SIDES.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSide
                      ? 'bg-green-500 scale-125'
                      : index < currentSide
                      ? 'bg-green-500/70'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleGuides}
              className="bg-black/50 hover:bg-black/70 text-white"
            >
              {showGuides ? <X className="w-4 h-4 mr-2" /> : <Maximize className="w-4 h-4 mr-2" />}
              Guías
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};