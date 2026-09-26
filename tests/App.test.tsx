import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../src/App'

const { nativeListeners, listenMock } = vi.hoisted(() => {
  const nativeListeners = new Map<string, (event: { payload: unknown }) => void>()
  const listenMock = vi.fn(
    (eventName: string, callback: (event: { payload: unknown }) => void) => {
      nativeListeners.set(eventName, callback)
      return Promise.resolve(() => nativeListeners.delete(eventName))
    },
  )

  return { nativeListeners, listenMock }
})

vi.mock('@tauri-apps/api/event', () => ({ listen: listenMock }))

function enableNativeRuntime() {
  Object.defineProperty(window, '__TAURI_INTERNALS__', {
    configurable: true,
    value: {},
  })
}

describe('CleanPaste 应用界面', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    nativeListeners.clear()
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__
  })

  it('启动时选择纯文本并显示四个功能页签', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'CleanPaste' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(4)
    expect(screen.getByRole('tab', { name: '纯文本' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('输入文本')).toBeInTheDocument()
    expect(screen.getByLabelText('纯文本结果')).toBeInTheDocument()
  })

  it('输入纯文本后立即镜像结果', async () => {
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByLabelText('输入文本')
    await user.type(input, '网页')
    fireEvent.change(input, { target: { value: '网页\n第二行' } })

    expect(screen.getByLabelText('纯文本结果')).toHaveValue('网页\n第二行')
  })

  it('去除空格时保留换行并移除半角空格、全角空格和 Tab', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '去除空格' }))

    const input = screen.getByLabelText('输入文本')
    fireEvent.change(input, { target: { value: 'Hello  世界\t\n下一行' } })

    expect(screen.getByLabelText('处理结果')).toHaveValue('Hello世界\n下一行')
  })

  it('输入统计文本后立即更新所有统计项', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '字数统计' }))

    fireEvent.change(screen.getByLabelText('统计文本'), {
      target: { value: '你好 CleanPaste 2026!' },
    })

    expect(screen.getByText('检测语言：中英混合')).toBeInTheDocument()
    expect(within(screen.getByTestId('stat-han')).getByText('2')).toBeInTheDocument()
    expect(within(screen.getByTestId('stat-english-word')).getByText('1')).toBeInTheDocument()
    expect(within(screen.getByTestId('stat-number')).getByText('1')).toBeInTheDocument()
    expect(within(screen.getByTestId('stat-punctuation')).getByText('1')).toBeInTheDocument()
    expect(within(screen.getByTestId('stat-pure-word')).getByText('3')).toBeInTheDocument()
    expect(within(screen.getByTestId('stat-total-word')).getByText('5')).toBeInTheDocument()
  })

  it('文本替换实时更新预览和替换次数', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '文本替换' }))

    fireEvent.change(screen.getByLabelText('原始文本'), { target: { value: 'a.b a.b' } })
    fireEvent.change(screen.getByLabelText('查找'), { target: { value: '.' } })
    fireEvent.change(screen.getByLabelText('替换为'), { target: { value: '-' } })

    expect(screen.getByLabelText('替换结果')).toHaveValue('a-b a-b')
    expect(screen.getByText('已替换 2 处')).toBeInTheDocument()
  })

  it('清空按钮会重置当前功能', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '去除空格' }))
    const input = screen.getByLabelText('输入文本')
    fireEvent.change(input, { target: { value: '有内容' } })

    fireEvent.click(screen.getByRole('button', { name: '清空' }))

    expect(input).toHaveValue('')
    expect(screen.getByLabelText('处理结果')).toHaveValue('')
  })

  it('复制按钮只把当前结果写入剪贴板', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    render(<App />)
    const input = screen.getByLabelText('输入文本')
    fireEvent.change(input, { target: { value: '复制我' } })

    await user.click(screen.getByRole('button', { name: '复制结果' }))

    expect(writeText).toHaveBeenCalledWith('复制我')
  })

  it('粘贴时只读取 text/plain 并阻止富文本默认粘贴', () => {
    render(<App />)
    const input = screen.getByLabelText('输入文本')
    const preventDefault = vi.spyOn(Event.prototype, 'preventDefault')

    fireEvent.paste(input, {
      clipboardData: {
        getData: (type: string) => (type === 'text/plain' ? '纯文本内容' : '<b>富文本</b>'),
      },
    })

    expect(preventDefault).toHaveBeenCalled()
    expect(input).toHaveValue('纯文本内容')
    preventDefault.mockRestore()
  })

  it('使用 Alt+1 到 Alt+4 切换功能并阻止浏览器默认行为', () => {
    const preventDefault = vi.spyOn(Event.prototype, 'preventDefault')
    render(<App />)

    for (const [key, label] of [
      ['1', '纯文本'],
      ['2', '去除空格'],
      ['3', '字数统计'],
      ['4', '文本替换'],
    ]) {
      fireEvent.keyDown(window, { key, altKey: true })
      expect(screen.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'true')
    }

    expect(preventDefault).toHaveBeenCalledTimes(4)
    preventDefault.mockRestore()
  })

  it('接收原生功能事件后切换页签并聚焦对应输入框', async () => {
    enableNativeRuntime()
    render(<App />)

    await waitFor(() => {
      expect(listenMock).toHaveBeenCalledWith('shortcut-command', expect.any(Function))
    })

    act(() => {
      nativeListeners.get('shortcut-command')?.({
        payload: { kind: 'feature', feature: 'replace' },
      })
    })

    expect(screen.getByRole('tab', { name: '文本替换' })).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(screen.getByLabelText('原始文本')).toHaveFocus())
  })

  it('显示原生注册告警但不阻塞应用操作', async () => {
    enableNativeRuntime()
    render(<App />)

    await waitFor(() => {
      expect(listenMock).toHaveBeenCalledWith('native-warning', expect.any(Function))
    })

    act(() => {
      nativeListeners.get('native-warning')?.({ payload: 'Ctrl+Alt+C 注册失败' })
    })

    expect(screen.getByRole('status')).toHaveTextContent('Ctrl+Alt+C 注册失败')
    expect(screen.getByRole('tab', { name: '纯文本' })).toBeEnabled()
  })
})
