import { useScanStore } from '../../stores/scanStore'
import ImportStep from '../ImportStep'
import ScanningStep from '../ScanningStep'
import CompareStep from '../CompareStep'
import ExecuteStep from '../ExecuteStep'
import type { ThemeClasses } from '../../types/theme'

interface DedupFeatureProps {
  theme: ThemeClasses
}

export default function DedupFeature({ theme }: DedupFeatureProps) {
  const phase = useScanStore((s) => s.phase)

  return (
    <>
      {phase === 'import' && <ImportStep theme={theme} />}
      {phase === 'scanning' && <ScanningStep theme={theme} />}
      {phase === 'comparing' && <CompareStep theme={theme} />}
      {(phase === 'executing' || phase === 'done') && <ExecuteStep theme={theme} />}
    </>
  )
}
