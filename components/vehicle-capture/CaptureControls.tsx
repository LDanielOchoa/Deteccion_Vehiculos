"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Camera, RotateCw, Maximize, AlertCircle } from "lucide-react"

interface CaptureControlsProps {
  vehicleDetected: boolean
  isLoading: boolean
  showPreview: boolean
  cameraError: string | null
  activeTab: string
  uploadedImage: string | null
  currentSide: number
  onTakePhoto: () => void
  onRetakePhoto: () => void
  onToggleGuides: () => void
}

export const CaptureControls: React.FC<CaptureControlsProps> = ({
  vehicleDetected,
  isLoading,
  showPreview,
  cameraError,
  activeTab,
  uploadedImage,
  currentSide,
  onTakePhoto,
  onRetakePhoto,
  onToggleGuides,
}) => {
  return (
    <div className="space-y-6 anim-item anim-slide-up">
      {/* Camera controls - Mejorados */}
      <div className="flex justify-center items-center gap-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onRetakePhoto}
            variant="outline"
            className="rounded-full w-12 h-12 p-0 border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-300 shadow-sm"
            disabled={currentSide === 0 || isLoading || showPreview}
          >
            <RotateCw className="h-5 w-5 text-green-700" />
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onTakePhoto}
            className={`bg-gradient-to-r ${
              vehicleDetected || (activeTab === "upload" && uploadedImage)
                ? "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                : "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            } text-white rounded-full w-20 h-20 p-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group`}
            disabled={
              isLoading ||
              showPreview ||
              (activeTab === "camera" && !vehicleDetected) ||
              (activeTab === "upload" && !uploadedImage) ||
              !!cameraError
            }
          >
            <span className="relative z-10">
              <Camera className="h-8 w-8" />
            </span>
            <span
              className={`absolute inset-0 bg-gradient-to-r ${
                vehicleDetected || (activeTab === "upload" && uploadedImage)
                  ? "from-green-600 to-emerald-700"
                  : "from-red-600 to-red-700"
              } opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0`}
            ></span>

            {/* Anillo pulsante cuando está listo */}
            {(vehicleDetected || (activeTab === "upload" && uploadedImage)) && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-green-400"
                animate={{ scale: [1, 1.15, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
              />
            )}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onToggleGuides}
            variant="outline"
            className="rounded-full w-12 h-12 p-0 border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-300 shadow-sm"
            disabled={isLoading || showPreview || activeTab === "upload" || !!cameraError}
          >
            <Maximize className="h-5 w-5 text-green-700" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

