"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, User, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  })
  const [errors, setErrors] = useState({
    username: "",
    password: "",
    general: "",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      username: "",
      password: "",
      general: "",
    }

    // Username validation
    if (!credentials.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido"
      isValid = false
    }

    // Password validation
    if (!credentials.password) {
      newErrors.password = "La contraseña es requerida"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setCredentials({
      ...credentials,
      [name]: value,
    })

    // Clear error when typing
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset general error
    setErrors({
      ...errors,
      general: "",
    })

    // Validate form
    if (!validateForm()) {
      // Show toast for validation errors
      toast.error("Por favor, completa todos los campos requeridos")

      // Add shake animation
      const form = document.getElementById("login-form")
      form?.classList.add("animate-shake")
      setTimeout(() => form?.classList.remove("animate-shake"), 500)

      return
    }

    setLoading(true)

    try {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check credentials
      if (credentials.username === "sao6" && credentials.password === "sao62025&") {
        // Success
        toast.success("¡Inicio de sesión exitoso!")

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 800)
      } else {
        // Failed login
        setLoading(false)

        // Set general error
        setErrors({
          ...errors,
          general: "Credenciales incorrectas. Por favor, verifica tu usuario y contraseña.",
        })

        // Show toast
        toast.error("Credenciales incorrectas", {
          description: "Por favor, verifica tu usuario y contraseña.",
        })

        // Add shake animation
        const form = document.getElementById("login-form")
        form?.classList.add("animate-shake")
        setTimeout(() => form?.classList.remove("animate-shake"), 500)
      }
    } catch (error) {
      setLoading(false)

      // Set general error
      setErrors({
        ...errors,
        general: "Error de conexión. Por favor, inténtalo de nuevo más tarde.",
      })

      // Show toast
      toast.error("Error de conexión", {
        description: "Por favor, inténtalo de nuevo más tarde.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full opacity-50 blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full opacity-50 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Card with shadow and hover effects */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-8 transform transition-all duration-500 hover:shadow-2xl">
          {/* Header with logo and title */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-green-100 to-emerald-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md transform transition-transform duration-500 hover:scale-105">
              <Camera className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h1>
            <p className="text-gray-600">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Login form */}
          <form id="login-form" onSubmit={handleLogin} className="space-y-6">
            {/* General error message */}
            {errors.general && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fadeIn">
                <div className="flex">
                  <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Username field */}
              <div className="space-y-2">
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200"
                    size={18}
                  />
                  <Input
                    type="text"
                    name="username"
                    placeholder="Nombre de usuario"
                    value={credentials.username}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.username ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"} rounded-lg transition-all duration-300`}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-xs pl-2 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password field with show/hide toggle */}
              <div className="space-y-2">
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200"
                    size={18}
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Contraseña"
                    value={credentials.password}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full pl-10 pr-10 py-3 border ${errors.password ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"} rounded-lg transition-all duration-300`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs pl-2 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Ingresando...
                </div>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Card shadow effect */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-5/6 h-4 bg-black/5 rounded-full blur-md"></div>
      </div>
    </div>
  )
}

