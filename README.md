# CleanPaste

CleanPaste 是一个面向 Windows 的轻量级本地文本处理工具。文本处理完全在本机离线完成，不上传文本、不依赖云端服务，也不包含遥测。

## 功能

- **纯文本**：粘贴或输入文本后实时生成纯文本结果，粘贴优先读取 `text/plain`。
- **去除空格**：移除半角空格、全角空格和 Tab，保留换行。
- **字数统计**：实时统计汉字、英文单词、字母、数字项、标点、纯字数、总字数、字符数和语言。
- **文本替换**：按字面值实时替换全部匹配项，显示预览和替换次数；查找为空时保留原文。

统计规则示例：`你好 CleanPaste 2026!` 的汉字为 2，英文单词为 1，数字项为 1，标点为 1，纯字数为 3，总字数为 5。`2026` 作为一个数字项计数。

## 快捷键

| 快捷键 | 操作 |
| --- | --- |
| `Ctrl + Alt + C` | 显示或隐藏 CleanPaste；显示时自动置前并聚焦当前输入框 |
| `Ctrl + Alt + 1` | 打开纯文本 |
| `Ctrl + Alt + 2` | 打开去除空格 |
| `Ctrl + Alt + 3` | 打开字数统计 |
| `Ctrl + Alt + 4` | 打开文本替换 |
| `Alt + 1..4` | 窗口内的备用功能切换快捷键 |

全局快捷键注册失败时，应用会显示简短的非阻塞提示，不会因此退出。

## 系统托盘与窗口行为

应用启动后会创建系统托盘图标。关闭窗口只会将 CleanPaste 隐藏到托盘，托盘菜单包含打开、四个功能入口和退出；双击托盘图标可以重新显示主窗口。只有点击“退出”才会结束进程。CleanPaste 使用单实例模式，重复启动时会激活已存在的窗口。

## Windows 安装

从 GitHub Release 下载以下任一安装包：

- `*.msi`：适合使用 Windows Installer 的安装流程。
- `*.exe`：NSIS 安装程序，适合直接双击安装。

## 本地开发

环境要求：Node.js 20+、稳定版 Rust（最低 1.77.2）、Windows MSVC 工具链和 WebView2 Runtime。

```powershell
npm install
npm test -- --run
npm run build
npm run tauri:dev
```

生成 Windows 安装包：

```powershell
npm run tauri:build
```

产物位于：

```text
src-tauri/target/release/bundle/msi/*.msi
src-tauri/target/release/bundle/nsis/*.exe
```

界面截图预留路径：`docs/assets/cleanpaste-screenshot.png`。

## 技术栈

React、TypeScript、Vite、Tailwind CSS、Tauri 2 和 Rust。核心文本转换与统计逻辑使用可测试的纯函数，Native 层负责系统托盘、窗口生命周期、全局快捷键和单实例行为。

## 隐私

CleanPaste 只处理用户主动输入或粘贴的文本，所有处理均在本机完成。项目不上传文本、不调用远程 AI、不收集使用数据。

## 许可证

[MIT License](LICENSE)
