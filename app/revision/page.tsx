"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Check,
  X,
  Camera,
  ArrowLeft,
  RefreshCw,
  Download,
  Truck,
  Eye,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Slider } from "@/components/ui/slider"
import { getSession, completeSession } from "@/app/actions/photo-storage"

interface PhotoData {
  side: string
  photoUrl: string // Cambiado de dataUrl a photoUrl
  timestamp: string
}

interface ClientPhotoSession {
  id: string
  date: string
  vehicleNumber: string
  photos: PhotoData[]
}

const SIDES = ["Frontal", "Lateral Izquierdo", "Trasero", "Lateral Derecho"]

const SIDE_COLORS: Record<string, string> = {
  Frontal: "from-green-400 to-emerald-500",
  "Lateral Izquierdo": "from-emerald-400 to-green-500",
  Trasero: "from-teal-400 to-emerald-500",
  "Lateral Derecho": "from-green-400 to-teal-500",
}

// Define which sides should be in landscape orientation
const LANDSCAPE_SIDES = ["Lateral Izquierdo", "Lateral Derecho"]

export default function Revision() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get("session")

  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<ClientPhotoSession | null>(null)
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [selectedSide, setSelectedSide] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const [initialTouchDistance, setInitialTouchDistance] = useState<number | null>(null)
  const [initialZoomLevel, setInitialZoomLevel] = useState<number>(1)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    loadSession()

    // Add fullscreen change event listener
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    // Add escape key listener to exit fullscreen
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isFullscreen) {
      exitFullscreen()
    }
  }

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement)
    if (!document.fullscreenElement) {
      // Reset zoom when exiting fullscreen
      setZoomLevel(1)
      setDragPosition({ x: 0, y: 0 })
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

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }

  const loadSession = async () => {
    setIsLoading(true)
    try {
      // Si se proporciona un ID de sesión específico, intentamos cargar esa sesión
      if (sessionParam) {
        let blobSession

        try {
          // Intentar cargar desde Vercel Blob
          blobSession = await getSession(sessionParam)
        } catch (error) {
          console.error("Error fetching from Vercel Blob, trying localStorage:", error)
          // Intentar cargar desde localStorage como fallback
          const storedSessions = localStorage.getItem("photoSessions")
          if (storedSessions) {
            const sessions = JSON.parse(storedSessions)
            blobSession = sessions.find((s: any) => s.id === sessionParam)
          }
        }

        if (blobSession) {
          // Convertir la sesión al formato que espera el componente
          let clientSession: ClientPhotoSession

          // Verificar si es una sesión de Blob o de localStorage
          if (blobSession.photos && blobSession.photos[0] && typeof blobSession.photos[0].photoUrl === "string") {
            // Formato Blob
            clientSession = {
              id: blobSession.id,
              date: new Date(blobSession.timestamp).toISOString(),
              vehicleNumber: blobSession.vehicleNumber,
              photos: blobSession.photos.map((photo: any) => ({
                side: photo.side,
                photoUrl: photo.photoUrl,
                timestamp: new Date(photo.timestamp).toISOString(),
              })),
            }
          } else if (
            blobSession.photos &&
            blobSession.photos[0] &&
            typeof blobSession.photos[0].photoData === "string"
          ) {
            // Formato antiguo (Redis)
            clientSession = {
              id: blobSession.id,
              date: new Date(blobSession.timestamp).toISOString(),
              vehicleNumber: blobSession.vehicleNumber,
              photos: blobSession.photos.map((photo: any) => ({
                side: photo.side,
                photoUrl: photo.photoData,
                timestamp: new Date(photo.timestamp).toISOString(),
              })),
            }
          } else {
            // Formato localStorage
            clientSession = {
              id: blobSession.id,
              date: blobSession.date || new Date().toISOString(),
              vehicleNumber: blobSession.vehicleNumber,
              photos: blobSession.photos.map((photo: any) => ({
                side: photo.side,
                photoUrl: photo.photoUrl || photo.dataUrl,
                timestamp: photo.timestamp || new Date().toISOString(),
              })),
            }
          }

          setSession(clientSession)

          // Crear un mapa de lado -> photoUrl
          const photoMap: Record<string, string> = {}
          clientSession.photos.forEach((photo) => {
            photoMap[photo.side] = photo.photoUrl
          })
          setPhotos(photoMap)
        } else {
          toast.error("Sesión no encontrada")
          router.push("/historial")
        }
      } else {
        toast.error("No se especificó una sesión")
        router.push("/historial")
      }
    } catch (error) {
      console.error("Error loading session:", error)
      toast.error("Error al cargar la sesión")

      // Intentar cargar desde localStorage como último recurso
      try {
        const storedSessions = localStorage.getItem("photoSessions")
        if (storedSessions && sessionParam) {
          const sessions = JSON.parse(storedSessions)
          const localSession = sessions.find((s: any) => s.id === sessionParam)

          if (localSession) {
            const clientSession: ClientPhotoSession = {
              id: localSession.id,
              date: localSession.date,
              vehicleNumber: localSession.vehicleNumber,
              photos: localSession.photos.map((photo: any) => ({
                side: photo.side,
                photoUrl: photo.photoUrl || photo.dataUrl,
                timestamp: photo.timestamp,
              })),
            }

            setSession(clientSession)

            const photoMap: Record<string, string> = {}
            clientSession.photos.forEach((photo) => {
              photoMap[photo.side] = photo.photoUrl
            })
            setPhotos(photoMap)

            toast.success("Cargado desde almacenamiento local (modo sin conexión)")
          } else {
            router.push("/historial")
          }
        } else {
          router.push("/historial")
        }
      } catch (localError) {
        console.error("Error loading from localStorage:", localError)
        router.push("/historial")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetakePhoto = (side: string) => {
    const index = SIDES.indexOf(side)
    if (index >= 0) {
      router.push(`/captura?retake=${index}`)
    }
  }

  const handleSavePhotos = async () => {
    if (session) {
      try {
        // Marcar la sesión como completada en Vercel Blob
        await completeSession(session.id)

        toast.success("Fotos guardadas correctamente", {
          description: "Las fotos han sido almacenadas en el historial",
        })
        router.push("/historial")
      } catch (error) {
        console.error("Error saving photos:", error)
        toast.error("Error al guardar las fotos")
      }
    }
  }

  const downloadPhoto = (photoUrl: string, side: string) => {
    try {
      const link = document.createElement("a")
      link.href = photoUrl
      link.download = `${side}_${new Date().toISOString().split("T")[0]}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Foto ${side} descargada correctamente`)
    } catch (error) {
      console.error("Error downloading photo:", error)
      toast.error("Error al descargar la foto")
    }
  }

  const downloadAllPhotos = () => {
    try {
      SIDES.forEach((side) => {
        if (photos[side]) {
          setTimeout(() => {
            downloadPhoto(photos[side], side)
          }, 300)
        }
      })
      toast.success(`Descargando fotos...`)
    } catch (error) {
      console.error("Error downloading all photos:", error)
      toast.error("Error al descargar las fotos")
    }
  }

  // Touch handlers for pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Calculate initial distance between two fingers
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      setInitialTouchDistance(distance)
      setInitialZoomLevel(zoomLevel)
    } else if (e.touches.length === 1) {
      // Start dragging
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - dragPosition.x,
        y: e.touches[0].clientY - dragPosition.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistance !== null) {
      // Calculate new distance
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)

      // Calculate new zoom level based on the change in distance
      const scale = distance / initialTouchDistance
      const newZoom = Math.max(1, Math.min(3, initialZoomLevel * scale))
      setZoomLevel(newZoom)

      // Prevent default to avoid page scrolling
      e.preventDefault()
    } else if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      // Calculate new position
      const newX = e.touches[0].clientX - dragStart.x
      const newY = e.touches[0].clientY - dragStart.y

      // Limit dragging based on zoom level
      const maxOffset = (zoomLevel - 1) * 100
      const limitedX = Math.max(-maxOffset, Math.min(maxOffset, newX))
      const limitedY = Math.max(-maxOffset, Math.min(maxOffset, newY))

      setDragPosition({ x: limitedX, y: limitedY })
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    setInitialTouchDistance(null)
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.25, 1)
      if (newZoom === 1) {
        // Reset drag position when zooming out completely
        setDragPosition({ x: 0, y: 0 })
      }
      return newZoom
    })
  }

  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0]
    setZoomLevel(newZoom)
    if (newZoom === 1) {
      // Reset drag position when zooming out completely
      setDragPosition({ x: 0, y: 0 })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-green-200/50 to-emerald-300/50 rounded-full blur-xl transform scale-110 animate-pulse-slow"></div>
            <div className="relative w-16 h-16 rounded-full border-4 border-t-green-500 border-green-200 animate-spin mb-4"></div>
          </div>
          <p className="text-green-800 font-medium mt-4">Cargando fotos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pb-12">
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
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/historial")}
                  className="rounded-full w-10 h-10 hover:bg-green-100/80 hover:text-green-700 transition-all duration-300 focus:ring-2 focus:ring-green-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="ml-3 text-xl font-bold text-green-800">Revisar fotos</h1>
              </div>

              {session?.vehicleNumber && (
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 hover:from-green-200 hover:to-emerald-300 flex items-center gap-1 shadow-sm">
                  <Truck className="w-3 h-3" />
                  <span>Vehículo #{session.vehicleNumber}</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`container mx-auto px-4 py-6 ${isFullscreen ? "hidden" : ""}`}>
        <Card className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-xl overflow-hidden shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 py-4">
            <CardTitle className="text-center text-green-800">
              Verifica que las fotos sean claras y muestren correctamente cada lado del vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SIDES.map((side, index) => (
                <motion.div
                  key={side}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="space-y-3"
                >
                  <div
                    className={`aspect-[${LANDSCAPE_SIDES.includes(side) ? "16/9" : "3/4"}] bg-gray-100 rounded-xl overflow-hidden relative shadow-md border border-green-100 group`}
                  >
                    {photos[side] ? (
                      <>
                        <img
                          src={photos[side] || "/placeholder.svg"}
                          alt={`Lado ${side}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                          <div className="flex justify-between items-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="bg-white/80 hover:bg-white text-green-700"
                                  onClick={() => {
                                    setSelectedPhoto(photos[side])
                                    setSelectedSide(side)
                                    setZoomLevel(1)
                                    setDragPosition({ x: 0, y: 0 })
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-2xl border-green-100 p-0" ref={fullscreenContainerRef}>
                                <DialogHeader className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                                  <DialogTitle className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div
                                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${SIDE_COLORS[selectedSide || ""]} flex items-center justify-center mr-2 text-white text-xs shadow-sm`}
                                      >
                                        {selectedSide && SIDES.indexOf(selectedSide) + 1}
                                      </div>
                                      <span className="text-green-800">Foto {selectedSide}</span>
                                      {session?.vehicleNumber && (
                                        <Badge className="ml-2 bg-gradient-to-r from-green-100 to-emerald-200 text-green-800">
                                          <div className="flex items-center gap-1">
                                            <Truck className="w-3 h-3" />
                                            <span>Vehículo #{session.vehicleNumber}</span>
                                          </div>
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleFullscreen}
                                        className="border-green-200 text-green-700 hover:bg-green-50"
                                      >
                                        {isFullscreen ? (
                                          <>
                                            <Minimize className="w-4 h-4 mr-1" /> Salir
                                          </>
                                        ) : (
                                          <>
                                            <Maximize className="w-4 h-4 mr-1" /> Pantalla completa
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </DialogTitle>
                                </DialogHeader>
                                <div
                                  className="relative overflow-hidden bg-gray-900 flex items-center justify-center"
                                  style={{
                                    height: isFullscreen ? "calc(100vh - 120px)" : "60vh",
                                  }}
                                  onTouchStart={handleTouchStart}
                                  onTouchMove={handleTouchMove}
                                  onTouchEnd={handleTouchEnd}
                                >
                                  {selectedPhoto && (
                                    <div
                                      style={{
                                        transform: `scale(${zoomLevel}) translate(${dragPosition.x / zoomLevel}px, ${dragPosition.y / zoomLevel}px)`,
                                        transition: isDragging ? "none" : "transform 0.2s ease-out",
                                      }}
                                      className="w-full h-full flex items-center justify-center"
                                    >
                                      <img
                                        src={selectedPhoto || "/placeholder.svg"}
                                        alt={`Foto ${selectedSide}`}
                                        className="max-w-full max-h-full object-contain"
                                        draggable="false"
                                      />
                                    </div>
                                  )}

                                  {/* Zoom controls */}
                                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleZoomOut}
                                      disabled={zoomLevel <= 1}
                                      className="h-8 w-8 p-0 text-white hover:bg-black/30 rounded-full"
                                    >
                                      <ZoomOut className="h-5 w-5" />
                                    </Button>

                                    <div className="w-32">
                                      <Slider
                                        value={[zoomLevel]}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        onValueChange={handleZoomChange}
                                        className="z-30"
                                      />
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleZoomIn}
                                      disabled={zoomLevel >= 3}
                                      className="h-8 w-8 p-0 text-white hover:bg-black/30 rounded-full"
                                    >
                                      <ZoomIn className="h-5 w-5" />
                                    </Button>

                                    <span className="text-white text-xs ml-1">{Math.round(zoomLevel * 10) / 10}x</span>
                                  </div>

                                  {/* Pinch/zoom hint */}
                                  {zoomLevel === 1 && (
                                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs animate-pulse">
                                      Pellizca para hacer zoom
                                    </div>
                                  )}
                                </div>
                                <div className="flex justify-end space-x-2 p-4 bg-white border-t border-green-100">
                                  <DialogClose asChild>
                                    <Button
                                      variant="outline"
                                      className="border-green-200 text-green-700 hover:bg-green-50"
                                    >
                                      Cerrar
                                    </Button>
                                  </DialogClose>
                                  <Button
                                    onClick={() =>
                                      selectedPhoto && selectedSide && downloadPhoto(selectedPhoto, selectedSide)
                                    }
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white group relative overflow-hidden"
                                  >
                                    <span className="relative z-10 flex items-center">
                                      <Download className="w-4 h-4 mr-2" />
                                      Descargar
                                    </span>
                                    <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              onClick={() => handleRetakePhoto(side)}
                              variant="secondary"
                              size="sm"
                              className="bg-white/80 hover:bg-white text-green-700"
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Volver a tomar
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <Camera className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm">Foto no disponible</p>
                        <Button
                          onClick={() => handleRetakePhoto(side)}
                          variant="outline"
                          size="sm"
                          className="mt-3 border-green-200 text-green-700 hover:bg-green-50"
                        >
                          Tomar foto
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full bg-gradient-to-br ${SIDE_COLORS[side]} flex items-center justify-center text-white text-xs shadow-sm`}
                      >
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium text-gray-800">{side}</p>
                    </div>
                    {photos[side] && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Capturada
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-green-50 border-t border-green-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {Object.keys(photos).length} de 4 fotos
              </Badge>
              {session?.vehicleNumber && (
                <span className="text-sm text-green-700">Vehículo #{session.vehicleNumber}</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push("/captura")}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={downloadAllPhotos}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar todas
              </Button>
              <Button
                onClick={handleSavePhotos}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white group relative overflow-hidden"
                disabled={Object.keys(photos).length === 0}
              >
                <span className="relative z-10 flex items-center">
                  <Check className="mr-2 h-4 w-4" />
                  Guardar fotos
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Next steps card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-xl overflow-hidden shadow-md">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 py-3">
              <CardTitle className="text-green-800 text-sm">Próximos pasos</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1">
                  <p className="text-gray-700 text-sm">
                    Una vez guardadas las fotos, podrás acceder a ellas en cualquier momento desde el historial. También
                    puedes descargarlas individualmente o todas juntas.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/historial")}
                  variant="ghost"
                  className="text-green-700 hover:bg-green-100 hover:text-green-800 flex items-center group"
                >
                  Ver historial
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

