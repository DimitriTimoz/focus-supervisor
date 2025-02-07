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


#[tauri::command]
fn get_last_input() -> u128 {
    match user_idle::UserIdle::get_time() {
        Ok(time) => time.as_milliseconds(),
        Err(_) => 0,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![get_focused_window, get_last_input])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
