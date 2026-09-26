import type { RefObject } from 'react'

import { PlainTextFeature } from '../features/plain-text/PlainTextFeature'
import { RemoveSpacesFeature } from '../features/remove-spaces/RemoveSpacesFeature'
import { ReplaceFeature } from '../features/replace/ReplaceFeature'
import { StatisticsFeature } from '../features/statistics/StatisticsFeature'
import type { FeatureId } from '../types/app'
import { FEATURE_LABELS } from '../types/app'
import { TabBar } from './TabBar'

interface AppShellProps {
  activeFeature: FeatureId
  inputRef: RefObject<HTMLTextAreaElement | null>
  onFeatureChange: (feature: FeatureId) => void
  warning?: string
  onDismissWarning?: () => void
}

function ActiveFeature({
  activeFeature,
  inputRef,
}: Pick<AppShellProps, 'activeFeature' | 'inputRef'>) {
  switch (activeFeature) {
    case 'remove-spaces':
      return <RemoveSpacesFeature inputRef={inputRef} />
    case 'statistics':
      return <StatisticsFeature inputRef={inputRef} />
    case 'replace':
      return <ReplaceFeature inputRef={inputRef} />
    case 'plain-text':
    default:
      return <PlainTextFeature inputRef={inputRef} />
  }
}

export function AppShell({
  activeFeature,
  inputRef,
  onFeatureChange,
  warning,
  onDismissWarning,
}: AppShellProps) {
  return (
    <main className="app-shell">
      <div className="app-container">
        <header className="app-header">
          <p className="app-kicker">LOCAL TEXT TOOL</p>
          <h1>CleanPaste</h1>
          <p className="app-description">简洁、离线、即时处理你的文本。</p>
          {warning ? (
            <div className="native-warning" role="status" aria-live="polite">
              <span>{warning}</span>
              {onDismissWarning ? (
                <button type="button" aria-label="关闭提示" onClick={onDismissWarning}>
                  关闭
                </button>
              ) : null}
            </div>
          ) : null}
        </header>
        <TabBar activeFeature={activeFeature} onSelect={onFeatureChange} />
        <section
          className="feature-panel"
          role="tabpanel"
          aria-label={FEATURE_LABELS[activeFeature]}
          tabIndex={-1}
        >
          <ActiveFeature activeFeature={activeFeature} inputRef={inputRef} />
        </section>
      </div>
    </main>
  )
}
