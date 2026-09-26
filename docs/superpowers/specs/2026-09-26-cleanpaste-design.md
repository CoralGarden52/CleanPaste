# CleanPaste 设计说明

## 目标

CleanPaste 是一个完全离线运行的 Windows 文本处理工具，提供四个即时处理功能：纯文本、去除空格、字数统计和文本替换。应用不需要账号、服务器、数据库、云端 API 或 AI API；用户输入的文本只在应用进程内存中处理，不持久化，也不上传网络。

交付结果包括可运行的 Tauri 2 Windows 桌面应用、MSI/NSIS 安装包配置、核心文本逻辑单元测试、README 和基于 Git tag 的 GitHub Actions 发布流程。

## 非目标

- 不实现正则表达式、复杂替换模式或 AI 替换。
- 不实现文本历史、自动保存、账号同步、云端存储或 SQLite。
- 不增加与四个核心功能无关的设置页、仪表盘、复杂动画或侧边栏。

## 方案选择

采用标准 Tauri 2 应用结构：React 19/Vite/TypeScript 负责界面和纯文本交互，Rust/Tauri 负责 Windows 生命周期能力。文本算法全部放在 TypeScript 纯函数中，便于单元测试和保证离线执行。

全局快捷键使用 Tauri 官方 global-shortcut 插件，单实例使用官方 single-instance 插件，托盘使用 Tauri 2 原生托盘 API。剪贴板粘贴由浏览器的 `ClipboardEvent` 读取 `text/plain`，复制由 `navigator.clipboard.writeText` 写入纯文本，避免保留 HTML 或富文本格式。

相比把文本算法放入 Rust，这种边界避免了前后端重复实现；相比让前端模拟托盘和全局快捷键，Tauri 原生能力能覆盖窗口隐藏、前台激活和 Windows 快捷键注册失败等情况。

## 结构

```text
src/
  components/
    AppShell.tsx
    ClipboardButtons.tsx
    TextPane.tsx
    TabBar.tsx
  features/
    plain-text/PlainTextFeature.tsx
    remove-spaces/RemoveSpacesFeature.tsx
    statistics/StatisticsFeature.tsx
    replace/ReplaceFeature.tsx
  hooks/
    useClipboard.ts
    useNativeShortcuts.ts
  lib/
    text/plainText.ts
    text/removeSpaces.ts
    text/statistics.ts
    text/replace.ts
  types/
    text.ts
    app.ts
  App.tsx
  main.tsx
  index.css
src-tauri/
  src/
    lib.rs
    main.rs
    tray.rs
    shortcuts.rs
  capabilities/default.json
  icons/
  tauri.conf.json
  Cargo.toml
tests/
  lib/text/*.test.ts
.github/workflows/release.yml
README.md
```

组件只负责展示、输入事件和状态组合；`src/lib/text` 不依赖 React、Tauri 或浏览器 API。应用状态只保留当前 tab 与各功能的临时输入，不写入本地存储。

## 界面与状态流

应用窗口默认尺寸为 900×620，启动时显示并选择“纯文本”。界面为纯白背景、黑色主要文字、灰色次级文字、`#E5E5E5` 边框和 `#F7F7F7` hover，不使用渐变、彩色大卡片、复杂 sidebar、玻璃拟态或花哨动画。

顶部显示 CleanPaste，下面是四个 Tab。当前 Tab 用黑色文字和黑色底部细线表示，其他 Tab 使用灰色文字。每个功能使用左侧输入、右侧结果（字数统计除外，统计结果位于大输入区下方）的布局。输入变更直接驱动纯函数计算，不提供“开始”“统计”“转换”“执行”等按钮。

当功能输入区域收到粘贴事件时，优先取 `event.clipboardData.getData("text/plain")` 并阻止富文本 HTML 进入状态。复制结果只写入纯文本。复制失败或剪贴板 API 不可用时，UI 显示短暂的非阻塞提示，不影响应用继续使用。

## 四个功能

### 纯文本

输入内容直接作为纯文本结果显示。功能函数 `toPlainText(text: string): string` 保持文本字符和换行，不携带 HTML、CSS、字体、颜色、超链接样式等富文本信息。右侧提供复制结果和清空。

### 去除空格

函数 `removeSpaces(text: string): string` 删除普通半角空格 `U+0020`、全角空格 `U+3000` 和 Tab `\t`，保留 `\n`、`\r` 等换行结构，不合并多行。结果随输入即时更新，提供复制结果和清空。

### 字数统计

函数 `analyzeText(text: string): TextStatistics` 返回所有 UI 所需统计值：汉字、英文单词、字母、数字项、标点、纯字数、总字数、字符数和检测语言。

规则如下：

