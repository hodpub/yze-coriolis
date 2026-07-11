import { resetCrewForShip } from "./actor/crew.js";
import { createBlankEPTokens, setActiveEPTokens } from "./item/ep-token.js";
import { displayDarknessPoints } from "./darkness-points.js";

// eslint-disable-next-line no-unused-vars
Hooks.on("updateUser", (entity, delta, options, userId) => {
  // we avoid any null sets because we are just doing a clearing of the flag
  // before setting it to a valid value.
  const isSettingDP =
    foundry.utils.hasProperty(delta, "flags.yzecoriolis.darknessPoints") &&
    delta.flags.yzecoriolis.darknessPoints !== null;

  if (isSettingDP) {
    if (game.user.isGM) {
      displayDarknessPoints();
    }
  }
});

// eslint-disable-next-line no-unused-vars
Hooks.on("updateActor", (entity, delta, options, userId) => {
  rerenderAllShips();
});

// eslint-disable-next-line no-unused-vars
Hooks.on("deleteActor", (entity, options, userId) => {
  if (entity.type === "ship") {
    resetCrewForShip(entity.id).then(() => {
      rerenderAllCrew();
    });
  }
});

// eslint-disable-next-line no-unused-vars
Hooks.on("createActor", async (entity, options, userId) => {
  if (entity.type === "ship") {
    rerenderAllCrew();
    await createEPTokensForShip(entity);
    await setMaxEPTokensActive(entity);
  }
});

Hooks.on("renderDialogV2", (dialog, element) => {
  // Hide energyPointTokens from the create dialog; they are used only internally.
  element
    .querySelectorAll('option[value="energyPointToken"]')
    .forEach((option) => option.remove());
});

Hooks.on("renderCombatTracker", (app, html) => {
  const currentCombat = app.viewed ?? game.combat;
  if (!currentCombat) return;

  html.querySelectorAll(".combatant").forEach((el) => {
    const id = el.dataset.combatantId;
    const combatant = currentCombat.combatants.get(id);
    if (!combatant) return;
    const initDiv = el.querySelector(".token-initiative");
    if (!initDiv) return;

    if (combatant.initiative != null) {
      const readOnly = game.user.isGM ? "" : "readonly";
      initDiv.innerHTML = `<input style="color: white;" type="number" ${readOnly} value="${combatant.initiative}">`;

      initDiv.addEventListener("change", async (e) => {
        const inputElement = e.target;
        const combatantId = inputElement.closest("[data-combatant-id]")
          ?.dataset.combatantId;
        if (!combatantId) return;
        await currentCombat.setInitiative(combatantId, inputElement.value);
      });
    }
  });
});

function rerenderAllCrew() {
  // re render all characters/npcs to update their crew position drop downs.
  for (let e of game.actors.contents) {
    let rootData = e;
    if (rootData.type === "character" || rootData.type === "npc") {
      e.render(false);
    }
  }
}

function rerenderAllShips() {
  for (let e of game.actors.contents) {
    if (e.type === "ship") {
      e.render(false);
    }
  }
}

async function createEPTokensForShip(entity) {
  await createBlankEPTokens(entity, CONFIG.YZECORIOLIS.MaxEPTokensPerShip);
}

// setMaxEPTokensActive sets maxEnergyPoints worth of EP tokens active for the
// ship on initial creation so the bar isn't empty when you creat a new ship.
async function setMaxEPTokensActive(entity) {
  const epMax = entity.system.maxEnergyPoints;
  if (epMax) {
    await setActiveEPTokens(entity, epMax);
  }
}
