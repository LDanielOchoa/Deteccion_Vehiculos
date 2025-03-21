"use client"

import { useState, useEffect } from "react"
import { Camera, Menu, ImageIcon, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter()
  const [showCamera, setShowCamera] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)

    // Add animation classes after component mounts
    const animElements = document.querySelectorAll(".anim-item")
    animElements.forEach((el, index) => {
      setTimeout(
        () => {
          el.classList.add("anim-visible")
        },
        100 + index * 150,
      )
    })
  }, [])

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-to-b from-green-100/40 to-emerald-200/30 blur-[80px] animate-float"></div>
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-t from-teal-100/30 to-blue-100/20 blur-[100px] animate-float-slow"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-[40%] left-[15%] w-[30%] h-[30%] rounded-full bg-gradient-to-r from-yellow-100/20 to-green-100/20 blur-[80px] animate-float-slow"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-green-100 anim-item anim-slide-down">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10 hover:bg-green-100/80 hover:text-green-700 transition-all duration-300 focus:ring-2 focus:ring-green-200"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="border-r border-green-100 w-72">
                  <SheetHeader className="pb-6">
                    <SheetTitle className="text-green-800 flex items-center gap-2">
                      <div className="bg-gradient-to-r from-green-100 to-green-200 w-8 h-8 rounded-full flex items-center justify-center">
                        <Camera className="h-4 w-4 text-green-700" />
                      </div>
                      <span className="font-semibold text-xl">Auto Capture</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="space-y-1">
                    <div className="px-3 py-2">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Menu</h3>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-lg p-3 text-green-800 hover:bg-green-50 hover:text-green-700 transition-all duration-200 group"
                      onClick={() => router.push("/historial")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                          <ImageIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <span>Historial de fotos</span>
                      </div>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="ml-4">
                <span className="font-medium text-green-800">Auto Capture</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          {/* Camera icon with animations */}
          <div className="relative mb-12 mx-auto anim-item">
            <div className="absolute inset-0 bg-gradient-to-b from-green-200/50 to-emerald-300/50 rounded-full blur-xl transform scale-110 animate-pulse-slow"></div>
            <div className="relative bg-gradient-to-br from-green-100 to-emerald-200 w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-lg transform transition-transform duration-500 hover:scale-105 hover:rotate-3 group">
              <Camera className="w-16 h-16 text-green-600 transition-transform duration-300 group-hover:scale-110" />
            </div>
          </div>

          {/* Heading text */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight anim-item">¿Listo para capturar fotos?</h1>

          {/* Subheading */}
          <p className="text-xl text-gray-600 mb-10 anim-item">
            Captura fotos de los 4 lados del vehículo siguiendo nuestras instrucciones
          </p>

          {/* Action button with animations */}
          <div className="anim-item">
            <Button
              onClick={() => router.push("/instrucciones")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg px-10 py-7 rounded-2xl shadow-lg 
              transition-all duration-300 transform hover:scale-[1.03] hover:shadow-xl 
              focus:outline-none focus:ring-4 focus:ring-green-500/30
              active:scale-[0.98] group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Comenzar captura
                <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
            </Button>
          </div>

          {/* Decorative cards */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-green-100/50 h-36 relative overflow-hidden group transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg anim-item"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-300 to-emerald-500 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                <div className="absolute -bottom-1 -right-1 w-20 h-20 bg-gradient-to-tl from-green-100 to-transparent rounded-full opacity-60"></div>
                <div className="p-6 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="bg-green-50 rounded-full w-6 h-6 flex items-center justify-center">
                      <span className="text-xs font-semibold text-green-700">{index}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Foto {index}</h3>
                    <p className="text-xs text-gray-500">
                      Vista{" "}
                      {index === 1
                        ? "frontal"
                        : index === 2
                          ? "lateral izquierda"
                          : index === 3
                            ? "lateral derecha"
                            : "trasera"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

