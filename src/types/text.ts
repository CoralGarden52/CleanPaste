export type Language = '中文' | '英文' | '中英混合' | '未识别'

export interface TextStatistics {
  hanCount: number
  englishWordCount: number
  letterCount: number
  numberCount: number
  punctuationCount: number
  pureWordCount: number
  totalWordCount: number
  characterCount: number
  language: Language
}

export interface ReplaceResult {
  result: string
  count: number
}
