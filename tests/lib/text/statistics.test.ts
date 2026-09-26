import { describe, expect, it } from 'vitest'

import { analyzeText, extractNumberTokens } from '../../../src/lib/text/statistics'

describe('Unicode 文本统计', () => {
  it('按连续数字片段统计数字项', () => {
    expect(analyzeText('2026').numberCount).toBe(1)
    expect(analyzeText('20 26').numberCount).toBe(2)
    expect(analyzeText('2026 09 26').numberCount).toBe(3)
    expect(extractNumberTokens('版本 2 更新于 2026 年')).toEqual(['2', '2026'])
  })

  it('统计中文、中文标点和总字数', () => {
    expect(analyzeText('你好，世界！')).toMatchObject({
      hanCount: 4,
      punctuationCount: 2,
      pureWordCount: 4,
      totalWordCount: 6,
    })
  })

  it('统计英文单词、字母和标点', () => {
    expect(analyzeText('Hello world!')).toMatchObject({
      englishWordCount: 2,
      letterCount: 10,
      punctuationCount: 1,
      pureWordCount: 2,
      totalWordCount: 3,
    })
  })

  it('统计中英混合文本和数字项', () => {
    expect(analyzeText('你好 CleanPaste 2026!')).toMatchObject({
      hanCount: 2,
      englishWordCount: 1,
      numberCount: 1,
      punctuationCount: 1,
      pureWordCount: 3,
      totalWordCount: 5,
    })
  })

  it('将撇号和连字符视为英文单词内部结构', () => {
    expect(analyzeText("don't user-friendly")).toMatchObject({
      englishWordCount: 2,
      letterCount: 16,
      punctuationCount: 2,
      pureWordCount: 2,
      totalWordCount: 4,
      language: '英文',
    })
  })

  it('根据汉字和拉丁字母 presence 判断语言', () => {
    expect(analyzeText('你好')).toMatchObject({ language: '中文' })
    expect(analyzeText('Hello')).toMatchObject({ language: '英文' })
    expect(analyzeText('你好 Hello')).toMatchObject({ language: '中英混合' })
    expect(analyzeText('123 !!!')).toMatchObject({ language: '未识别' })
  })

  it('不把空白计入单词或标点，但计入字符数', () => {
    expect(analyzeText('你好  Hello\n世界')).toMatchObject({
      hanCount: 4,
      englishWordCount: 1,
      letterCount: 5,
      pureWordCount: 5,
      totalWordCount: 5,
      characterCount: 12,
    })
  })

  it('按 Unicode code point 统计字符数', () => {
    expect(analyzeText('A😀好')).toMatchObject({
      characterCount: 3,
      hanCount: 1,
      letterCount: 1,
    })
  })

  it('支持空文本', () => {
    expect(analyzeText('')).toEqual({
      hanCount: 0,
      englishWordCount: 0,
      letterCount: 0,
      numberCount: 0,
      punctuationCount: 0,
      pureWordCount: 0,
      totalWordCount: 0,
      characterCount: 0,
      language: '未识别',
    })
  })

  it('支持较长输入', () => {
    const text = Array.from({ length: 2000 }, () => 'CleanPaste ').join('')

    expect(analyzeText(text)).toMatchObject({
      englishWordCount: 2000,
      letterCount: 20000,
      pureWordCount: 2000,
      totalWordCount: 2000,
      characterCount: 22000,
    })
  })
})
