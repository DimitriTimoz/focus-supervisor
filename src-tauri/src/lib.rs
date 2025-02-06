pub mod tracker;

#[derive(serde::Serialize)]
struct FocusedWindow {
  name: String,
  title: String,
}


// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn get_focused_window() -> Option<FocusedWindow> {
    match x_win::get_active_window() {
        Ok(window) => {
            let name = window.info.name;
            let title = window.title;

            if name.is_empty() {
                return None;
            }
            Some(FocusedWindow {
                name,
                title,
            })
        },
        Err(_) => None,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![get_focused_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
