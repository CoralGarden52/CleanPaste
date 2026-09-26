# CleanPaste Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a complete offline Tauri 2 Windows desktop application named CleanPaste with four real-time text tools, tray lifecycle, global shortcuts, single-instance behavior, tests, installers, documentation, and tag-based release automation.

**Architecture:** React 19/Vite/TypeScript owns the UI and pure text functions; Rust/Tauri owns the tray, window lifecycle, global shortcuts, and single-instance behavior. Feature components consume small typed functions from `src/lib/text` and keep all text transient in React state. Official Tauri plugins are used only for global shortcuts and single-instance support; the tray uses the Tauri 2 native API.

**Tech Stack:** Tauri 2, Rust stable/MSVC, React 19, TypeScript, Vite, TailwindCSS 4, Vitest, official Tauri global-shortcut and single-instance plugins, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-26-cleanpaste-design.md`

## Global Constraints

- The application is fully local: no account, server, database, cloud API, AI API, telemetry, or upload of user text.
- The first release contains exactly four features: 纯文本, 去除空格, 字数统计, 文本替换.
- Input changes update derived results immediately; no conversion, statistics, execution, or replace buttons are added.
- Remove only `U+0020`, `U+3000`, and `\t` in the remove-spaces feature; preserve line breaks.
- Count Han characters with Unicode Script Han, English words as words including contractions/hyphenated words, and numbers as contiguous `[0-9]+` items.
- `2026` is one number item; `你好 CleanPaste 2026!` has number count 1 and total word count 5.
- `总字数 = 纯字数 + 标点数 + 数字项数`; spaces and line breaks do not contribute to total word count.
- `字符数 = Array.from(text).length`, including spaces, line breaks, punctuation, digits, letters, Han characters, and Unicode emoji/code points.
- Window defaults to 900×620, starts on 纯文本, closes to the tray, and exits only from the tray menu.
- Register `Ctrl+Alt+C` and `Ctrl+Alt+1..4` globally; a registration failure must not crash the application and must show a non-blocking warning.
- Support `Alt+1..4` inside the app as fallback shortcuts.
- Configure both `msi` and `nsis` Windows bundle targets and build releases on `v*` tags.
- Do not leave TODOs, empty implementations, placeholder functions, or unfinished buttons in the delivered product.
- Work in `D:\Git\CleanPaste` as explicitly requested; do not create a second worktree.
- Rust/Cargo may be installed under `D:\Program Files` for verification; preserve the existing user-supplied `prompt.md`.

## Review Focus

- Unicode Han, emoji, and surrogate-pair input must be counted without falling back to `text.length`; covered by `statistics.test.ts` Unicode cases.
- Digits embedded in letters and separated by spaces must produce number tokens rather than digit-character counts; covered by number-token tests in Task 3.
- Literal replacement text containing regex metacharacters must be replaced literally, and an empty search string must be a no-op; covered by replacement tests in Task 2.
- Rich clipboard payloads must use `text/plain` and must not insert HTML; covered by the paste interaction test in Task 4.
- A hidden window, occupied global shortcut, tray menu action, and second launch must preserve a usable single process; covered by Rust mapping tests in Task 5 and runtime verification in Task 6.

### Task 1: Bootstrap the Tauri/Vite project and verification tooling

**Files:**
- Create: `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/test/setup.ts`
- Create: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`
- Create: `src-tauri/icons/icon.svg` and generated Windows icon assets under `src-tauri/icons/`
- Modify: `prompt.md` is not edited; add it to the first project commit so the remote repository retains the supplied requirements.

**Interfaces:**
- Produces the npm scripts `dev`, `build`, `test`, `test:watch`, `tauri`, `tauri:dev`, `tauri:build`, and `cargo:check` used by later tasks.
- Produces a Vite entry importing `App` and a Tauri configuration with product name `CleanPaste`, identifier `com.coralgarden52.cleanpaste`, version `0.1.0`, 900×620 main window, `msi`/`nsis` targets, and `frontendDist: "../dist"`.

