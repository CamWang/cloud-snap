import { createContext } from 'react'

type ImagesContextType = {
  images: string[],
  setImages: React.Dispatch<React.SetStateAction<string[]>> | null
}

export const ImagesContext = createContext<ImagesContextType>({
  images: [],
  setImages: null
})