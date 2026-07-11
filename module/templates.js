export const preloadHandlerbarsTemplates = async function () {
  const templatePaths = [
    // chat templates
    "systems/yzecoriolis/templates/sidebar/roll.html",
    "systems/yzecoriolis/templates/sidebar/dice-results.html",
    "systems/yzecoriolis/templates/sidebar/darkness-points-chat.html",
    // sheet templates
    "systems/yzecoriolis/templates/actor/parts/actor-bio.html",
    "systems/yzecoriolis/templates/actor/parts/actor-talents.html",
    "systems/yzecoriolis/templates/actor/parts/actor-stats.html",
    "systems/yzecoriolis/templates/actor/parts/actor-gear.html",
    "systems/yzecoriolis/templates/actor/parts/ship-crew.html",
    "systems/yzecoriolis/templates/actor/parts/ship-modules.html",
    "systems/yzecoriolis/templates/actor/parts/ship-features.html",
    "systems/yzecoriolis/templates/actor/parts/ship-critical-damage.html",
    "systems/yzecoriolis/templates/actor/parts/ship-problems.html",
    "systems/yzecoriolis/templates/actor/parts/ship-logbooks.html",
    // partial item templates
    "systems/yzecoriolis/templates/item/modifiers.html",
    // dialog templates
    "systems/yzecoriolis/templates/dialog/coriolis-roll.html",
    "systems/yzecoriolis/templates/dialog/roll-visibility.html",
    "systems/yzecoriolis/templates/dialog/roll-automaticFire.html",
    "systems/yzecoriolis/templates/dialog/roll-itemModifiers.html",
    "systems/yzecoriolis/templates/dialog/roll-shipGunner.html",
    "systems/yzecoriolis/templates/dialog/roll-modifiers.html",
  ];

  return foundry.applications.handlebars.loadTemplates(templatePaths);
};
