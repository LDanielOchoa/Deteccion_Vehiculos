"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Camera, Smartphone, Truck, CheckCircle } from "lucide-react"

interface TutorialProps {
  tutorialStep: number
  onNext: () => void
}

export const Tutorial: React.FC<TutorialProps> = ({ tutorialStep, onNext }) => {
  const tutorialContent = [
    {
      title: "Bienvenido a la captura de fotos",
      description: "Aprenderás a capturar fotos de alta calidad de tu vehículo desde diferentes ángulos.",
      icon: <Camera className="h-10 w-10 text-emerald-600" />,
    },
    {
      title: "Orientación correcta",
      description:
        "Gira tu dispositivo según se indique para cada lado del vehículo. Algunos lados requieren orientación horizontal.",
      icon: <Smartphone className="h-10 w-10 text-emerald-600" />,
    },
    {
      title: "Detección automática",
      description:
        "La aplicación detectará automáticamente el vehículo. Asegúrate de que esté completamente visible en el encuadre.",
      icon: <Truck className="h-10 w-10 text-emerald-600" />,
    },
    {
      title: "¡Listo para comenzar!",
      description: "Toca la pantalla para capturar la foto cuando el vehículo esté correctamente encuadrado.",
      icon: <CheckCircle className="h-10 w-10 text-emerald-600" />,
    },
  ]

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
            {tutorialContent[tutorialStep].icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{tutorialContent[tutorialStep].title}</h3>
          <p className="text-gray-600">{tutorialContent[tutorialStep].description}</p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            {tutorialContent.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${index === tutorialStep ? "bg-emerald-500" : "bg-gray-300"}`}
              />
            ))}
          </div>

          <Button
            onClick={onNext}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
          >
            {tutorialStep < 3 ? "Siguiente" : "Comenzar"}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

