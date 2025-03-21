"use client";

import { motion } from "framer-motion";
import { Camera, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PermissionRequestProps {
  onPermissionGranted: () => void;
  onCancel: () => void;
}

export default function PermissionRequest({
  onPermissionGranted,
  onCancel,
}: PermissionRequestProps) {
  const handleRequestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      onPermissionGranted();
    } catch (error) {
      console.error("Error requesting camera permission:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Camera className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Permiso de Cámara Requerido
        </h2>
        <p className="text-gray-600 text-sm">
          Para capturar fotos de su vehículo, necesitamos acceso a la cámara de su dispositivo
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-gray-900 font-medium mb-1">Su privacidad es importante</p>
            <p className="text-gray-600">
              Solo utilizaremos la cámara cuando usted esté capturando fotos. No almacenamos ni compartimos el acceso a su cámara.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleRequestPermission}
        >
          <Camera className="w-4 h-4 mr-2" />
          Permitir cámara
        </Button>
      </div>
    </motion.div>
  );
}