import { useState, useRef, useCallback, type DragEvent } from 'react'

interface PathValidationResult {
  path: string
  type: 'file' | 'directory' | 'invalid'
  isImage: boolean
}

interface UseDropZoneOptions {
  accept: 'folder' | 'image' | 'any'
  onDropFolder?: (path: string) => void
  onDropImage?: (path: string) => void
  onError?: (message: string) => void
}

interface DropZoneProps {
  onDragEnter: (e: DragEvent<HTMLElement>) => void
  onDragOver: (e: DragEvent<HTMLElement>) => void
  onDragLeave: (e: DragEvent<HTMLElement>) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
}

export function useDropZone({ accept, onDropFolder, onDropImage, onError }: UseDropZoneOptions) {
  const [isDragActive, setIsDragActive] = useState(false)
  const dragCounter = useRef(0)

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    dragCounter.current = 0

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const paths = Array.from(files).map((f) => (f as any).path as string).filter(Boolean)
    if (paths.length === 0) return

    try {
      const results: PathValidationResult[] = await window.api.validatePaths(paths)

      for (const result of results) {
        if (result.type === 'invalid') {
          onError?.(`Invalid path: ${result.path}`)
          continue
        }

        if (accept === 'folder' && result.type === 'directory') {
          onDropFolder?.(result.path)
          return
        }

        if (accept === 'image' && result.type === 'file' && result.isImage) {
          onDropImage?.(result.path)
          return
        }

        if (accept === 'any') {
          if (result.type === 'directory') {
            onDropFolder?.(result.path)
            return
          }
          if (result.isImage) {
            onDropImage?.(result.path)
            return
          }
        }

        // Mismatch
        if (accept === 'folder' && result.type !== 'directory') {
          onError?.('Please drop a folder')
        } else if (accept === 'image' && !result.isImage) {
          onError?.('Please drop an image file')
        }
      }
    } catch (err) {
      onError?.(String(err))
    }
  }, [accept, onDropFolder, onDropImage, onError])

  const dropZoneProps: DropZoneProps = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  }

  return { isDragActive, dropZoneProps }
}
