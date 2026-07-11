import {
  migrateActorKeyArtIfNeeded,
  migrateTalentBonus,
} from "../migration.js";
/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class yzecoriolisActor extends Actor {
  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === "character")
      this._prepareCharacterData(actorData, true);
    if (actorData.type === "npc") this._prepareCharacterData(actorData, false);
  }

  async _preCreate(initData, options, user) {
    await super._preCreate(initData, options, user);
    //setup default images for ships
    if (
      initData.type === "ship" &&
      ((foundry.utils.hasProperty(initData, "img") &&
        initData.img === Actor.DEFAULT_ICON) ||
        !foundry.utils.hasProperty(initData, "img"))
    ) {
      this.updateSource({ img: CONFIG.YZECORIOLIS.DEFAULT_SHIP_KEY_ART });
    }

    // we check the incoming data to make sure we aren't overriding a 'cloning'
    // operation.
    if (
      !foundry.utils.hasProperty(initData, "img") &&
      (initData.type === "character" || initData.type === "npc")
    ) {
      this.updateSource({
        img: CONFIG.YZECORIOLIS.DEFAULT_PLAYER_KEY_ART,
        prototypeToken: {
          texture: {
            src: CONFIG.YZECORIOLIS.DEFAULT_PLAYER_KEY_ART_TOKEN,
          },
        },
      });
    }
  }

  async _onCreate(data, ...args) {
    await super._onCreate(data, ...args);
  }

  async _preUpdate(updateData, options, user) {
    await super._preUpdate(updateData, options, user);
  }

  static migrateData(source) {
    migrateActorKeyArtIfNeeded(source);
    if (source.items) {
      for (let item of source.items) {
        if (item.type !== "talent") {
          continue;
        }
        migrateTalentBonus(item);
      }
    }
    return super.migrateData(source);
  }
  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData, capCharPoints) {
    const sysData = actorData.system;

    if (capCharPoints) {
      // Cap attribute scores
      Object.keys(sysData.attributes).forEach((k) => {
        let attr = sysData.attributes[k];
        if (attr.value > attr.max) {
          attr.value = attr.max;
        }
        if (attr.value < attr.min) {
          attr.value = attr.min;
        }
      });

      //Cap Skill scores
      Object.keys(sysData.skills).forEach((k) => {
        let skl = sysData.skills[k];
        if (skl.value > skl.max) {
          skl.value = skl.max;
        }
        if (skl.value < skl.min) {
          skl.value = skl.min;
        }
      });
    }

    let hpModifcations = this._prepHPModifications();
    let mpModifcations = this._prepMPModifications();
    let radiationModifcations = this._prepRadiationModifications();
    let encumbranceModifcations = this._prepEncumbranceModifications();
    let movementRateModifcations = this._prepMovementRateModifications();
    sysData.hitPoints.max =
      sysData.attributes.strength.value +
      sysData.attributes.agility.value +
      hpModifcations;
    sysData.mindPoints.max =
      sysData.attributes.wits.value +
      sysData.attributes.empathy.value +
      mpModifcations;
    sysData.radiation.max = sysData.radiation.max + radiationModifcations;
    sysData.movementRateMods = movementRateModifcations;
    sysData.encumbranceMods = encumbranceModifcations;

    if (sysData.hitPoints.value > sysData.hitPoints.max) {
      sysData.hitPoints.value = sysData.hitPoints.max;
    }
    if (sysData.mindPoints.value > sysData.mindPoints.max) {
      sysData.mindPoints.value = sysData.mindPoints.max;
    }

    // get the different modifiers and sort them into their attributes/skills
    sysData.itemModifiers = {
      strength: {},
      agility: {},
      wits: {},
      empathy: {},
      dexterity: {},
      force: {},
      infiltration: {},
      manipulation: {},
      meleecombat: {},
      observation: {},
      rangedcombat: {},
      survival: {},
      command: {},
      culture: {},
      datadjinn: {},
      medicurgy: {},
      mysticpowers: {},
      pilot: {},
      science: {},
      technology: {},
      armor: {},
    };
    for (let item of this.items) {
      for (let key in item.system.itemModifiers) {
        // everything with the strength-attribute
        if (item.system.itemModifiers[key].mod === "itemModifierAttrStrength") {
          sysData.itemModifiers.strength[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrStrength"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.force[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrStrength"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.meleecombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrStrength"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillForce") {
          sysData.itemModifiers.force[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrStrength"),
            skill: game.i18n.localize("YZECORIOLIS.SkillForce"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillMelee") {
          sysData.itemModifiers.meleecombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrStrength"),
            skill: game.i18n.localize("YZECORIOLIS.SkillMeleeCombat"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // everything with the agility-attribute
        if (item.system.itemModifiers[key].mod === "itemModifierAttrAgility") {
          sysData.itemModifiers.agility[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAgility"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.dexterity[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAgility"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.infiltration[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAgility"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.rangedcombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAgility"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.pilot[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAgility"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillDex") {
          sysData.itemModifiers.dexterity[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAgility"),
            skill: game.i18n.localize("YZECORIOLIS.SkillDexterity"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillInf") {
          sysData.itemModifiers.infiltration[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAgility"),
            skill: game.i18n.localize("YZECORIOLIS.SkillInfiltration"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillRange") {
          sysData.itemModifiers.rangedcombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAgility"),
            skill: game.i18n.localize("YZECORIOLIS.SkillRangedCombat"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillPil") {
          sysData.itemModifiers.pilot[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAgility"),
            skill: game.i18n.localize("YZECORIOLIS.SkillPilot"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // everything with the wits-attribute
        if (item.system.itemModifiers[key].mod === "itemModifierAttrWits") {
          sysData.itemModifiers.wits[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.observation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.survival[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.datadjinn[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.medicurgy[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.science[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.technology[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillObs") {
          sysData.itemModifiers.observation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: game.i18n.localize("YZECORIOLIS.SkillObservation"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillSurv") {
          sysData.itemModifiers.survival[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: game.i18n.localize("YZECORIOLIS.SkillSurvival"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillData") {
          sysData.itemModifiers.datadjinn[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: game.i18n.localize("YZECORIOLIS.SkillDataDjinn"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillMedi") {
          sysData.itemModifiers.medicurgy[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: game.i18n.localize("YZECORIOLIS.SkillMedicurgy"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillSci") {
          sysData.itemModifiers.science[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: game.i18n.localize("YZECORIOLIS.SkillScience"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillTech") {
          sysData.itemModifiers.technology[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrWits"),
            skill: game.i18n.localize("YZECORIOLIS.SkillTechnology"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // everything with the empathy-attribute
        if (item.system.itemModifiers[key].mod === "itemModifierAttrEmpathy") {
          sysData.itemModifiers.empathy[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrEmpathy"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.manipulation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrEmpathy"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.command[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrEmpathy"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.culture[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrEmpathy"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.mysticpowers[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrEmpathy"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillMan") {
          sysData.itemModifiers.manipulation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrEmpathy"),
            skill: game.i18n.localize("YZECORIOLIS.SkillManipulation"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillCom") {
          sysData.itemModifiers.command[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrEmpathy"),
            skill: game.i18n.localize("YZECORIOLIS.SkillCommand"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillCult") {
          sysData.itemModifiers.culture[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrEmpathy"),
            skill: game.i18n.localize("YZECORIOLIS.SkillCulture"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        if (item.system.itemModifiers[key].mod === "itemModifierSkillMys") {
          sysData.itemModifiers.mysticpowers[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrEmpathy"),
            skill: game.i18n.localize("YZECORIOLIS.SkillMysticPowers"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // other roll related modifiers
        if (item.system.itemModifiers[key].mod === "itemModifierArmor") {
          sysData.itemModifiers.armor[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // all attributes
        if (item.system.itemModifiers[key].mod === "itemModifierAttrAll") {
          sysData.itemModifiers.strength[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.agility[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.wits[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.empathy[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          // all attributes - general skills
          sysData.itemModifiers.dexterity[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.force[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.infiltration[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.manipulation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.meleecombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.observation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.rangedcombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.survival[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          // all attributes - advanced skills
          sysData.itemModifiers.command[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.culture[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.datadjinn[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.medicurgy[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.mysticpowers[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.pilot[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.science[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.technology[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: game.i18n.localize("YZECORIOLIS.AttrAll"),
            skill: null,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // all general skills
        if (
          item.system.itemModifiers[key].mod ===
          "itemModifierSkillCatGeneralAll"
        ) {
          sysData.itemModifiers.dexterity[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatGeneralAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.force[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatGeneralAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.infiltration[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatGeneralAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.manipulation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatGeneralAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.meleecombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatGeneralAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.observation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatGeneralAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.rangedcombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatGeneralAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.survival[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatGeneralAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // all advanced skills
        if (
          item.system.itemModifiers[key].mod ===
          "itemModifierSkillCatAdvancedAll"
        ) {
          sysData.itemModifiers.command[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatAdvancedAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.culture[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatAdvancedAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.datadjinn[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatAdvancedAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.medicurgy[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatAdvancedAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.mysticpowers[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatAdvancedAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.pilot[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatAdvancedAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.science[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatAdvancedAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.technology[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.SkillCatAdvancedAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // all blessings
        if (item.system.itemModifiers[key].mod === "itemModifierBlessingsAll") {
          // all blessings - general skills
          sysData.itemModifiers.dexterity[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.force[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.infiltration[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.manipulation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.meleecombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.observation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.rangedcombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.survival[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          // all blessings - advanced skills
          sysData.itemModifiers.command[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.culture[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.datadjinn[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.medicurgy[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.mysticpowers[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.pilot[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.science[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.technology[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.BlessingsAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // blessing - messenger
        if (
          item.system.itemModifiers[key].mod ===
          "itemModifierBlessingsMessenger"
        ) {
          sysData.itemModifiers.datadjinn[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconMessenger")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.science[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconMessenger")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.technology[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconMessenger")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // blessing - dancer
        if (
          item.system.itemModifiers[key].mod === "itemModifierBlessingsDancer"
        ) {
          sysData.itemModifiers.dexterity[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconDancer")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.meleecombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconDancer")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // blessing - gambler
        if (
          item.system.itemModifiers[key].mod === "itemModifierBlessingsGambler"
        ) {
          sysData.itemModifiers.observation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconGambler")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.pilot[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconGambler")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // blessing - deckhand
        if (
          item.system.itemModifiers[key].mod === "itemModifierBlessingsDeckhand"
        ) {
          sysData.itemModifiers.force[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconDeckhand")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // blessing - merchant
        if (
          item.system.itemModifiers[key].mod === "itemModifierBlessingsMerchant"
        ) {
          sysData.itemModifiers.manipulation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconMerchant")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // blessing - judge
        if (
          item.system.itemModifiers[key].mod === "itemModifierBlessingsJudge"
        ) {
          sysData.itemModifiers.rangedcombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconJudge")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.command[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconJudge")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // blessing - traveler
        if (
          item.system.itemModifiers[key].mod === "itemModifierBlessingsTraveler"
        ) {
          sysData.itemModifiers.survival[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconTraveler")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.culture[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconTraveler")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // blessing - lady of tears
        if (
          item.system.itemModifiers[key].mod ===
          "itemModifierBlessingsLadyOfTears"
        ) {
          sysData.itemModifiers.medicurgy[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconLadyOfTears")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // blessing - faceless one
        if (
          item.system.itemModifiers[key].mod ===
          "itemModifierBlessingsFacelessOne"
        ) {
          sysData.itemModifiers.infiltration[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconFaceless")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
          sysData.itemModifiers.mysticpowers[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Blessing"
            )}: ${game.i18n.localize("YZECORIOLIS.IconFaceless")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: false,
          };
        }
        // all prayers
        if (item.system.itemModifiers[key].mod === "itemModifierPrayersAll") {
          // all prayers - general skills
          sysData.itemModifiers.dexterity[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.force[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.infiltration[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.manipulation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.meleecombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.observation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.rangedcombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.survival[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          // all prayers - advanced skills
          sysData.itemModifiers.command[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.culture[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.datadjinn[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.medicurgy[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.mysticpowers[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.pilot[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.science[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.technology[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: game.i18n.localize("YZECORIOLIS.PrayersAll"),
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
        }
        // prayer - messenger
        if (
          item.system.itemModifiers[key].mod === "itemModifierPrayersMessenger"
        ) {
          sysData.itemModifiers.datadjinn[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconMessenger")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.science[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconMessenger")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.technology[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconMessenger")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
        }
        // prayer - dancer
        if (
          item.system.itemModifiers[key].mod === "itemModifierPrayersDancer"
        ) {
          sysData.itemModifiers.dexterity[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconDancer")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.meleecombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconDancer")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
        }
        // prayer - gambler
        if (
          item.system.itemModifiers[key].mod === "itemModifierPrayersGambler"
        ) {
          sysData.itemModifiers.observation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconGambler")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.pilot[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconGambler")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
        }
        // prayer - deckhand
        if (
          item.system.itemModifiers[key].mod === "itemModifierPrayersDeckhand"
        ) {
          sysData.itemModifiers.force[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconDeckhand")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
        }
        // prayer - merchant
        if (
          item.system.itemModifiers[key].mod === "itemModifierPrayersMerchant"
        ) {
          sysData.itemModifiers.manipulation[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconMerchant")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
        }
        // prayer - judge
        if (item.system.itemModifiers[key].mod === "itemModifierPrayersJudge") {
          sysData.itemModifiers.rangedcombat[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconJudge")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.command[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconJudge")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
        }
        // prayer - traveler
        if (
          item.system.itemModifiers[key].mod === "itemModifierPrayersTraveler"
        ) {
          sysData.itemModifiers.survival[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconTraveler")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.culture[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconTraveler")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
        }
        // prayer - lady of tears
        if (
          item.system.itemModifiers[key].mod ===
          "itemModifierPrayersLadyOfTears"
        ) {
          sysData.itemModifiers.medicurgy[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconLadyOfTears")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
        }
        // prayer - faceless one
        if (
          item.system.itemModifiers[key].mod ===
          "itemModifierPrayersFacelessOne"
        ) {
          sysData.itemModifiers.infiltration[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconFaceless")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
          sysData.itemModifiers.mysticpowers[`${key}|${item._id}`] = {
            id: `${key}|${item._id}`,
            name: item.name,
            attribute: null,
            skill: `${game.i18n.localize(
              "YZECORIOLIS.Prayer"
            )}: ${game.i18n.localize("YZECORIOLIS.IconFaceless")}`,
            type: game.i18n.localize(CONFIG.YZECORIOLIS.itemTypes[item.type]),
            value: item.system.itemModifiers[key].value,
            checked: false,
            prayer: true,
          };
        }
      }
    }
  }

  _prepareChatRollOptions(template, title) {
    let chatOptions = {
      speaker: {
        alias: this.prototypeToken.name,
        actor: this._id,
      },
      title: title,
      template: template,
      rollMode:
        game.settings.get("core", "rollMode") ??
        game.settings.get("core", "messageMode"),
      sound: CONFIG.sounds.dice,
      flags: {
        img: this.prototypeToken.randomImg
          ? this.img
          : this.prototypeToken.texture.src,
      },
      // img to be displayed next to the name on the test card - if it's a wildcard img, use the actor image
    };

    // If the test is coming from a token sheet
    if (this.token) {
      chatOptions.speaker.alias = this.token.name; // Use the token name instead of the actor name
      chatOptions.speaker.token = this.token._id;
      chatOptions.speaker.scene = canvas.scene.id;
      chatOptions.flags.img = this.token.texture.src; // Use the token image instead of the actor image
    } // If a linked actor - use the currently selected token's data if the actor id matches
    else {
      let speaker = ChatMessage.getSpeaker();
      if (speaker.actor == this._id) {
        chatOptions.speaker.alias = speaker.alias;
        chatOptions.speaker.token = speaker.token;
        chatOptions.speaker.scene = speaker.scene;
        chatOptions.flags.img = speaker.token
          ? canvas.tokens.get(speaker.token).document.texture.src
          : chatOptions.flags.img;
      }
    }

    return chatOptions;
  }

  _prepHPModifications() {
    // look through items for any HP-Modifications
    let bonus = 0;
    for (let t of this.items) {
      const tData = t.system.itemModifiers;
      if (tData) {
        bonus += Number(
          Object.keys(tData).reduce((counter, x) => {
            counter +=
              tData[x].mod === "itemModifierHP" &&
              (t.type === "injury" ||
                t.type === "talent" ||
                t.system.equipped === true)
                ? tData[x].value
                : 0;
            return counter;
          }, 0)
        );
      }
    }
    return bonus;
  }

  _prepMPModifications() {
    // look through items for any MP-Modifications
    let bonus = 0;
    for (let t of this.items) {
      const tData = t.system.itemModifiers;
      if (tData) {
        bonus += Number(
          Object.keys(tData).reduce((counter, x) => {
            counter +=
              tData[x].mod === "itemModifierMP" &&
              (t.type === "injury" ||
                t.type === "talent" ||
                t.system.equipped === true)
                ? tData[x].value
                : 0;
            return counter;
          }, 0)
        );
      }
    }
    return bonus;
  }

  _prepRadiationModifications() {
    // look through items for any Radiation-Modifications
    let bonus = 0;
    for (let t of this.items) {
      const tData = t.system.itemModifiers;
      if (tData) {
        bonus += Number(
          Object.keys(tData).reduce((counter, x) => {
            counter +=
              tData[x].mod === "itemModifierRad" &&
              (t.type === "injury" ||
                t.type === "talent" ||
                t.system.equipped === true)
                ? tData[x].value
                : 0;
            return counter;
          }, 0)
        );
      }
    }
    return bonus;
  }

  _prepEncumbranceModifications() {
    // look through items for any Encumbrance-Modifications
    let bonus = 0;
    for (let t of this.items) {
      const tData = t.system.itemModifiers;
      if (tData) {
        bonus += Number(
          Object.keys(tData).reduce((counter, x) => {
            counter +=
              tData[x].mod === "itemModifierEnc" &&
              (t.type === "injury" ||
                t.type === "talent" ||
                t.system.equipped === true)
                ? tData[x].value
                : 0;
            return counter;
          }, 0)
        );
      }
    }
    return bonus;
  }

  _prepMovementRateModifications() {
    // look through items for any MovementRate-Modifications
    let bonus = 0;
    for (let t of this.items) {
      const tData = t.system.itemModifiers;
      if (tData) {
        bonus += Number(
          Object.keys(tData).reduce((counter, x) => {
            counter +=
              tData[x].mod === "itemModifierMR" &&
              (t.type === "injury" ||
                t.type === "talent" ||
                t.system.equipped === true)
                ? tData[x].value
                : 0;
            return counter;
          }, 0)
        );
      }
    }
    return bonus;
  }

  /** @override */
  static async create(initData, options = {}) {
    initData.prototypeToken = initData.prototypeToken || {};
    if (initData.type === "character" || initData.type === "npc") {
      foundry.utils.mergeObject(
        initData.prototypeToken,
        {
          actorLink: true,
        },
        { overwrite: false }
      );
    }
    return super.create(initData, options);
  }
}
