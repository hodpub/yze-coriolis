import { coriolisRoll } from "./coriolis-roll.js";

const { FormApplication } = foundry.appv1.api;

export class CoriolisModifierDialog extends FormApplication {
    constructor(rollData, chatOptions) {
      super();
      this.rollData = rollData;
      this.chatOptions = chatOptions;
      this.rollVisibility = game.settings.get("yzecoriolis", "RollVisibility");
      this.rollMode =
        game.settings.get("core", "rollMode") ??
        game.settings.get("core", "messageMode");
      this.isAutomatic = rollData.isAutomatic;
      this.automaticFire = rollData.automaticFire;
      this.machineGunner = rollData.machineGunner;
      this.highCapacity = rollData.highCapacity;
      this.shipGunner = rollData.shipGunner;
      this.crewMembersControlled = rollData.crewMembersControlled;
      this.gunnerToChoose = rollData.gunnerToChoose;
      this.gunnerChoosen = rollData.gunnerToChoose
        ? Object.keys(rollData.crewMembersControlled)[0]
        : null;
      this.itemModifiers = rollData.gunnerToChoose
        ? this.crewMembersControlled[this.gunnerChoosen].system.itemModifiers.rangedcombat
        : rollData.itemModifiers;
    }
  
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ['form'],
        popOut: true,
        template: "systems/yzecoriolis/templates/dialog/coriolis-roll.html",
        id: 'coriolisModifierDialog',
        title: game.i18n.localize("YZECORIOLIS.ModifierForRoll"),
        height: 'auto',
        width: 'auto',
        minimizable: false,
        resizable: true,
        closeOnSubmit: true,
        submitOnClose: false,
        submitOnChange: false,
      });
    }
    
    getData() {
      // Send data to the template
        return {
          rollVisibility: this.rollVisibility,
          rollMode: this.rollMode,
          isAutomatic: this.isAutomatic,
          automaticFire: this.automaticFire,
          machineGunner: this.machineGunner,
          highCapacity: this.highCapacity,
          itemModifiers: this.itemModifiers,
          gunnerToChoose: this.gunnerToChoose,
          gunnerChoosen: this.gunnerChoosen,
          gunnerList: this.crewMembersControlled,
        };
    }
  
    activateListeners(html) {
      super.activateListeners(html);
    }

    async _onChangeInput(event) {    
      if (event.currentTarget.name === "dialogRollMode") {
        this.rollMode = event.currentTarget.value;
      }
      if (event.currentTarget.name === "automaticFire") {
        this.automaticFire = event.currentTarget.checked;
      }
      if (event.currentTarget.name === "machineGunner") {
        this.machineGunner = event.currentTarget.checked;
      }
      if (event.currentTarget.name === "highCapacity") {
        this.highCapacity = event.currentTarget.checked;
      }
      if (event.currentTarget.name.match(/^si_.*$/)) {
        this.itemModifiers[event.currentTarget.name].checked = event.currentTarget.checked;
      }
      if (event.currentTarget.name === "gunnerChoosen") {
        this.gunnerChoosen = event.currentTarget.value;
        this.itemModifiers = this.crewMembersControlled[this.gunnerChoosen].system.itemModifiers.rangedcombat;
      }
      this.render();
    }

    async _updateObject(event, formData) {
      this.chatOptions.rollMode = this.rollMode;
      this.rollData.modifier = parseInt(event.submitter.value);
      this.rollData.automaticFire = this.automaticFire;
      this.rollData.machineGunner = this.machineGunner ? 1 : 0;
      this.rollData.highCapacity = this.highCapacity ? 1 : 0;
      this.rollData.numberOfIgnoredOnes = this.rollData.machineGunner + this.rollData.highCapacity;
      this.rollData.itemModifiers = this.itemModifiers;
      if (this.gunnerToChoose) {
        this.rollData.actorType = this.crewMembersControlled[this.gunnerChoosen].type;
        this.rollData.gunnerName = this.crewMembersControlled[this.gunnerChoosen].name;
        this.rollData.attribute = this.crewMembersControlled[this.gunnerChoosen].system.attributes.agility.value;
        this.rollData.skill = this.crewMembersControlled[this.gunnerChoosen].system.skills.rangedcombat.value;
        this.rollData.rollTitle = game.i18n.localize("YZECORIOLIS.CrewSpotGunner") + " " + this.rollData.gunnerName + "\n- " + this.rollData.ship;
      }
      coriolisRoll(this.chatOptions, this.rollData);
      return;
    }
  }
  
  window.CoriolisModifierDialog = CoriolisModifierDialog;