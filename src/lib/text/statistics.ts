import type { Language, TextStatistics } from '../../types/text'

const HAN_PATTERN = /\p{Script=Han}/gu
const ENGLISH_WORD_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+|-[A-Za-z]+)*/g
const LETTER_PATTERN = /[A-Za-z]/g
const NUMBER_PATTERN = /[0-9]+/g
const PUNCTUATION_PATTERN = /\p{P}/gu

export function extractNumberTokens(text: string): string[] {
  return text.match(NUMBER_PATTERN) ?? []
}

function detectLanguage(hanCount: number, letterCount: number): Language {
  if (hanCount > 0 && letterCount > 0) {
    return '中英混合'
  }

  if (hanCount > 0) {
    return '中文'
  }

  if (letterCount > 0) {
    return '英文'
  }

  return '未识别'
}

export function analyzeText(text: string): TextStatistics {
  const hanCount = text.match(HAN_PATTERN)?.length ?? 0
  const englishWordCount = text.match(ENGLISH_WORD_PATTERN)?.length ?? 0
  const letterCount = text.match(LETTER_PATTERN)?.length ?? 0
  const numberCount = extractNumberTokens(text).length
  const punctuationCount = text.match(PUNCTUATION_PATTERN)?.length ?? 0
  const pureWordCount = hanCount + englishWordCount
  const totalWordCount = pureWordCount + numberCount + punctuationCount

  return {
    hanCount,
    englishWordCount,
    letterCount,
    numberCount,
    punctuationCount,
    pureWordCount,
    totalWordCount,
    characterCount: Array.from(text).length,
    language: detectLanguage(hanCount, letterCount),
  }
}
