"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"

export const useCamera = () => {
  // Refs para los elementos de video y canvas
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Estado para la gestión del stream y errores
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Estado y controles para el zoom
  const [zoomLevel, setZoomLevel] = useState(1)
  const [initialTouchDistance, setInitialTouchDistance] = useState<number | null>(null)
  const [initialZoomLevel, setInitialZoomLevel] = useState<number>(1)
  const [showZoomControls, setShowZoomControls] = useState(false)

  // Ref para detectar doble toque (double tap)
  const lastTapRef = useRef<number>(0)

  // Inicia la cámara solicitando permisos y configurando el stream
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true)
      setCameraError(null)

      // Si hay un stream previo, detenerlo
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      // Función auxiliar para probar distintas constraints
      const tryWithConstraints = async (constraints: MediaStreamConstraints) => {
        try {
          console.log("Solicitando acceso a la cámara con constraints:", constraints)
          return await navigator.mediaDevices.getUserMedia(constraints)
        } catch (error) {
          console.warn("Fallo con constraints:", constraints, error)
          throw error
        }
      }

      let newStream;
      // Primero intenta con alta resolución
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
        // Si falla, intenta con resolución más baja
        const lowResConstraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }
        newStream = await tryWithConstraints(lowResConstraints)
      }

      console.log("Acceso a la cámara concedido:", newStream)
      setStream(newStream)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream

        // Timeout para manejar casos en que los metadatos tarden en cargar
        const metadataTimeout = setTimeout(() => {
          if (isLoading) {
            console.warn("Timeout en la carga de metadatos - forzando inicio")
            setIsLoading(false)
          }
        }, 5000)

        videoRef.current.onloadedmetadata = () => {
          console.log("Metadatos del video cargados")
          clearTimeout(metadataTimeout)
          setIsLoading(false)
        }

        videoRef.current.onloadeddata = () => {
          console.log("Datos del video cargados")
        }

        videoRef.current.onerror = (e) => {
          console.error("Error en el elemento de video:", e)
          clearTimeout(metadataTimeout)
          setCameraError("Error al cargar el video")
          setIsLoading(false)
        }
      } else {
        console.error("Referencia de video es null")
        setCameraError("Error: Elemento de video no disponible")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err)
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos.")
      toast.error("Error al acceder a la cámara", {
        description: "Verifica los permisos de la cámara en tu navegador",
      })
      setIsLoading(false)
    }
  }, [isLoading, stream])

  // Detiene la cámara liberando todos los tracks
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  // Captura la foto aplicando el zoom actual
  const takePhoto = useCallback(() => {
    if (videoRef.current) {
      // Se crea un canvas temporal para dibujar la imagen
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Calcular dimensiones y posición en función del zoom
        const sourceWidth = videoRef.current.videoWidth / zoomLevel
        const sourceHeight = videoRef.current.videoHeight / zoomLevel
        const sourceX = (videoRef.current.videoWidth - sourceWidth) / 2
        const sourceY = (videoRef.current.videoHeight - sourceHeight) / 2

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(
          videoRef.current,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height
        )

        // Se devuelve la imagen en formato dataURL
        return canvas.toDataURL("image/jpeg", 0.92)
      }
    }
    return null
  }, [zoomLevel])

  // Reintenta el acceso a la cámara
  const retryCamera = useCallback(() => {
    setCameraError(null)
    startCamera()
  }, [startCamera])

  // Funciones de control del zoom
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2.6))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 1))
  }, [])

  const handleZoomChange = useCallback((value: number[]) => {
    // Usar requestAnimationFrame para una animación más fluida
    requestAnimationFrame(() => {
      setZoomLevel(value[0])
    })
  }, [])

  // Handlers para el pinch zoom (uso de dos dedos)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      setInitialTouchDistance(distance)
      setInitialZoomLevel(zoomLevel)
      // Prevenir el comportamiento de desplazamiento
      e.preventDefault()
    }
  }, [zoomLevel])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistance !== null) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      // Cálculo del nuevo zoom con factor de escala suavizado
      const scale = distance / initialTouchDistance
      const scaleFactor = Math.pow(scale, 0.7)
      const newZoom = Math.max(1, Math.min(2.6, initialZoomLevel * scaleFactor))

      requestAnimationFrame(() => {
        setZoomLevel(newZoom)
      })

      e.preventDefault()
    }
  }, [initialTouchDistance, initialZoomLevel])

  const handleTouchEnd = useCallback(() => {
    setInitialTouchDistance(null)
  }, [])

  // Handler para detectar doble toque y tomar la foto
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    // Solo considerar toques de un dedo para el doble toque
    if (e.touches.length > 0) return

    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300 // milisegundos
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Doble toque detectado: tomar la foto
      const photo = takePhoto()
      if (photo) {
        toast.success("Foto tomada")
        console.log("Foto tomada:", photo)
        // Aquí podrías agregar lógica adicional, por ejemplo, guardar la foto o actualizar el estado
      } else {
        toast.error("Error al capturar la foto")
      }
    }
    lastTapRef.current = now
  }, [takePhoto])

  return {
    videoRef,
    canvasRef,
    stream,
    isLoading,
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
    handleDoubleTap, // Agregado para el doble toque
  }
}
