export interface PhotoSession {
    id: string
    date: string
    vehicleNumber: string
    photos: {
      side: string
      dataUrl: string
      timestamp: string
    }[]
  }
  
  export type Orientation = "portrait" | "landscape"
  
  