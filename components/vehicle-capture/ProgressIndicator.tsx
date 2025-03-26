import type React from "react"
import { CheckCircle } from "lucide-react"
import { SIDES, SIDE_ICONS, SIDE_COLORS } from "@/constants/vehicle-capture"

interface ProgressIndicatorProps {
  currentSide: number
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentSide }) => {
  return (
    <div className="flex justify-center items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm max-w-xs mx-auto border border-green-100">
      {SIDES.map((side, index) => (
        <div
          key={index}
          className={`flex flex-col items-center transition-all duration-300 ${
            index === currentSide ? "scale-110" : "opacity-70"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index < currentSide
                ? "bg-green-100 text-green-600"
                : index === currentSide
                  ? `bg-gradient-to-br ${SIDE_COLORS[side as keyof typeof SIDE_COLORS]} text-white`
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {index < currentSide ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <span className="text-sm font-bold">{SIDE_ICONS[side as keyof typeof SIDE_ICONS]}</span>
            )}
          </div>
          <span className={`text-xs mt-1 ${index === currentSide ? "font-medium text-gray-900" : "text-gray-500"}`}>
            {index + 1}
          </span>
        </div>
      ))}
    </div>
  )
}

