# Visibility Toggle (for Excluded Files)

**Quickly reveal excluded files and folders in VS Code.**

This extension lets you toggle the visibility of excluded files (in regards to exclusions via `files.exclude` or `.gitignore`) directly via the UI – perfect for anyone who wants more control over what’s shown in the Explorer.


## 🔧 Features

- Toggle excluded files on or off via **status bar**, **commands**, or **Explorer context menu**.
- Right-clicking in the **Explorer** gives you quick access to:
  - *Toggle Extended Visibility*
  - *File Visibility Settings* – opens all related exclusion settings, including those of this extension.
- Scope-aware: All settings apply either globally on the **User level** or **per Workspace** – fully respecting VS Code’s configuration hierarchy.
- Protect specific exclusions from being changed using `protectedKeys`.
- Optional `.gitignore` integration: automatically toggle `excludeGitIgnore` together with visibility mode.


## 🛠 Commands

- **"Toggle Extended Visibility"**  
  Toggles visibility of excluded items.

- **"File Visibility Settings"**  
  Opens exclusion-related settings panel.


## 📦 Release Notes

### 0.0.1 (Initial release)
  - Visibility toggle via UI and commands
  - `protectedKeys` support
  - Optional `.gitignore` sync
  - Full workspace/user scope awareness



**Get full control over your file visibility — fast, flexible, and just one click away!**
