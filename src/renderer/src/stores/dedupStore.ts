import { create } from 'zustand'
import type { DedupDecision, DuplicateGroup } from '../types'

interface DedupState {
  decisions: Map<string, DedupDecision>

  setDecision: (groupId: string, keepFileIds: string[], deleteFileIds: string[]) => void
  keepLeft: (group: DuplicateGroup) => void
  keepRight: (group: DuplicateGroup) => void
  keepAllLeft: (groups: DuplicateGroup[]) => void
  keepAllRight: (groups: DuplicateGroup[]) => void
  clearAll: () => void
  getDecisionsArray: () => DedupDecision[]
  getStats: (groups: DuplicateGroup[]) => { total: number; decided: number; pending: number }
  hasDecision: (groupId: string) => boolean
}

export const useDedupStore = create<DedupState>((set, get) => ({
  decisions: new Map(),

  setDecision: (groupId, keepFileIds, deleteFileIds) => {
    set((state) => {
      const newDecisions = new Map(state.decisions)
      newDecisions.set(groupId, { groupId, keepFileIds, deleteFileIds })
      return { decisions: newDecisions }
    })
  },

  keepLeft: (group) => {
    if (group.files.length < 2) return
    const keep = [group.files[0].id]
    const del = group.files.slice(1).map((f) => f.id)
    get().setDecision(group.groupId, keep, del)
  },

  keepRight: (group) => {
    if (group.files.length < 2) return
    const keep = [group.files[group.files.length - 1].id]
    const del = group.files.slice(0, -1).map((f) => f.id)
    get().setDecision(group.groupId, keep, del)
  },

  keepAllLeft: (groups) => {
    set(() => {
      const newDecisions = new Map<string, DedupDecision>()
      for (const group of groups) {
        if (group.files.length < 2) continue
        const keep = [group.files[0].id]
        const del = group.files.slice(1).map((f) => f.id)
        newDecisions.set(group.groupId, { groupId: group.groupId, keepFileIds: keep, deleteFileIds: del })
      }
      return { decisions: newDecisions }
    })
  },

  keepAllRight: (groups) => {
    set(() => {
      const newDecisions = new Map<string, DedupDecision>()
      for (const group of groups) {
        if (group.files.length < 2) continue
        const keep = [group.files[group.files.length - 1].id]
        const del = group.files.slice(0, -1).map((f) => f.id)
        newDecisions.set(group.groupId, { groupId: group.groupId, keepFileIds: keep, deleteFileIds: del })
      }
      return { decisions: newDecisions }
    })
  },

  clearAll: () => set({ decisions: new Map() }),

  getDecisionsArray: () => {
    return Array.from(get().decisions.values())
  },

  getStats: (groups) => {
    const total = groups.length
    const decided = get().decisions.size
    return { total, decided, pending: total - decided }
  },

  hasDecision: (groupId) => get().decisions.has(groupId)
}))