- [ ] **Step 1: Install the local Rust toolchain required by Tauri**

  Install stable Rust with the MSVC target under `D:\Program Files\Rust` using task-specific `RUSTUP_HOME` and `CARGO_HOME` paths. Add its `cargo\bin` directory to the current process PATH, then verify `rustc --version` and `cargo --version`. If the MSVC linker is unavailable, record the exact missing Visual Studio Build Tools dependency before continuing.

- [ ] **Step 2: Create the generated/configuration scaffold**

  Add the React/Vite/Tailwind/Vitest scripts and dependencies, configure Vitest with a `jsdom` environment and `src/test/setup.ts`, and create the minimal generated Tauri entry/config needed for later feature code. Use TailwindCSS 4 through the Vite plugin and keep the initial `App` as a buildable scaffold only.

- [ ] **Step 3: Generate a real tray/application icon**

  Create a small monochrome `icon.svg` representing CleanPaste and run the Tauri icon generator to produce the PNG/ICO assets referenced by `tauri.conf.json`. Do not leave an empty icon file.

- [ ] **Step 4: Install dependencies and verify the scaffold**

  Run:

  ```powershell
  npm install
  npm run build
  cargo check --manifest-path src-tauri/Cargo.toml
  ```

  Expected: npm installation succeeds, Vite exits with code 0, and Cargo reports a successful check. If the environment prevents Cargo from running, record the missing dependency and continue with frontend work while preserving the exact failure.

- [ ] **Step 5: Commit the bootstrap**

  ```powershell
  git add package.json package-lock.json index.html vite.config.ts vitest.config.ts tsconfig*.json src src-tauri prompt.md
  git commit -m "chore: bootstrap CleanPaste desktop app"
  ```

### Task 2: Implement and test the pure text transforms

**Files:**
- Create: `src/types/text.ts`
- Create: `src/lib/text/plainText.ts`, `src/lib/text/removeSpaces.ts`, `src/lib/text/replace.ts`
- Test: `tests/lib/text/transforms.test.ts`

**Interfaces:**
- Produces `toPlainText(text: string): string`.
- Produces `removeSpaces(text: string): string`.
- Produces `replaceAll(text: string, search: string, replacement: string): ReplaceResult` where `ReplaceResult` is `{ result: string; count: number }`.

- [ ] **Step 1: Write the failing transform tests**

  Add behavior tests for:

  ```ts
  expect(toPlainText("网页\\n第二行")).toBe("网页\\n第二行");
  expect(removeSpaces("Hello  世界\\t\\n下一行")).toBe("Hello世界\\n下一行");
  expect(replaceAll("a.b a.b", ".", "-")).toEqual({ result: "a-b a-b", count: 2 });
  expect(replaceAll("same", "", "x")).toEqual({ result: "same", count: 0 });
  ```

- [ ] **Step 2: Run the focused tests and verify the expected RED state**

  Run `npm test -- --run tests/lib/text/transforms.test.ts`.

  Expected: the test runner starts but fails because the three modules/exports do not yet exist; no test should pass merely because the assertions are vacuous.

- [ ] **Step 3: Implement the minimal pure transforms**

  Implement the exact interfaces in the files above. `removeSpaces` must remove only `/[ \\u3000\\t]/g`; `replaceAll` must use literal string matching and return the number of non-overlapping matches; `toPlainText` must preserve the supplied plain string and its line endings.

- [ ] **Step 4: Run focused and full tests GREEN**

  Run the focused test again, then `npm test -- --run`.

  Expected: all transform tests and the whole current suite pass with zero failures.

- [ ] **Step 5: Commit the transform module**

  ```powershell
  git add src/types/text.ts src/lib/text tests/lib/text/transforms.test.ts
  git commit -m "feat: add local text transforms"
  ```

### Task 3: Implement and test Unicode-aware statistics

**Files:**
- Modify: `src/types/text.ts`
- Create: `src/lib/text/statistics.ts`
- Test: `tests/lib/text/statistics.test.ts`

