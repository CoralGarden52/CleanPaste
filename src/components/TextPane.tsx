import { useId } from 'react'
import type { ClipboardEvent, RefObject } from 'react'

import { ClipboardButtons } from './ClipboardButtons'

interface TextPaneProps {
  inputLabel: string
  outputLabel: string
  value: string
  result: string
  inputRef: RefObject<HTMLTextAreaElement | null>
  onChange: (value: string) => void
  onPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void
  onCopy: () => void | Promise<void>
  onClear: () => void
  status?: string
}

export function TextPane({
  inputLabel,
  outputLabel,
  value,
  result,
  inputRef,
  onChange,
  onPaste,
  onCopy,
  onClear,
  status,
}: TextPaneProps) {
  const inputId = useId()
  const outputId = useId()

  return (
    <section className="text-pane" aria-label={`${inputLabel}与${outputLabel}`}>
      <div className="pane-column">
        <label className="field-label" htmlFor={inputId}>
          {inputLabel}
        </label>
        <textarea
          ref={inputRef}
          id={inputId}
          className="text-editor"
          aria-label={inputLabel}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={onPaste}
          placeholder="在这里输入或粘贴文本"
          spellCheck={false}
        />
      </div>
      <div className="pane-column output-column">
        <label className="field-label" htmlFor={outputId}>
          {outputLabel}
        </label>
        <textarea
          id={outputId}
          className="text-editor output-editor"
          aria-label={outputLabel}
          value={result}
          readOnly
          spellCheck={false}
        />
      </div>
      <div className="pane-actions">
        <ClipboardButtons onCopy={onCopy} onClear={onClear} status={status} />
      </div>
    </section>
  )
}
