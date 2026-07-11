import { coriolisPushRoll } from "./coriolis-roll.js";

const { FormApplication } = foundry.appv1.api;

export class CoriolisModifierDialog extends FormApplication {
    constructor(chatMessage, origRollData, origRoll) {
      super();
      this.chatMessage = chatMessage;
      this.origRollData = origRollData;
      this.origRoll = origRoll;
      this.itemModifiers = {};
      if (origRollData.rollType != 'attribute' && origRollData.rollType != 'armor') {
        for (let mod in origRollData.itemModifiers) {
          if (origRollData.itemModifiers[mod].prayer) {
            this.itemModifiers[mod] = origRollData.itemModifiers[mod];
          }
        }
      }
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
        prayerRoll: true,
        itemModifiers: this.itemModifiers,
      };
    }
  
    activateListeners(html) {
      super.activateListeners(html);
    }

    async _onChangeInput(event) {    
      if (event.currentTarget.name.match(/^si_.*$/)) {
        this.itemModifiers[event.currentTarget.name].checked = event.currentTarget.checked;
      }
      this.render();
    }

    async _updateObject(event, formData) {
      this.origRollData.prayerBonus = parseInt(event.submitter.value);
      this.origRollData.prayerModifiersBonus = 0;
      this.origRollData.prayerModifiers = {};
      for (const modifier in this.itemModifiers) {
        if (this.itemModifiers[modifier].checked) {
          this.origRollData.prayerModifiersBonus += parseInt(this.itemModifiers[modifier].value);
          this.origRollData.prayerModifiers[modifier] = this.itemModifiers[modifier];
          // uncheck them, so that they don't get listet as regular itemModfiers
          this.itemModifiers[modifier].checked = false;
        }
      }
      coriolisPushRoll(this.chatMessage, this.origRollData, this.origRoll);
      return;
    }
  }
  
  window.CoriolisModifierDialog = CoriolisModifierDialog;