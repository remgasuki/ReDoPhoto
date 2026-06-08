import { useIdPhotoStore } from '../../stores/idphotoStore'
import IdPhotoImport from './IdPhotoImport'
import IdPhotoPreview from './IdPhotoPreview'
import IdPhotoRecolorPreview from './IdPhotoRecolorPreview'
import IdPhotoExecute from './IdPhotoExecute'
import type { ThemeClasses } from '../../types/theme'

interface IdPhotoFeatureProps {
  theme: ThemeClasses
}

export default function IdPhotoFeature({ theme }: IdPhotoFeatureProps) {
  const phase = useIdPhotoStore((s) => s.phase)

  return (
    <>
      {phase === 'import' && <IdPhotoImport theme={theme} />}
      {phase === 'preview' && <IdPhotoPreview theme={theme} />}
      {phase === 'recolor_preview' && <IdPhotoRecolorPreview theme={theme} />}
      {(phase === 'executing' || phase === 'done') && <IdPhotoExecute theme={theme} />}
    </>
  )
}
