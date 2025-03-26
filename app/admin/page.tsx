"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, Search, Database } from "lucide-react"
import { toast } from "sonner"
import type { VehiclePhoto } from "@/app/actions/photo-storage"

export default function PhotosAdmin() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sessionPhotos, setSessionPhotos] = useState<VehiclePhoto[]>([])
  const [activeTab, setActiveTab] = useState("sessions")

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  // Load sessions from Redis
  const loadSessions = async () => {
    try {
      setLoading(true)

      // This would be a real API call in production
      // For demo purposes, we'll simulate some sessions
      const response = await fetch("/api/sessions")
      const data = await response.json()

      if (data.sessions) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error("Error loading sessions:", error)
      toast.error("Error loading sessions")
    } finally {
      setLoading(false)
    }
  }

  // Load photos for a session
  const loadSessionPhotos = async (sessionId: string) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/photos?sessionId=${sessionId}`)
      const data = await response.json()

      if (data.photos) {
        setSessionPhotos(data.photos)
        setSelectedSession(sessionId)
        setActiveTab("photos")
      }
    } catch (error) {
      console.error("Error loading photos:", error)
      toast.error("Error loading photos")
    } finally {
      setLoading(false)
    }
  }

  // Filter sessions by search term
  const filteredSessions = sessions.filter((session) => session.vehicleNumber.includes(searchTerm))

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin de Fotos</h1>
          <Button onClick={loadSessions} disabled={loading}>
            <Database className="mr-2 h-4 w-4" />
            Recargar Datos
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por número de vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="sessions">Sesiones</TabsTrigger>
            <TabsTrigger value="photos" disabled={!selectedSession}>
              Fotos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <p className="text-center col-span-full py-8">Cargando sesiones...</p>
              ) : filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Truck className="mr-2 h-5 w-5 text-green-600" />
                          <span>Vehículo #{session.vehicleNumber}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          {Array(6)
                            .fill(0)
                            .map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${session.photos[i] ? "bg-green-600" : "bg-gray-300"}`}
                              />
                            ))}
                        </div>
                        <Button size="sm" onClick={() => loadSessionPhotos(session.id)}>
                          Ver Fotos
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center col-span-full py-8">No se encontraron sesiones</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="photos">
            {selectedSession && (
              <div>
                <Button variant="outline" className="mb-4" onClick={() => setActiveTab("sessions")}>
                  ← Volver a Sesiones
                </Button>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {loading ? (
                    <p className="text-center col-span-full py-8">Cargando fotos...</p>
                  ) : sessionPhotos.length > 0 ? (
                    sessionPhotos.map((photo) => (
                      <Card key={photo.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Lado {photo.side.split(":")[1]}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="aspect-w-4 aspect-h-3 bg-gray-100 rounded-md overflow-hidden">
                            <img
                              // src={photo.photoData || "/placeholder.svg"}
                              alt={`Lado ${photo.side} del vehículo ${photo.vehicleNumber}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="mt-2 text-sm text-gray-500">{new Date(photo.timestamp).toLocaleString()}</div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center col-span-full py-8">No hay fotos para esta sesión</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

