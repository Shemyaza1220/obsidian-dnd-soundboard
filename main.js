"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

var main_exports = {};
__export(main_exports, {
  SoundboardView: () => SoundboardView,
  SoundEditModal: () => SoundEditModal,
  VIEW_TYPE: () => VIEW_TYPE,
  default: () => SoundboardPlugin
});
module.exports = __toCommonJS(main_exports);

var import_obsidian = require("obsidian");

// ─── Defaults ────────────────────────────────────────────────────────────────

var DEFAULT_SETTINGS = {
  masterVolume: 70,
  soundsFolder: "z_sounds",
  iconsFolder: "z_icons",
  categories: []
};

var VIEW_TYPE = "dnd-soundboard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isImageIcon(icon) {
  return !!icon && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(icon);
}

// Returns an <img> or a text span for an icon value
function renderIcon(app, icon, iconsFolder, cls) {
  if (isImageIcon(icon)) {
    const filePath = (0, import_obsidian.normalizePath)(`${iconsFolder}/${icon}`);
    const file = app.vault.getAbstractFileByPath(filePath);
    const el = document.createElement("img");
    el.className = cls || "";
    if (file instanceof import_obsidian.TFile) {
      el.src = app.vault.getResourcePath(file);
    }
    return el;
  }
  const el = document.createElement("span");
  el.className = cls || "";
  el.textContent = icon || "🎵";
  return el;
}

// ─── Input Modal ──────────────────────────────────────────────────────────────

var InputModal = class extends import_obsidian.Modal {
  constructor(app, title, placeholder, defaultValue, onSubmit) {
    super(app);
    this.title = title;
    this.placeholder = placeholder;
    this.defaultValue = defaultValue || "";
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.title });

    let value = this.defaultValue;
    const input = contentEl.createEl("input", { type: "text" });
    input.placeholder = this.placeholder;
    input.value = value;
    input.style.cssText = "width:100%;padding:6px 8px;margin:12px 0;font-size:14px;border:1px solid var(--background-modifier-border);border-radius:var(--radius-m);background:var(--background-primary);color:var(--text-normal);box-sizing:border-box;";
    input.addEventListener("input", e => { value = e.target.value; });
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") submit();
      if (e.key === "Escape") this.close();
    });

    const btnRow = contentEl.createDiv();
    btnRow.style.cssText = "display:flex;gap:8px;justify-content:flex-end;margin-top:8px;";

    const cancelBtn = btnRow.createEl("button", { text: "Abbrechen" });
    cancelBtn.addEventListener("click", () => this.close());

    const okBtn = btnRow.createEl("button", { text: "OK" });
    okBtn.addClass("mod-cta");
    okBtn.addEventListener("click", () => submit());

    const submit = () => {
      if (value.trim()) { this.onSubmit(value.trim()); this.close(); }
      else input.style.borderColor = "var(--text-error)";
    };

    setTimeout(() => input.focus(), 50);
  }

  onClose() { this.contentEl.empty(); }
};

// ─── Icon Picker Modal ────────────────────────────────────────────────────────

