const SHIP_SHEET_TUTORIAL_PACK = "yzecoriolis.ship_sheet_instructions";
const SHIP_SHEET_TUTORIAL_ID = "0QlMn9tJBwKSZ9a6";
const SHIP_SHEET_TUTORIAL_NAME = "Ship Sheet Instructions";
const SHIP_SHEET_TUTORIAL_VER = "1";

export async function showOnboardingMessage() {
  const triggered = game.settings.get("yzecoriolis", "firstLaunch");
  if (triggered) {
    return;
  }
  const path = "systems/yzecoriolis/data/firstlaunch.html";
  const response = await (await fetch(path)).text();
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ alias: "Coriolis - The Third Horizon" }),
    whisper: [game.user.id],
    content: response,
  });

  await game.settings.set("yzecoriolis", "firstLaunch", true);
}

export async function importShipSheetTutorial() {
  if (!game.user.isGM) {
    return;
  }

  try {
    const journal = game.journal.getName(SHIP_SHEET_TUTORIAL_NAME);
    const ver = journal?.getFlag("yzecoriolis", "ver");
    if (journal && ver !== undefined && !(ver < SHIP_SHEET_TUTORIAL_VER)) {
      return;
    }

    if (journal) {
      await journal.delete();
    }

    const pack = game.packs.get(SHIP_SHEET_TUTORIAL_PACK);
    if (!pack) {
      throw new Error(`Compendium ${SHIP_SHEET_TUTORIAL_PACK} was not found`);
    }

    const document = await pack.getDocument(SHIP_SHEET_TUTORIAL_ID);
    if (!document) {
      throw new Error(
        `Journal ${SHIP_SHEET_TUTORIAL_ID} missing from ${SHIP_SHEET_TUTORIAL_PACK}. Rebuild packs with yarn build:packs (Foundry must be closed).`
      );
    }

    await game.journal.importFromCompendium(pack, SHIP_SHEET_TUTORIAL_ID);
    await game.journal
      .getName(SHIP_SHEET_TUTORIAL_NAME)
      ?.setFlag("yzecoriolis", "ver", SHIP_SHEET_TUTORIAL_VER);
    console.log("Imported Coriolis Ship Sheet Instructions.");
  } catch (error) {
    console.warn("failed to load up ship sheet instructions", error);
  }
}
