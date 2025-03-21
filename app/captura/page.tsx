"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Upload,
  Image,
  X,
  ZoomIn,
  ZoomOut,
  Expand,
  Minimize,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

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

// Define which sides should be in landscape orientation
const LANDSCAPE_SIDES = ["Lateral Izquierdo", "Lateral Derecho"]

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
  const searchParams = useSearchParams()
  const retakeIndex = searchParams.get("retake")

  const [currentSide, setCurrentSide] = useState(0)
  const [photos, setPhotos] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  const [sessionId, setSessionId] = useState("")
  const [vehicleDetected, setVehicleDetected] = useState(false)
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [showVehicleForm, setShowVehicleForm] = useState(true)
  const [vehicleNumberError, setVehicleNumberError] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null)
  const [activeTab, setActiveTab] = useState<string>("camera")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showZoomControls, setShowZoomControls] = useState(false)
  const [initialTouchDistance, setInitialTouchDistance] = useState<number | null>(null)
  const [initialZoomLevel, setInitialZoomLevel] = useState<number>(1)
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

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

    // Check if we're retaking a photo
    if (retakeIndex) {
      const index = Number.parseInt(retakeIndex)
      if (!isNaN(index) && index >= 0 && index < SIDES.length) {
        setCurrentSide(index)

        // Load existing session from localStorage
        try {
          const existingSessions = localStorage.getItem("photoSessions")
          if (existingSessions) {
            const sessions: PhotoSession[] = JSON.parse(existingSessions)
            const lastSession = sessions[sessions.length - 1]
            if (lastSession) {
              setSessionId(lastSession.id)
              setVehicleNumber(lastSession.vehicleNumber || "")

              // Load existing photos
              const existingPhotos: string[] = []
              lastSession.photos.forEach((photo) => {
                const sideIndex = SIDES.indexOf(photo.side)
                if (sideIndex >= 0) {
                  existingPhotos[sideIndex] = photo.dataUrl
                }
              })
              setPhotos(existingPhotos)
              setShowVehicleForm(false)
            }
          }
        } catch (error) {
          console.error("Error loading session for retake:", error)
        }
      }
    } else {
      // Generate a unique session ID for new sessions
      const newSessionId = `session_${Date.now()}`
      setSessionId(newSessionId)
    }

    // Don't start camera until vehicle number is entered
    if (!showVehicleForm) {
      startCamera()
    }

    // Add fullscreen change event listener
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    // Add escape key listener to exit fullscreen
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      stopCamera()
      if (simulationInterval) {
        clearInterval(simulationInterval)
      }
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [showVehicleForm, retakeIndex])

  // Update orientation based on current side
  useEffect(() => {
    if (!showVehicleForm) {
      const newOrientation = LANDSCAPE_SIDES.includes(SIDES[currentSide]) ? "landscape" : "portrait"

      if (newOrientation !== orientation) {
        setIsTransitioning(true)
        setTimeout(() => {
          setOrientation(newOrientation)
          setTimeout(() => {
            setIsTransitioning(false)
          }, 300)
        }, 300)
      }
    }
  }, [currentSide, showVehicleForm, orientation])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isFullscreen) {
      exitFullscreen()
    }
  }

  const handleFullscreenChange = () => {
    const newIsFullscreen = !!document.fullscreenElement
    setIsFullscreen(newIsFullscreen)

    // No resetear el zoom al salir de pantalla completa
    // Esto mantiene la misma visualización
  }

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      // Guardar el nivel de zoom actual antes de entrar a pantalla completa
      const currentZoom = zoomLevel
      enterFullscreen()

      // Asegurar que el mismo nivel de zoom se mantiene en pantalla completa
      setTimeout(() => {
        setZoomLevel(currentZoom)
      }, 300)
    }
  }

  const enterFullscreen = () => {
    if (fullscreenContainerRef.current) {
      if (fullscreenContainerRef.current.requestFullscreen) {
        fullscreenContainerRef.current.requestFullscreen()
      }
    }
  }

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }

  const startCamera = async () => {
    if (activeTab !== "camera") return

    try {
      setIsLoading(true)
      setCameraError(null)

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      type MediaConstraints = {
        video: {
          facingMode?: string;
          width?: { ideal: number };
          height?: { ideal: number };
        };
      };

      const tryWithConstraints = async (constraints: MediaConstraints) => {
        try {
          console.log("Requesting camera access with constraints:", constraints)
          return await navigator.mediaDevices.getUserMedia(constraints)
        } catch (error) {
          console.warn("Failed with constraints:", constraints, error)
          throw error
        }
      };

      let newStream
      try {
        const highResConstraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        }
        newStream = await tryWithConstraints(highResConstraints)
      } catch (error) {
        // If high resolution fails, try with lower resolution
        const lowResConstraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }
        newStream = await tryWithConstraints(lowResConstraints)
      }

      console.log("Camera access granted:", newStream)
      setStream(newStream)

      if (videoRef.current) {
        console.log("Setting video source")
        videoRef.current.srcObject = newStream

        // Set a timeout to handle cases where metadata might not load
        const metadataTimeout = setTimeout(() => {
          if (isLoading) {
            console.warn("Video metadata loading timeout - forcing start")
            setIsLoading(false)
            startDetectionSimulation()
          }
        }, 5000)

        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded")
          clearTimeout(metadataTimeout)
          setIsLoading(false)
          // Start detection simulation once video is loaded
          startDetectionSimulation()
        }

        videoRef.current.onloadeddata = () => {
          console.log("Video data loaded")
        }

        videoRef.current.onerror = (e) => {
          console.error("Video element error:", e)
          clearTimeout(metadataTimeout)
          setCameraError("Error al cargar el video")
          setIsLoading(false)
        }
      } else {
        console.error("Video ref is null")
        setCameraError("Error: Elemento de video no disponible")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos.")
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

    if (simulationInterval) {
      clearInterval(simulationInterval)
      setSimulationInterval(null)
    }
  }

  const startDetectionSimulation = () => {
    // Simulate loading the detection model
    toast.success("Detector de buses activado", {
      description: "Simulación de detección iniciada",
    })

    // Draw initial detection box
    drawSimulatedDetection(true)
    setVehicleDetected(true)

    // Set up interval to simulate detection changes
    const interval = setInterval(() => {
      // Randomly toggle detection state with 80% chance of being detected
      const isDetected = Math.random() < 0.8
      setVehicleDetected(isDetected)
      drawSimulatedDetection(isDetected)
    }, 3000)

    setSimulationInterval(interval)
  }

  const drawSimulatedDetection = (isDetected: boolean) => {
    if (!canvasRef.current || !videoRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    if (isDetected) {
      // Get video dimensions
      const videoWidth = videoRef.current.videoWidth || 1280
      const videoHeight = videoRef.current.videoHeight || 720

      // Calculate a random position for the detection box
      // that stays within the center area of the video
      const centerX = videoWidth / 2
      const centerY = videoHeight / 2
      const boxWidth = videoWidth * 0.5 + (Math.random() * 0.2 - 0.1) * videoWidth
      const boxHeight = videoHeight * 0.6 + (Math.random() * 0.2 - 0.1) * videoHeight
      const x = centerX - boxWidth / 2 + (Math.random() * 0.2 - 0.1) * videoWidth
      const y = centerY - boxHeight / 2 + (Math.random() * 0.2 - 0.1) * videoHeight

      // Draw bounding box
      ctx.strokeStyle = "#10b981" // emerald-500
      ctx.lineWidth = 4
      ctx.strokeRect(x, y, boxWidth, boxHeight)

      // Draw label
      ctx.fillStyle = "#10b981" // emerald-500
      ctx.font = "bold 18px Arial"
      ctx.fillText(`BUS ${Math.round(70 + Math.random() * 25)}%`, x, y > 20 ? y - 5 : y + 20)
    }
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

      // If retaking a photo, remove the old one for this side
      const sideToSave = SIDES[currentSide]
      const existingPhotoIndex = currentSession.photos.findIndex((p) => p.side === sideToSave)
      if (existingPhotoIndex >= 0) {
        currentSession.photos.splice(existingPhotoIndex, 1)
      }

      // Add new photo to session
      currentSession.photos.push({
        side: sideToSave,
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
    if (activeTab === "camera") {
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
          // Aplicar el mismo nivel de zoom que se ve en la pantalla
          const sourceWidth = videoRef.current.videoWidth / zoomLevel
          const sourceHeight = videoRef.current.videoHeight / zoomLevel
          const sourceX = (videoRef.current.videoWidth - sourceWidth) / 2
          const sourceY = (videoRef.current.videoHeight - sourceHeight) / 2

          // Limpiar el canvas primero
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Dibujar el frame del video con zoom
          ctx.drawImage(
            videoRef.current,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height,
          )

          // Obtener la URL de datos de la foto con mayor calidad
          const photo = canvas.toDataURL("image/jpeg", 0.92)
          processPhoto(photo)
        }
      }
    } else if (activeTab === "upload" && uploadedImage) {
      processPhoto(uploadedImage)
    }
  }

  const processPhoto = (photoDataUrl: string) => {
    // Guardar en estado y localStorage
    const newPhotos = [...photos]
    newPhotos[currentSide] = photoDataUrl
    setPhotos(newPhotos)
    savePhotoToLocalStorage(photoDataUrl)

    // Mostrar vista previa
    setShowPreview(true)

    // Toast de éxito
    toast.success(`¡Foto ${SIDES[currentSide]} del bus capturada!`, {
      icon: <CheckCircle className="text-green-500" />,
    })

    // Mover al siguiente lado o finalizar
    setTimeout(() => {
      setShowPreview(false)

      // Salir de pantalla completa después de mostrar la vista previa
      if (isFullscreen) {
        exitFullscreen()
      }

      if (currentSide < SIDES.length - 1) {
        setCurrentSide(currentSide + 1)
        setUploadedImage(null) // Limpiar imagen cargada al pasar al siguiente lado
        // No resetear el nivel de zoom para mantener la misma visualización
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

  const retakePhoto = () => {
    if (currentSide > 0) {
      setCurrentSide(currentSide - 1)
      // Remove the photo from state
      const newPhotos = [...photos]
      newPhotos[currentSide - 1] = ""
      setPhotos(newPhotos)

      // Also remove from localStorage
      try {
        const existingSessions = localStorage.getItem("photoSessions")
        if (existingSessions) {
          const sessions: PhotoSession[] = JSON.parse(existingSessions)
          const currentSession = sessions.find((s) => s.id === sessionId)
          if (currentSession) {
            const sideToRemove = SIDES[currentSide - 1]
            const photoIndex = currentSession.photos.findIndex((p) => p.side === sideToRemove)
            if (photoIndex >= 0) {
              currentSession.photos.splice(photoIndex, 1)
              localStorage.setItem("photoSessions", JSON.stringify(sessions))
            }
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

  const handleScreenTap = () => {
    if (!isLoading && !showPreview && activeTab === "camera") {
      takePhoto()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo seleccionado no es una imagen")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage(event.target.result as string)
        setVehicleDetected(true) // Always enable the take photo button for uploads
      }
    }
    reader.readAsDataURL(file)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)

    if (value === "camera") {
      setUploadedImage(null)
      if (!isLoading && !stream) {
        startCamera()
      }
    } else if (value === "upload") {
      stopCamera()
    }
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2.6))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 1))
  }

  const handleZoomChange = (value: number[]) => {
    // Usar requestAnimationFrame para una animación más suave
    requestAnimationFrame(() => {
      setZoomLevel(value[0])
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Calcular la distancia inicial entre dos dedos
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      setInitialTouchDistance(distance)
      setInitialZoomLevel(zoomLevel)

      // Prevenir el comportamiento predeterminado para evitar desplazamiento
      e.preventDefault()
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistance !== null) {
      // Calcular nueva distancia
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)

      // Calcular nuevo nivel de zoom basado en el cambio de distancia
      // Usar un factor de escala más suave para móviles
      const scale = distance / initialTouchDistance
      const scaleFactor = Math.pow(scale, 0.7) // Suavizar el efecto de escala
      const newZoom = Math.max(1, Math.min(2.6, initialZoomLevel * scaleFactor))

      // Usar requestAnimationFrame para una animación más suave
      requestAnimationFrame(() => {
        setZoomLevel(newZoom)
      })

      // Prevenir el comportamiento predeterminado para evitar desplazamiento
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    setInitialTouchDistance(null)
  }

  // Retry camera access
  const retryCamera = () => {
    setCameraError(null)
    startCamera()
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

      {/* Header - Hide in fullscreen mode */}
      {!isFullscreen && (
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
      )}

      {/* Main content - Hide in fullscreen mode */}
      <div className={`container mx-auto px-4 pt-8 pb-6 space-y-6 ${isFullscreen ? "hidden" : ""}`}>
        {showVehicleForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto anim-item anim-slide-up"
          >
            <div className="text-center mb-8 anim-item anim-slide-up">
              <div className="relative mb-6 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-b from-green-200/50 to-emerald-300/50 rounded-full blur-xl transform scale-110 animate-pulse-slow"></div>
                <div className="relative bg-gradient-to-br from-green-100 to-emerald-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg transform transition-transform duration-500 hover:scale-105 hover:rotate-3 group">
                  <Truck className="w-12 h-12 text-green-600 transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Información del Vehículo</h1>
              <p className="text-gray-600 max-w-sm mx-auto">
                Ingresa el número del vehículo para comenzar la captura de fotos
              </p>
            </div>

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

            {/* Decorative cards */}
            <div className="mt-12 grid grid-cols-2 gap-4 anim-item anim-slide-up">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-green-100/50 h-24 relative overflow-hidden group transform transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-300 to-emerald-500 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                  <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-gradient-to-tl from-green-100 to-transparent rounded-full opacity-60"></div>
                  <div className="p-4 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="bg-green-50 rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="text-xs font-semibold text-green-700">{index}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        {index === 1
                          ? "Vista frontal"
                          : index === 2
                            ? "Lateral izquierdo"
                            : index === 3
                              ? "Trasero"
                              : "Lateral derecho"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <p className="text-gray-600 max-w-md mx-auto">
                {activeTab === "camera"
                  ? "Posiciona la cámara correctamente y toca la pantalla para tomar la foto"
                  : "Selecciona una imagen para cargar"}
              </p>
              <div className="flex justify-center mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {LANDSCAPE_SIDES.includes(SIDES[currentSide]) ? "Orientación: Horizontal" : "Orientación: Vertical"}
                </Badge>
              </div>
            </motion.div>

            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full max-w-md mx-auto mb-4 anim-item anim-slide-up"
            >
              <TabsList className="grid grid-cols-2 w-full bg-green-100/50 p-1">
                <TabsTrigger
                  value="camera"
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Cámara
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Cargar Imagen
                </TabsTrigger>
              </TabsList>

              <TabsContent value="camera" className="mt-0">
                <div
                  ref={fullscreenContainerRef}
                  className={`relative ${isFullscreen ? "fixed inset-0 z-[100] bg-black" : "aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-xl border border-green-800/20 anim-item anim-slide-up"}`}
                >
                  {/* Animación de transición a pantalla completa */}
                  <AnimatePresence>
                    {isFullscreen && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute inset-0 z-10"
                      >
                        {/* Esta div es solo para la animación */}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Loading state */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900 to-emerald-900 z-20">
                      <div className="flex flex-col items-center">
                        <RefreshCw className="w-12 h-12 text-green-400 animate-spin mb-4" />
                        <p className="text-green-200 text-sm font-medium">Iniciando cámara...</p>
                        <div className="mt-4 w-48 h-1.5 bg-green-800/50 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse-slow rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Camera error state */}
                  {cameraError && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900/90 to-red-800/90 z-20">
                      <div className="flex flex-col items-center text-center p-6">
                        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                        <p className="text-white text-lg font-medium mb-2">Error de cámara</p>
                        <p className="text-red-200 text-sm mb-6 max-w-xs">{cameraError}</p>
                        <Button onClick={retryCamera} className="bg-white text-red-600 hover:bg-red-50">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reintentar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Camera view with orientation */}
                  <div
                    className={`relative h-full w-full flex items-center justify-center ${isTransitioning ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
                    ref={videoContainerRef}
                    onClick={handleScreenTap}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Video container with orientation */}
                    <div
                      className={`relative overflow-hidden ${
                        orientation === "landscape"
                          ? "w-full max-h-full aspect-video"
                          : "h-full max-w-full aspect-[3/4]"
                      } flex items-center justify-center`}
                    >
                      {/* Video element with zoom */}
                      <motion.div
                        animate={{
                          scale: zoomLevel,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          duration: 0.3,
                        }}
                        className="w-full h-full"
                      >
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      </motion.div>

                      {/* Detection canvas overlay */}
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                        width={videoRef.current?.videoWidth || 1280}
                        height={videoRef.current?.videoHeight || 720}
                      />

                      {/* Camera guides */}
                      {showGuides && !isLoading && !showPreview && !cameraError && (
                        <div className="absolute inset-0 pointer-events-none z-10">
                          {/* Center frame */}
                          <div
                            className={`absolute inset-[15%] border ${
                              vehicleDetected ? "border-green-400/30" : "border-red-400/30"
                            } rounded-lg transition-colors duration-300`}
                          ></div>

                          {/* Corner guides */}
                          <div
                            className={`absolute top-[15%] left-[15%] w-6 h-6 border-t border-l ${
                              vehicleDetected ? "border-green-400/50" : "border-red-400/50"
                            } rounded-tl-lg transition-colors duration-300`}
                          ></div>
                          <div
                            className={`absolute top-[15%] right-[15%] w-6 h-6 border-t border-r ${
                              vehicleDetected ? "border-green-400/50" : "border-red-400/50"
                            } rounded-tr-lg transition-colors duration-300`}
                          ></div>
                          <div
                            className={`absolute bottom-[15%] left-[15%] w-6 h-6 border-b border-l ${
                              vehicleDetected ? "border-green-400/50" : "border-red-400/50"
                            } rounded-bl-lg transition-colors duration-300`}
                          ></div>
                          <div
                            className={`absolute bottom-[15%] right-[15%] w-6 h-6 border-b border-r ${
                              vehicleDetected ? "border-green-400/50" : "border-red-400/50"
                            } rounded-br-lg transition-colors duration-300`}
                          ></div>

                          {/* Center crosshair */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div
                              className={`w-8 h-8 border ${
                                vehicleDetected ? "border-green-400/40" : "border-red-400/40"
                              } rounded-full flex items-center justify-center transition-colors duration-300`}
                            >
                              <div
                                className={`w-1.5 h-1.5 ${
                                  vehicleDetected ? "bg-green-400/70" : "bg-red-400/70"
                                } rounded-full transition-colors duration-300`}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Vehicle detection status indicator */}
                      {!isLoading && !showPreview && !cameraError && (
                        <div
                          className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full z-10 transition-all duration-300 ${
                            vehicleDetected
                              ? "bg-black/40 backdrop-blur-sm text-white"
                              : "bg-black/40 backdrop-blur-sm text-white"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${vehicleDetected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                          ></div>
                          <span className="text-xs font-medium">
                            {vehicleDetected ? "Vehículo detectado" : "No se detecta vehículo"}
                          </span>
                        </div>
                      )}

                      {/* Side indicator */}
                      {!isLoading && !showPreview && !cameraError && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full z-10">
                          <div className="flex items-center space-x-2">
                            <span className="text-white text-xs font-medium">{SIDES[currentSide]}</span>
                          </div>
                        </div>
                      )}

                      {/* Orientation indicator */}
                      {!isLoading && !showPreview && !cameraError && (
                        <div className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                          <div className="flex items-center gap-2">
                            <RotateCcw className="w-3 h-3 text-white" />
                            <span className="text-white text-xs">
                              {orientation === "landscape" ? "Horizontal" : "Vertical"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tap to capture hint */}
                      {!isLoading && !showPreview && !cameraError && (
                        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs z-10 opacity-80">
                          Toca la pantalla para capturar
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

                    {/* Fullscreen controls - Mejorados para móviles */}
                    {isFullscreen && !isLoading && !showPreview && !cameraError && (
                      <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="absolute top-4 left-0 right-0 z-30 flex items-center justify-between px-4"
                      >
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={exitFullscreen}
                            className="bg-black/50 hover:bg-black/70 text-white border-0"
                          >
                            <Minimize className="w-4 h-4 mr-1" />
                            Salir
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowGuides(!showGuides)}
                            className="bg-black/50 hover:bg-black/70 text-white border-0"
                          >
                            {showGuides ? (
                              <span className="flex items-center">
                                <X className="w-4 h-4 mr-1" />
                                Guías
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Maximize className="w-4 h-4 mr-1" />
                                Guías
                              </span>
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-black/40 text-white border-0">
                            {SIDES[currentSide]}
                          </Badge>
                        </div>
                      </motion.div>
                    )}

                    {/* Zoom controls in fullscreen - Mejorados para móviles */}
                    {isFullscreen && !isLoading && !showPreview && !cameraError && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-4"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomOut}
                          disabled={zoomLevel <= 1}
                          className="h-8 w-8 p-0 text-white hover:bg-black/30 rounded-full"
                        >
                          <ZoomOut className="h-5 w-5" />
                        </Button>

                        <div className="w-40 sm:w-48">
                          <Slider
                            value={[zoomLevel]}
                            min={1}
                            max={2.6}
                            step={0.1}
                            onValueChange={handleZoomChange}
                            className="z-30"
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomIn}
                          disabled={zoomLevel >= 2.6}
                          className="h-8 w-8 p-0 text-white hover:bg-black/30 rounded-full"
                        >
                          <ZoomIn className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    )}

                    {/* Botón de captura en pantalla completa para móviles */}
                    {isFullscreen && !isLoading && !showPreview && !cameraError && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
                      >
                        <Button
                          onClick={takePhoto}
                          className={`bg-gradient-to-r ${
                            vehicleDetected ? "from-green-500 to-emerald-600" : "from-red-500 to-red-600"
                          } text-white rounded-full w-16 h-16 p-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95`}
                          disabled={!vehicleDetected}
                        >
                          <Camera className="h-7 w-7" />
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  {/* Floating controls (only shown when not in fullscreen) */}
                  {!isFullscreen && !isLoading && !showPreview && !cameraError && (
                    <>
                      {/* Fullscreen button */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="absolute top-4 left-4 z-30 bg-black/50 hover:bg-black/70 text-white border-0"
                      >
                        <Expand className="w-4 h-4 mr-1" />
                        Pantalla completa
                      </Button>

                      {/* Zoom button */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowZoomControls(!showZoomControls)}
                        className="absolute top-4 right-4 z-30 bg-black/50 hover:bg-black/70 text-white border-0"
                      >
                        <ZoomIn className="w-4 h-4 mr-1" />
                        {Math.round(zoomLevel * 10) / 10}x
                      </Button>

                      {/* Zoom controls */}
                      {showZoomControls && (
                        <div className="absolute top-16 right-4 z-30 bg-black/50 backdrop-blur-sm rounded-lg p-3 flex flex-col items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                            disabled={zoomLevel >= 2.6}
                            className="h-8 w-8 p-0 text-white hover:bg-black/30 rounded-full"
                          >
                            <ZoomIn className="h-5 w-5" />
                          </Button>

                          <div className="h-24 flex items-center">
                            <Slider
                              value={[zoomLevel]}
                              min={1}
                              max={2.6}
                              step={0.1}
                              onValueChange={handleZoomChange}
                              orientation="vertical"
                              className="z-30"
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                            disabled={zoomLevel <= 1}
                            className="h-8 w-8 p-0 text-white hover:bg-black/30 rounded-full"
                          >
                            <ZoomOut className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-0">
                <div className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-xl border border-green-200 flex flex-col items-center justify-center anim-item anim-slide-up">
                  {uploadedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Imagen cargada"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-4 right-4 bg-white/80 hover:bg-white text-red-600 rounded-full w-8 h-8 p-0 shadow-md"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <Image className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Cargar imagen</h3>
                      <p className="text-sm text-gray-500 mb-4 max-w-xs">
                        Selecciona una imagen desde tu dispositivo para el lado {SIDES[currentSide]}
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg shadow-md"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Seleccionar archivo
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-6 anim-item anim-slide-up">
              {/* Camera controls */}
              <div className="flex justify-center items-center gap-4">
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="rounded-full w-12 h-12 p-0 border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-300 shadow-sm"
                  disabled={currentSide === 0 || isLoading || showPreview}
                >
                  <RotateCw className="h-5 w-5 text-green-700" />
                </Button>

                <Button
                  onClick={takePhoto}
                  className={`bg-gradient-to-r ${
                    vehicleDetected || (activeTab === "upload" && uploadedImage)
                      ? "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  } text-white rounded-full w-20 h-20 p-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 relative overflow-hidden group`}
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
                </Button>

                <Button
                  onClick={() => setShowGuides(!showGuides)}
                  variant="outline"
                  className="rounded-full w-12 h-12 p-0 border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-300 shadow-sm"
                  disabled={isLoading || showPreview || activeTab === "upload" || !!cameraError}
                >
                  <Maximize className="h-5 w-5 text-green-700" />
                </Button>
              </div>

              {/* Vehicle detection message */}
              {activeTab === "camera" && !vehicleDetected && !isLoading && !showPreview && !cameraError && (
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

