import type { FeatureId } from '../types/app'
import { FEATURE_LABELS, FEATURE_ORDER } from '../types/app'

interface TabBarProps {
  activeFeature: FeatureId
  onSelect: (feature: FeatureId) => void
}

export function TabBar({ activeFeature, onSelect }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="功能导航">
      <div
        className="tab-list"
        role="tablist"
        aria-label="CleanPaste 功能"
        style={{ overflowX: 'visible', overflowY: 'visible' }}
      >
        {FEATURE_ORDER.map((feature) => (
          <button
            key={feature}
            className={`tab-button ${activeFeature === feature ? 'tab-button-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeFeature === feature}
            onClick={() => onSelect(feature)}
          >
            {FEATURE_LABELS[feature]}
          </button>
        ))}
      </div>
    </nav>
  )
}
