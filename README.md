# 🎲 DnD Soundboard – Obsidian Plugin

An atmospheric soundboard for your tabletop RPG sessions, living right inside your Obsidian sidebar. Play ambient sounds, battle music and environmental effects – all without leaving your notes.

![Obsidian](https://img.shields.io/badge/Obsidian-%23483699.svg?style=flat&logo=obsidian&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Desktop Only](https://img.shields.io/badge/platform-desktop%20only-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **Sidebar Soundboard** – always one click away while you run your session
- **Categories** – organise sounds by scene (e.g. *Taverne*, *Kampf*, *Wildnis*)
- **Loop support** – ambient sounds loop seamlessly until you stop them
- **Master volume** – one slider to rule them all
- **Custom icons** – assign emoji or custom image icons to each sound button
- **Sub-labels** – add a short description beneath each button label
- **Stop All** – instantly silence everything with one button
- **Persistent settings** – your sounds, categories and volume are saved across sessions

---

## 📋 Requirements

- [Obsidian](https://obsidian.md) v1.0.0 or higher
- Desktop only (audio playback requires local file access)

---

## 🚀 Installation

### Manual (recommended for now)

1. Download `main.js` and `manifest.json` from the [latest release](../../releases/latest)
2. Create a folder at `.obsidian/plugins/dnd-soundboard/` inside your vault
3. Place both files into that folder
4. Open Obsidian → **Settings → Community Plugins** → enable **DnD Soundboard**

### Via BRAT (Beta Reviewers Auto-update Tool)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from the community plugins
2. In BRAT settings → **Add Beta Plugin**
3. Enter: `Shemyaza1220/obsidian-dnd-soundboard`

---

## ⚙️ Setup

### 1. Add your sound files

Place your audio files (`.mp3`, `.ogg`, `.wav`) into a folder inside your vault. The default folder name is `z_sounds` – you can change this in the plugin settings.

```
YourVault/
├── z_sounds/
│   ├── taverne_musik.mp3
│   ├── regen.ogg
│   ├── kampf_episch.mp3
│   └── ...
└── .obsidian/
    └── plugins/
        └── dnd-soundboard/
```

### 2. (Optional) Add custom icons

Place image files (`.png`, `.jpg`, `.svg`, `.webp`) into your icons folder (default: `z_icons`). These can be assigned to sound buttons in the editor.

### 3. Configure sounds

Go to **Settings → DnD Soundboard**:

1. Create a **category** (e.g. *Umgebung*, *Musik*, *Kampf*)
2. Click **+ Sound** to add a sound to that category
3. Fill in label, file, optional sub-label and icon
4. Enable **Loop** for ambient sounds that should repeat

---

## 🎮 Usage

Open the soundboard via the **ribbon icon** (🎵) or via **Command Palette → Open Soundboard**.

| Action | How |
|--------|-----|
| Play a sound | Click the button |
| Stop a sound | Click the playing button again |
| Loop a sound | Enable loop in settings – button glows green |
| Adjust master volume | Use the slider at the top of the sidebar |
| Stop everything | Click **■ Alles stoppen** |

---

## 🛠 Settings Reference

| Setting | Default | Description |
|---------|---------|-------------|
| Sounds Folder | `z_sounds` | Vault-relative path to your audio files |
| Icons Folder | `z_icons` | Vault-relative path to your icon images |
| Master Volume | `70` | Global volume (0–100), applied to all sounds |
| Categories | — | Ordered list of sound categories |

Each **sound** has the following fields:

| Field | Required | Description |
|-------|----------|-------------|
| Label | ✅ | Button title |
| File | ✅ | Filename inside your sounds folder |
| Sub-label | ❌ | Small description shown below the label |
| Icon | ❌ | Emoji or image filename from icons folder |
| Loop | ❌ | Whether the sound should loop |
| Volume | ❌ | Per-sound volume override (set in settings) |

---

## 🗺 Roadmap

- [ ] Drag & drop sound reordering
- [ ] Fade in / fade out
- [ ] Keyboard shortcuts per sound
- [ ] Scene presets (start/stop a whole set of sounds at once)
- [ ] Mobile support

---

## 🤝 Contributing

Issues and PRs are welcome! Please open an issue first to discuss what you'd like to change.

---

## 📄 License

[MIT](LICENSE) © Shemyaza1220