**Interfaces:**
- Produces `Language = "中文" | "英文" | "中英混合" | "未识别"`.
- Produces `TextStatistics` with `hanCount`, `englishWordCount`, `letterCount`, `numberCount`, `punctuationCount`, `pureWordCount`, `totalWordCount`, `characterCount`, and `language` numeric/string fields.
- Produces `extractNumberTokens(text: string): string[]` for the explicit number-token behavior test.
- Produces `analyzeText(text: string): TextStatistics` for the UI.

- [ ] **Step 1: Write the failing statistics tests**

  Cover all required examples and edge cases. At minimum assert:

  ```ts
  expect(analyzeText("2026").numberCount).toBe(1);
  expect(analyzeText("20 26").numberCount).toBe(2);
  expect(analyzeText("2026 09 26").numberCount).toBe(3);
  expect(extractNumberTokens("版本 2 更新于 2026 年")).toEqual(["2", "2026"]);

  expect(analyzeText("你好，世界！")).toMatchObject({
    hanCount: 4, punctuationCount: 2, pureWordCount: 4, totalWordCount: 6,
  });
  expect(analyzeText("Hello world!")).toMatchObject({
    englishWordCount: 2, letterCount: 10, punctuationCount: 1,
    pureWordCount: 2, totalWordCount: 3,
  });
  expect(analyzeText("你好 CleanPaste 2026!")).toMatchObject({
    hanCount: 2, englishWordCount: 1, numberCount: 1,
    punctuationCount: 1, pureWordCount: 3, totalWordCount: 5,
  });
  ```

  Add tests for `don't`, `user-friendly`, Chinese/English language detection, punctuation, spaces/newlines, emoji/code-point character count, empty input, and a generated long input.

- [ ] **Step 2: Run the focused statistics tests and verify RED**

  Run `npm test -- --run tests/lib/text/statistics.test.ts`.

  Expected: failures identify the missing statistics module or missing exports, not malformed test setup.

- [ ] **Step 3: Implement the statistics algorithm**

  Use Unicode property escapes with global matches for Han and punctuation, the ASCII word pattern `/[A-Za-z]+(?:['’][A-Za-z]+|-[A-Za-z]+)*/g`, `/[A-Za-z]/g` for letters, `/[0-9]+/g` for number tokens, and `Array.from(text).length` for characters. Derive pure and total word counts from the component counts and derive language from Han and Latin-letter presence.

- [ ] **Step 4: Run focused and full tests GREEN**

  Run the focused file and then `npm test -- --run`.

  Expected: all statistics cases, transform cases, and edge cases pass with zero failures.

- [ ] **Step 5: Commit the statistics module**

  ```powershell
  git add src/types/text.ts src/lib/text/statistics.ts tests/lib/text/statistics.test.ts
  git commit -m "feat: add Unicode-aware text statistics"
  ```

### Task 4: Build the React shell and four interactive features

**Files:**
- Create: `src/types/app.ts`
- Create: `src/components/AppShell.tsx`, `src/components/ClipboardButtons.tsx`, `src/components/TextPane.tsx`, `src/components/TabBar.tsx`
- Create: `src/features/plain-text/PlainTextFeature.tsx`, `src/features/remove-spaces/RemoveSpacesFeature.tsx`, `src/features/statistics/StatisticsFeature.tsx`, `src/features/replace/ReplaceFeature.tsx`
- Create: `src/hooks/useClipboard.ts`
- Modify: `src/App.tsx`, `src/index.css`, `src/test/setup.ts`
- Test: `tests/App.test.tsx`

**Interfaces:**
- `FeatureId = "plain-text" | "remove-spaces" | "statistics" | "replace"` is the shared UI route type.
- `useClipboard()` exposes `handlePaste(event, onText)` and `copyText(text): Promise<void>` with non-blocking status messages.
- Feature components accept a ref/focus callback and own only their input/derived display state; they consume the Task 2/3 pure functions without duplicating algorithms.

