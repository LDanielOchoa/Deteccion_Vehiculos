"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Truck, Camera } from "lucide-react"

interface VehicleFormProps {
  vehicleNumber: string
  setVehicleNumber: (value: string) => void
  vehicleNumberError: string
  handleVehicleNumberSubmit: (e: React.FormEvent) => boolean
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  vehicleNumber,
  setVehicleNumber,
  vehicleNumberError,
  handleVehicleNumberSubmit,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto anim-item anim-slide-up"
    >
      <div className="text-center mb-8 anim-item anim-slide-up">
        <div className="relative mb-6 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-green-200/50 to-emerald-300/50 rounded-full blur-xl transform scale-110 animate-pulse-slow"></div>
          <div className="relative bg-gradient-to-br from-green-100 to-emerald-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg transform transition-transform duration-500 hover:scale-105 hover:rotate-3 group">
            <Truck className="w-12 h-12 text-green-600 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Información del Vehículo</h1>
        <p className="text-gray-600 max-w-sm mx-auto">
          Ingresa el número del vehículo para comenzar la captura de fotos
        </p>
      </div>

      <Card className="border-green-100 shadow-lg overflow-hidden anim-item anim-slide-up">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <div className="bg-gradient-to-r from-green-100 to-emerald-200 w-8 h-8 rounded-full flex items-center justify-center">
              <Truck className="h-4 w-4 text-green-700" />
            </div>
            <span>Registro de Vehículo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleVehicleNumberSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">
                  Número del Vehículo
                </Label>
                <Input
                  id="vehicleNumber"
                  placeholder="Ingrese el número del vehículo"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className={`border ${vehicleNumberError ? "border-red-300" : "border-green-200"} focus:border-green-400 rounded-lg`}
                />
                {vehicleNumberError && <p className="text-sm text-red-500">{vehicleNumberError}</p>}
              </div>
              <p className="text-sm text-gray-500">
                Este número se guardará junto con las fotos para identificar el vehículo en el historial.
              </p>
            </div>
            <div className="mt-6">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Continuar con la captura
                  <ChevronRight className="ml-1 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-green-50 border-t border-green-100 text-xs text-gray-500 py-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <p>Buses compatibles: Runners, Agrale, NPR del sistema alimentador oriental 6 de Medellín</p>
          </div>
        </CardFooter>
      </Card>

      {/* Decorative cards */}
      <div className="mt-12 grid grid-cols-2 gap-4 anim-item anim-slide-up">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-green-100/50 h-24 relative overflow-hidden group transform transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-300 to-emerald-500 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
            <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-gradient-to-tl from-green-100 to-transparent rounded-full opacity-60"></div>
            <div className="p-4 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-green-600" />
                </div>
                <div className="bg-green-50 rounded-full w-5 h-5 flex items-center justify-center">
                  <span className="text-xs font-semibold text-green-700">{index}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  {index === 1
                    ? "Vista frontal"
                    : index === 2
                      ? "Lateral izquierdo"
                      : index === 3
                        ? "Trasero"
                        : "Lateral derecho"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

