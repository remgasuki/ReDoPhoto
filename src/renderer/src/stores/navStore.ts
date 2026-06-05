import { create } from 'zustand'

export type Feature = 'dedup' | 'rename' | 'orientation'

interface NavState {
  activeFeature: Feature
  setFeature: (feature: Feature) => void
}

export const useNavStore = create<NavState>((set) => ({
  activeFeature: 'dedup',
  setFeature: (feature) => set({ activeFeature: feature })
}))
