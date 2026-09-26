import { useState } from 'react'

import { useClipboard } from '../../hooks/useClipboard'
import { analyzeText } from '../../lib/text/statistics'
import type { FeatureProps } from '../../types/app'

const statisticItems = [
  ['han', '汉字', 'hanCount'],
  ['english-word', '英文单词', 'englishWordCount'],
  ['punctuation', '标点', 'punctuationCount'],
  ['number', '数字', 'numberCount'],
  ['letter', '字母', 'letterCount'],
  ['pure-word', '纯字数', 'pureWordCount'],
  ['total-word', '总字数', 'totalWordCount'],
  ['character', '字符数', 'characterCount'],
] as const

export function StatisticsFeature({ inputRef }: FeatureProps) {
  const [text, setText] = useState('')
  const clipboard = useClipboard()
  const statistics = analyzeText(text)

  return (
    <section className="feature-page" aria-label="字数统计">
      <div className="statistics-input">
        <label className="field-label" htmlFor="statistics-input">
          统计文本
        </label>
        <textarea
          ref={inputRef}
          id="statistics-input"
          className="text-editor statistics-editor"
          aria-label="统计文本"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onPaste={(event) => clipboard.handlePaste(event, setText)}
          placeholder="在这里输入或粘贴文本"
          spellCheck={false}
        />
      </div>
      <p className="language-result">检测语言：{statistics.language}</p>
      <dl className="statistics-grid">
        {statisticItems.map(([id, label, key]) => (
          <div className="statistic-item" data-testid={`stat-${id}`} key={id}>
            <dt>{label}</dt>
            <dd>{statistics[key]}</dd>
          </div>
        ))}
      </dl>
      <div className="feature-actions">
        <button className="secondary-button" type="button" onClick={() => setText('')}>
          清空
        </button>
        {clipboard.status ? (
          <span className="text-sm text-[#666666]" role="status" aria-live="polite">
            {clipboard.status}
          </span>
        ) : null}
      </div>
    </section>
  )
}