- [ ] **Step 1: Write failing UI behavior tests**

  Add tests that render the real app and assert:

  - startup selects 纯文本 and renders all four tabs;
  - typing in 纯文本 immediately mirrors the result;
  - removing spaces keeps a newline while removing half-width/full-width spaces and Tab;
  - statistics update immediately and show the required labels/values;
  - replacement updates preview and “已替换 N 处” for all literal matches;
  - clear resets the active feature;
  - copy invokes `navigator.clipboard.writeText` with the result;
  - a paste event containing both `text/plain` and `text/html` inserts only `text/plain` and calls `preventDefault`.

- [ ] **Step 2: Run `npm test -- --run tests/App.test.tsx` and verify RED**

  Expected: the test runner reports missing shell/features or missing behavior; it must not pass on placeholder assertions.

- [ ] **Step 3: Implement the shell and feature components**

  Use one top-level tab state with default `plain-text`; keep feature text transient in React state; use controlled textareas/inputs; use the shared clipboard hook for paste/copy; use the specified pure functions for every derived result. Use Tailwind utilities and `index.css` for the pure white layout, thin borders, black active-tab underline, responsive two-pane layout, and non-card statistics rows. Do not add action buttons beyond copy and clear.

- [ ] **Step 4: Run UI and full tests GREEN**

  Run the focused App test and then `npm test -- --run`.

  Expected: all UI, transform, and statistics tests pass with zero failures.

- [ ] **Step 5: Commit the React feature layer**

  ```powershell
  git add src tests/App.test.tsx
  git commit -m "feat: add CleanPaste text tool interface"
  ```

### Task 5: Add native tray, lifecycle, global shortcuts, and single-instance behavior

**Files:**
- Create: `src-tauri/src/tray.rs`, `src-tauri/src/shortcuts.rs`
- Modify: `src-tauri/src/lib.rs`, `src-tauri/src/main.rs`, `src-tauri/Cargo.toml`, `src-tauri/capabilities/default.json`, `src-tauri/tauri.conf.json`
- Test: Rust unit tests inside `src-tauri/src/tray.rs` and `src-tauri/src/shortcuts.rs`

**Interfaces:**
- Rust emits `shortcut-command` payloads `{ kind: "toggle" | "feature", feature?: FeatureId }` and `native-warning` string payloads to the main webview.
- `shortcuts::register(app: &AppHandle) -> tauri::Result<()>` initializes the official plugin handler and attempts each global shortcut independently.
- `tray::create(app: &AppHandle) -> tauri::Result<()>` creates the tray menu/icon and handles show, feature selection, double-click, and exit.
- Pure mapping helpers `shortcut_action(...)` and `tray_action(...)` are unit-tested independently from the Windows event loop.

- [ ] **Step 1: Write failing Rust mapping tests**

  Add tests for all five global accelerators mapping to toggle/plain/remove/statistics/replace actions, unknown accelerators mapping to `None`, all tray IDs mapping to the expected action, and unknown tray IDs being ignored.

- [ ] **Step 2: Run the Rust tests and verify RED**

  Run `cargo test --manifest-path src-tauri/Cargo.toml`.

  Expected: compilation/test failures identify the missing mapping helpers, not an unavailable Rust toolchain or malformed Cargo manifest. Resolve toolchain setup first if that is the cause.

- [ ] **Step 3: Implement the native modules**

  Add `tauri-plugin-global-shortcut = "2"`, `tauri-plugin-single-instance = "2"`, and the required Tauri tray feature. Register the plugin handler with `Shortcut::new`, `Modifiers::CONTROL | Modifiers::ALT`, and `Code::KeyC`/`Code::Digit1..Digit4`; react only to `Pressed`. Show, unminimize, focus, and emit the feature command before focusing the corresponding frontend input. Hide on toggle when visible. Catch each registration error, emit `native-warning`, and continue.

  Build the tray with `TrayIconBuilder`, native menu items for opening, all four features, and quitting, and a double-left-click handler. Intercept `CloseRequested` with `prevent_close()` and `hide()`. Initialize single-instance so a second launch shows and focuses the existing main window. Preserve `app.exit(0)` only for the tray Exit action.

