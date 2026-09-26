import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import type { Event } from '@tauri-apps/api/event'

import { FEATURE_ORDER } from '../types/app'
import type { FeatureId } from '../types/app'

interface ShortcutCommand {
  kind: 'toggle' | 'feature'
  feature?: string
}

interface NativeShortcutOptions {
  onFeatureChange: (feature: FeatureId) => void
  onToggle: () => void
  onWarning: (message: string) => void
}

function hasNativeRuntime() {
  if (typeof window === 'undefined') {
    return false
  }

  return Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
}

function isFeatureId(value: string | undefined): value is FeatureId {
  return value !== undefined && FEATURE_ORDER.includes(value as FeatureId)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export function useNativeShortcuts({
  onFeatureChange,
  onToggle,
  onWarning,
}: NativeShortcutOptions) {
  useEffect(() => {
    if (!hasNativeRuntime()) {
      return undefined
    }

    let disposed = false
    const unlisteners: Array<() => void> = []

    const attach = async <T>(
      eventName: string,
      handler: (event: Event<T>) => void,
    ) => {
      try {
        const unlisten = await listen<T>(eventName, handler)
        if (disposed) {
          unlisten()
        } else {
          unlisteners.push(unlisten)
        }
      } catch (error) {
        onWarning(`原生事件监听失败：${errorMessage(error)}`)
      }
    }

    void attach<ShortcutCommand>('shortcut-command', ({ payload }) => {
      if (payload.kind === 'toggle') {
        onToggle()
      } else if (payload.kind === 'feature' && isFeatureId(payload.feature)) {
        onFeatureChange(payload.feature)
      }
    })

    void attach<string>('native-warning', ({ payload }) => {
      onWarning(payload)
    })

    return () => {
      disposed = true
      unlisteners.forEach((unlisten) => unlisten())
    }
  }, [onFeatureChange, onToggle, onWarning])
}
