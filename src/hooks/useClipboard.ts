import { useCallback, useState } from 'react'
import type { ClipboardEvent } from 'react'

export function useClipboard() {
  const [status, setStatus] = useState('')

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLTextAreaElement>, onText: (text: string) => void) => {
      const plainText = event.clipboardData.getData('text/plain')
      event.preventDefault()
      onText(plainText)
      setStatus('已粘贴')
    },
    [],
  )

  const copyText = useCallback(async (text: string): Promise<void> => {
    if (!text) {
      setStatus('暂无可复制内容')
      return
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('当前环境不支持剪贴板写入')
      }

      await navigator.clipboard.writeText(text)
      setStatus('已复制')
    } catch {
      setStatus('复制失败')
    }
  }, [])

  return { handlePaste, copyText, status }
}
