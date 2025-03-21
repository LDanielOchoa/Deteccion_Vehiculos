"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  ArrowLeft,
  Camera,
  Smartphone,
  Info,
  Car,
  Sun,
  Shield,
} from "lucide-react"
import { MainNav } from "@/components/main-nav"
import { useToast } from "@/hooks/use-toast"
import PermissionRequest from "@/components/permission-request"

export default function Instructions() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPermissionRequest, setShowPermissionRequest] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    setIsMounted(true)

    // Animate steps sequentially
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < 3) return prev + 1
        clearInterval(timer)
        return prev
      })
    }, 400)

    return () => {
      setIsMounted(false)
      clearInterval(timer)
    }
  }, [])

  if (!isMounted) {
    return null
  }

  const handleContinue = () => {
    setShowPermissionRequest(true)
  }

  const handlePermissionGranted = () => {
    toast({
      title: "¡Listo para comenzar!",
      description: "Ahora puede capturar fotos de su vehículo",
    })
    setTimeout(() => {
      router.push("/captura")
    }, 500)
  }

  const handleBack = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-to-b from-green-100/40 to-emerald-200/30 blur-[80px] animate-float"></div>
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-t from-teal-100/30 to-blue-100/20 blur-[100px] animate-float-slow"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-[40%] left-[15%] w-[30%] h-[30%] rounded-full bg-gradient-to-r from-yellow-100/20 to-green-100/20 blur-[80px] animate-float-slow"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <MainNav />

      <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10 mt-14">
        {showPermissionRequest ? (
          <div className="animate-fadeIn">
            <PermissionRequest
              onPermissionGranted={handlePermissionGranted}
              onCancel={() => setShowPermissionRequest(false)}
            />
          </div>
        ) : (
          <>
            <div className="text-center mb-8 animate-slide-down">
              <div className="inline-block bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-sm mb-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                  Guía de Captura
                </h1>
              </div>
              <p className="text-gray-700 text-lg max-w-md mx-auto">
                Siga estas instrucciones para obtener los mejores resultados
              </p>
            </div>

            <div className="max-w-2xl mx-auto grid gap-6 md:grid-cols-2">
              {/* Capture angles card */}
              <div
                className={`bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-green-100/50 transform transition-all duration-500 ${activeStep >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
              >
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Car className="mr-3" size={20} />
                    Captura de 4 Ángulos
                  </h2>
                  <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">Paso 1</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        title: "Frontal",
                        icon: "↑",
                        desc: "Vista delantera completa",
                        color: "from-green-400 to-green-600",
                      },
                      {
                        title: "Lateral Izq.",
                        icon: "←",
                        desc: "Lado izquierdo completo",
                        color: "from-emerald-400 to-emerald-600",
                      },
                      {
                        title: "Trasera",
                        icon: "↓",
                        desc: "Vista trasera completa",
                        color: "from-teal-400 to-teal-600",
                      },
                      {
                        title: "Lateral Der.",
                        icon: "→",
                        desc: "Lado derecho completo",
                        color: "from-cyan-400 to-cyan-600",
                      },
                    ].map((angle, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
                      >
                        <div
                          className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${angle.color} flex items-center justify-center shadow-md transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12`}
                        >
                          <span className="text-white text-xl font-bold">{angle.icon}</span>
                        </div>
                        <h3 className="text-gray-800 font-semibold">{angle.title}</h3>
                        <p className="text-gray-500 text-sm mt-1">{angle.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Important tips card */}
              <div
                className={`bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-green-100/50 transform transition-all duration-500 ${activeStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
              >
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <AlertCircle className="mr-3" size={20} />
                    Consejos Importantes
                  </h2>
                  <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">Paso 2</span>
                </div>
                <div className="p-5">
                  <div className="grid gap-3">
                    {[
                      {
                        icon: <CheckCircle size={18} />,
                        text: "Capture todo el vehículo en el encuadre",
                        color: "text-green-600 bg-green-50",
                        borderColor: "border-green-200",
                      },
                      {
                        icon: <CheckCircle size={18} />,
                        text: "Mantenga una distancia de 2-3 metros",
                        color: "text-green-600 bg-green-50",
                        borderColor: "border-green-200",
                      },
                      {
                        icon: <Sun size={18} />,
                        text: "Busque buena iluminación, evite sombras fuertes",
                        color: "text-amber-600 bg-amber-50",
                        borderColor: "border-amber-200",
                      },
                      {
                        icon: <X size={18} />,
                        text: "No capture con obstáculos en el camino",
                        color: "text-red-500 bg-red-50",
                        borderColor: "border-red-200",
                      },
                    ].map((tip, index) => (
                      <div
                        key={index}
                        className={`flex items-center ${tip.color} p-3 rounded-xl text-sm border ${tip.borderColor} transform transition-all duration-300 hover:-translate-x-1 hover:shadow-sm`}
                      >
                        <span className="mr-3 p-1.5 bg-white rounded-full shadow-sm">{tip.icon}</span>
                        <span className="font-medium">{tip.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Example card */}
              <div
                className={`bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-green-100/50 transform transition-all duration-500 ${activeStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Info className="mr-3" size={20} />
                    Ejemplo de Captura
                  </h2>
                  <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">Paso 3</span>
                </div>
                <div className="p-5">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 relative">
                    <div className="aspect-video rounded-xl overflow-hidden relative bg-gradient-to-br from-gray-200 to-gray-300 shadow-inner border border-gray-300">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Car silhouette */}
                        <div className="w-2/3 h-1/2 bg-gray-400/30 rounded-lg relative">
                          <div className="absolute top-0 left-1/4 right-1/4 h-1/3 bg-gray-400/20 rounded-t-lg"></div>
                          <div className="absolute bottom-0 inset-x-0 h-1/4 bg-gray-400/40 rounded-b-lg"></div>
                          <div className="absolute inset-y-1/3 inset-x-1/6 bg-gray-400/10"></div>
                        </div>

                        {/* Frame guides */}
                        <div className="absolute inset-x-[15%] inset-y-[20%] border-2 border-dashed border-green-500/70 rounded-lg">
                          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-500"></div>
                          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-500"></div>
                          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-500"></div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-500"></div>
                        </div>

                        {/* Camera indicators */}
                        <div className="absolute top-[15%] left-[15%] w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse-slow">
                          <Camera size={16} className="text-green-600" />
                        </div>
                        <div
                          className="absolute top-[15%] right-[15%] w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse-slow"
                          style={{ animationDelay: "0.5s" }}
                        >
                          <Camera size={16} className="text-green-600" />
                        </div>
                        <div
                          className="absolute bottom-[15%] left-[15%] w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse-slow"
                          style={{ animationDelay: "1s" }}
                        >
                          <Camera size={16} className="text-green-600" />
                        </div>
                        <div
                          className="absolute bottom-[15%] right-[15%] w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse-slow"
                          style={{ animationDelay: "1.5s" }}
                        >
                          <Camera size={16} className="text-green-600" />
                        </div>
                      </div>
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-3 py-1 rounded-full shadow-sm">
                        Ejemplo
                      </div>
                    </div>
                    <p className="text-center text-gray-700 mt-4 text-sm font-medium">
                      Asegúrese de que el vehículo esté centrado y completamente visible
                    </p>
                  </div>
                </div>
              </div>

              {/* Device requirements card */}
              <div
                className={`bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-green-100/50 transform transition-all duration-500 ${activeStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
              >
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Shield className="mr-3" size={20} />
                    Requisitos del Dispositivo
                  </h2>
                  <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">Paso 4</span>
                </div>
                <div className="p-5">
                  <ul className="space-y-3">
                    {[
                      {
                        icon: <Camera size={18} />,
                        text: "Cámara trasera con resolución mínima de 2MP",
                        color: "bg-purple-50 border-purple-200",
                      },
                      {
                        icon: <Smartphone size={18} />,
                        text: "Navegador actualizado (Chrome, Safari, Firefox)",
                        color: "bg-blue-50 border-blue-200",
                      },
                      {
                        icon: <Shield size={18} />,
                        text: "Permisos de cámara habilitados en el navegador",
                        color: "bg-green-50 border-green-200",
                      },
                    ].map((req, index) => (
                      <li
                        key={index}
                        className={`flex items-start p-3 rounded-xl text-sm ${req.color} border transform transition-all duration-300 hover:translate-x-1 hover:shadow-sm`}
                      >
                        <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                          <span className="text-purple-600">{req.icon}</span>
                        </div>
                        <div className="flex-1 pt-1">
                          <span className="font-medium text-gray-800">{req.text}</span>
                        </div>
                        <CheckCircle size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-10 animate-fade-in" style={{ animationDelay: "1.2s" }}>
              <Button
                onClick={handleBack}
                variant="outline"
                className="px-5 py-6 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-300 hover:border-gray-400 group"
              >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                Volver
              </Button>
              <Button
                onClick={handleContinue}
                className="px-6 py-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 flex items-center group"
              >
                Comenzar
                <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

