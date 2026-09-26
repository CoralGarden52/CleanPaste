import { describe, expect, it } from 'vitest'

import { toPlainText } from '../../../src/lib/text/plainText'
import { removeSpaces } from '../../../src/lib/text/removeSpaces'
import { replaceAll } from '../../../src/lib/text/replace'

describe('纯文本转换', () => {
  it('保留纯文本内容和换行', () => {
    expect(toPlainText('网页\n第二行')).toBe('网页\n第二行')
  })

  it('移除普通空格、全角空格和制表符并保留换行', () => {
    expect(removeSpaces('Hello  世界\t\n下一行')).toBe('Hello世界\n下一行')
  })

  it('按字面值替换所有非重叠匹配并返回次数', () => {
    expect(replaceAll('a.b a.b', '.', '-')).toEqual({ result: 'a-b a-b', count: 2 })
  })

  it('搜索词为空时不修改文本', () => {
    expect(replaceAll('same', '', 'x')).toEqual({ result: 'same', count: 0 })
  })
})
