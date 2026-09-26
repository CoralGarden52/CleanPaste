mod shortcuts;
mod tray;

use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Err(error) = shortcuts::show_main_window(app) {
                shortcuts::emit_warning(app, format!("激活已有窗口失败：{error}"));
            }
        }))
        .setup(|app| {
            app.handle()
                .plugin(tauri_plugin_global_shortcut::Builder::new().build())?;
            tray::create(app.handle())?;
            shortcuts::register(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if let Err(error) = window.hide() {
                    shortcuts::emit_warning(
                        window.app_handle(),
                        format!("隐藏窗口失败：{error}"),
                    );
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("CleanPaste 启动失败");
}
