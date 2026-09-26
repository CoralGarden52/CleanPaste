import { useEffect, useRef, useState } from 'react'

import { AppShell } from './components/AppShell'
import type { FeatureId } from './types/app'

export default function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureId>('plain-text')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [activeFeature])

  return (
    <AppShell
      activeFeature={activeFeature}
      inputRef={inputRef}
      onFeatureChange={setActiveFeature}
    />
  )
}
