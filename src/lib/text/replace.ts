import type { ReplaceResult } from '../../types/text'

export function replaceAll(text: string, search: string, replacement: string): ReplaceResult {
  if (search.length === 0) {
    return { result: text, count: 0 }
  }

  const pieces = text.split(search)
  return {
    result: pieces.join(replacement),
    count: pieces.length - 1,
  }
}
