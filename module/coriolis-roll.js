import { addDarknessPoints, spendDarknessPoints } from "./darkness-points.js";
import { CoriolisModifierDialog } from "./coriolisPrayerModifier.js";

/**
 * takes in rendering options, rollData and:
 * 1. does the roll
 * 2. evaluates the roll
 * 3. takes the results and shows them in a chat message.
 * @param  {} chatOptions the options used to display the roll result in chat.
 * @param  {} rollData contains all data necessary to make a roll in Coriolis.
 */
export async function coriolisRoll(chatOptions, rollData) {
  let errorObj = { error: "YZECORIOLIS.ErrorsInvalidSkillRoll" };
  const isValid = isValidRoll(rollData, errorObj);
  if (!isValid) {
    ui.notifications.error(new Error(game.i18n.localize(errorObj.error)));
    return;
  }

  let totalDice = getTotalDice(rollData);
  if (totalDice <= 0) {
    totalDice = 2; // desparation roll where both will have to be successes to be considered a success.
  }
  const automaticFire = rollData.automaticFire;
  const formula = automaticFire
    ? createAutomaticFireFormula(totalDice, rollData.numberOfIgnoredOnes)
    : `${totalDice}d6`;
  let roll = new Roll(formula);
  await roll.evaluate();
  /* await showDiceSoNice(roll, chatOptions.rollMode); */
  const result = evaluateCoriolisRoll(rollData, roll);
  await showChatMessage(chatOptions, result, roll);
}

/**
 * handle pushing a roll
 * @param  {} chatMessage
 * @param  {} origRollData
 * @param  {} origRoll
 */
export async function coriolisPushRoll(chatMessage, origRollData, origRoll) {
    origRollData.pushed = true;
    const Die = foundry.dice.terms.Die;
    for (let part of origRoll.dice) {
      for (let r of part.results) {
        if (r.result !== CONFIG.YZECORIOLIS.maxRoll) {
          const newDie = new Die({ faces: 6 });
          const rolled = await newDie.roll();
          r.result = rolled.result;
        }
      }

      // do not apply the prayer bonus on automatic fire rolls
      let bonus = origRollData.prayerBonus + origRollData.prayerModifiersBonus;
      if (!part.modifiers.includes("x>1")) {
        part.number = part.number + bonus;
        for (let i = 0; i < bonus; i++) {
          const newDie = new Die({ faces: 6 });
          const rolled = await newDie.roll();
          part.results.push({ result: rolled.result, active: true });
        }
      }
    }

    const messageMode =
      chatMessage.getFlag("yzecoriolis", "messageMode") ??
      foundry.dice.Roll._mapLegacyRollMode(chatMessage.rollMode) ??
      game.settings.get("core", "messageMode");
    await showDiceSoNice(origRoll, messageMode);
    const result = evaluateCoriolisRoll(origRollData, origRoll);
    await updateChatMessage(chatMessage, result, origRoll);
    if (origRollData.actorType === "npc") {
      await spendDarknessPoints(1);
    } else {
      await addDarknessPoints(1);
    }
}

/**
 *
 * returns if this is a valid Roll or not and an error describing why it isn't.
 * @param  {} rollData
 * @param  {} errorObj
 * @returns true / false
 */
function isValidRoll(rollData, errorObj) {
  // TODO: account for modifier somehow.
  // not as straight forward. should I apply modifiers before checking for zero?
  const skill = rollData.skill;
  const attribute = rollData.attribute;
  const bonus = rollData.bonus;
  switch (rollData.rollType) {
    case "general": // general skills
      return attribute + skill > 0;
    case "advanced": // advanced skills
      if (skill <= 0) {
        errorObj.error = "YZECORIOLIS.ErrorsInvalidAdvancedSkillRoll";
        return false;
      }
      return attribute + skill > 0;
    case "weapon":
      return attribute + skill + bonus > 0;
    case "armor":
      return bonus >= 0; // should probably always be true?
    case "attribute":
      return attribute > 0;
  }
  errorObj.error = "YZECORIOLIS.ErrorsInvalidSkillRoll";
  return false;
}

/**
 * takes the result of the role and associated roll data and returns a result object.
 * @param  {rollType, skill, attribute, modifier} rollData
 * @param  {} roll
 * @returns {limitedSuccess,criticalSuccess,failure, roll, rollData} returns the results plus the initial rollData and roll object in case you wish to push.
 */
