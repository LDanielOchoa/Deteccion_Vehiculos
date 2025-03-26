import { type NextRequest, NextResponse } from "next/server"
import { getAllSessions, getSession, savePhoto } from "@/app/actions/photo-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (sessionId) {
      // Get a specific session
      const session = await getSession(sessionId)

      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      return NextResponse.json({ session })
    } else {
      // Get all sessions
      const sessions = await getAllSessions()
      return NextResponse.json({ sessions })
    }
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleNumber, side, photoData } = body

    if (!vehicleNumber || !side || !photoData) {
      return NextResponse.json({ error: "Vehicle number, side, and photo data are required" }, { status: 400 })
    }

    // Save photo to Redis
    const photoId = await savePhoto(vehicleNumber, side, photoData)

    return NextResponse.json({ success: true, photoId })
  } catch (error) {
    console.error("Error saving photo:", error)
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 })
  }
}

