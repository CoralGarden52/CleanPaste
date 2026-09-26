use tauri::menu::MenuBuilder;
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::AppHandle;

use crate::shortcuts::{dispatch_feature, emit_warning, show_main_window};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayAction {
    Show,
    Feature(&'static str),
    Exit,
}

pub fn tray_action(id: &str) -> Option<TrayAction> {
    match id {
        "open" => Some(TrayAction::Show),
        "plain-text" => Some(TrayAction::Feature("plain-text")),
        "remove-spaces" => Some(TrayAction::Feature("remove-spaces")),
        "statistics" => Some(TrayAction::Feature("statistics")),
        "replace" => Some(TrayAction::Feature("replace")),
        "exit" => Some(TrayAction::Exit),
        _ => None,
    }
}

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let menu = MenuBuilder::new(app)
        .text("open", "显示 CleanPaste")
        .separator()
        .text("plain-text", "纯文本")
        .text("remove-spaces", "去除空格")
        .text("statistics", "字数统计")
        .text("replace", "文本替换")
        .separator()
        .text("exit", "退出")
        .build()?;

    let mut builder = TrayIconBuilder::with_id("main")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("CleanPaste")
        .on_menu_event(|app, event| match tray_action(event.id().as_ref()) {
            Some(TrayAction::Show) => {
                if let Err(error) = show_main_window(app) {
                    emit_warning(app, format!("显示窗口失败：{error}"));
                }
            }
            Some(TrayAction::Feature(feature)) => {
                if let Err(error) = dispatch_feature(app, feature) {
                    emit_warning(app, format!("切换功能失败：{error}"));
                }
            }
            Some(TrayAction::Exit) => app.exit(0),
            None => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::DoubleClick {
                button: MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Err(error) = show_main_window(&app) {
                    emit_warning(&app, format!("显示窗口失败：{error}"));
                }
            }
        });

    if let Some(icon) = app.default_window_icon().cloned() {
        builder = builder.icon(icon);
    }

    builder.build(app)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{tray_action, TrayAction};

    #[test]
    fn maps_tray_ids_to_actions() {
        assert_eq!(tray_action("open"), Some(TrayAction::Show));
        assert_eq!(
            tray_action("plain-text"),
            Some(TrayAction::Feature("plain-text"))
        );
        assert_eq!(
            tray_action("remove-spaces"),
            Some(TrayAction::Feature("remove-spaces"))
        );
        assert_eq!(
            tray_action("statistics"),
            Some(TrayAction::Feature("statistics"))
        );
        assert_eq!(
            tray_action("replace"),
            Some(TrayAction::Feature("replace"))
        );
        assert_eq!(tray_action("exit"), Some(TrayAction::Exit));
    }

    #[test]
    fn ignores_unknown_tray_ids() {
        assert_eq!(tray_action("unknown"), None);
        assert_eq!(tray_action(""), None);
    }
}
