"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Image, Upload, X } from "lucide-react"
import { SIDES } from "@/constants/vehicle-capture"

interface UploadViewProps {
  uploadedImage: string | null
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearImage: () => void
  currentSide: number
}

export const UploadView: React.FC<UploadViewProps> = ({
  uploadedImage,
  fileInputRef,
  onFileUpload,
  onClearImage,
  currentSide,
}) => {
  return (
    <div className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-xl border border-green-200 flex flex-col items-center justify-center anim-item anim-slide-up">
      {uploadedImage ? (
        <div className="relative w-full h-full">
          <img
            src={uploadedImage || "/placeholder.svg"}
            alt="Imagen cargada"
            className="w-full h-full object-contain"
          />
          <Button
            onClick={onClearImage}
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
          <input type="file" ref={fileInputRef} accept="image/*" onChange={onFileUpload} className="hidden" />
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
  )
}

