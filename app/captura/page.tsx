"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Camera,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  RotateCw,
  Maximize,
  AlertCircle,
  Truck,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import * as cocossd from "@tensorflow-models/coco-ssd"
import "@tensorflow/tfjs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const SIDES = ["Frontal", "Lateral Izquierdo", "Trasero", "Lateral Derecho"]

const SIDE_ICONS = {
  Frontal: "↑",
  "Lateral Izquierdo": "←",
  Trasero: "↓",
  "Lateral Derecho": "→",
}

const SIDE_COLORS: Record<string, string> = {
  Frontal: "from-green-400 to-emerald-500",
  "Lateral Izquierdo": "from-emerald-400 to-green-500",
  Trasero: "from-teal-400 to-emerald-500",
  "Lateral Derecho": "from-green-400 to-teal-500",
}

interface PhotoSession {
  id: string
  date: string
  vehicleNumber: string
  photos: {
    side: string
    dataUrl: string
    timestamp: string
  }[]
}

export default function Captura() {
  const router = useRouter()
  const [currentSide, setCurrentSide] = useState(0)
  const [photos, setPhotos] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  const [sessionId, setSessionId] = useState("")
  const [model, setModel] = useState<cocossd.ObjectDetection | null>(null)
  const [vehicleDetected, setVehicleDetected] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const detectionRef = useRef<number | null>(null)
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [showVehicleForm, setShowVehicleForm] = useState(true)
  const [vehicleNumberError, setVehicleNumberError] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)

    // Add animation classes after component mounts
    setTimeout(() => {
      const animElements = document.querySelectorAll(".anim-item")
      animElements.forEach((el, index) => {
        setTimeout(
          () => {
            el.classList.add("anim-visible")
          },
          100 + index * 150,
        )
      })
    }, 100)

    // Generate a unique session ID
    const newSessionId = `session_${Date.now()}`
    setSessionId(newSessionId)

    // Don't load model or start camera until vehicle number is entered
    if (!showVehicleForm) {
      loadModelAndStartCamera()
    }

    return () => {
      stopCamera()
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current)
      }
    }
  }, [showVehicleForm])

  const loadModelAndStartCamera = async () => {
    // Load COCO-SSD model
    try {
      setIsModelLoading(true)
      const loadedModel = await cocossd.load()
      setModel(loadedModel)
      setIsModelLoading(false)
      toast.success("Detector de buses activado", {
        description: "Optimizado para buses de Medellín (Runners, Agrale, NPR)",
      })
    } catch (error) {
      console.error("Error loading detection model:", error)
      toast.error("Error al cargar el detector de vehículos", {
        description: "La detección automática no estará disponible",
      })
      setIsModelLoading(false)
    }

    startCamera()
  }

  const startCamera = async () => {
    try {
      setIsLoading(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      setStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false)
          // Start detection once video is loaded
          startVehicleDetection()
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      toast.error("Error al acceder a la cámara", {
        description: "Verifica los permisos de la cámara en tu navegador",
      })
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const startVehicleDetection = () => {
    if (!model || !videoRef.current) return

    const detectVehicle = async () => {
      if (!model || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return
      }

      try {
        // Run detection
        const predictions = await model.detect(videoRef.current)

        // Log all detections for debugging
        if (predictions.length > 0) {
          console.log("Detections:", predictions)
        }

        // Prioritize bus detection with lower threshold
        // Bus types in Medellin: Runners, Agrale, NPR are all classified as "bus" in COCO-SSD
        const busDetection = predictions.find((p) => p.class === "bus" && p.score > 0.4)

        // If bus is detected, use it
        if (busDetection) {
          setVehicleDetected(true)

          // Draw detection results if canvas is available
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d")
            if (ctx) {
              // Clear canvas
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

              // Draw bounding box with thicker line for buses
              ctx.strokeStyle = "#10b981" // emerald-500
              ctx.lineWidth = 4
              ctx.strokeRect(busDetection.bbox[0], busDetection.bbox[1], busDetection.bbox[2], busDetection.bbox[3])

              // Draw label with bus highlight
              ctx.fillStyle = "#10b981" // emerald-500
              ctx.font = "bold 18px Arial"
              ctx.fillText(
                `BUS ${Math.round(busDetection.score * 100)}%`,
                busDetection.bbox[0],
                busDetection.bbox[1] > 20 ? busDetection.bbox[1] - 5 : busDetection.bbox[1] + 20,
              )
            }
          }
        } else {
          // If no bus, check for other vehicles with higher threshold
          const vehicleClasses = ["car", "truck", "bus"]
          const vehiclePrediction = predictions.find((p) => vehicleClasses.includes(p.class) && p.score > 0.5)

          setVehicleDetected(!!vehiclePrediction)

          // Draw detection results if canvas is available
          if (canvasRef.current && vehiclePrediction) {
            const ctx = canvasRef.current.getContext("2d")
            if (ctx) {
              // Clear canvas
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

              // Draw bounding box
              ctx.strokeStyle = "#10b981" // emerald-500
              ctx.lineWidth = 3
              ctx.strokeRect(
                vehiclePrediction.bbox[0],
                vehiclePrediction.bbox[1],
                vehiclePrediction.bbox[2],
                vehiclePrediction.bbox[3],
              )

              // Draw label
              ctx.fillStyle = "#10b981" // emerald-500
              ctx.font = "16px Arial"
              ctx.fillText(
                `${vehiclePrediction.class} ${Math.round(vehiclePrediction.score * 100)}%`,
                vehiclePrediction.bbox[0],
                vehiclePrediction.bbox[1] > 20 ? vehiclePrediction.bbox[1] - 5 : vehiclePrediction.bbox[1] + 20,
              )
            }
          } else if (canvasRef.current) {
            // Clear canvas if no vehicle detected
            const ctx = canvasRef.current.getContext("2d")
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            }
          }
        }
      } catch (error) {
        console.error("Detection error:", error)
      }

      // Continue detection loop
      detectionRef.current = requestAnimationFrame(detectVehicle)
    }

    detectVehicle()
  }

  const savePhotoToLocalStorage = (photoDataUrl: string) => {
    try {
      // Get existing sessions from localStorage
      const existingSessions = localStorage.getItem("photoSessions")
      const sessions: PhotoSession[] = existingSessions ? JSON.parse(existingSessions) : []

      // Find current session or create new one
      let currentSession = sessions.find((s) => s.id === sessionId)

      if (!currentSession) {
        currentSession = {
          id: sessionId,
          date: new Date().toISOString().split("T")[0],
          vehicleNumber: vehicleNumber, // Save vehicle number with the session
          photos: [],
        }
        sessions.push(currentSession)
      }

      // Add new photo to session
      currentSession.photos.push({
        side: SIDES[currentSide],
        dataUrl: photoDataUrl,
        timestamp: new Date().toISOString(),
      })

      // Save back to localStorage
      localStorage.setItem("photoSessions", JSON.stringify(sessions))

      return true
    } catch (error) {
      console.error("Error saving to localStorage:", error)
      toast.error("Error al guardar la foto")
      return false
    }
  }

  const takePhoto = () => {
    if (!vehicleDetected) {
      toast.error("No se detecta ningún bus", {
        description: "Asegúrate de que el bus (Runner, Agrale o NPR) esté en el encuadre",
        icon: <AlertCircle className="text-red-500" />,
      })
      return
    }

    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Draw the video frame
        ctx.drawImage(videoRef.current, 0, 0)

        // Get photo data URL
        const photo = canvas.toDataURL("image/jpeg", 0.8)

        // Save to state and localStorage
        setPhotos([...photos, photo])
        savePhotoToLocalStorage(photo)

        // Show preview
        setShowPreview(true)

        // Success toast
        toast.success(`¡Foto ${SIDES[currentSide]} del bus capturada!`, {
          icon: <CheckCircle className="text-green-500" />,
        })

        // Move to next side or finish
        setTimeout(() => {
          setShowPreview(false)
          if (currentSide < SIDES.length - 1) {
            setCurrentSide(currentSide + 1)
          } else {
            stopCamera()
            toast.success("¡Todas las fotos del bus capturadas!", {
              description: "Redirigiendo a la revisión...",
            })
            setTimeout(() => {
              router.push("/revision")
            }, 1000)
          }
        }, 1500)
      }
    }
  }

  const retakePhoto = () => {
    if (currentSide > 0) {
      setCurrentSide(currentSide - 1)
      // Remove the last photo from state
      setPhotos(photos.slice(0, -1))

      // Also remove from localStorage
      try {
        const existingSessions = localStorage.getItem("photoSessions")
        if (existingSessions) {
          const sessions: PhotoSession[] = JSON.parse(existingSessions)
          const currentSession = sessions.find((s) => s.id === sessionId)
          if (currentSession && currentSession.photos.length > 0) {
            currentSession.photos.pop()
            localStorage.setItem("photoSessions", JSON.stringify(sessions))
          }
        }
      } catch (error) {
        console.error("Error removing photo from localStorage:", error)
      }
    }
  }

  const handleVehicleNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!vehicleNumber.trim()) {
      setVehicleNumberError("El número del vehículo es obligatorio")
      return
    }

    // Clear any previous errors
    setVehicleNumberError("")

    // Hide form and start camera
    setShowVehicleForm(false)
    toast.success(`Vehículo #${vehicleNumber} registrado`, {
      description: "Iniciando cámara para captura de fotos",
    })
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-green-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full w-10 h-10 hover:bg-green-100/80 hover:text-green-700 transition-all duration-300 focus:ring-2 focus:ring-green-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              {!showVehicleForm && (
                <>
                  {SIDES.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentSide
                          ? "bg-green-600 scale-125"
                          : index < currentSide
                            ? "bg-green-600 opacity-70"
                            : "bg-gray-300"
                      }`}
                    />
                  ))}
                </>
              )}
            </div>
            {!showVehicleForm && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGuides(!showGuides)}
                className="rounded-full w-10 h-10 hover:bg-green-100/80 hover:text-green-700 transition-all duration-300 focus:ring-2 focus:ring-green-200"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 pb-6 space-y-6">
        {showVehicleForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto anim-item anim-slide-up"
          >

            <Card className="border-green-100 shadow-lg overflow-hidden anim-item anim-slide-up">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <div className="bg-gradient-to-r from-green-100 to-emerald-200 w-8 h-8 rounded-full flex items-center justify-center">
                    <Truck className="h-4 w-4 text-green-700" />
                  </div>
                  <span>Registro de Vehículo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleVehicleNumberSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">
                        Número del Vehículo
                      </Label>
                      <Input
                        id="vehicleNumber"
                        placeholder="Ingrese el número del vehículo"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        className={`border ${vehicleNumberError ? "border-red-300" : "border-green-200"} focus:border-green-400 rounded-lg`}
                      />
                      {vehicleNumberError && <p className="text-sm text-red-500">{vehicleNumberError}</p>}
                    </div>
                    <p className="text-sm text-gray-500">
                      Este número se guardará junto con las fotos para identificar el vehículo en el historial.
                    </p>
                  </div>
                  <div className="mt-6">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Continuar con la captura
                        <ChevronRight className="ml-1 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
                    </Button>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="bg-green-50 border-t border-green-100 text-xs text-gray-500 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <p>Buses compatibles: Runners, Agrale, NPR del sistema alimentador oriental 6 de Medellín</p>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div
              key={currentSide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2 anim-item anim-slide-up"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 rounded-full text-sm font-medium shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span>Vehículo #{vehicleNumber}</span>
                  </div>
                </div>
              </div>
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${SIDE_COLORS[SIDES[currentSide] as keyof typeof SIDE_COLORS]} mb-3 shadow-md transform transition-transform duration-300 hover:scale-105 hover:rotate-3`}
              >
                <span className="text-2xl text-white font-bold">{SIDE_ICONS[SIDES[currentSide]]}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Lado {SIDES[currentSide]}</h1>
              <p className="text-gray-600 max-w-md mx-auto">Posiciona la cámara correctamente antes de tomar la foto</p>
            </motion.div>

            <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-xl border border-green-800/20 anim-item anim-slide-up">
              {/* Loading state */}
              {(isLoading || isModelLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900 to-emerald-900 z-20">
                  <div className="flex flex-col items-center">
                    <RefreshCw className="w-12 h-12 text-green-400 animate-spin mb-4" />
                    <p className="text-green-200 text-sm font-medium">
                      {isLoading ? "Iniciando cámara..." : "Cargando detector de vehículos..."}
                    </p>
                    <div className="mt-4 w-48 h-1.5 bg-green-800/50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse-slow rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Video feed */}
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

              {/* Detection canvas overlay */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                width={videoRef.current?.videoWidth || 1280}
                height={videoRef.current?.videoHeight || 720}
              />

              {/* Vehicle detection status indicator */}
              {!isLoading && !isModelLoading && !showPreview && (
                <div
                  className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full z-10 transition-all duration-300 ${
                    vehicleDetected
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                      : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${vehicleDetected ? "bg-white animate-pulse" : "bg-white"}`}
                  ></div>
                  <span className="text-xs font-medium">
                    {vehicleDetected ? "Vehículo detectado" : "No se detecta vehículo"}
                  </span>
                </div>
              )}

              {/* Add a bus detection indicator to the UI */}
              {!isLoading && !isModelLoading && !showPreview && vehicleDetected && (
                <div className="absolute bottom-4 left-4 z-10 bg-gradient-to-r from-green-600/90 to-emerald-700/90 text-white px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Vehículo #{vehicleNumber}</span>
                  </div>
                  <div className="text-xs mt-1 text-green-100">Runners, Agrale, NPR</div>
                </div>
              )}

              {/* Camera guides */}
              {showGuides && !isLoading && !showPreview && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {/* Center frame */}
                  <div
                    className={`absolute inset-[10%] border-2 ${
                      vehicleDetected ? "border-green-400/60" : "border-red-400/60"
                    } rounded-lg transition-colors duration-300`}
                  ></div>

                  {/* Corner guides */}
                  <div
                    className={`absolute top-[10%] left-[10%] w-8 h-8 border-t-2 border-l-2 ${
                      vehicleDetected ? "border-green-400" : "border-red-400"
                    } rounded-tl-lg transition-colors duration-300`}
                  ></div>
                  <div
                    className={`absolute top-[10%] right-[10%] w-8 h-8 border-t-2 border-r-2 ${
                      vehicleDetected ? "border-green-400" : "border-red-400"
                    } rounded-tr-lg transition-colors duration-300`}
                  ></div>
                  <div
                    className={`absolute bottom-[10%] left-[10%] w-8 h-8 border-b-2 border-l-2 ${
                      vehicleDetected ? "border-green-400" : "border-red-400"
                    } rounded-bl-lg transition-colors duration-300`}
                  ></div>
                  <div
                    className={`absolute bottom-[10%] right-[10%] w-8 h-8 border-b-2 border-r-2 ${
                      vehicleDetected ? "border-green-400" : "border-red-400"
                    } rounded-br-lg transition-colors duration-300`}
                  ></div>

                  {/* Center crosshair */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div
                      className={`w-12 h-12 border-2 ${
                        vehicleDetected ? "border-green-400/60" : "border-red-400/60"
                      } rounded-full flex items-center justify-center transition-colors duration-300`}
                    >
                      <div
                        className={`w-2 h-2 ${
                          vehicleDetected ? "bg-green-400" : "bg-red-400"
                        } rounded-full transition-colors duration-300`}
                      ></div>
                    </div>
                  </div>

                  {/* Side indicator */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-xs font-medium">{SIDES[currentSide]}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo preview */}
              <AnimatePresence>
                {showPreview && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-br from-green-900/90 to-emerald-900/90 backdrop-blur-sm flex items-center justify-center z-20"
                  >
                    <div className="text-white flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-xl font-medium">¡Foto capturada!</p>
                      <p className="text-sm text-green-200 mt-1">Preparando siguiente ángulo...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-6 anim-item anim-slide-up">
              {/* Camera controls */}
              <div className="flex justify-center items-center gap-4">
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="rounded-full w-12 h-12 p-0 border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-300 shadow-sm"
                  disabled={currentSide === 0 || isLoading || showPreview || isModelLoading}
                >
                  <RotateCw className="h-5 w-5 text-green-700" />
                </Button>

                <Button
                  onClick={takePhoto}
                  className={`bg-gradient-to-r ${
                    vehicleDetected
                      ? "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  } text-white rounded-full w-20 h-20 p-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 relative overflow-hidden group`}
                  disabled={isLoading || showPreview || isModelLoading}
                >
                  <span className="relative z-10">
                    <Camera className="h-8 w-8" />
                  </span>
                  <span
                    className={`absolute inset-0 bg-gradient-to-r ${
                      vehicleDetected ? "from-green-600 to-emerald-700" : "from-red-600 to-red-700"
                    } opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0`}
                  ></span>
                </Button>

                <Button
                  onClick={() => setShowGuides(!showGuides)}
                  variant="outline"
                  className="rounded-full w-12 h-12 p-0 border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-300 shadow-sm"
                  disabled={isLoading || showPreview || isModelLoading}
                >
                  <Maximize className="h-5 w-5 text-green-700" />
                </Button>
              </div>

              {/* Vehicle detection message */}
              {!vehicleDetected && !isLoading && !isModelLoading && !showPreview && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-xs mx-auto shadow-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      No se detecta ningún bus en el encuadre. Asegúrate de que el bus (Runner, Agrale o NPR) esté
                      visible para poder tomar la foto.
                    </p>
                  </div>
                </div>
              )}

              {/* Progress indicator */}
              <div className="flex justify-center items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm max-w-xs mx-auto border border-green-100">
                {SIDES.map((side, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center transition-all duration-300 ${
                      index === currentSide ? "scale-110" : "opacity-70"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index < currentSide
                          ? "bg-green-100 text-green-600"
                          : index === currentSide
                            ? `bg-gradient-to-br ${SIDE_COLORS[side as keyof typeof SIDE_COLORS]} text-white`
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {index < currentSide ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-bold">{SIDE_ICONS[side]}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 ${index === currentSide ? "font-medium text-gray-900" : "text-gray-500"}`}
                    >
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