var IconPickerModal = class extends import_obsidian.Modal {
  constructor(app, iconFiles, iconsFolder, currentIcon, onSelect) {
    super(app);
    this.iconFiles = iconFiles;
    this.iconsFolder = iconsFolder;
    this.currentIcon = currentIcon;
    this.onSelect = onSelect;
  }

  onOpen() {
    const { contentEl } = this;
    this.modalEl.style.width = "480px";
    contentEl.createEl("h3", { text: "Icon auswählen" });

    // Emoji option at the top
    const emojiRow = contentEl.createDiv("sb-icon-picker-emoji-row");
    emojiRow.createEl("span", { text: "Eigenes Emoji:", cls: "sb-icon-picker-emoji-label" });
    const emojiInput = emojiRow.createEl("input", { type: "text" });
    emojiInput.placeholder = "🎵";
    emojiInput.value = isImageIcon(this.currentIcon) ? "" : (this.currentIcon || "");
    emojiInput.style.cssText = "width:60px;padding:4px 6px;font-size:18px;text-align:center;border:1px solid var(--background-modifier-border);border-radius:var(--radius-s);background:var(--background-primary);color:var(--text-normal);";
    const emojiOkBtn = emojiRow.createEl("button", { text: "Verwenden" });
    emojiOkBtn.addClass("mod-cta");
    emojiOkBtn.style.cssText = "padding:4px 10px;font-size:12px;";
    emojiOkBtn.addEventListener("click", () => {
      const val = emojiInput.value.trim();
      if (val) { this.onSelect(val); this.close(); }
    });

    contentEl.createEl("div", { text: "— oder PNG aus Bibliothek —", cls: "sb-icon-picker-divider" });

    if (this.iconFiles.length === 0) {
      contentEl.createEl("p", { text: "Keine Icons im Icons-Ordner gefunden.", cls: "sb-icon-picker-empty" });
      return;
    }

    // Search input
    const searchInput = contentEl.createEl("input", { type: "text" });
    searchInput.placeholder = "Icons durchsuchen…";
    searchInput.style.cssText = "width:100%;padding:6px 8px;margin-bottom:10px;font-size:13px;border:1px solid var(--background-modifier-border);border-radius:var(--radius-s);background:var(--background-primary);color:var(--text-normal);box-sizing:border-box;";

    const grid = contentEl.createDiv("sb-icon-picker-grid");

    const renderGrid = (filter) => {
      grid.empty();
      const term = filter.toLowerCase();
      let shown = 0;
      for (const filename of this.iconFiles) {
        const name = filename.replace(/\.[^.]+$/, "");
        if (term && !name.toLowerCase().includes(term)) continue;
        const filePath = (0, import_obsidian.normalizePath)(`${this.iconsFolder}/${filename}`);
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (!(file instanceof import_obsidian.TFile)) continue;

        const item = grid.createDiv("sb-icon-picker-item");
        if (this.currentIcon === filename) item.addClass("sb-icon-picker-selected");

        const img = item.createEl("img");
        img.src = this.app.vault.getResourcePath(file);
        img.alt = filename;

        item.createEl("div", { text: name, cls: "sb-icon-picker-label" });
        item.addEventListener("click", () => { this.onSelect(filename); this.close(); });
        shown++;
      }
      if (shown === 0) {
        grid.createEl("div", { text: `Keine Icons für "${filter}" gefunden.`, cls: "sb-icon-picker-empty" });
      }
    };

    renderGrid("");
    searchInput.addEventListener("input", e => renderGrid(e.target.value));
    setTimeout(() => searchInput.focus(), 50);
  }

  onClose() { this.contentEl.empty(); }
};

// ─── Move Sound Modal ─────────────────────────────────────────────────────────

var MoveSoundModal = class extends import_obsidian.Modal {
  constructor(app, sound, categories, currentCatIdx, onMove) {
    super(app);
    this.sound = sound;
    this.categories = categories;
    this.currentCatIdx = currentCatIdx;
    this.onMove = onMove;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: `"${this.sound.label}" verschieben` });
    contentEl.createEl("p", { text: "Ziel-Kategorie wählen:", cls: "sb-move-hint" });

    const list = contentEl.createDiv("sb-move-cat-list");
    const others = this.categories.filter((_, i) => i !== this.currentCatIdx);

    if (others.length === 0) {
      list.createEl("p", { text: "Keine anderen Kategorien vorhanden.", cls: "sb-move-empty" });
    } else {
      for (const cat of others) {
        const btn = list.createEl("button", { text: cat.category, cls: "sb-move-cat-btn" });
        btn.addEventListener("click", () => {
          this.onMove(cat);
          this.close();
        });
      }
    }

    const cancelBtn = contentEl.createEl("button", { text: "Abbrechen", cls: "sb-move-cancel-btn" });
    cancelBtn.addEventListener("click", () => this.close());
  }

  onClose() { this.contentEl.empty(); }
};

// ─── Sound Edit Modal ─────────────────────────────────────────────────────────

