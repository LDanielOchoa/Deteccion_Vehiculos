"use server"

import { put, del, list, head } from "@vercel/blob";
import { nanoid } from "nanoid";

// Type definitions
export interface VehiclePhoto {
  id: string;
  vehicleNumber: string;
  side: string;
  photoUrl: string; // URL to the blob instead of base64 data
  timestamp: number;
}

export interface PhotoSession {
  id: string;
  vehicleNumber: string;
  timestamp: number;
  photos: VehiclePhoto[];
  completed: boolean;
}

// In-memory cache for development and fallback
let sessionsCache: Record<string, PhotoSession> = {};
let vehicleSessionsCache: Record<string, string> = {};

// Función para guardar en localStorage (solo en el cliente)
function saveToLocalStorage(vehicleNumber: string, side: string, photoData: string) {
  // Esta función solo debe ejecutarse en el cliente
  if (typeof window === "undefined") {
    console.log("No se puede usar localStorage en el servidor, omitiendo guardado local");
    return;
  }

  try {
    const photoId = `photo:${vehicleNumber}:${side}:${Date.now()}`;
    const photo = {
      id: photoId,
      vehicleNumber,
      side,
      photoUrl: photoData, // En localStorage guardamos el dataURL directamente
      timestamp: Date.now(),
    };

    // Guardar la foto
    localStorage.setItem(photoId, JSON.stringify(photo));

    // Actualizar o crear sesión
    const sessionId = `session:${vehicleNumber}:${Date.now()}`;
    let session = JSON.parse(localStorage.getItem(sessionId) || "null");

    if (!session) {
      session = {
        id: sessionId,
        vehicleNumber,
        timestamp: Date.now(),
        photos: [photo],
        completed: false,
      };
    } else {
      const existingPhotoIndex = session.photos.findIndex((p: any) => p.side === side);
      if (existingPhotoIndex >= 0) {
        session.photos[existingPhotoIndex] = photo;
      } else {
        session.photos.push(photo);
      }
      session.timestamp = Date.now();
    }

    localStorage.setItem(sessionId, JSON.stringify(session));
    localStorage.setItem(`vehicle:${vehicleNumber}:session`, sessionId);

    // Actualizar lista de sesiones
    const sessionKeys = JSON.parse(localStorage.getItem("sessionKeys") || "[]");
    if (!sessionKeys.includes(sessionId)) {
      sessionKeys.push(sessionId);
      localStorage.setItem("sessionKeys", JSON.stringify(sessionKeys));
    }
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

// Función para convertir base64 a Blob
function base64ToBlob(base64Data: string): Blob {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const byteCharacters = atob(parts[1]);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

// Modificar la función savePhoto para usar Vercel Blob
export async function savePhoto(vehicleNumber: string, side: string, photoData: string): Promise<string> {
  try {
    // Verificar si el token de Vercel Blob está configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("Vercel Blob token not configured, using local storage only");
      // Si estamos en el cliente, guardar en localStorage
      if (typeof window !== "undefined") {
        saveToLocalStorage(vehicleNumber, side, photoData);
      }
      return `photo:${vehicleNumber}:${side}:${Date.now()}`;
    }

    // Generate a unique ID for the photo
    const photoId = `photo-${vehicleNumber}-${side}-${nanoid(6)}`;
    
    // Extraer el tipo MIME y los datos
    const matches = photoData.match(/^data:(.+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 data format");
    }
    
    const contentType = matches[1];
    const base64Content = matches[2];
    
    // Convertir base64 a buffer para subir a Blob
    const buffer = Buffer.from(base64Content, 'base64');
    
    // Subir la imagen a Vercel Blob
    const blob = await put(photoId, buffer, {
      contentType,
      access: 'public',
    });

    // Create photo object
    const photo: VehiclePhoto = {
      id: photoId,
      vehicleNumber,
      side,
      photoUrl: blob.url,
      timestamp: Date.now(),
    };

    // Check if there's an existing session for this vehicle
    let sessionId: string;
    const existingSessionKey = vehicleSessionsCache[`vehicle:${vehicleNumber}:session`];

    if (existingSessionKey) {
      // Use existing session
      sessionId = existingSessionKey;

      // Get the existing session
      const sessionData = sessionsCache[sessionId];

      if (sessionData) {
        // Check if there's an existing photo for this side
        const existingPhotoIndex = sessionData.photos.findIndex((p) => p.side === side);

        if (existingPhotoIndex >= 0) {
          // Replace the existing photo - delete old blob first
          const oldPhotoId = sessionData.photos[existingPhotoIndex].id;
          try {
            await del(oldPhotoId);
          } catch (error) {
            console.warn(`Failed to delete old photo blob: ${oldPhotoId}`, error);
          }

          // Update the photos array
          const updatedPhotos = [...sessionData.photos];
          updatedPhotos[existingPhotoIndex] = photo;

          const updatedSession: PhotoSession = {
            ...sessionData,
            photos: updatedPhotos,
            timestamp: Date.now(), // Update timestamp
          };

          sessionsCache[sessionId] = updatedSession;
        } else {
          // Add new photo to session
          const updatedSession: PhotoSession = {
            ...sessionData,
            photos: [...sessionData.photos, photo],
            timestamp: Date.now(), // Update timestamp
          };

          sessionsCache[sessionId] = updatedSession;
        }
      }
    } else {
      // Create new session
      sessionId = `session-${vehicleNumber}-${nanoid(6)}`;

      // Store reference to latest session for this vehicle
      vehicleSessionsCache[`vehicle:${vehicleNumber}:session`] = sessionId;

      const newSession: PhotoSession = {
        id: sessionId,
        vehicleNumber,
        timestamp: Date.now(),
        photos: [photo],
        completed: false,
      };

      sessionsCache[sessionId] = newSession;
    }

    return photoId;
  } catch (error) {
    console.error("Error saving photo to Vercel Blob:", error);

    // Si estamos en el cliente, intentar guardar en localStorage
    if (typeof window !== "undefined") {
      saveToLocalStorage(vehicleNumber, side, photoData);
    }

    // No lanzar error, simplemente devolver un ID simulado
    return `photo:${vehicleNumber}:${side}:${Date.now()}`;
  }
}

/**
 * Get all sessions
 */
export async function getAllSessions(): Promise<PhotoSession[]> {
  try {
    // Verificar si el token de Vercel Blob está configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("Vercel Blob token not configured, using local storage only");
      return getLocalSessions();
    }

    // Return sessions from cache
    return Object.values(sessionsCache).sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error getting all sessions:", error);
    return getLocalSessions(); // Fallback a localStorage
  }
}

// Función de fallback para obtener sesiones de localStorage
function getLocalSessions(): PhotoSession[] {
  if (typeof window === "undefined") {
    return []; // En el servidor, devolver un array vacío
  }

  try {
    const sessionKeys = JSON.parse(localStorage.getItem("sessionKeys") || "[]");
    const sessions: PhotoSession[] = [];

    for (const key of sessionKeys) {
      const sessionData = localStorage.getItem(key);
      if (sessionData) {
        sessions.push(JSON.parse(sessionData));
      }
    }

    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error getting sessions from localStorage:", error);
    return [];
  }
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<PhotoSession | null> {
  try {
    // Verificar si el token de Vercel Blob está configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("Vercel Blob token not configured, using local storage only");
      return getLocalSession(sessionId);
    }

    const session = sessionsCache[sessionId];
    if (!session) {
      return getLocalSession(sessionId); // Fallback a localStorage
    }
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return getLocalSession(sessionId); // Fallback a localStorage
  }
}

// Función de fallback para obtener una sesión de localStorage
function getLocalSession(sessionId: string): PhotoSession | null {
  if (typeof window === "undefined") {
    return null; // En el servidor, devolver null
  }

  try {
    const sessionData = localStorage.getItem(sessionId);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    return null;
  } catch (error) {
    console.error("Error getting session from localStorage:", error);
    return null;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    // Verificar si el token de Vercel Blob está configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("Vercel Blob token not configured, using local storage only");
      return deleteLocalSession(sessionId);
    }

    const session = sessionsCache[sessionId];

    if (session) {
      // Eliminar todas las fotos en la sesión de Vercel Blob
      for (const photo of session.photos) {
        try {
          await del(photo.id);
        } catch (error) {
          console.warn(`Failed to delete photo blob: ${photo.id}`, error);
        }
      }

      // Eliminar la sesión del cache
      delete sessionsCache[sessionId];

      // Si esta es la sesión actual para el vehículo, eliminar la referencia
      const vehicleKey = `vehicle:${session.vehicleNumber}:session`;
      if (vehicleSessionsCache[vehicleKey] === sessionId) {
        delete vehicleSessionsCache[vehicleKey];
      }

      return true;
    }

    // Intentar eliminar de localStorage como fallback
    return deleteLocalSession(sessionId);
  } catch (error) {
    console.error("Error deleting session:", error);
    return deleteLocalSession(sessionId); // Fallback a localStorage
  }
}

// Función de fallback para eliminar una sesión de localStorage
function deleteLocalSession(sessionId: string): boolean {
  if (typeof window === "undefined") {
    return false; // En el servidor, devolver false
  }

  try {
    const sessionData = localStorage.getItem(sessionId);
    if (!sessionData) return false;

    const session = JSON.parse(sessionData);

    // Eliminar fotos
    for (const photo of session.photos) {
      localStorage.removeItem(photo.id);
    }

    // Eliminar sesión
    localStorage.removeItem(sessionId);

    // Eliminar referencia de vehículo si es necesario
    const vehicleSessionKey = `vehicle:${session.vehicleNumber}:session`;
    if (localStorage.getItem(vehicleSessionKey) === sessionId) {
      localStorage.removeItem(vehicleSessionKey);
    }

    // Actualizar lista de sesiones
    const sessionKeys = JSON.parse(localStorage.getItem("sessionKeys") || "[]");
    const updatedKeys = sessionKeys.filter((key: string) => key !== sessionId);
    localStorage.setItem("sessionKeys", JSON.stringify(updatedKeys));

    return true;
  } catch (error) {
    console.error("Error deleting session from localStorage:", error);
    return false;
  }
}

/**
 * Mark a session as completed
 */
export async function completeSession(sessionId: string): Promise<boolean> {
  try {
    // Verificar si el token de Vercel Blob está configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("Vercel Blob token not configured, using local storage only");
      return completeLocalSession(sessionId);
    }

    const session = sessionsCache[sessionId];

    if (session) {
      const updatedSession: PhotoSession = {
        ...session,
        completed: true,
      };

      sessionsCache[sessionId] = updatedSession;
      return true;
    }

    // Intentar completar en localStorage como fallback
    return completeLocalSession(sessionId);
  } catch (error) {
    console.error("Error completing session:", error);
    return completeLocalSession(sessionId); // Fallback a localStorage
  }
}

// Función de fallback para marcar una sesión como completada en localStorage
function completeLocalSession(sessionId: string): boolean {
  if (typeof window === "undefined") {
    return false; // En el servidor, devolver false
  }

  try {
    const sessionData = localStorage.getItem(sessionId);
    if (!sessionData) return false;

    const session = JSON.parse(sessionData);
    session.completed = true;

    localStorage.setItem(sessionId, JSON.stringify(session));
    return true;
  } catch (error) {
    console.error("Error completing session in localStorage:", error);
    return false;
  }
}
