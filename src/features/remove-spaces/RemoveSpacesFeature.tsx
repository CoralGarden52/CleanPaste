import { useState } from 'react'

import { TextPane } from '../../components/TextPane'
import { useClipboard } from '../../hooks/useClipboard'
import { removeSpaces } from '../../lib/text/removeSpaces'
import type { FeatureProps } from '../../types/app'

export function RemoveSpacesFeature({ inputRef }: FeatureProps) {
  const [text, setText] = useState('')
  const clipboard = useClipboard()
  const result = removeSpaces(text)

  return (
    <TextPane
      inputLabel="输入文本"
      outputLabel="处理结果"
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