export function evaluateCoriolisRoll(rollData, roll) {
  let successes = 0;
  let maxRoll = CONFIG.YZECORIOLIS.maxRoll;
  roll.dice.forEach((part) => {
    part.results.forEach((r) => {
      if (r.result === maxRoll) {
        successes++;
      }
    });
  });
  const isDesparation = getTotalDice(rollData) <= 0;
  let result = {
    desparationRoll: isDesparation,
    successes: successes,
    limitedSuccess: isDesparation
      ? successes === 2
      : successes > 0 && successes < 3,
    criticalSuccess: successes >= 3,
    failure: isDesparation ? successes < 2 : successes === 0,
    rollData: rollData,
    pushed: rollData.pushed,
  };

  return result;
}

function getTotalDice(rollData) {
  let attributeValue = rollData.attribute;
  let skillValue = rollData.skill;
  let modifier = rollData.modifier;
  let itemModifierBonus = parseInt(getRollModifiersBonus(rollData));
  let bonus = rollData.bonus;
  switch (rollData.rollType) {
    case "general":
      return attributeValue + skillValue + modifier + itemModifierBonus;
    case "advanced":
      return attributeValue + skillValue + modifier + itemModifierBonus;
    case "attribute":
      return attributeValue + modifier + itemModifierBonus;
    case "weapon":
      if (rollData.automaticFire) {
        return attributeValue + skillValue + bonus + modifier + itemModifierBonus - 2;
      } else {
        return attributeValue + skillValue + bonus + modifier + itemModifierBonus;
      }
    case "armor":
      return bonus + modifier + itemModifierBonus;
  }
  return 0;
}

async function showChatMessage(chatMsgOptions, resultData, roll) {
  let tooltip = await foundry.applications.handlebars.renderTemplate(
    "systems/yzecoriolis/templates/sidebar/dice-results.html",
    getTooltipData(resultData, roll)
  );
  let chatData = {
    title: getRollTitle(resultData.rollData),
    icon: getRollIconKey(resultData.rollData),
    results: resultData,
    tooltip: tooltip,
    canPush: !resultData.pushed,
    totalDice: getTotalDice(resultData.rollData),
    actorType: getActorType(resultData.rollData),
    rollType: getRollType(resultData.rollData),
    attribute: getRollAttribute(resultData.rollData),
    attributeName: getRollAttributeName(resultData.rollData),
    skill: getRollSkill(resultData.rollData),
    skillName: getRollSkillName(resultData.rollData),
    modifier: getRollModifier(resultData.rollData),
    isAutomatic: getRollIsAuto(resultData.rollData),
    isAutomaticActive: getRollIsAutoActive(resultData.rollData),
    automaticRollAmount: parseInt(getRollAutoIgnoOnes(resultData.rollData)) + 1,
    isExplosive: getRollIsExplosive(resultData.rollData),
    bonus: getRollBonus(resultData.rollData),
    blastPower: getRollBlastPower(resultData.rollData),
    blastRadius: getRollBlastRadius(resultData.rollData),
    crit: getRollCrit(resultData.rollData),
    critText: getRollCritText(resultData.rollData),
    damage: getRollDmg(resultData.rollData),
    damageText: getRollDmgText(resultData.rollData),
    range: getRollRange(resultData.rollData),
    features: getRollFeatures(resultData.rollData),
    itemModifiersBonus: getRollModifiersBonus(resultData.rollData),
    itemModifiersChecked: getRollModifiersChecked(resultData.rollData),
  };

  const legacyMode = chatMsgOptions.rollMode ?? chatMsgOptions.messageMode;
  const messageMode = foundry.dice.Roll._mapLegacyRollMode(legacyMode);
  delete chatMsgOptions.rollMode;
  delete chatMsgOptions.whisper;
  delete chatMsgOptions.blind;

  chatMsgOptions.roll = roll;
  const html = await foundry.applications.handlebars.renderTemplate(
    chatMsgOptions.template,
    chatData
  );
  chatMsgOptions["content"] = html;
  chatMsgOptions["rolls"] = [roll];
  const msg = await ChatMessage.create(chatMsgOptions, { messageMode });
  // attach the results to the chat message so we can push later if needed.
  await msg.setFlag("yzecoriolis", "results", chatData.results);
  await msg.setFlag("yzecoriolis", "messageMode", messageMode);
  return msg;
}

