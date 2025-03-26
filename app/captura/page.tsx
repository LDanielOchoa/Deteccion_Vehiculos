"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Truck } from "lucide-react"

// Hooks
import { useCamera } from "@/hooks/use-camera"
import { useVehicleDetection } from "@/hooks/use-vehicle-detection"
import { usePhotoSessionDB } from "../../hooks/use-photo-session-db" // Corregido el import
import { useOrientation } from "@/hooks/use-orientation"
import { useMobile } from "@/hooks/use-mobile"

// Constants
const SIDES = ["Frontal", "Lateral Izquierdo", "Trasero", "Lateral Derecho"]
const LANDSCAPE_SIDES = ["Lateral Izquierdo", "Lateral Derecho"]

// Components
import { VehicleForm } from "@/components/vehicle-capture/VehicleForm"
import { CameraView } from "@/components/vehicle-capture/CameraView"
import { UploadView } from "@/components/vehicle-capture/UploadView"
import { OrientationGuide } from "@/components/vehicle-capture/OrientationGuide"
import { Tutorial } from "@/components/vehicle-capture/Tutorial"
import { SideChangeAnimation } from "@/components/vehicle-capture/SideChangeAnimation"
import { CaptureControls } from "@/components/vehicle-capture/CaptureControls"
import { ProgressIndicator } from "@/components/vehicle-capture/ProgressIndicator"
import { FullscreenView } from "@/components/vehicle-capture/FullscreenView"

