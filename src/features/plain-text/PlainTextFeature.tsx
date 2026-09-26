import { useState } from 'react'

import { TextPane } from '../../components/TextPane'
import { useClipboard } from '../../hooks/useClipboard'
import { toPlainText } from '../../lib/text/plainText'
import type { FeatureProps } from '../../types/app'

export function PlainTextFeature({ inputRef }: FeatureProps) {
  const [text, setText] = useState('')
  const clipboard = useClipboard()
  const result = toPlainText(text)

  return (
    <TextPane
      inputLabel="输入文本"
      outputLabel="纯文本结果"
      value={text}
      result={result}
      inputRef={inputRef}
      onChange={setText}
      onPaste={(event) => clipboard.handlePaste(event, setText)}
      onCopy={() => clipboard.copyText(result)}
      onClear={() => setText('')}
      status={clipboard.status}
    />
  )
}