async function updateChatMessage(
  chatMessage,
  resultData,
  origRoll
) {
  let tooltip = await foundry.applications.handlebars.renderTemplate(
    "systems/yzecoriolis/templates/sidebar/dice-results.html",
    getTooltipData(resultData, origRoll)
  );
  let chatData = {
    title: getRollTitle(resultData.rollData),
    results: resultData,
    tooltip: tooltip,
    canPush: false,
    prayerBonus: resultData.rollData.prayerBonus,
    totalDice: getTotalDice(resultData.rollData),
    actorType: getActorType(resultData.rollData),
    rollType: getRollType(resultData.rollData),
    attribute: getRollAttribute(resultData.rollData),
    attributeName: getRollAttributeName(resultData.rollData),
    skill: getRollSkill(resultData.rollData),
    skillName: getRollSkillName(resultData.rollData),
    modifier: getRollModifier(resultData.rollData),
    isAutomatic: getRollIsAuto(resultData.rollData),
    isAutomaticActive: getRollIsAutoActive(resultData.rollData),
    automaticRollAmount: parseInt(getRollAutoIgnoOnes(resultData.rollData)) + 1,
    isExplosive: getRollIsExplosive(resultData.rollData),
    bonus: getRollBonus(resultData.rollData),
    blastPower: getRollBlastPower(resultData.rollData),
    blastRadius: getRollBlastRadius(resultData.rollData),
    crit: getRollCrit(resultData.rollData),
    critText: getRollCritText(resultData.rollData),
    damage: getRollDmg(resultData.rollData),
    damageText: getRollDmgText(resultData.rollData),
    range: getRollRange(resultData.rollData),
    features: getRollFeatures(resultData.rollData),
    itemModifiersBonus: getRollModifiersBonus(resultData.rollData),
    itemModifiersChecked: getRollModifiersChecked(resultData.rollData),
    prayerModifiersChecked: getPrayerModifiersChecked(resultData.rollData),
  };

  const html = await foundry.applications.handlebars.renderTemplate(
    "systems/yzecoriolis/templates/sidebar/roll.html",
    chatData
  );
  const newMsg = await chatMessage.update({
    content: html,
    flags: {
      yzecoriolis: {
        results: chatData.results,
      },
    },
  });
  ui.chat.updateMessage(newMsg);
  return newMsg;
}

function getRollTitle(rollData) {
  return `${rollData.rollTitle}`;
}

function getRollIconKey(rollData) {
  const icon = CONFIG.YZECORIOLIS.skillIcons[rollData.skillKey];
  return icon ? CONFIG.YZECORIOLIS.icons[icon] : "";
}

function getTooltipData(results, roll) {
  const rollData = {
    formula: roll.formula,
    total: results.successes,
  };
  // Prepare dice parts
  rollData["parts"] = roll.dice.map((d) => {
    let maxRoll = CONFIG.YZECORIOLIS.maxRoll;
    // Generate tooltip data
    return {
      total: results.successes,
      faces: d.faces,
      rolls: d.results.map((r) => {
        return {
          result: "&nbsp;",
          showNum: r.result === maxRoll,
          classes: [
            d.constructor.name.toLowerCase(),
            "d" + d.faces,
            "dice-" + r.result,
            "dice-face",
            r.rerolled ? "rerolled" : null,
            r.result === maxRoll ? "success" : null,
          ]
            .filter((c) => c)
            .join(" "),
        };
      }),
    };
  });
  return rollData;
}

function getActorType(rollData) {
  return `${rollData.actorType}`;
}

function getRollType(rollData) {
  return `${rollData.rollType}`;
}

function getRollAttribute(rollData) {
  return `${rollData.attribute}`;
}

function getRollAttributeName(rollData) {
  return CONFIG.YZECORIOLIS.attributes[rollData.attributeKey];
}

function getRollSkill(rollData) {
  return `${rollData.skill}`;
}

function getRollSkillName(rollData) {
  return CONFIG.YZECORIOLIS.skills[rollData.skillKey];
}

function getRollModifier(rollData) {
  return `${rollData.modifier}`;
}

function getRollIsAuto(rollData) {
  return `${rollData.isAutomatic}`;
}

function getRollIsAutoActive(rollData) {
  return `${rollData.automaticFire}`;
}

function getRollAutoIgnoOnes(rollData) {
  return `${rollData.numberOfIgnoredOnes}`;
}

function getRollIsExplosive(rollData) {
  return `${rollData.isExplosive}`;
}

function getRollBonus(rollData) {
  return `${rollData.bonus}`;
}

function getRollBlastPower(rollData) {
  return `${rollData.blastPower}`;
}

