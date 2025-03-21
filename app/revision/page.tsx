"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Revision() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);

  const handleRetakePhoto = (index: number) => {
    router.push(`/captura?retake=${index}`);
  };

  const handleSavePhotos = () => {
    // Aquí iría la lógica para guardar las fotos
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Revisar fotos</h1>
          <p className="text-gray-600 mt-2">
            Verifica que las fotos sean claras y muestren correctamente cada lado
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {["Frontal", "Lateral Izquierdo", "Trasero", "Lateral Derecho"].map(
            (side, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                  {photos[index] ? (
                    <img
                      src={photos[index]}
                      alt={`Lado ${side}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Camera className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <Button
                    onClick={() => handleRetakePhoto(index)}
                    className="absolute bottom-2 right-2 bg-white text-gray-900"
                    size="sm"
                  >
                    Volver a tomar
                  </Button>
                </div>
                <p className="text-center text-sm font-medium">{side}</p>
              </div>
            )
          )}
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={() => router.push("/captura")}
            variant="outline"
            className="px-8"
          >
            <X className="mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSavePhotos}
            className="bg-green-600 hover:bg-green-700 text-white px-8"
          >
            <Check className="mr-2" />
            Guardar fotos
          </Button>
        </div>
      </div>
    </div>
  );
}