var SoundEditModal = class extends import_obsidian.Modal {
  constructor(app, sound, audioFiles, iconFiles, iconsFolder, onSave) {
    super(app);
    this.editSound = sound
      ? { ...sound }
      : { id: "", label: "", sub: "", icon: "🎵", file: "", loop: false, volume: 100 };
    this.audioFiles = audioFiles;
    this.iconFiles = iconFiles;
    this.iconsFolder = iconsFolder;
    this.onSave = onSave;
    this.isNew = !sound;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: this.isNew ? "Sound hinzufügen" : "Sound bearbeiten" });

    // Name
    new import_obsidian.Setting(contentEl)
      .setName("Name")
      .setDesc("Anzeigename des Buttons")
      .addText(t => t.setPlaceholder("z.B. Taverne").setValue(this.editSound.label).onChange(v => (this.editSound.label = v)));

    // Sub
    new import_obsidian.Setting(contentEl)
      .setName("Beschreibung")
      .setDesc("Kurze Unterzeile (optional)")
      .addText(t => t.setPlaceholder("z.B. Gemurmel & Musik").setValue(this.editSound.sub || "").onChange(v => (this.editSound.sub = v)));

    // Icon picker
    const iconSetting = new import_obsidian.Setting(contentEl)
      .setName("Icon")
      .setDesc("Emoji oder PNG aus der Icon-Bibliothek");

    // Preview + button
    const iconPreviewWrap = iconSetting.controlEl.createDiv("sb-icon-preview-wrap");

    const updatePreview = () => {
      iconPreviewWrap.empty();
      const preview = renderIcon(this.app, this.editSound.icon, this.iconsFolder, "sb-icon-preview-img");
      iconPreviewWrap.appendChild(preview);
      const btn = iconPreviewWrap.createEl("button", { text: "Ändern", cls: "sb-icon-pick-btn" });
      btn.addEventListener("click", () => {
        new IconPickerModal(this.app, this.iconFiles, this.iconsFolder, this.editSound.icon, selected => {
          this.editSound.icon = selected;
          updatePreview();
        }).open();
      });
    };
    updatePreview();

    // Audio file
    const fileSetting = new import_obsidian.Setting(contentEl)
      .setName("Audiodatei")
      .setDesc("Datei aus dem Sound-Ordner");

    if (this.audioFiles.length > 0) {
      fileSetting.addDropdown(d => {
        d.addOption("", "── Datei wählen ──");
        this.audioFiles.forEach(f => d.addOption(f, f));
        d.setValue(this.editSound.file || "").onChange(v => (this.editSound.file = v));
      });
    } else {
      fileSetting
        .setDesc("Keine Dateien gefunden – Sound-Ordner in den Einstellungen prüfen.")
        .addText(t => t.setPlaceholder("dateiname.mp3").setValue(this.editSound.file).onChange(v => (this.editSound.file = v)));
    }

    // Loop
    new import_obsidian.Setting(contentEl)
      .setName("Loop")
      .setDesc("Sound in Schleife abspielen (ideal für Ambience)")
      .addToggle(t => t.setValue(this.editSound.loop || false).onChange(v => (this.editSound.loop = v)));

    // Individual Volume
    const volSetting = new import_obsidian.Setting(contentEl)
      .setName("Lautstärke")
      .setDesc("Individuelle Lautstärke (0–100). Wird mit Master-Volume multipliziert.");
    const volDisplay = volSetting.nameEl.createEl("span", { cls: "sb-edit-vol-val" });
    const curVol = this.editSound.volume ?? 100;
    volDisplay.textContent = ` ${curVol}%`;
    volSetting.addSlider(sl => {
      sl.setLimits(0, 100, 1).setValue(curVol).onChange(v => {
        this.editSound.volume = v;
        volDisplay.textContent = ` ${v}%`;
      });
      sl.sliderEl.addEventListener("mousedown", e => {
        e.stopPropagation();
        const onMove = e => e.stopPropagation();
        const onUp = () => {
          document.removeEventListener("mousemove", onMove, true);
          document.removeEventListener("mouseup", onUp, true);
        };
        document.addEventListener("mousemove", onMove, true);
        document.addEventListener("mouseup", onUp, true);
      });
    });

    // Save / Cancel
    new import_obsidian.Setting(contentEl)
      .addButton(b => b.setButtonText("Speichern").setCta().onClick(() => {
        if (!this.editSound.label.trim()) { new import_obsidian.Notice("Bitte einen Namen eingeben."); return; }
        if (!this.editSound.file) { new import_obsidian.Notice("Bitte eine Audiodatei auswählen."); return; }
        if (!this.editSound.id) {
          this.editSound.id = this.editSound.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
        }
        this.onSave({ ...this.editSound });
        this.close();
      }))
      .addButton(b => b.setButtonText("Abbrechen").onClick(() => this.close()));
  }

  onClose() { this.contentEl.empty(); }
};

// ─── Soundboard Sidebar View ──────────────────────────────────────────────────

