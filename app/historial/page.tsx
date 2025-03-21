"use client"

import { useState, useEffect } from "react"
import { Camera, Calendar, Eye, Truck, Trash2, ArrowLeft, Download, Clock, ChevronRight, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"

interface PhotoData {
  side: string
  dataUrl: string
  timestamp: string
}

interface PhotoSession {
  id: string
  date: string
  vehicleNumber?: string // Make it optional for backward compatibility
  photos: PhotoData[]
}

const SIDE_ICONS = {
  Frontal: "↑",
  "Lateral Izquierdo": "←",
  Trasero: "↓",
  "Lateral Derecho": "→",
}

const SIDE_COLORS = {
  Frontal: "bg-green-500",
  "Lateral Izquierdo": "bg-emerald-500",
  Trasero: "bg-teal-500",
  "Lateral Derecho": "bg-green-600",
}

export default function Historial() {
  const router = useRouter()
  const [sessions, setSessions] = useState<PhotoSession[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    loadSessions()

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
  }, [])

  const loadSessions = () => {
    setIsLoading(true)
    try {
      const storedSessions = localStorage.getItem("photoSessions")
      if (storedSessions) {
        const parsedSessions: PhotoSession[] = JSON.parse(storedSessions)
        // Sort sessions by date (newest first)
        parsedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setSessions(parsedSessions)
      }
    } catch (error) {
      console.error("Error loading sessions from localStorage:", error)
      toast.error("Error al cargar el historial de fotos")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSession = (sessionId: string) => {
    try {
      const updatedSessions = sessions.filter((session) => session.id !== sessionId)
      localStorage.setItem("photoSessions", JSON.stringify(updatedSessions))
      setSessions(updatedSessions)
      toast.success("Sesión eliminada correctamente")
      setConfirmDelete(null)
    } catch (error) {
      console.error("Error deleting session:", error)
      toast.error("Error al eliminar la sesión")
    }
  }

  const downloadPhoto = (photo: PhotoData) => {
    try {
      const link = document.createElement("a")
      link.href = photo.dataUrl
      link.download = `${photo.side}_${new Date(photo.timestamp).toISOString().split("T")[0]}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Foto descargada correctamente")
    } catch (error) {
      console.error("Error downloading photo:", error)
      toast.error("Error al descargar la foto")
    }
  }

  const downloadAllPhotos = (session: PhotoSession) => {
    try {
      session.photos.forEach((photo) => {
        setTimeout(() => {
          downloadPhoto(photo)
        }, 300)
      })
      toast.success(`Descargando ${session.photos.length} fotos...`)
    } catch (error) {
      console.error("Error downloading all photos:", error)
      toast.error("Error al descargar las fotos")
    }
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return new Date(dateString).toLocaleDateString("es-ES", options)
  }

  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleTimeString("es-ES", options)
  }

  const getFilteredSessions = () => {
    if (filter === "all") return sessions

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterday = new Date(today - 86400000).getTime()
    const thisWeekStart = new Date(today - now.getDay() * 86400000).getTime()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    return sessions.filter((session) => {
      const sessionDate = new Date(session.date).getTime()
      switch (filter) {
        case "today":
          return sessionDate >= today
        case "yesterday":
          return sessionDate >= yesterday && sessionDate < today
        case "week":
          return sessionDate >= thisWeekStart
        case "month":
          return sessionDate >= thisMonthStart
        default:
          return true
      }
    })
  }

  const filteredSessions = getFilteredSessions()

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
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-green-100 anim-item anim-slide-down">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="rounded-full w-10 h-10 hover:bg-green-100/80 hover:text-green-700 transition-all duration-300 focus:ring-2 focus:ring-green-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="ml-3 text-xl font-bold text-green-800">Historial de fotos</h1>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filtrar
                  <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800">
                    {filter === "all"
                      ? "Todos"
                      : filter === "today"
                        ? "Hoy"
                        : filter === "yesterday"
                          ? "Ayer"
                          : filter === "week"
                            ? "Esta semana"
                            : "Este mes"}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-green-100">
                <DropdownMenuItem onClick={() => setFilter("all")}>Todos los registros</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("today")}>Hoy</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("yesterday")}>Ayer</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("week")}>Esta semana</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("month")}>Este mes</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-green-200/50 to-emerald-300/50 rounded-full blur-xl transform scale-110 animate-pulse-slow"></div>
              <div className="relative w-16 h-16 rounded-full border-4 border-t-green-500 border-green-200 animate-spin mb-4"></div>
            </div>
            <p className="text-green-800 font-medium mt-4">Cargando historial...</p>
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center max-w-md mx-auto border border-green-100 anim-item anim-slide-up"
          >
            <div className="relative mb-6 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-b from-green-200/50 to-emerald-300/50 rounded-full blur-xl transform scale-110 animate-pulse-slow"></div>
              <div className="relative bg-gradient-to-br from-green-100 to-emerald-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg transform transition-transform duration-500 hover:scale-105 hover:rotate-3 group">
                <Camera className="w-12 h-12 text-green-600 transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No hay fotos guardadas</h2>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Aún no has capturado ninguna foto. Comienza una nueva sesión para ver tu historial aquí.
            </p>
            <Button
              onClick={() => router.push("/instrucciones")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium text-lg group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Comenzar captura
                <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
            </Button>
          </motion.div>
        ) : filteredSessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center max-w-md mx-auto border border-green-100 anim-item anim-slide-up"
          >
            <div className="relative mb-6 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-200/50 to-yellow-300/50 rounded-full blur-xl transform scale-110 animate-pulse-slow"></div>
              <div className="relative bg-gradient-to-br from-amber-100 to-yellow-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg transform transition-transform duration-500 hover:scale-105 hover:rotate-3 group">
                <Filter className="w-12 h-12 text-amber-600 transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No hay resultados</h2>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              No se encontraron sesiones que coincidan con el filtro seleccionado.
            </p>
            <Button
              onClick={() => setFilter("all")}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium group relative overflow-hidden"
            >
              <span className="relative z-10">Ver todas las sesiones</span>
              <span className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <AnimatePresence>
              {filteredSessions.map((session, sessionIndex) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: sessionIndex * 0.1 }}
                  className="group anim-item anim-slide-up"
                  style={{ animationDelay: `${sessionIndex * 100}ms` }}
                >
                  <Card className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 py-4">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center shadow-sm">
                            <Calendar className="w-5 h-5 text-green-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-green-800 font-bold">{formatDate(session.date)}</h3>
                              {session.vehicleNumber && (
                                <Badge className="bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 hover:from-green-200 hover:to-emerald-300 flex items-center gap-1 shadow-sm">
                                  <Truck className="w-3 h-3" />#{session.vehicleNumber}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-green-600 mt-0.5">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>{formatTime(session.photos[0]?.timestamp || session.date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
                            onClick={() => downloadAllPhotos(session)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Descargar todas
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setConfirmDelete(session.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {session.photos.map((photo, index) => (
                          <Dialog key={index}>
                            <DialogTrigger asChild>
                              <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                className="aspect-[4/3] rounded-lg overflow-hidden shadow-md border border-green-100 cursor-pointer relative group"
                                onClick={() => setSelectedPhoto(photo)}
                              >
                                <img
                                  src={photo.dataUrl || "/placeholder.svg"}
                                  alt={`Foto ${photo.side}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-green-900/70 via-green-800/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                  <div
                                    className={`self-start ${SIDE_COLORS[photo.side as keyof typeof SIDE_COLORS]} text-white text-xs px-2 py-1 rounded-full flex items-center shadow-sm`}
                                  >
                                    <span className="mr-1">{SIDE_ICONS[photo.side as keyof typeof SIDE_ICONS]}</span>
                                    <span>{photo.side}</span>
                                  </div>
                                  <div className="flex justify-between items-end w-full">
                                    <span className="text-white/90 text-xs">{formatTime(photo.timestamp)}</span>
                                    <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                      <Eye className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  </div>
                                </div>
                                {/* Decorative bottom border that appears on hover */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                              </motion.div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl border-green-100">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div
                                      className={`${SIDE_COLORS[photo.side as keyof typeof SIDE_COLORS]} w-6 h-6 rounded-full flex items-center justify-center mr-2 shadow-sm`}
                                    >
                                      <span className="text-white text-xs">
                                        {SIDE_ICONS[photo.side as keyof typeof SIDE_ICONS]}
                                      </span>
                                    </div>
                                    <span className="text-green-800">Foto {photo.side}</span>
                                    {session.vehicleNumber && (
                                      <Badge className="ml-2 bg-gradient-to-r from-green-100 to-emerald-200 text-green-800">
                                        <div className="flex items-center gap-1">
                                          <Truck className="w-3 h-3" />
                                          <span>Vehículo #{session.vehicleNumber}</span>
                                        </div>
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-sm font-normal text-green-600">
                                    {new Date(photo.timestamp).toLocaleString()}
                                  </span>
                                </DialogTitle>
                              </DialogHeader>
                              <div className="rounded-lg overflow-hidden border border-green-200 bg-green-50">
                                <img
                                  src={photo.dataUrl || "/placeholder.svg"}
                                  alt={`Foto ${photo.side}`}
                                  className="w-full h-auto"
                                />
                              </div>
                              <div className="flex justify-end space-x-2 mt-4">
                                <DialogClose asChild>
                                  <Button
                                    variant="outline"
                                    className="border-green-200 text-green-700 hover:bg-green-50"
                                  >
                                    Cerrar
                                  </Button>
                                </DialogClose>
                                <Button
                                  onClick={() => downloadPhoto(photo)}
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
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-green-50 px-6 py-3 border-t border-green-100">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <Badge variant="secondary" className="mr-2 bg-green-100 text-green-800">
                            {session.photos.length} fotos
                          </Badge>
                          <span className="text-sm text-green-600">ID: {session.id.split("_")[1]}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-700 hover:bg-green-100 hover:text-green-800 flex items-center group"
                          onClick={() => router.push(`/revision?session=${session.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver detalles
                          <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md border-green-100">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              Confirmar eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-gray-700">
              ¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer y todas las fotos se
              perderán permanentemente.
            </p>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={() => confirmDelete && deleteSession(confirmDelete)} variant="destructive">
              Eliminar permanentemente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => router.push("/instrucciones")}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group relative overflow-hidden"
        >
          <span className="relative z-10">
            <Camera className="h-6 w-6" />
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
        </Button>
      </div>
    </div>
  )
}

