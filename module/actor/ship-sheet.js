import {
  setActiveEPTokens,
  shipEPCount,
  crewEPCount,
  getMaxAllowedEPTokens,
  setCrewEPCount,
  crewHasTokens,
  canChangeEPForShip,
} from "../item/ep-token.js";
import {
  getActorDataById,
  getOwnedItemsByType,
  hasOwnerPermissionLevel,
} from "../util.js";
import {
  computeNewBarValue,
  onHoverBarSegmentIn,
  onHoverBarOut,
  prepDataBarBlocks,
} from "./databar.js";
import { toggleShipModule } from "../item/ship-module.js";
import { CoriolisModifierDialog } from "../coriolisRollModifier.js";

/**
 * Extend the basic ActorSheet for a basic Coriolis ship sheet
 * @extends {ActorSheet}
 */
export class yzecoriolisShipSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["yzecoriolis", "sheet", "actor", "ship"],
      template: "systems/yzecoriolis/templates/actor/ship-sheet.html",
      width: 1200,
      height: 880,
      scrollY: [
        ".modules-panel .module-list",
        ".features-panel .feature-list",
        ".critical-damage-panel .feature-list",
        ".problems-panel .feature-list",
        ".logbooks-panel .feature-list",
      ],
      resizable: false,
      tabs: [
        {
          navSelector: ".navigation",
          contentSelector: ".sheet-panels",
          initial: "crew",
        },
      ],
    });
  }
  /**
   * Activate a named TinyMCE text editor
   * @param {string} name             The named data field which the editor modifies.
   * @param {object} options          TinyMCE initialization options passed to TextEditor.create
   * @param {string} initialContent   Initial text content for the editor area.
   */
  activateEditor(name, options = {}, initialContent = "") {
    const customOptions = { ...options, body_class: "charnotes-edit-body" };
    super.activateEditor(name, customOptions, initialContent);
  }

  async getData(options) {
    const baseData = super.getData(options);
    let stats = {};
    if (baseData.actor.type === "ship") {
      stats = this._prepShipStats(baseData.actor);
    }

    // instead of using object flags (which had a race condition in mass
    // imports) simply check for the default image. since the default image is
    // the one we don't wish to have any sort of 'object sizing' and everything
    // else we do, we can exclude it specifically.
    const shipImageSet =
      baseData.actor.img !== CONFIG.YZECORIOLIS.DEFAULT_SHIP_KEY_ART;

    let imageCSSClass = ""; // no css class
    if (shipImageSet) {
      imageCSSClass = "object-fit-cover";
    }
    const shipNotes = await TextEditor.enrichHTML(baseData.actor.system.notes, {
      async: true,
    });
    const sheetData = {
      editable: baseData.editable,
      owner: baseData.actor.isOwner,
      config: CONFIG.YZECORIOLIS,
      shipNotes,
      ...baseData.actor,
      ...stats,
      imageCSSClass,
    };
    return sheetData;
  }

  _prepShipStats(actor) {
    const maxTokens = getMaxAllowedEPTokens(actor);
    const shipTokenCount = shipEPCount(actor);
    const sysData = actor.system;
    // pull in any relevant crew.
    let crew = [];
    const shipId = actor.id;
    for (let e of game.actors.contents) {
      let rootData = e;
      if (rootData.type === "character" || rootData.type === "npc") {
        const crewShipId = rootData.system.bio.crewPosition.shipId;
        if (shipId !== crewShipId) {
          continue;
        }
        const charEPCount = crewEPCount(actor, rootData._id);
        const crewCopy = foundry.utils.deepClone(rootData);
        crewCopy.energyBlocks = prepDataBarBlocks(charEPCount, maxTokens);
        crewCopy.currentEP = charEPCount;
        crew.push(crewCopy);
      }
    }

    // have a consistent sort order when displaying ship crews.
    // TODO: should probably have a set of coriolis constants for these positions.
    const crewSortingOrder = {
      captain: 0,
      engineer: 1,
      pilot: 2,
      sensorOperator: 3,
      gunner: 4,
    };

    crew = crew.sort((a, b) => {
      return (
        crewSortingOrder[a.system.bio.crewPosition.position] -
        crewSortingOrder[b.system.bio.crewPosition.position]
      );
    });

    // make a list of module catgeories
    // sets the dataset for new modules
    const modulesList = {};
    for (let k of Object.keys(CONFIG.YZECORIOLIS.shipModuleCategories)) {
      modulesList[k] = {
        dataset: {
          type: "shipModule",
          defaultname: game.i18n.localize("NewShipModule"),
          category: k,
          enabled: true,
        },
        items: [],
      };
    }
    // get modules
    const modules = getOwnedItemsByType(actor, "shipModule").map((m) => m);
    // add modules to the category-list
    for (let m of modules) {
      m.enabledCSS = "";
      if (m.system.enabled) {
        m.enabledCSS = "enabled";
      }
      modulesList[m.system.category].items.push(m);
    }

    const stats = {
      hullBlocks: prepDataBarBlocks(
        sysData.hullPoints.value,
        sysData.hullPoints.max
      ),
      energyBlocks: prepDataBarBlocks(shipTokenCount, maxTokens),
      // since energy points are a derived value and not a stored value, we need to expose it as a field
      // for the template, unlike the more simple hull points.
      currentShipEP: shipTokenCount,
      crew,
      modulesList: modulesList,
      features: {
        dataset: {
          type: "shipFeature",
          defaultName: game.i18n.localize("YZECORIOLIS.NewShipFeature"),
        },
        items: getOwnedItemsByType(actor, "shipFeature").map((f) => f),
      },
      criticalDamages: {
        dataset: {
          type: "shipCriticalDamage",
          defaultName: game.i18n.localize("YZECORIOLIS.NewShipCriticalDamage"),
        },
        items: getOwnedItemsByType(actor, "shipCriticalDamage").map((cd) => cd),
      },
      problems: {
        dataset: {
          type: "shipProblem",
          defaultName: game.i18n.localize("YZECORIOLIS.NewShipProblem"),
        },
        items: getOwnedItemsByType(actor, "shipProblem").map((p) => p),
      },
      logbooks: {
        dataset: {
          type: "shipLogbook",
          defaultName: game.i18n.localize("YZECORIOLIS.NewShipLogbook"),
        },
        items: getOwnedItemsByType(actor, "shipLogbook").map((p) => p),
      },
    };
    return stats;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // databar editing
    html
      .find(".hull-bar-segment")
      .click(this._onClickHullBarSegment.bind(this));
    html.find(".ep-bar-segment").click(this._onClickEPBarSegment.bind(this));
    html
      .find(".crew-bar-segment")
      .click(this._onClickCrewEPBarSegment.bind(this));
    html.find(".bar-segment").mouseenter(onHoverBarSegmentIn);
    html.find(".bar").mouseleave(onHoverBarOut);

    // rolling
    html.find(".crew-portrait").click(this._onRollCrewPosition.bind(this));
    html.find(".module-roll").click(this._onRollModuleWeapon.bind(this));
    html.find(".armor-roll").click(this._onRollArmor.bind(this));

    // crew portrait hovering flourishes
    html
      .find(".crew-portrait")
      .mouseenter(this._onHoverInCrewPortrait.bind(this));
    html
      .find(".crew-portrait")
      .mouseleave(this._onHoverOutCrewPortrait.bind(this));

    html
      .find(".toggle-ship-module")
      .click(this._onClickToggleModule.bind(this));

    html.find(".module-create").click(this._onClickCreateModule.bind(this));
    html.find(".module-edit").click(this._onClickEditModule.bind(this));
    html.find(".module-delete").click(this._onClickDeleteModule.bind(this));

    // *shipItem involves features, problems, and critical damages
    html.find(".shipItem-create").click(this._onClickCreateShipItem.bind(this));
    html.find(".shipItem-edit").click(this._onClickEditShipItem.bind(this));
    html.find(".shipItem-delete").click(this._onClickDeleteShipItem.bind(this));

    html
      .find(".expandable-info")
      .click((event) => this._onShipItemSummary(event));
  }

  _onClickCreateModule(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const type = targetButton.dataset.type;
    const dataset = Object.assign({}, foundry.utils.deepClone(targetButton.dataset));
    const name = dataset.defaultname;
    let imgPath = "";
    if (dataset.category === "weapon") {
      imgPath = "systems/yzecoriolis/css/icons/weapons-icon.svg";
    } else {
      imgPath = "systems/yzecoriolis/css/icons/gear-icon.svg";
    }
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: dataset,
      img: imgPath,
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];
    // no need to keep ahold of defaultname after creation.
    delete itemData.system["defaultname"];

    // Finally, create the item!
    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }
  
  _onClickEditModule(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const moduleId = targetButton.dataset.module;
    const item = this.actor.items.get(moduleId);
    item.sheet.render(true);
  }

  async _onClickDeleteModule(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const moduleId = targetButton.dataset.module;
    this.actor.deleteEmbeddedDocuments("Item", [moduleId]);
  }

  _onClickCreateShipItem(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const type = targetButton.dataset.type;
    // Grab any data associated with this control.
    const dataset = Object.assign({}, foundry.utils.deepClone(targetButton.dataset));
    // Initialize a default name.
    const name = dataset.defaultname;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: dataset,
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];
    // no need to keep ahold of defaultname after creation.
    delete itemData.system["defaultname"];

    // Finally, create the item!
    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  _onClickEditShipItem(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const featureId = targetButton.dataset.feature;
    const item = this.actor.items.get(featureId);
    item.sheet.render(true);
  }

  async _onClickDeleteShipItem(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const li = $(targetButton).parents(".item");
    const featureId = targetButton.dataset.feature;
    li.slideUp(200, async () => {
      await this.actor.deleteEmbeddedDocuments("Item", [featureId]);
    });
  }

  async _onClickEPBarSegment(event) {
    event.preventDefault();
    const canChange = canChangeEPForShip(this.actor);
    if (!canChange) {
      ui.notifications.error(
        game.i18n.localize("YZECORIOLIS.InvalidEPPermissions")
      );
      return;
    }
    // when the EP bar is clicked, do the standard data fetching, but activate the correct EPTokens
    const newBarValue = this.getNewBarValue(event);
    if (crewHasTokens(this.actor)) {
      ui.notifications.info(
        game.i18n.localize("YZECORIOLIS.EnergyPointsReset")
      );
    }
    await setActiveEPTokens(this.actor, newBarValue);
  }

  // you can distribute EP to crew mates, but only the engineer and GM can.
  async _onClickCrewEPBarSegment(event) {
    event.preventDefault();
    const canChange = canChangeEPForShip(this.actor);
    if (!canChange) {
      ui.notifications.error(
        game.i18n.localize("YZECORIOLIS.InvalidEPPermissions")
      );
      return;
    }
    const targetSegment = event.currentTarget;
    const crewId = targetSegment.dataset.crew;
    const newBarValue = this.getNewBarValue(event);
    await setCrewEPCount(this.actor, crewId, newBarValue);
  }

  async _onClickHullBarSegment(event) {
    event.preventDefault();
    const targetSegment = event.currentTarget;
    const newBarValue = this.getNewBarValue(event);

    const targetField = targetSegment.dataset.name;
    let update = {};
    update[targetField] = newBarValue;
    await this.actor.update(update);
  }

  getNewBarValue(event) {
    event.preventDefault();
    const targetSegment = event.currentTarget;
    // Get the bar segment data
    const index = Number(targetSegment.dataset.index) || 0;
    const curValue = Number(targetSegment.dataset.current) || 0;
    const minValue = Number(targetSegment.dataset.min) || 0;
    const maxValue = Number(targetSegment.dataset.max) || 0;
    // Grab any data associated with this control.
    return computeNewBarValue(index, curValue, minValue, maxValue);
  }

  async _onClickToggleModule(event) {
    event.preventDefault();
    const targetButton = event.currentTarget;
    const moduleId = targetButton.dataset.module;
    return toggleShipModule(this.actor, moduleId);
  }

  async _onRollCrewPosition(event) {
    event.preventDefault();
    const targetPortrait = event.currentTarget;
    const crewId = targetPortrait.dataset.crew;
    const crewEntity = getActorDataById(crewId);

    // For rolling on the ship sheet, the user who owns that actor can roll on
    // the ship sheet. The GM can also roll any actor.
    const isGM = game.user.isGM;

    //  you own a character (in the case you may
    // be running two different characters at the same time in a session)
    const isRollingForOwnActor = hasOwnerPermissionLevel(crewEntity.permission);

    if (!isGM && !isRollingForOwnActor) {
      ui.notifications.error(
        game.i18n.localize("YZECORIOLIS.InvalidCrewRollPermissions")
      );
      return;
    }

    const shipName = this.object.name;
    const crewmate = getActorDataById(crewId);
    const crewPosition = crewmate.system.bio.crewPosition;
    const crewPositionName =
      CONFIG.YZECORIOLIS.crewPositions[crewPosition.position];
    const skillKey = CONFIG.YZECORIOLIS.crewRolls[crewPosition.position];
    const attributeKey = crewmate.system.skills[skillKey].attribute;
    const itemModifiers = crewmate.system.itemModifiers[skillKey];

    // create a skill roll based off the crew's position.
    const rollData = {
      actorType: crewmate.type,
      rollType: crewmate.system.skills[skillKey].category,
      skillKey: skillKey,
      skill: skillKey ? crewmate.system.skills[skillKey].value : 0,
      attributeKey: attributeKey,
      attribute: attributeKey
        ? crewmate.system.attributes[attributeKey].value
        : 0,
      modifier: 0,
      itemModifiers: itemModifiers,
      rollTitle: crewPositionName + " " + crewmate.name + "\n- " + shipName,
      pushed: false,
    };
    const chatOptions = crewEntity._prepareChatRollOptions(
      "systems/yzecoriolis/templates/sidebar/roll.html",
      "skill"
    );
    new CoriolisModifierDialog(rollData, chatOptions).render(true);
  }

  async _onRollModuleWeapon(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const ship = this.actor;
    const shipId = ship._id;
    const itemId = element.closest(".item")
      ? element.closest(".item").dataset.itemId
      : null;
    const item = itemId ? ship.items.get(itemId).system : null;

    // Check for crew members and permissions.
    // Won't check for gunner-position as probably anyone from the crew will/can fight if problems arise.
    let crewMembers = {};
    let crewMembersControlled = {};
    const isGM = game.user.isGM;
    for (let actor of game.actors.contents) {
      if ((actor.type === "character" || actor.type === "npc")
        && shipId === actor.system.bio.crewPosition.shipId)
        {
          crewMembers[actor._id] = actor;
          if (hasOwnerPermissionLevel(actor.permission)) {
            crewMembersControlled[actor._id] = actor;
          }
      }
    }
    
    // Nothing can be fired without a crew.
    if (Object.keys(crewMembers).length < 1) {
      ui.notifications.error(
        game.i18n.localize("YZECORIOLIS.InvalidNoCrewMembers")
      );
      return;
    }
    // Check if the user has permission to at least one of the crewmembers.
    // The GM can roll on any actor.
    if (!isGM && (crewMembersControlled.length < 1)) {
      ui.notifications.error(
        game.i18n.localize("YZECORIOLIS.InvalidCrewRollPermissionsAny")
      );
      return;
    }
    // Check if a weapon is disabled.
    if (!item.enabled) {
      ui.notifications.error(
        game.i18n.localize("YZECORIOLIS.InvalidWeaponDisabled")
      );
      return;
    }

    // Who is rolling?
    let gunnerType = '';
    let gunnerName = '';
    let gunnerAttribute = 0;
    let gunnerSkill = 0;
    let gunnerItemModifiers = {};
    let gunnerToChoose = false;
    if (Object.keys(crewMembersControlled).length === 1) {
      const gunnerId = Object.keys(crewMembersControlled)[0];
      gunnerType = crewMembersControlled[gunnerId].type;
      gunnerName = crewMembersControlled[gunnerId].name;
      gunnerAttribute = crewMembersControlled[gunnerId].system.attributes.agility.value;
      gunnerSkill = crewMembersControlled[gunnerId].system.skills.rangedcombat.value;
      gunnerItemModifiers = crewMembersControlled[gunnerId].system.itemModifiers.rangedcombat;
    } else if (Object.keys(crewMembersControlled).length > 1) {
      gunnerToChoose = true;
    }
    
    // create a skill roll based off the previous input.
    const rollData = {
      rollType: 'weapon',
      actorType: gunnerType,
      skillKey: 'rangedcombat',
      skill: gunnerSkill,
      attributeKey: 'agility',
      attribute: gunnerAttribute,
      modifier: 0,
      bonus: item.bonus
        ? item.bonus
        : 0,
      rollTitle: game.i18n.localize("YZECORIOLIS.CrewSpotGunner") + " " + gunnerName + "\n- " + ship.name,
      pushed: false,
      isAutomatic: false,
      isExplosive: false,
      blastPower: 0,
      blastRadius: '',
      damage: item.damage,
      damageText: '',
      range: item.range,
      crit: item.crit?.numericValue,
      critText: item.crit?.customValue,
      features: item.special
        ? Object.values(item.special).join(", ")
        : "",
      ship: ship.name,
      crewMembersControlled: crewMembersControlled,
      gunnerToChoose: gunnerToChoose,
      itemModifiers: gunnerItemModifiers,
    };
    const chatOptions = ship._prepareChatRollOptions(
      "systems/yzecoriolis/templates/sidebar/roll.html",
      "weapon"
    );
    new CoriolisModifierDialog(rollData, chatOptions).render(true);
  }

  async _onRollArmor(event) {
    event.preventDefault();
    const ship = this.actor;
    const shipName = ship.name;
    const shipArmor = parseInt(ship.system.armor.value);
    const characterName = game.user.character.name;

    // For rolling on the ship sheet, the user who owns that actor can roll on
    // the ship sheet. The GM can also roll any actor.
    const isGM = game.user.isGM;
    const isRollingForOwnActor = hasOwnerPermissionLevel(ship.permission);
    if (!isGM && !isRollingForOwnActor) {
      ui.notifications.error(
        game.i18n.localize("YZECORIOLIS.InvalidCrewRollPermissions")
      );
      return;
    }

    // create the roll based off the actor-item-armor-roll
    const rollData = {
      actorType: "character",
      rollType: "armor",
      modifier: 0,
      features: "",
      bonus: shipArmor,
      rollTitle: characterName + "\n- " + shipName + " " + game.i18n.localize("YZECORIOLIS.Armor"),
      pushed: false,
    };
    const chatOptions = ship._prepareChatRollOptions(
      "systems/yzecoriolis/templates/sidebar/roll.html",
      "armor"
    );
    new CoriolisModifierDialog(rollData, chatOptions).render(true);
  }

  _onHoverInCrewPortrait(event) {
    event.preventDefault();
    // make the number animate
    const portraitDiv = event.currentTarget;
    $(portraitDiv).find(".crew-roll-number").addClass("crew-roll-number-hover");
    $(portraitDiv).find(".roll-glow").addClass("roll-glow-animated");
    // brighten the portraits a bit
    $(portraitDiv)
      .parent()
      .find(".crew-portrait")
      .addClass("crew-portrait-hovered");
  }

  _onHoverOutCrewPortrait(event) {
    event.preventDefault();
    // make the number animation reset.
    const portraitDiv = event.currentTarget;
    $(portraitDiv)
      .find(".crew-roll-number")
      .removeClass("crew-roll-number-hover");

    $(portraitDiv).find(".roll-glow").removeClass("roll-glow-animated");
    $(portraitDiv)
      .parent()
      .find(".crew-portrait")
      .removeClass("crew-portrait-hovered");
  }

  /**
   * Handle showing an item's description in the character sheet as an easy fold out.
   * @private
   */
  async _onShipItemSummary(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("item-id"));
    const chatData = await item.getChatData({
      secrets: this.actor.isOwner,
      async: true,
    });
    // Toggle summary
    if (li.hasClass("expanded")) {
      let summary = li.children(".item-summary");
      summary.slideUp(200, () => {
        summary.remove();
      });
    } else {
      let div = $(
        `<div class="item-summary"><div class="item-summary-wrapper"><div>${chatData.description}</div></div></div>`
      );
      // toogle when features should (not) always be shown
      if (!game.settings.get("yzecoriolis", "AlwaysShowFeatures")) {
        let props = $(`<div class="item-properties"></div>`);
        if (chatData.special) {
          Object.keys(chatData.special).forEach(key=>{
            props.append(`<span class="tag">${chatData.special[key]}</span>`)
          });
        }
        $(div).find(".item-summary-wrapper").append(props);
      }

      li.append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass("expanded");
  }
}
