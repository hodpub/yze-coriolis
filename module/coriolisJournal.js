function isCustomJournal(entity) {
  const importPath = entity.getFlag("yzecoriolis", "customJournal");
  if (!importPath) {
    return false;
  }
  return true;
}

const { JournalSheet } = foundry.appv1.sheets;

export class coriolisJournalSheet extends JournalSheet {
  /**
   * Activate a named TinyMCE text editor
   * @param {string} name             The named data field which the editor modifies.
   * @param {object} options          TinyMCE initialization options passed to TextEditor.create
   * @param {string} initialContent   Initial text content for the editor area.
   */
  activateEditor(name, options = {}, initialContent = "") {
    let customOptions = { ...options };
    if (isCustomJournal(this.document)) {
      customOptions.body_class = "coriolis-official-body";
    }
    super.activateEditor(name, customOptions, initialContent);
  }
}

/// handles injecting coriolis classes into journal entries so that compendiums
/// can use them for custom styling
// eslint-disable-next-line no-unused-vars
Hooks.on("renderJournalEntrySheet", (app, html, options) => {
  if (!(app.document && isCustomJournal(app.document))) return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  root.classList.add("coriolis-core");
  root.querySelector(".journal-entry-content")?.classList.add("coriolis-core");
  root.querySelector(".entryContent")?.classList.add("coriolis-core");
});
