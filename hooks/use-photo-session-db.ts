"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { savePhoto } from "@/app/actions/photo-storage"

export function usePhotoSessionDB(retakeIndex?: string | null) {
  const [sessionId, setSessionId] = useState<string>("")
  const [photos, setPhotos] = useState<string[]>([])
  const [vehicleNumber, setVehicleNumber] = useState<string>("")
  const [vehicleNumberError, setVehicleNumberError] = useState<string>("")
  const [showVehicleForm, setShowVehicleForm] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Inicializar el hook
  useEffect(() => {
    // Si hay un índice de retake, cargar la sesión existente
    if (retakeIndex !== null && retakeIndex !== undefined) {
      loadExistingSession()
    }
  }, [retakeIndex])

  // Cargar una sesión existente desde localStorage (para compatibilidad)
  const loadExistingSession = () => {
    try {
      const storedSessions = localStorage.getItem("photoSessions")
      if (storedSessions) {
        const sessions = JSON.parse(storedSessions)
        if (sessions.length > 0) {
          const latestSession = sessions[sessions.length - 1]
          setSessionId(latestSession.id)
          setVehicleNumber(latestSession.vehicleNumber || "")

          // Convertir las fotos al formato que espera el componente
          const photoArray: string[] = []
          latestSession.photos.forEach((photo: any) => {
            const index = ["Frontal", "Lateral Izquierdo", "Trasero", "Lateral Derecho"].indexOf(photo.side)
            if (index >= 0) {
              photoArray[index] = photo.photoUrl || photo.dataUrl
            }
          })

          setPhotos(photoArray)
          setShowVehicleForm(false)
        }
      }
    } catch (error) {
      console.error("Error loading existing session:", error)
    }
  }

  // Guardar una foto en la base de datos
  const savePhotoToDB = async (photoDataUrl: string, sideIndex: number) => {
    try {
      setIsLoading(true)

      // Mapear el índice al nombre del lado
      const sides = ["Frontal", "Lateral Izquierdo", "Trasero", "Lateral Derecho"]
      const side = sides[sideIndex]

      if (!side) {
        throw new Error("Invalid side index")
      }

      try {
        // Guardar la foto en Vercel Blob
        await savePhoto(vehicleNumber, side, photoDataUrl)
      } catch (error) {
        console.error("Error saving to Vercel Blob, falling back to localStorage:", error)
        // El fallback a localStorage ya está implementado en savePhoto
      }

      // Actualizar el estado local
      const newPhotos = [...photos]
      newPhotos[sideIndex] = photoDataUrl // Guardamos la versión original en el estado local para mostrarla
      setPhotos(newPhotos)

      return true
    } catch (error) {
      console.error("Error saving photo:", error)
      toast.error("Error al guardar la foto")

      // Intentar guardar solo en localStorage como último recurso
      try {
        savePhotoToLocalStorage(photoDataUrl, sideIndex)

        // Actualizar el estado local
        const newPhotos = [...photos]
        newPhotos[sideIndex] = photoDataUrl
        setPhotos(newPhotos)

        toast.success("Foto guardada localmente (modo sin conexión)")
        return true
      } catch (localError) {
        console.error("Error saving to localStorage:", localError)
        return false
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminar una foto de la base de datos
  const removePhotoFromDB = async (sideIndex: number) => {
    try {
      setIsLoading(true)

      // Actualizar el estado local
      const newPhotos = [...photos]
      newPhotos[sideIndex] = ""
      setPhotos(newPhotos)

      // También eliminar de localStorage para compatibilidad
      removePhotoFromLocalStorage(sideIndex)

      return true
    } catch (error) {
      console.error("Error removing photo from DB:", error)
      toast.error("Error al eliminar la foto de la base de datos")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar una foto en localStorage (para compatibilidad)
  const savePhotoToLocalStorage = (photoDataUrl: string, sideIndex: number) => {
    try {
      const sides = ["Frontal", "Lateral Izquierdo", "Trasero", "Lateral Derecho"]
      const side = sides[sideIndex]

      if (!side) {
        throw new Error("Invalid side index")
      }

      const storedSessions = localStorage.getItem("photoSessions")
      const sessions = storedSessions ? JSON.parse(storedSessions) : []

      // Si no hay sesiones, crear una nueva
      if (sessions.length === 0) {
        const newSessionId = `session_${Date.now()}`
        sessions.push({
          id: newSessionId,
          date: new Date().toISOString(),
          vehicleNumber,
          photos: [],
        })
        setSessionId(newSessionId)
      }

      // Obtener la última sesión
      const currentSession = sessions[sessions.length - 1]

      // Buscar si ya existe una foto para este lado
      const existingPhotoIndex = currentSession.photos.findIndex((p: any) => p.side === side)

      if (existingPhotoIndex >= 0) {
        // Actualizar la foto existente
        currentSession.photos[existingPhotoIndex] = {
          side,
          photoUrl: photoDataUrl,
          timestamp: new Date().toISOString(),
        }
      } else {
        // Agregar una nueva foto
        currentSession.photos.push({
          side,
          photoUrl: photoDataUrl,
          timestamp: new Date().toISOString(),
        })
      }

      // Guardar las sesiones actualizadas
      localStorage.setItem("photoSessions", JSON.stringify(sessions))
    } catch (error) {
      console.error("Error saving photo to localStorage:", error)
    }
  }

  // Eliminar una foto de localStorage (para compatibilidad)
  const removePhotoFromLocalStorage = (sideIndex: number) => {
    try {
      const sides = ["Frontal", "Lateral Izquierdo", "Trasero", "Lateral Derecho"]
      const side = sides[sideIndex]

      if (!side) {
        return
      }

      const storedSessions = localStorage.getItem("photoSessions")
      if (!storedSessions) {
        return
      }

      const sessions = JSON.parse(storedSessions)
      if (sessions.length === 0) {
        return
      }

      // Obtener la última sesión
      const currentSession = sessions[sessions.length - 1]

      // Eliminar la foto para este lado
      currentSession.photos = currentSession.photos.filter((p: any) => p.side !== side)

      // Guardar las sesiones actualizadas
      localStorage.setItem("photoSessions", JSON.stringify(sessions))
    } catch (error) {
      console.error("Error removing photo from localStorage:", error)
    }
  }

  // Manejar el envío del formulario de número de vehículo
  const handleVehicleNumberSubmit = (e: React.FormEvent): boolean => {
    e.preventDefault()

    // Validar el número de vehículo
    if (!vehicleNumber.trim()) {
      setVehicleNumberError("El número de vehículo es obligatorio")
      return false
    }

    // Crear una nueva sesión
    const newSessionId = `session-${vehicleNumber}-${Date.now()}`
    setSessionId(newSessionId)
    setShowVehicleForm(false)

    // Crear una sesión en localStorage para compatibilidad
    try {
      const storedSessions = localStorage.getItem("photoSessions")
      const sessions = storedSessions ? JSON.parse(storedSessions) : []

      sessions.push({
        id: newSessionId,
        date: new Date().toISOString(),
        vehicleNumber,
        photos: [],
      })

      localStorage.setItem("photoSessions", JSON.stringify(sessions))
    } catch (error) {
      console.error("Error creating session in localStorage:", error)
    }

    return true
  }

  return {
    sessionId,
    photos,
    setPhotos,
    vehicleNumber,
    setVehicleNumber,
    vehicleNumberError,
    setVehicleNumberError,
    showVehicleForm,
    setShowVehicleForm,
    isLoading,
    savePhotoToDB,
    removePhotoFromDB,
    savePhotoToLocalStorage,
    removePhotoFromLocalStorage,
    handleVehicleNumberSubmit,
  }
}

