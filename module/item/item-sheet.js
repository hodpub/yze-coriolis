import { getID } from "../util.js";

const { ItemSheet } = foundry.appv1.sheets;

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class yzecoriolisItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["yzecoriolis", "sheet", "item"],
      width: 770,
      height: 770,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = "systems/yzecoriolis/templates/item";
    // Return a single sheet for all item types.
    //return `${path}/item-sheet.html`;
    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.

    return `${path}/${this.item.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    const baseData = super.getData(options);
    const itemDescript = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      baseData.item.system.description,
      {
        async: true,
      }
    );
    const sheetData = {
      editable: baseData.editable,
      owner: baseData.item.isOwner,
      config: CONFIG.YZECORIOLIS,
      itemDescript,
      ...baseData.item,
    };
    return sheetData;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here.
    // Add Inventory Item or Modifier
    html.find(".feature-create").click(this._onFeatureCreate.bind(this));
    html.find(".itemModifier-create").click(this._onItemModifierCreate.bind(this));

    // // Delete Inventory Item or Modifier
    html.find(".feature-delete").click(this._onFeatureDelete.bind(this));
    html.find(".itemModifier-delete").click(this._onItemModifierDelete.bind(this));
  }

  _onFeatureCreate(event) {
    event.preventDefault();
    const name = "";
    let features = {};
    if (this.object.system.special) {
      features = foundry.utils.deepClone(this.object.system.special);
    }
    let key = getID();
    features["si" + key] = name;
    return this.object.update({ "system.special": features });
  }

  _onFeatureDelete(event) {
    const li = $(event.currentTarget).parents(".special-feature");
    let features = foundry.utils.deepClone(this.object.system.special);
    let targetKey = li.data("itemId");
    delete features[targetKey];
    li.slideUp(200, async () => {
      await this._setSpecialFeatures(features);
    });
  }

  async _setSpecialFeatures(features) {
    await this.object.update({ "system.special": null }, { render: false });
    await this.object.update({ "system.special": features });
  }
  
  _onItemModifierCreate(event) {
    event.preventDefault();
    const name = "";
    let itemModifiers = {};
    if (this.object.system.itemModifiers) {
      itemModifiers = foundry.utils.deepClone(this.object.system.itemModifiers);
    }
    let key = getID();
    itemModifiers["si" + key] = name;
    return this.object.update({ "system.itemModifiers": itemModifiers });
  }

  _onItemModifierDelete(event) {
    const li = $(event.currentTarget).parents(".special-feature");
    let itemModifiers = foundry.utils.deepClone(this.object.system.itemModifiers);
    let targetKey = li.data("itemId");
    delete itemModifiers[targetKey];
    li.slideUp(200, async () => {
      await this._setItemModifiers(itemModifiers);
    });
  }

  async _setItemModifiers(itemModifiers) {
    await this.object.update({ "system.itemModifiers": null }, { render: false });
    await this.object.update({ "system.itemModifiers": itemModifiers });
  }
}