export default function Captura() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const retakeIndex = searchParams.get("retake")
  const isMobile = useMobile()
  const deviceOrientation = useOrientation()

  // State
  const [currentSide, setCurrentSide] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("camera")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showOrientationGuide, setShowOrientationGuide] = useState(false)
  const [sideChanging, setSideChanging] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  // Refs
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Custom hooks
  const {
    sessionId,
    photos,
    setPhotos,
    vehicleNumber,
    setVehicleNumber,
    vehicleNumberError,
    setVehicleNumberError,
    showVehicleForm,
    setShowVehicleForm,
    isLoading: dbLoading,
    savePhotoToDB,
    removePhotoFromDB,
    savePhotoToLocalStorage,
    removePhotoFromLocalStorage,
    handleVehicleNumberSubmit,
  } = usePhotoSessionDB(retakeIndex)

  const {
    videoRef,
    canvasRef,
    stream,
    isLoading: cameraLoading,
    cameraError,
    zoomLevel,
    showZoomControls,
    setShowZoomControls,
    startCamera,
    stopCamera,
    takePhoto,
    retryCamera,
    handleZoomIn,
    handleZoomOut,
    handleZoomChange,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDoubleTap,
  } = useCamera()

  const { vehicleDetected, startDetectionSimulation, drawSimulatedDetection } = useVehicleDetection(
    canvasRef,
    videoRef,
    cameraLoading,
  )

  // Combined loading state
  const isLoading = cameraLoading || dbLoading

  // Verificar conexión a internet
  useEffect(() => {
    const checkConnection = () => {
      const isOffline = !navigator.onLine
      setIsOfflineMode(isOffline)

      if (isOffline) {
        toast.info("Modo sin conexión activado", {
          description: "Las fotos se guardarán localmente",
          duration: 5000,
        })
      }
    }

    checkConnection()

    window.addEventListener("online", checkConnection)
    window.addEventListener("offline", checkConnection)

    return () => {
      window.removeEventListener("online", checkConnection)
      window.removeEventListener("offline", checkConnection)
    }
  }, [])

  // Initialize
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

    // Don't start camera until vehicle number is entered
    if (!showVehicleForm) {
      startCamera()
    }

    // Add escape key listener to exit fullscreen
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      stopCamera()
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

  // Verificar si la orientación del dispositivo coincide con la orientación requerida
  useEffect(() => {
    if (!isMobile || showVehicleForm || isLoading) return

    const requiredOrientation = LANDSCAPE_SIDES.includes(SIDES[currentSide]) ? "landscape" : "portrait"

    if (deviceOrientation !== requiredOrientation) {
      setShowOrientationGuide(true)
    } else {
      setShowOrientationGuide(false)
    }
  }, [deviceOrientation, currentSide, isMobile, showVehicleForm, isLoading])

  // Reiniciar la cámara cuando se entra en modo pantalla completa
  useEffect(() => {
    if (isFullscreen && stream && videoRef.current) {
      console.log("Aplicando stream al video en pantalla completa")

      // Asegurar que el video tenga el stream correcto
      videoRef.current.srcObject = stream

      // Forzar la reproducción
      videoRef.current.play().catch((err) => {
        console.error("Error al reproducir video en pantalla completa:", err)
      })

      // Redibujamos la detección si es necesario
      if (vehicleDetected) {
        setTimeout(() => {
          drawSimulatedDetection(true)
        }, 200)
      }
    }
  }, [isFullscreen, stream])

  // Event handlers
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isFullscreen) {
      setIsFullscreen(false)
    }
  }

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen

    // Si estamos entrando en modo de pantalla completa, reiniciamos la cámara
    if (newFullscreenState && !isLoading && stream) {
      console.log("Reiniciando cámara para modo pantalla completa")
      // Pequeña pausa para permitir que el DOM se actualice
      setTimeout(() => {
        if (videoRef.current) {
          // Asegurar que el video tenga el stream correcto
          videoRef.current.srcObject = stream
          videoRef.current.play().catch((err) => {
            console.error("Error al reproducir video en pantalla completa:", err)
          })
        }
      }, 100)
    }

    setIsFullscreen(newFullscreenState)
  }

  const handleScreenTap = () => {
    if (!isLoading && !showPreview && activeTab === "camera" && !showOrientationGuide && !showTutorial) {
      handleTakePhoto()
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
        // Always enable the take photo button for uploads
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

  const handleTakePhoto = () => {
    if (activeTab === "camera") {
      if (!vehicleDetected && !isOfflineMode) {
        toast.error("No se detecta ningún vehículo", {
          description: "Asegúrate de que el vehículo esté en el encuadre",
        })
        return
      }

      const photoDataUrl = takePhoto()
      if (photoDataUrl) {
        processPhoto(photoDataUrl)
      }
    } else if (activeTab === "upload" && uploadedImage) {
      processPhoto(uploadedImage)
    }
  }

  // Modificar la función processPhoto para manejar mejor los errores
  const processPhoto = async (photoDataUrl: string) => {
    try {
      // Mostrar vista previa inmediatamente
      setShowPreview(true)

      // Actualizar el estado local primero para mostrar la vista previa
      const newPhotos = [...photos]
      newPhotos[currentSide] = photoDataUrl
      setPhotos(newPhotos)

      // Intentar guardar en la base de datos
      if (isOfflineMode) {
        // En modo sin conexión, guardar directamente en localStorage
        savePhotoToLocalStorage(photoDataUrl, currentSide)
        toast.success(`¡Foto ${SIDES[currentSide]} guardada localmente!`, {
          description: "Modo sin conexión activo",
        })
      } else {
        try {
          // Intentar guardar en Vercel Blob
          await savePhotoToDB(photoDataUrl, currentSide)
          toast.success(`¡Foto ${SIDES[currentSide]} del vehículo capturada!`)
        } catch (error) {
          console.error("Error saving to database:", error)

          // Verificar si estamos en el cliente para usar localStorage
          if (typeof window !== "undefined") {
            // Fallback a localStorage si falla Vercel Blob
            savePhotoToLocalStorage(photoDataUrl, currentSide)
            toast.success(`¡Foto ${SIDES[currentSide]} guardada localmente!`, {
              description: "No se pudo conectar al servidor",
            })
          } else {
            toast.error("Error al guardar la foto")
          }

          // Activar modo sin conexión
          setIsOfflineMode(true)
        }
      }

      // Mover al siguiente lado o finalizar después de un breve retraso
      setTimeout(() => {
        setShowPreview(false)

        // Salir de pantalla completa después de mostrar la vista previa
        if (isFullscreen) {
          setIsFullscreen(false)
        }

        if (currentSide < SIDES.length - 1) {
          // Iniciar animación de cambio de lado
          setSideChanging(true)

          setTimeout(() => {
            setCurrentSide(currentSide + 1)
            setUploadedImage(null) // Limpiar imagen cargada al pasar al siguiente lado

            // Terminar animación después de cambiar el lado
            setTimeout(() => {
              setSideChanging(false)
            }, 500)
          }, 500)
        } else {
          stopCamera()
          toast.success("¡Todas las fotos del vehículo capturadas!", {
            description: "Redirigiendo a la revisión...",
          })
          setTimeout(() => {
            router.push("/revision")
          }, 1000)
        }
      }, 1500)
    } catch (error) {
      console.error("Error processing photo:", error)
      setShowPreview(false)
      toast.error("Error al procesar la foto")
    }
  }

  const handleRetakePhoto = () => {
    if (currentSide > 0) {
      // Iniciar animación de cambio de lado
      setSideChanging(true)

      setTimeout(() => {
        setCurrentSide(currentSide - 1)

        // Intentar eliminar la foto
        if (isOfflineMode) {
          // En modo sin conexión, eliminar directamente de localStorage
          removePhotoFromLocalStorage(currentSide - 1)
        } else {
          // Intentar eliminar de Vercel Blob
          removePhotoFromDB(currentSide - 1).catch((error) => {
            console.error("Error removing photo:", error)
            // Fallback a localStorage
            removePhotoFromLocalStorage(currentSide - 1)
          })
        }

        // Terminar animación después de cambiar el lado
        setTimeout(() => {
          setSideChanging(false)
        }, 500)
      }, 500)
    }
  }

  const handleVehicleFormSubmit = (e: React.FormEvent): boolean => {
    const success = handleVehicleNumberSubmit(e)
    if (success) {
      // Mostrar tutorial para nuevos usuarios
      setShowTutorial(true)
    }
    return success
  }

  // Avanzar en el tutorial
  const nextTutorialStep = () => {
    if (tutorialStep < 3) {
      setTutorialStep(tutorialStep + 1)
    } else {
      setShowTutorial(false)
      setTutorialStep(0)
      // Iniciar detección después del tutorial
      startDetectionSimulation()
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Indicador de modo sin conexión */}
      {isOfflineMode && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-1 text-sm z-50">
          Modo sin conexión - Las fotos se guardarán localmente
        </div>
      )}

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

      {/* Animación de cambio de lado */}
      <AnimatePresence>{sideChanging && <SideChangeAnimation currentSide={currentSide} />}</AnimatePresence>

      {/* Guía de orientación */}
      <AnimatePresence>
        {showOrientationGuide && (
          <OrientationGuide
            currentSide={currentSide}
            requiredOrientation={LANDSCAPE_SIDES.includes(SIDES[currentSide]) ? "landscape" : "portrait"}
            onClose={() => setShowOrientationGuide(false)}
          />
        )}
      </AnimatePresence>

      {/* Tutorial */}
      <AnimatePresence>
        {showTutorial && <Tutorial tutorialStep={tutorialStep} onNext={nextTutorialStep} />}
      </AnimatePresence>

      {/* Modo de pantalla completa */}
      {isFullscreen && (
        <FullscreenView
          videoRef={videoRef}
          canvasRef={canvasRef}
          isLoading={isLoading}
          cameraError={cameraError}
          showPreview={showPreview}
          showGuides={showGuides}
          vehicleDetected={vehicleDetected || isOfflineMode}
          zoomLevel={zoomLevel}
          onRetryCamera={retryCamera}
          onToggleGuides={() => setShowGuides(!showGuides)}
          onToggleFullscreen={toggleFullscreen}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomChange={handleZoomChange}
          onTakePhoto={handleTakePhoto}
          currentSide={currentSide}
        />
      )}

      {/* Header - Hide in fullscreen mode */}
      {!isFullscreen && (
        <div
          className={`sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-green-100 ${isOfflineMode ? "mt-6" : ""}`}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => router.back()}
                className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-green-100/80 hover:text-green-700 transition-all duration-300 focus:ring-2 focus:ring-green-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
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
                <button
                  onClick={() => setShowGuides(!showGuides)}
                  className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-green-100/80 hover:text-green-700 transition-all duration-300 focus:ring-2 focus:ring-green-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content - Hide in fullscreen mode */}
      <div className={`container mx-auto px-4 pt-8 pb-6 space-y-6 ${isFullscreen ? "hidden" : ""}`}>
        {showVehicleForm ? (
          <VehicleForm
            vehicleNumber={vehicleNumber}
            setVehicleNumber={setVehicleNumber}
            vehicleNumberError={vehicleNumberError}
            handleVehicleNumberSubmit={handleVehicleFormSubmit}
          />
        ) : (
          <>
            <div className="text-center space-y-2 anim-item anim-slide-up">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 rounded-full text-sm font-medium shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span>Vehículo #{vehicleNumber}</span>
                  </div>
                </div>
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
            </div>

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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  Cámara
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Cargar Imagen
                </TabsTrigger>
              </TabsList>

              <TabsContent value="camera" className="mt-0">
                <div ref={videoContainerRef}>
                  <CameraView
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    isLoading={isLoading}
                    cameraError={cameraError}
                    showPreview={showPreview}
                    showGuides={showGuides}
                    vehicleDetected={vehicleDetected || isOfflineMode}
                    zoomLevel={zoomLevel}
                    orientation={orientation}
                    showZoomControls={showZoomControls}
                    onRetryCamera={retryCamera}
                    onToggleGuides={() => setShowGuides(!showGuides)}
                    onToggleFullscreen={toggleFullscreen}
                    onToggleZoomControls={() => setShowZoomControls(!showZoomControls)}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomChange={handleZoomChange}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onScreenTap={handleScreenTap}
                    currentSide={currentSide}
                  />
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-0">
                <UploadView
                  uploadedImage={uploadedImage}
                  fileInputRef={fileInputRef}
                  onFileUpload={handleFileUpload}
                  onClearImage={() => setUploadedImage(null)}
                  currentSide={currentSide}
                />
              </TabsContent>
            </Tabs>

            <CaptureControls
              vehicleDetected={vehicleDetected || isOfflineMode}
              isLoading={isLoading}
              showPreview={showPreview}
              cameraError={cameraError}
              activeTab={activeTab}
              uploadedImage={uploadedImage}
              currentSide={currentSide}
              onTakePhoto={handleTakePhoto}
              onRetakePhoto={handleRetakePhoto}
              onToggleGuides={() => setShowGuides(!showGuides)}
            />

            <ProgressIndicator currentSide={currentSide} />
          </>
        )}
      </div>
    </div>
  )
}

