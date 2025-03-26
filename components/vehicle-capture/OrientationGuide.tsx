"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Smartphone } from "lucide-react"
import { SIDES } from "@/constants/vehicle-capture"
import type { Orientation } from "@/types/vehicle-capture"

interface OrientationGuideProps {
  currentSide: number
  requiredOrientation: Orientation
  onClose: () => void
}

export const OrientationGuide: React.FC<OrientationGuideProps> = ({ currentSide, requiredOrientation, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center"
    >
      <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="h-10 w-10 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Gira tu dispositivo</h3>
          <p className="text-gray-600">
            Para capturar correctamente el lado {SIDES[currentSide]}, por favor gira tu dispositivo a modo{" "}
            {requiredOrientation === "landscape" ? "horizontal" : "vertical"}.
          </p>
        </div>

        <div className="relative w-32 h-32 mx-auto mb-6">
          <motion.div
            animate={{
              rotate: requiredOrientation === "landscape" ? 90 : 0,
              scale: [1, 1.05, 1],
            }}
            transition={{
              rotate: { duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
              scale: { duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
            }}
            className="w-full h-full bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center justify-center"
          >
            <Smartphone className="h-16 w-16 text-emerald-500" />
          </motion.div>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
        >
          Continuar de todos modos
        </Button>
      </div>
    </motion.div>
  )
}