- 汉字使用 Unicode Script Han 识别，等价于 `/\p{Script=Han}/gu`，不限制在 `U+4E00-U+9FA5`。
- 英文单词使用连续 ASCII 拉丁字母，并允许内部 apostrophe 或连字符，例如 `don't`、`user-friendly` 各算一个英文单词。
- 字母只统计 `A-Z` 和 `a-z` 字符数量。
- 数字按连续 ASCII 数字序列 `[0-9]+` 统计；`2026` 是 1 个数字项，`20 26` 是 2 个数字项，`abc123def456` 是 2 个数字项。数字字符本身仍按实际字符计入字符数。
- 标点使用 Unicode 标点类别识别，覆盖中文和英文标点、引号、括号、短横线等；Emoji 不因属于 Unicode symbol 而被误算为标点。
- 纯字数 = 汉字数 + 英文单词数。
- 总字数 = 纯字数 + 标点数 + 数字项数；空格和换行不计入总字数。
- 字符数 = `Array.from(text).length`，以 Unicode code point 计数，包含汉字、字母、数字、标点、空格、换行和 Emoji。
- 有汉字且有拉丁字母时为“中英混合”；只有汉字时为“中文”；无汉字但有拉丁字母时为“英文”；空文本或只有其他字符时显示“未识别”。

统计面板使用两行横向指标，不使用彩色卡片。输入更新时同步计算；算法保持线性扫描/有限正则匹配，避免对普通十万字符文本造成明显卡顿。

### 文本替换

函数 `replaceAll(text: string, search: string, replacement: string): ReplaceResult` 实现普通字符串的全部替换，不启用正则表达式。`search` 为空时返回原始文本且替换数量为 0；否则返回替换结果与实际替换处数。原始文本、查找内容或替换内容任意变更都会立即刷新预览，并显示“已替换 N 处”。提供复制结果和清空。

## Windows 能力

### 全局快捷键

Rust 在应用初始化时尝试注册：`Ctrl+Alt+C` 显示/隐藏窗口，`Ctrl+Alt+1..4` 显示窗口并切换到对应功能。显示窗口时执行 show、前台激活和 focus；前端收到快捷键事件后聚焦当前功能的输入框。窗口已显示时 `Ctrl+Alt+C` 隐藏到托盘。

注册任何快捷键失败都捕获错误并向前端发出非阻塞 warning，应用继续运行；前端仍提供 `Alt+1..4` 作为窗口内备用快捷键。

### 托盘与窗口生命周期

启动时创建托盘图标和菜单：打开 CleanPaste、纯文本、去除空格、字数统计、文本替换、退出。双击图标显示并激活窗口；关闭按钮拦截 close request 并隐藏窗口，不退出进程；只有托盘“退出”真正结束程序。

### 单实例

使用 single-instance 插件阻止第二个进程继续启动，并在重复启动时让已存在的窗口显示、激活。单实例回调只负责通知已有窗口，不保存或传输用户文本。

## 错误处理与隐私

- 全局快捷键冲突、托盘初始化异常、窗口激活失败等原生错误记录到 stderr 或返回前端短提示，不 panic、不让应用崩溃。
- 文本处理函数对空字符串安全，替换查找为空时不改变文本。
- 不调用网络 API，不发送遥测，不写入文本内容；关闭进程后临时文本自然丢失。
- GitHub Actions 只构建发布产物，不接触用户文本。

## 测试策略

使用 Vitest 测试 `src/lib/text` 的真实函数，不测试实现细节或 mock 调用。覆盖中文、英文、中英混合、中文/英文标点、数字项、空格、Tab、换行、Emoji、Unicode surrogate pair、英文 contractions、连字符、空字符串和较长文本。

必须包含：`2026` 数字项为 1；`20 26` 为 2；`2026 09 26` 为 3；`你好 CleanPaste 2026!` 汉字 2、英文单词 1、数字项 1、标点 1、纯字数 3、总字数 5；`版本 2 更新于 2026 年` 的数字项为 2 且分别为 `2`、`2026`。所有核心函数各至少有行为测试。

## 打包与发布

`src-tauri/tauri.conf.json` 设置 productName `CleanPaste`、稳定的反向域名 identifier、版本号、窗口配置以及 `msi` 和 `nsis` bundle targets。`npm run build` 生成前端产物，`cargo check` 验证 Rust，`npm run tauri build` 生成 Windows MSI 与 NSIS EXE。

`.github/workflows/release.yml` 在 `v*` tag 触发 Windows runner，安装 Node、Rust 和 Tauri 所需依赖，运行测试、前端构建和 Tauri 构建，然后将 `.msi` 与 `.exe` 上传到 GitHub Release。工作流不依赖自有服务器。

README 说明四个功能、快捷键、截图占位、Windows 安装、开发与构建、隐私和技术栈，并明确写出：

> CleanPaste processes all text locally. No text is uploaded to any server.

## 验收标准映射
本机尚未安装 Rust/Cargo，可自行将工具链安装到 `D:\Program Files`。

验收按以下层次执行：文本纯函数测试覆盖算法契约；Vite 构建验证 TypeScript/React；Cargo check 验证 Rust；Tauri build 验证 Windows 安装包配置；人工检查或运行时检查验证托盘、快捷键、单实例和关闭隐藏行为。任何功能不以 TODO、空函数或未完成按钮代替。
