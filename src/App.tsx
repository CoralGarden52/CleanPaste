import { useCallback, useEffect, useRef, useState } from 'react'

import { AppShell } from './components/AppShell'
import { useNativeShortcuts } from './hooks/useNativeShortcuts'
import { ALT_FEATURES } from './types/app'
import type { FeatureId } from './types/app'

export default function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureId>('plain-text')
  const [nativeWarning, setNativeWarning] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const focusActiveInput = useCallback(() => {
    const focus = () => inputRef.current?.focus()

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(focus)
    } else {
      window.setTimeout(focus, 0)
    }
  }, [])

  useEffect(() => {
    focusActiveInput()
  }, [activeFeature, focusActiveInput])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const feature = event.altKey ? ALT_FEATURES[event.key] : undefined
    if (!feature || event.ctrlKey || event.metaKey || event.shiftKey) {
      return
    }

    event.preventDefault()
    setActiveFeature(feature)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleFeatureChange = useCallback((feature: FeatureId) => {
    setActiveFeature(feature)
  }, [])

  const handleWarning = useCallback((message: string) => {
    setNativeWarning(message)
  }, [])

  useNativeShortcuts({
    onFeatureChange: handleFeatureChange,
    onToggle: focusActiveInput,
    onWarning: handleWarning,
  })

  return (
    <AppShell
      activeFeature={activeFeature}
      inputRef={inputRef}
      onFeatureChange={handleFeatureChange}
      warning={nativeWarning}
      onDismissWarning={() => setNativeWarning('')}
    />
  )
}
