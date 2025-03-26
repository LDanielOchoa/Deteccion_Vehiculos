"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "sonner"

export const useVehicleDetection = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  videoRef: React.RefObject<HTMLVideoElement>,
  isLoading: boolean,
) => {
  const [vehicleDetected, setVehicleDetected] = useState(false)
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval)
      }
    }
  }, [simulationInterval])

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

  return {
    vehicleDetected,
    startDetectionSimulation,
    drawSimulatedDetection,
  }
}

