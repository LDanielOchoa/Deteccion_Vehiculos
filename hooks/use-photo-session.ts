"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { PhotoSession } from "@/types/vehicle-capture"
import { SIDES } from "@/constants/vehicle-capture"
import { toast } from "sonner"

export const usePhotoSession = (retakeIndex: string | null) => {
  const [sessionId, setSessionId] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [vehicleNumberError, setVehicleNumberError] = useState("")
  const [showVehicleForm, setShowVehicleForm] = useState(true)

  useEffect(() => {
    // Check if we're retaking a photo
    if (retakeIndex) {
      const index = Number.parseInt(retakeIndex)
      if (!isNaN(index) && index >= 0 && index < SIDES.length) {
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
  }, [retakeIndex])

  const savePhotoToLocalStorage = (photoDataUrl: string, currentSide: number) => {
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

  const removePhotoFromLocalStorage = (sideIndex: number) => {
    try {
      const existingSessions = localStorage.getItem("photoSessions")
      if (existingSessions) {
        const sessions: PhotoSession[] = JSON.parse(existingSessions)
        const currentSession = sessions.find((s) => s.id === sessionId)
        if (currentSession) {
          const sideToRemove = SIDES[sideIndex]
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

  const handleVehicleNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!vehicleNumber.trim()) {
      setVehicleNumberError("El número del vehículo es obligatorio")
      return false
    }

    // Clear any previous errors
    setVehicleNumberError("")

    // Hide form and start camera
    setShowVehicleForm(false)
    toast.success(`Vehículo #${vehicleNumber} registrado`, {
      description: "Iniciando cámara para captura de fotos",
    })

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
    savePhotoToLocalStorage,
    removePhotoFromLocalStorage,
    handleVehicleNumberSubmit,
  }
}

