"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, CheckCircle, Smartphone } from "lucide-react"
import { SIDES, SIDE_ICONS, SIDE_COLORS, LANDSCAPE_SIDES } from "@/constants/vehicle-capture"

interface SideChangeAnimationProps {
  currentSide: number
}

export const SideChangeAnimation: React.FC<SideChangeAnimationProps> = ({ currentSide }) => {
  const [animationPhase, setAnimationPhase] = useState<"flash" | "preview" | "transition" | "next">("flash")
  const nextSide = Math.min(SIDES.length - 1, currentSide + 1)

  // Colores para el lado actual y siguiente
  const currentSideColor = SIDE_COLORS[SIDES[currentSide] as keyof typeof SIDE_COLORS]
  const nextSideColor = SIDE_COLORS[SIDES[nextSide] as keyof typeof SIDE_COLORS]

  // Determinar la orientación requerida para el siguiente lado
  const nextSideRequiresLandscape = LANDSCAPE_SIDES.includes(SIDES[nextSide])

  // Controlar las fases de la animación
  useEffect(() => {
    // Fase 1: Flash inicial (simulando el disparo de la cámara)
    const flashTimer = setTimeout(() => {
      setAnimationPhase("preview")
    }, 300)

    // Fase 2: Mostrar vista previa brevemente
    const previewTimer = setTimeout(() => {
      setAnimationPhase("transition")
    }, 1200)

    // Fase 3: Transición al siguiente lado
    const transitionTimer = setTimeout(() => {
      setAnimationPhase("next")
    }, 2200)

    return () => {
      clearTimeout(flashTimer)
      clearTimeout(previewTimer)
      clearTimeout(transitionTimer)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Flash de cámara */}
      <AnimatePresence>
        {animationPhase === "flash" && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white z-50"
          />
        )}
      </AnimatePresence>

      {/* Fondo principal */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Vista previa de la foto */}
      <AnimatePresence>
        {animationPhase === "preview" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            {/* Simulación de la foto capturada */}
            <div className="relative w-full max-w-md aspect-[3/4] mx-4 overflow-hidden rounded-2xl shadow-2xl">
              {/* Fondo simulado de la foto */}
              <div className={`absolute inset-0 bg-gradient-to-br ${currentSideColor} opacity-20`} />

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">¡Foto capturada!</h3>
                  <p className="text-green-200 text-sm">Lado {SIDES[currentSide]}</p>
                </motion.div>
              </div>

              {/* Elementos de interfaz de cámara */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Capturado</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animación de transición */}
      <AnimatePresence>
        {animationPhase === "transition" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full max-w-md mx-4">
              {/* Línea de progreso */}
              <div className="mb-8 px-4">
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-gray-400 text-xs">
                  <span>Lado {SIDES[currentSide]}</span>
                  <span>Lado {SIDES[nextSide]}</span>
                </div>
              </div>

              {/* Animación de rotación de cámara */}
              <motion.div
                className="flex justify-center mb-8"
                animate={{
                  rotateY: [0, 180],
                  z: [0, 50, 0],
                }}
                transition={{
                  duration: 1.2,
                  times: [0, 0.5, 1],
                  ease: "easeInOut",
                }}
                style={{ perspective: "1000px" }}
              >
                <div className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800">
                  <Camera className="w-16 h-16 text-gray-300" />
                </div>
              </motion.div>

              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <h3 className="text-xl font-medium text-white mb-2">Preparando siguiente ángulo</h3>
                  <p className="text-gray-400 text-sm mb-4">Cambiando posición de la cámara</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Información del siguiente lado */}
      <AnimatePresence>
        {animationPhase === "next" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full max-w-md mx-4 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${nextSideColor} mb-6 shadow-lg`}
              >
                <span className="text-4xl text-white font-bold">
                  {SIDE_ICONS[SIDES[nextSide] as keyof typeof SIDE_ICONS]}
                </span>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold text-white mb-2">Lado {SIDES[nextSide]}</h2>
                <p className="text-gray-300 mb-8">Posiciona la cámara para capturar este ángulo</p>

                {/* Indicador de orientación */}
                {nextSideRequiresLandscape && (
                  <div className="inline-flex items-center gap-3 px-4 py-3 bg-gray-800/80 rounded-full text-white">
                    <motion.div animate={{ rotate: 90 }} transition={{ duration: 0.5 }}>
                      <Smartphone className="w-5 h-5" />
                    </motion.div>
                    <span className="text-sm font-medium">Gira tu dispositivo horizontalmente</span>
                  </div>
                )}
              </motion.div>

              {/* Indicador de progreso */}
              <div className="mt-8 flex justify-center space-x-3">
                {SIDES.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full ${
                      index < currentSide
                        ? "bg-green-500"
                        : index === currentSide
                          ? "bg-white"
                          : index === nextSide
                            ? "bg-green-400"
                            : "bg-gray-700"
                    }`}
                    animate={
                      index === nextSide
                        ? {
                            scale: [1, 1.3, 1],
                            opacity: [0.7, 1, 0.7],
                          }
                        : {}
                    }
                    transition={
                      index === nextSide
                        ? {
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }
                        : {}
                    }
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