var SoundboardView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.playing = new Map();
    this.plugin = plugin;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Soundboard"; }
  getIcon() { return "music"; }

  async onOpen() { this.render(); }
  async onClose() { this.stopAll(); }

  render() {
    const { settings } = this.plugin;
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("sb-root");

    const style = root.createEl("style");
    style.textContent = CSS;

    const header = root.createDiv("sb-header");
    header.createEl("span", { text: "⚔ Soundboard", cls: "sb-title" });

    const master = root.createDiv("sb-master");
    master.createEl("span", { text: "Lautstärke", cls: "sb-master-label" });
    const volSlider = master.createEl("input");
    volSlider.type = "range"; volSlider.min = "0"; volSlider.max = "100";
    volSlider.step = "1"; volSlider.value = String(settings.masterVolume);
    volSlider.addClass("sb-slider");
    const volVal = master.createEl("span", { text: String(settings.masterVolume), cls: "sb-vol-val" });
    volSlider.addEventListener("mousedown", e => {
      e.stopPropagation();
      const onMove = e => e.stopPropagation();
      const onUp = () => {
        document.removeEventListener("mousemove", onMove, true);
        document.removeEventListener("mouseup", onUp, true);
      };
      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("mouseup", onUp, true);
    });
    volSlider.addEventListener("input", () => {
      const v = parseInt(volSlider.value);
      volVal.textContent = String(v);
      this.plugin.settings.masterVolume = v;
      this.plugin.saveSettings();
      this.playing.forEach(entry => (entry.audio.volume = (v / 100) * ((entry.vol ?? 100) / 100)));
    });

    const stopBtn = root.createEl("button", { text: "■  Alles stoppen", cls: "sb-stop-all" });
    stopBtn.addEventListener("click", () => this.stopAll());

    const activeCats = settings.categories.filter(c => c.sounds.length > 0);
    if (activeCats.length === 0) {
      const empty = root.createDiv("sb-empty");
      empty.createEl("p", { text: "Noch keine Sounds konfiguriert." });
      empty.createEl("p", { text: "→ Einstellungen → DnD Soundboard" });
      return;
    }

    for (const cat of activeCats) {
      const catDiv = root.createDiv("sb-category");
      catDiv.createEl("div", { text: cat.category, cls: "sb-cat-label" });
      const grid = catDiv.createDiv("sb-grid");
      for (const s of cat.sounds) {
        const btn = grid.createEl("button", { cls: "sb-btn" });
        btn.dataset.id = s.id;

        // ── Top: click area for toggle ──
        const top = btn.createDiv("sb-btn-top");
        const iconEl = renderIcon(this.app, s.icon, settings.iconsFolder, "sb-btn-icon");
        top.appendChild(iconEl);
        const info = top.createDiv("sb-btn-info");
        info.createEl("div", { text: s.label, cls: "sb-btn-label" });
        if (s.sub) info.createEl("div", { text: s.sub, cls: "sb-btn-sub" });
        if (s.loop) top.createEl("span", { text: "↺", cls: "sb-loop-badge" });
        btn.addEventListener("click", () => this.toggleSound(s, btn));


        btn.createDiv("sb-playing-bar");

        // restore active state
        if (this.playing.has(s.id)) {
          btn.addClass("sb-playing");
          if (s.loop) btn.addClass("sb-looping");
        }
      }
    }
  }

  async toggleSound(s, btn) {
    const key = s.id;
    if (this.playing.has(key)) {
      this.playing.get(key).audio.pause();
      this.playing.delete(key);
      btn.removeClass("sb-playing", "sb-looping");
      return;
    }
    const folder = this.plugin.settings.soundsFolder;
    const filePath = (0, import_obsidian.normalizePath)(`${folder}/${s.file}`);
    const file = this.app.vault.getAbstractFileByPath(filePath);
    let src;
    if (file instanceof import_obsidian.TFile) src = this.app.vault.getResourcePath(file);
    else src = filePath;

    const soundVol = (s.volume ?? 100) / 100;
    const audio = new Audio(src);
    audio.volume = (this.plugin.settings.masterVolume / 100) * soundVol;
    audio.loop = s.loop;
    audio.addEventListener("error", () => {
      this.playing.delete(key);
      btn.removeClass("sb-playing", "sb-looping");
      const label = btn.querySelector(".sb-btn-label");
      if (label) {
        const orig = label.textContent ?? "";
        label.textContent = "⚠ nicht gefunden";
        setTimeout(() => (label.textContent = orig), 2500);
      }
    });
    audio.addEventListener("ended", () => {
      if (!s.loop) { this.playing.delete(key); btn.removeClass("sb-playing", "sb-looping"); }
    });
    this.playing.set(key, { audio, vol: s.volume ?? 100 });
    btn.addClass("sb-playing");
    if (s.loop) btn.addClass("sb-looping");
    await audio.play().catch(() => {});
  }

  stopAll() {
    this.playing.forEach(entry => entry.audio.pause());
    this.playing.clear();
    this.containerEl.querySelectorAll(".sb-btn").forEach(btn => btn.removeClass("sb-playing", "sb-looping"));
  }
};

// ─── Plugin ───────────────────────────────────────────────────────────────────

var SoundboardPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, leaf => new SoundboardView(leaf, this));
    this.addRibbonIcon("music", "DnD Soundboard öffnen", () => this.activateView());
    this.addCommand({ id: "open-soundboard", name: "Soundboard öffnen", callback: () => this.activateView() });
    this.addSettingTab(new SoundboardSettingTab(this.app, this));
  }

  async onunload() { this.app.workspace.detachLeavesOfType(VIEW_TYPE); }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!this.settings.categories) this.settings.categories = [];
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach(leaf => {
      if (leaf.view instanceof SoundboardView) leaf.view.render();
    });
  }

  async saveSilent() {
    await this.saveData(this.settings);
  }

  getAudioFiles() {
    const folder = this.settings.soundsFolder.replace(/\/$/, "");
    return this.app.vault.getFiles()
      .filter(f => f.path.startsWith(folder + "/") && /\.(mp3|ogg|wav|m4a|flac|webm)$/i.test(f.name))
      .map(f => f.name)
      .sort((a, b) => a.localeCompare(b));
  }

  getIconFiles() {
    const folder = this.settings.iconsFolder.replace(/\/$/, "");
    return this.app.vault.getFiles()
      .filter(f => f.path.startsWith(folder + "/") && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f.name))
      .map(f => f.name)
      .sort((a, b) => a.localeCompare(b));
  }
};

