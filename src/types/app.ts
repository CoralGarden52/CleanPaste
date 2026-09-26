import type { RefObject } from 'react'

export type FeatureId = 'plain-text' | 'remove-spaces' | 'statistics' | 'replace'

export const FEATURE_ORDER: readonly FeatureId[] = [
  'plain-text',
  'remove-spaces',
  'statistics',
  'replace',
]

export const FEATURE_LABELS: Record<FeatureId, string> = {
  'plain-text': '纯文本',
  'remove-spaces': '去除空格',
  statistics: '字数统计',
  replace: '文本替换',
}

export const ALT_FEATURES: Readonly<Record<string, FeatureId>> = Object.fromEntries(
  FEATURE_ORDER.map((feature, index) => [String(index + 1), feature]),
) as Record<string, FeatureId>

export interface FeatureProps {
  inputRef: RefObject<HTMLTextAreaElement | null>
}