- [ ] **Step 4: Run Rust tests, check, and frontend build GREEN**

  Run:

  ```powershell
  cargo test --manifest-path src-tauri/Cargo.toml
  cargo check --manifest-path src-tauri/Cargo.toml
  npm run build
  ```

  Expected: Rust unit tests pass, Cargo check exits 0, and the frontend build exits 0. No shortcut registration error may be promoted to a process panic.

- [ ] **Step 5: Commit the native integration**

  ```powershell
  git add src-tauri
  git commit -m "feat: add tray shortcuts and single instance"
  ```

### Task 6: Complete runtime integration, documentation, packaging, and release automation

**Files:**
- Create: `src/hooks/useNativeShortcuts.ts`
- Modify: `src/App.tsx`, `src/types/app.ts`, `README.md`, `src-tauri/tauri.conf.json`
- Create: `LICENSE`, `.github/workflows/release.yml`

**Interfaces:**
- `useNativeShortcuts({ onFeatureChange, onToggle, onWarning })` listens for the Rust events, switches the active feature, focuses the corresponding input, and displays warning text without assuming Tauri APIs exist in browser-only tests.
- `FeatureId` is the single source of truth for tab labels, tray event payloads, global shortcuts, and `Alt+1..4` fallback mapping.

- [ ] **Step 1: Write the failing native-event/fallback tests**

  Add tests for `Alt+1..4` selecting the matching tab and preventing the browser default, and for an incoming `shortcut-command` feature payload changing the active feature and focus target. Add a warning test proving a native registration warning is rendered without blocking the UI.

- [ ] **Step 2: Run focused tests and verify RED**

  Run `npm test -- --run tests/App.test.tsx`.

  Expected: the new event/fallback assertions fail because the hook and event routing are not implemented.

- [ ] **Step 3: Implement the hook and final UI integration**

  Listen to Tauri events only when the Tauri runtime is present; clean up listeners on unmount. Use `requestAnimationFrame` after feature changes to focus the active textarea/input. Add `Alt+1..4` handling on the app shell, show the warning as a short dismissible/non-blocking status line, and keep browser tests working without native IPC.

- [ ] **Step 4: Add README, MIT license, bundle metadata, and GitHub Actions**

  README must cover the four functions, all shortcuts, tray behavior, screenshot path placeholder, Windows installation, local development, build commands, privacy statement, technology stack, and MIT license. The workflow must run on `v*`, use a Windows runner with Node and stable Rust, run tests/builds, and publish both MSI and NSIS EXE artifacts to the GitHub Release without a custom server.

- [ ] **Step 5: Run the complete verification set**

  Run the following in the project root:

  ```powershell
  npm install
  npm test -- --run
  npm run build
  cargo check --manifest-path src-tauri/Cargo.toml
  npm run tauri dev
  npm run tauri build
  ```

  For `npm run tauri dev`, confirm the app starts, opens on 纯文本, and can be stopped cleanly after startup. For `npm run tauri build`, confirm both `src-tauri/target/release/bundle/msi/*.msi` and `src-tauri/target/release/bundle/nsis/*.exe` exist. If the machine lacks WebView2 or an MSVC linker, report the exact external dependency and installation command rather than masking it in code.

- [ ] **Step 6: Commit documentation and release configuration**

  ```powershell
  git add README.md LICENSE .github/workflows/release.yml src src-tauri
  git commit -m "chore: document and automate CleanPaste releases"
  ```

## Execution Notes

Each task must follow RED → GREEN → full-suite verification before its commit. If a build/test failure comes from the implementation, use systematic debugging and add a regression test before fixing it. If a dependency or Tauri API differs from the plan, record a ruling in the execution ledger and reconcile it against the design spec before proceeding.

After Task 6, perform a fresh whole-branch code review against this plan and the design spec, fix Critical/Important findings with a new failing test and a full green suite, then use `superpowers:finishing-a-development-branch` before deciding whether to push to the supplied GitHub remote.

