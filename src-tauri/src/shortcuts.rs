use serde_json::json;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ShortcutAction {
    Toggle,
    Feature(&'static str),
}

pub fn shortcut_action(accelerator: &str) -> Option<ShortcutAction> {
    let normalized = accelerator.to_ascii_lowercase().replace("control", "ctrl");

    match normalized.as_str() {
        "ctrl+alt+c" => Some(ShortcutAction::Toggle),
        "ctrl+alt+1" => Some(ShortcutAction::Feature("plain-text")),
        "ctrl+alt+2" => Some(ShortcutAction::Feature("remove-spaces")),
        "ctrl+alt+3" => Some(ShortcutAction::Feature("statistics")),
        "ctrl+alt+4" => Some(ShortcutAction::Feature("replace")),
        _ => None,
    }
}

pub(crate) fn emit_warning(app: &AppHandle, message: impl Into<String>) {
    let _ = app.emit("native-warning", message.into());
}

pub(crate) fn show_main_window(app: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.show()?;
        window.unminimize()?;
        window.set_focus()?;
    }

    Ok(())
}

pub(crate) fn dispatch_feature(app: &AppHandle, feature: &'static str) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.show()?;
        window.unminimize()?;
        app.emit(
            "shortcut-command",
            json!({ "kind": "feature", "feature": feature }),
        )?;
        window.set_focus()?;
    }

    Ok(())
}

fn dispatch_action(app: &AppHandle, action: ShortcutAction) -> tauri::Result<()> {
    match action {
        ShortcutAction::Toggle => {
            if let Some(window) = app.get_webview_window("main") {
                if window.is_visible()? {
                    window.hide()?
                } else {
                    window.show()?;
                    window.unminimize()?;
                    window.set_focus()?
                }
            }
            app.emit("shortcut-command", json!({ "kind": "toggle" }))?;
        }
        ShortcutAction::Feature(feature) => dispatch_feature(app, feature)?,
    }

    Ok(())
}

pub fn register(app: &AppHandle) -> tauri::Result<()> {
    let modifiers = Modifiers::CONTROL | Modifiers::ALT;
    let shortcuts = [
        (
            Shortcut::new(Some(modifiers), Code::KeyC),
            "control+alt+c",
        ),
        (
            Shortcut::new(Some(modifiers), Code::Digit1),
            "control+alt+1",
        ),
        (
            Shortcut::new(Some(modifiers), Code::Digit2),
            "control+alt+2",
        ),
        (
            Shortcut::new(Some(modifiers), Code::Digit3),
            "control+alt+3",
        ),
        (
            Shortcut::new(Some(modifiers), Code::Digit4),
            "control+alt+4",
        ),
    ];

    for (shortcut, accelerator) in shortcuts {
        let action = shortcut_action(accelerator).expect("快捷键映射必须存在");
        let registration = app.global_shortcut().on_shortcut(
            shortcut,
            move |app, _shortcut, event| {
                if event.state != ShortcutState::Pressed {
                    return;
                }

                if let Err(error) = dispatch_action(app, action) {
                    emit_warning(app, format!("快捷键执行失败：{error}"));
                }
            },
        );

        if let Err(error) = registration {
            emit_warning(app, format!("全局快捷键 {accelerator} 注册失败：{error}"));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{shortcut_action, ShortcutAction};

    #[test]
    fn maps_global_accelerators_to_actions() {
        assert_eq!(shortcut_action("Ctrl+Alt+C"), Some(ShortcutAction::Toggle));
        assert_eq!(
            shortcut_action("Ctrl+Alt+1"),
            Some(ShortcutAction::Feature("plain-text"))
        );
        assert_eq!(
            shortcut_action("Ctrl+Alt+2"),
            Some(ShortcutAction::Feature("remove-spaces"))
        );
        assert_eq!(
            shortcut_action("Ctrl+Alt+3"),
            Some(ShortcutAction::Feature("statistics"))
        );
        assert_eq!(
            shortcut_action("Ctrl+Alt+4"),
            Some(ShortcutAction::Feature("replace"))
        );
    }

    #[test]
    fn ignores_unknown_accelerators() {
        assert_eq!(shortcut_action("Ctrl+Shift+C"), None);
        assert_eq!(shortcut_action(""), None);
    }
}