function getRollBlastRadius(rollData) {
  return CONFIG.YZECORIOLIS.ranges[rollData.blastRadius];
}

function getRollCrit(rollData) {
  return `${rollData.crit}`;
}

function getRollCritText(rollData) {
  return `${rollData.critText}`;
}

function getRollDmg(rollData) {
  return `${rollData.damage}`;
}

function getRollDmgText(rollData) {
  return `${rollData.damageText}`;
}

function getRollRange(rollData) {
  return CONFIG.YZECORIOLIS.ranges[rollData.range];
}

function getRollFeatures(rollData) {
  return `${rollData.features}`;
}

function getRollModifiersBonus(rollData) {
  let bonus = 0;
  for (const modifier in rollData.itemModifiers) {
    if (rollData.itemModifiers[modifier].checked) {
      bonus += rollData.itemModifiers[modifier].value;
    }
  }
  return `${bonus}`;
}

function getRollModifiersChecked(rollData) {
  let modifiersCheckedList = [];
  for (const modifier in rollData.itemModifiers) {
    if (rollData.itemModifiers[modifier].checked) {
      let value = rollData.itemModifiers[modifier].value > 0
        ? '+' + rollData.itemModifiers[modifier].value
        : rollData.itemModifiers[modifier].value;
      modifiersCheckedList.push(rollData.itemModifiers[modifier].name + ' (' + value + ')');
    }
  }
  const modifiersChecked = modifiersCheckedList.join("\n")
  return modifiersChecked;
}

function getPrayerModifiersChecked(rollData) {
  let modifiersCheckedList = [];
  for (const modifier in rollData.prayerModifiers) {
    let value = rollData.prayerModifiers[modifier].value > 0
      ? '+' + rollData.prayerModifiers[modifier].value
      : rollData.prayerModifiers[modifier].value;
    modifiersCheckedList.push(`+ ${rollData.prayerModifiers[modifier].name} (${value})`);
  }
  const modifiersChecked = modifiersCheckedList.join(", ")
  return modifiersChecked;
}

export async function coriolisChatListeners(html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;

  root.querySelectorAll(".dice-push").forEach((button) => {
    button.addEventListener("click", (ev) => {
      const messageEl = ev.currentTarget.closest(".message, .chat-message");
      const messageId = messageEl?.dataset.messageId;
      const message = game.messages.get(messageId);
      if (!message) return;
      const results = message.getFlag("yzecoriolis", "results");
      const originalRoll = message.rolls?.[0];
      if (!results || !originalRoll) return;
      if (results.pushed || message.getFlag("yzecoriolis", "results")?.pushed) {
        ui.notifications.error(
          new Error(game.i18n.localize("YZECORIOLIS.ErrorsAlreadyPushed"))
        );
        return;
      }
      new CoriolisModifierDialog(message, results.rollData, originalRoll).render(
        true
      );
    });
  });
}
/**
 * Add support for the Dice So Nice module
 * @param {Object} roll
 * @param {String} messageMode
 */
async function showDiceSoNice(roll, messageMode) {
  if (
    game.modules.get("dice-so-nice") &&
    game.modules.get("dice-so-nice").active
  ) {
    let whisper = null;
    let blind = false;
    const mode = foundry.dice.Roll._mapLegacyRollMode(messageMode);
    switch (mode) {
      case "blind":
        blind = true;
      // fall through
      // eslint-disable-next-line no-fallthrough
      case "gm": {
        whisper = game.users.filter((user) => user.isGM).map((gm) => gm.id);
        break;
      }
      case "public": {
        whisper = game.users.filter((user) => user.active).map((user) => user.id);
        break;
      }
      case "self": {
        whisper = [game.user.id];
        break;
      }
    }
    await game.dice3d.showForRoll(roll, game.user, true, whisper, blind);
  }
}

/**
 * Create the automatic fire formula.
 *
 * Normally, automatic fire you roll a d6 until the first 1.
 * There is a talent (Machinegunner) and a weapon feature (High Capacity) that ignores the first 1
 * so it is possible to ignore the first two 1s when combining both.
 *
 * This is implemented as a sequence of `1d6x>1` dice rolls, each representing rolling
 * until the first 1 result.
 */

function createAutomaticFireFormula(totalDice, numberOfIgnoredOnes) {
  let formula = `${totalDice}d6`;
  for (let i = 0; i <= numberOfIgnoredOnes; i++) {
    formula = formula + ", 1d6x>1";
  }
  return `{${formula}}`;
}
