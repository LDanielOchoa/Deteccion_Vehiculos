"use client"

import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"
import type { Orientation } from "@/types/vehicle-capture"

export const useOrientation = () => {
  const isMobile = useMobile()
  const [deviceOrientation, setDeviceOrientation] = useState<Orientation>("portrait")

  useEffect(() => {
    if (!isMobile) return

    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight
      setDeviceOrientation(isLandscape ? "landscape" : "portrait")
    }

    // Configuración inicial
    handleOrientationChange()

    // Escuchar cambios de orientación
    window.addEventListener("resize", handleOrientationChange)
    window.addEventListener("orientationchange", handleOrientationChange)

    return () => {
      window.removeEventListener("resize", handleOrientationChange)
      window.removeEventListener("orientationchange", handleOrientationChange)
    }
  }, [isMobile])

  return deviceOrientation
}