// ─── Settings Tab ─────────────────────────────────────────────────────────────

var SoundboardSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "⚔ DnD Soundboard" });

    // Sound folder
    new import_obsidian.Setting(containerEl)
      .setName("Sound-Ordner")
      .setDesc("Ordner mit deinen Audiodateien (relativ zum Vault-Root)")
      .addText(t => t.setPlaceholder("z_sounds").setValue(this.plugin.settings.soundsFolder).onChange(async v => {
        this.plugin.settings.soundsFolder = v.trim() || "z_sounds";
        await this.plugin.saveSettings();
        this.display();
      }));

    const audioFiles = this.plugin.getAudioFiles();
    containerEl.createEl("p", {
      text: audioFiles.length > 0 ? `✓ ${audioFiles.length} Audiodateien gefunden.` : "⚠ Keine Audiodateien gefunden.",
      cls: "sb-settings-info"
    });

    // Icons folder
    new import_obsidian.Setting(containerEl)
      .setName("Icons-Ordner")
      .setDesc("Ordner mit PNG-Icons für die Buttons (relativ zum Vault-Root)")
      .addText(t => t.setPlaceholder("z_icons").setValue(this.plugin.settings.iconsFolder).onChange(async v => {
        this.plugin.settings.iconsFolder = v.trim() || "z_icons";
        await this.plugin.saveSettings();
        this.display();
      }));

    const iconFiles = this.plugin.getIconFiles();
    containerEl.createEl("p", {
      text: iconFiles.length > 0 ? `✓ ${iconFiles.length} Icons gefunden.` : "⚠ Keine Icons gefunden.",
      cls: "sb-settings-info"
    });

    containerEl.createEl("h3", { text: "Kategorien & Sounds" });

    const { categories } = this.plugin.settings;

    for (const [catIdx, cat] of categories.entries()) {
      const catSection = containerEl.createDiv("sb-settings-cat");
      const catHeader = catSection.createDiv("sb-settings-cat-header");
      catHeader.createEl("span", { text: cat.category, cls: "sb-settings-cat-name" });
      const catActions = catHeader.createDiv("sb-settings-cat-actions");

      const renameBtn = catActions.createEl("button", { text: "✏", title: "Umbenennen", cls: "sb-settings-icon-btn" });
      renameBtn.addEventListener("click", () => {
        new InputModal(this.app, "Kategorie umbenennen", "Neuer Name", cat.category, name => {
          categories[catIdx].category = name;
          this.plugin.saveSettings(); this.display();
        }).open();
      });

      if (catIdx > 0) {
        const upBtn = catActions.createEl("button", { text: "↑", title: "Nach oben", cls: "sb-settings-icon-btn" });
        upBtn.addEventListener("click", () => {
          [categories[catIdx - 1], categories[catIdx]] = [categories[catIdx], categories[catIdx - 1]];
          this.plugin.saveSettings(); this.display();
        });
      }
      if (catIdx < categories.length - 1) {
        const downBtn = catActions.createEl("button", { text: "↓", title: "Nach unten", cls: "sb-settings-icon-btn" });
        downBtn.addEventListener("click", () => {
          [categories[catIdx], categories[catIdx + 1]] = [categories[catIdx + 1], categories[catIdx]];
          this.plugin.saveSettings(); this.display();
        });
      }

      const delCatBtn = catActions.createEl("button", { text: "🗑", title: "Löschen", cls: "sb-settings-icon-btn sb-settings-delete-btn" });
      delCatBtn.addEventListener("click", () => {
        categories.splice(catIdx, 1);
        this.plugin.saveSettings(); this.display();
        new import_obsidian.Notice(`Kategorie "${cat.category}" gelöscht.`);
      });

      const soundsList = catSection.createDiv("sb-settings-sounds");
      if (cat.sounds.length === 0) soundsList.createEl("div", { text: "Noch keine Sounds.", cls: "sb-settings-empty" });

      for (const [sndIdx, snd] of cat.sounds.entries()) {
        const sndRow = soundsList.createDiv("sb-settings-sound-row");
        const sndInfo = sndRow.createDiv("sb-settings-sound-info");

        // Icon preview (PNG or emoji)
        const iconEl = renderIcon(this.app, snd.icon, this.plugin.settings.iconsFolder, "sb-settings-snd-icon");
        sndInfo.appendChild(iconEl);

        const sndMeta = sndInfo.createDiv("sb-settings-snd-meta");
        const nameLine = sndMeta.createDiv();
        nameLine.createEl("span", { text: snd.label, cls: "sb-settings-snd-label" });
        if (snd.sub) nameLine.createEl("span", { text: `  ${snd.sub}`, cls: "sb-settings-snd-sub" });
        const fileLine = sndMeta.createDiv();
        fileLine.createEl("code", { text: snd.file, cls: "sb-settings-snd-file" });
        if (snd.loop) fileLine.createEl("span", { text: " ↺ loop", cls: "sb-settings-snd-loop" });

        const sndActions = sndRow.createDiv("sb-settings-sound-actions");

        if (sndIdx > 0) {
          const up = sndActions.createEl("button", { text: "↑", title: "Nach oben", cls: "sb-settings-icon-btn" });
          up.addEventListener("click", () => {
            [cat.sounds[sndIdx - 1], cat.sounds[sndIdx]] = [cat.sounds[sndIdx], cat.sounds[sndIdx - 1]];
            this.plugin.saveSettings(); this.display();
          });
        }
        if (sndIdx < cat.sounds.length - 1) {
          const dn = sndActions.createEl("button", { text: "↓", title: "Nach unten", cls: "sb-settings-icon-btn" });
          dn.addEventListener("click", () => {
            [cat.sounds[sndIdx], cat.sounds[sndIdx + 1]] = [cat.sounds[sndIdx + 1], cat.sounds[sndIdx]];
            this.plugin.saveSettings(); this.display();
          });
        }

        const editBtn = sndActions.createEl("button", { text: "✏", title: "Bearbeiten", cls: "sb-settings-icon-btn" });
        editBtn.addEventListener("click", () => {
          new SoundEditModal(this.app, snd, audioFiles, iconFiles, this.plugin.settings.iconsFolder, updated => {
            cat.sounds[sndIdx] = updated;
            this.plugin.saveSettings(); this.display();
          }).open();
        });

        if (categories.length > 1) {
          const moveBtn = sndActions.createEl("button", { text: "→", title: "Kategorie wechseln", cls: "sb-settings-icon-btn sb-settings-move-btn" });
          moveBtn.addEventListener("click", () => {
            new MoveSoundModal(this.app, snd, categories, catIdx, targetCat => {
              cat.sounds.splice(sndIdx, 1);
              targetCat.sounds.push(snd);
              this.plugin.saveSettings(); this.display();
              new import_obsidian.Notice(`"${snd.label}" → ${targetCat.category}`);
            }).open();
          });
        }

        const delBtn = sndActions.createEl("button", { text: "🗑", title: "Löschen", cls: "sb-settings-icon-btn sb-settings-delete-btn" });
        delBtn.addEventListener("click", () => {
          cat.sounds.splice(sndIdx, 1);
          this.plugin.saveSettings(); this.display();
          new import_obsidian.Notice(`Sound "${snd.label}" gelöscht.`);
        });
      }

      const addSoundBtn = soundsList.createEl("button", { text: "+ Sound hinzufügen", cls: "sb-settings-add-sound-btn" });
      addSoundBtn.addEventListener("click", () => {
        new SoundEditModal(this.app, null, audioFiles, iconFiles, this.plugin.settings.iconsFolder, newSound => {
          cat.sounds.push(newSound);
          this.plugin.saveSettings(); this.display();
        }).open();
      });
    }

    // Add category
    const addCatDiv = containerEl.createDiv("sb-settings-add-cat");
    const addCatBtn = addCatDiv.createEl("button", { text: "+ Kategorie hinzufügen", cls: "sb-settings-add-cat-btn" });
    addCatBtn.addEventListener("click", () => {
      new InputModal(this.app, "Neue Kategorie", "z.B. Atmosphäre", "", name => {
        categories.push({ category: name, sounds: [] });
        this.plugin.saveSettings(); this.display();
      }).open();
    });

    if (!containerEl.querySelector("style.sb-settings-style")) {
      const s = containerEl.createEl("style");
      s.addClass("sb-settings-style");
      s.textContent = SETTINGS_CSS;
    }
  }
};

