import { useId, useState } from 'react'

import { ClipboardButtons } from '../../components/ClipboardButtons'
import { useClipboard } from '../../hooks/useClipboard'
import { replaceAll } from '../../lib/text/replace'
import type { FeatureProps } from '../../types/app'

export function ReplaceFeature({ inputRef }: FeatureProps) {
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [replacement, setReplacement] = useState('')
  const clipboard = useClipboard()
  const result = replaceAll(text, search, replacement)
  const searchId = useId()
  const replacementId = useId()
  const resultId = useId()

  return (
    <section className="feature-page" aria-label="文本替换">
      <div className="replace-layout">
        <div className="replace-source">
          <label className="field-label" htmlFor="replace-source-input">
            原始文本
          </label>
          <textarea
            ref={inputRef}
            id="replace-source-input"
            className="text-editor replace-source-editor"
            aria-label="原始文本"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onPaste={(event) => clipboard.handlePaste(event, setText)}
            placeholder="在这里输入或粘贴文本"
            spellCheck={false}
          />
        </div>
        <div className="replace-controls">
          <label className="field-label" htmlFor={searchId}>
            查找
          </label>
          <input
            id={searchId}
            className="text-input"
            aria-label="查找"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="field-label" htmlFor={replacementId}>
            替换为
          </label>
          <input
            id={replacementId}
            className="text-input"
            aria-label="替换为"
            value={replacement}
            onChange={(event) => setReplacement(event.target.value)}
          />
        </div>
        <div className="replace-preview">
          <label className="field-label" htmlFor={resultId}>
            实时预览
          </label>
          <textarea
            id={resultId}
            className="text-editor output-editor"
            aria-label="替换结果"
            value={result.result}
            readOnly
            spellCheck={false}
          />
          <p className="replace-count">已替换 {result.count} 处</p>
        </div>
      </div>
      <ClipboardButtons
        onCopy={() => clipboard.copyText(result.result)}
        onClear={() => {
          setText('')
          setSearch('')
          setReplacement('')
        }}
        status={clipboard.status}
      />
    </section>
  )
}