// ─── Soundboard CSS ───────────────────────────────────────────────────────────

var CSS = `
.sb-root { padding:12px 10px; font-family:var(--font-text); overflow-y:auto; height:100%; }
.sb-header { margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--background-modifier-border); }
.sb-title { font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-muted); }
.sb-master { background:var(--background-secondary); border:1px solid var(--background-modifier-border); border-radius:var(--radius-m); padding:8px 10px; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
.sb-master-label { font-size:11px; color:var(--text-faint); width:70px; flex-shrink:0; }
.sb-slider { flex:1; height:4px; accent-color:var(--interactive-accent); cursor:pointer; }
.sb-vol-val { font-size:11px; color:var(--text-muted); width:26px; text-align:right; }
.sb-stop-all { width:100%; background:transparent; border:1px solid var(--text-error); border-radius:var(--radius-m); padding:6px; color:var(--text-error); font-size:11px; letter-spacing:1px; text-transform:uppercase; cursor:pointer; margin-bottom:12px; font-family:var(--font-text); transition:background 0.15s; }
.sb-stop-all:hover { background:rgba(var(--color-red-rgb),0.1); }
.sb-empty { text-align:center; color:var(--text-faint); font-size:12px; padding:20px 10px; line-height:1.8; }
.sb-category { margin-bottom:12px; }
.sb-cat-label { font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-faint); margin-bottom:5px; padding-left:2px; }
.sb-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px; }
.sb-btn { background:var(--background-secondary); border:1px solid var(--background-modifier-border); border-radius:var(--radius-m); padding:7px 8px; cursor:pointer; display:flex; align-items:center; gap:6px; text-align:left; transition:border-color 0.15s,background 0.15s; position:relative; overflow:hidden; }
.sb-btn:hover { background:var(--background-secondary-alt); border-color:var(--background-modifier-border-hover); }
.sb-btn.sb-playing { border-color:var(--interactive-accent); background:rgba(var(--interactive-accent-rgb),0.12); }
.sb-btn.sb-playing .sb-btn-label { color:var(--interactive-accent); font-weight:600; }
.sb-btn.sb-looping { border-color:var(--color-green); background:rgba(var(--color-green-rgb),0.12); }
.sb-btn.sb-looping .sb-btn-label { color:var(--color-green); font-weight:600; }
.sb-btn-top { display:flex; align-items:center; gap:6px; width:100%; }
.sb-btn-icon { font-size:14px; flex-shrink:0; width:20px; height:20px; text-align:center; object-fit:contain; }
.sb-btn-info { flex:1; min-width:0; }
.sb-btn-label { font-size:12px; color:var(--text-normal); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.3; }
.sb-btn-sub { font-size:10px; color:var(--text-faint); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.2; }
.sb-loop-badge { font-size:9px; color:var(--text-faint); opacity:0.5; flex-shrink:0; }
.sb-btn.sb-looping .sb-loop-badge { color:var(--color-green); opacity:1; animation:sb-spin 3s linear infinite; display:inline-block; }
.sb-playing-bar { position:absolute; bottom:0; left:0; height:2px; background:var(--interactive-accent); width:0%; border-radius:0 0 var(--radius-m) var(--radius-m); }
.sb-btn.sb-playing .sb-playing-bar { width:100%; animation:sb-pulse 2s ease-in-out infinite; }
.sb-btn.sb-looping .sb-playing-bar { background:var(--color-green); width:100%; animation:sb-pulse 2s ease-in-out infinite; }
@keyframes sb-pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
@keyframes sb-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

// ─── Settings CSS ─────────────────────────────────────────────────────────────

var SETTINGS_CSS = `
.sb-settings-info { font-size:12px; color:var(--text-muted); margin:-8px 0 16px 0; }
.sb-settings-cat { border:1px solid var(--background-modifier-border); border-radius:var(--radius-m); margin-bottom:10px; overflow:hidden; }
.sb-settings-cat-header { display:flex; align-items:center; background:var(--background-secondary); padding:8px 10px; gap:6px; }
.sb-settings-cat-name { flex:1; font-weight:600; font-size:13px; }
.sb-settings-cat-actions { display:flex; gap:4px; }
.sb-settings-icon-btn { background:transparent; border:1px solid transparent; border-radius:var(--radius-s); padding:2px 6px; cursor:pointer; font-size:13px; color:var(--text-muted); line-height:1.5; transition:background 0.1s,color 0.1s; }
.sb-settings-icon-btn:hover { background:var(--background-modifier-hover); color:var(--text-normal); border-color:var(--background-modifier-border); }
.sb-settings-delete-btn:hover { color:var(--text-error); background:rgba(var(--color-red-rgb),0.08); border-color:var(--text-error); }
.sb-settings-move-btn { color:var(--interactive-accent); }
.sb-settings-move-btn:hover { background:rgba(var(--interactive-accent-rgb),0.1); border-color:var(--interactive-accent); color:var(--interactive-accent); }
.sb-settings-sounds { padding:6px 8px; }
.sb-settings-empty { font-size:12px; color:var(--text-faint); padding:6px 4px; font-style:italic; }
.sb-settings-sound-row { display:flex; align-items:center; gap:8px; padding:5px 4px; border-radius:var(--radius-s); transition:background 0.1s; }
.sb-settings-sound-row:hover { background:var(--background-modifier-hover); }
.sb-settings-sound-info { display:flex; align-items:center; gap:8px; flex:1; min-width:0; }
.sb-settings-snd-icon { width:22px; height:22px; font-size:16px; flex-shrink:0; object-fit:contain; }
.sb-settings-snd-meta { min-width:0; }
.sb-settings-snd-label { font-size:13px; font-weight:500; }
.sb-settings-snd-sub { font-size:12px; color:var(--text-muted); }
.sb-settings-snd-file { font-size:11px; color:var(--text-faint); }
.sb-settings-snd-loop { font-size:11px; color:var(--color-green); margin-left:4px; }
.sb-edit-vol-val { font-size:12px; color:var(--text-muted); font-weight:normal; margin-left:6px; }
.sb-settings-sound-actions { display:flex; gap:2px; flex-shrink:0; }
.sb-settings-add-sound-btn { width:100%; margin-top:6px; padding:5px; background:transparent; border:1px dashed var(--background-modifier-border); border-radius:var(--radius-s); color:var(--text-muted); font-size:12px; cursor:pointer; transition:background 0.1s,color 0.1s; }
.sb-settings-add-sound-btn:hover { background:var(--background-modifier-hover); color:var(--text-normal); border-color:var(--interactive-accent); }
.sb-settings-add-cat { margin-top:12px; }
.sb-settings-add-cat-btn { width:100%; padding:8px; background:transparent; border:1px dashed var(--interactive-accent); border-radius:var(--radius-m); color:var(--interactive-accent); font-size:13px; cursor:pointer; transition:background 0.1s; }
.sb-settings-add-cat-btn:hover { background:rgba(var(--interactive-accent-rgb),0.08); }

/* Icon picker modal */
.sb-icon-preview-wrap { display:flex; align-items:center; gap:8px; }
.sb-icon-preview-img { width:28px; height:28px; object-fit:contain; font-size:20px; }
.sb-icon-pick-btn { padding:3px 10px; font-size:12px; cursor:pointer; background:var(--background-secondary); border:1px solid var(--background-modifier-border); border-radius:var(--radius-s); color:var(--text-normal); }
.sb-icon-pick-btn:hover { background:var(--background-modifier-hover); }
.sb-icon-picker-emoji-row { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
.sb-icon-picker-emoji-label { font-size:13px; color:var(--text-muted); }
.sb-icon-picker-divider { text-align:center; font-size:11px; color:var(--text-faint); margin:10px 0 12px; letter-spacing:0.5px; }
.sb-icon-picker-empty { color:var(--text-faint); font-size:13px; text-align:center; padding:20px; }
.sb-icon-picker-grid { display:grid; grid-template-columns:repeat(5,80px); gap:8px; max-height:340px; overflow:auto; padding:4px 4px 8px; width:100%; box-sizing:border-box; }
.sb-icon-picker-item { display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border:2px solid transparent; border-radius:var(--radius-m); cursor:pointer; transition:background 0.1s,border-color 0.1s; width:80px; box-sizing:border-box; }
.sb-icon-picker-item:hover { background:var(--background-modifier-hover); border-color:var(--background-modifier-border); }
.sb-icon-picker-item.sb-icon-picker-selected { border-color:var(--interactive-accent); background:rgba(var(--interactive-accent-rgb),0.08); }
.sb-icon-picker-item img { width:44px; height:44px; object-fit:contain; flex-shrink:0; }
.sb-icon-picker-label { font-size:10px; color:var(--text-muted); text-align:center; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* Move sound modal */
.sb-move-hint { font-size:13px; color:var(--text-muted); margin-bottom:10px; }
.sb-move-empty { font-size:13px; color:var(--text-faint); text-align:center; padding:16px; }
.sb-move-cat-list { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
.sb-move-cat-btn { width:100%; padding:9px 14px; background:var(--background-secondary); border:1px solid var(--background-modifier-border); border-radius:var(--radius-m); color:var(--text-normal); font-size:13px; text-align:left; cursor:pointer; transition:background 0.1s,border-color 0.1s; }
.sb-move-cat-btn:hover { background:rgba(var(--interactive-accent-rgb),0.1); border-color:var(--interactive-accent); color:var(--interactive-accent); font-weight:600; }
.sb-move-cancel-btn { width:100%; padding:6px; background:transparent; border:1px solid var(--background-modifier-border); border-radius:var(--radius-s); color:var(--text-muted); font-size:12px; cursor:pointer; }
.sb-move-cancel-btn:hover { background:var(--background-modifier-hover); }
`;
