// Darkness Points are distributed among user setting flags. Adding DP adds it
// to the local user flag. removing it removes it from anyone that has DP to
// remove. Fetching it is summing up all setting flags. Originally, DP was a
// world setting, but world setting mutations are GM only. If the permissions
// model in future foundry allows for custom world setting permission, this code
// could be simplified.

const { Application } = foundry.appv1.api;

export async function addDarknessPoints(points) {
  // local user cache
  let dpObj = getDarknessPointsForUserID(game.user.id);
  dpObj.value += points;
  await setDarknessPointsForUser(game.user.id, dpObj);
  // purposefully not announcing DP here since there is no way to hide it locally.
  // GM will be listening on an update hook to display DP.
}

export async function spendDarknessPoints(points) {
  for (let i = 0; i < points; i++) {
    await decrementDarknessPoint();
  }
  //purposefully not announcing the spending of points publically.
}

export async function displayDarknessPoints() {
  await showDarknessPoints(getDarknessPoints());
}

async function decrementDarknessPoint() {
  for (let userID of game.users.keys()) {
    let dPoints = getDarknessPointsForUserID(userID);
    if (dPoints.value > 0) {
      dPoints.value -= 1;
      await setDarknessPointsForUser(userID, dPoints);
      return;
    }
  }
}

function getDarknessPointsForUserID(userID) {
  let user = game.users.get(userID);
  let dPoints = user.getFlag("yzecoriolis", "darknessPoints");
  if (!dPoints) {
    dPoints = {
      value: 0,
    };
  }
  return dPoints;
}

async function setDarknessPointsForUser(userID, dPoints) {
  let user = game.users.get(userID);
  await user.setFlag("yzecoriolis", "darknessPoints", dPoints);
}

function getDarknessPoints() {
  let total = 0;
  for (let userID of game.users.keys()) {
    let dPoints = getDarknessPointsForUserID(userID);
    total += dPoints.value;
  }
  return total;
}

/**
 * whispers the current darkness points to the GM.
 * @param  {} totalPoints
 */
async function showDarknessPoints(totalPoints) {
  // first try to just grab active GMs in the game.
  let gmList = game.users.filter((user) => user.isGM && user.active);
  // failing that just grab all the GMs in the game.
  if (gmList.length === 0) {
    gmList = game.users.filter((user) => user.isGM);
  }

  let gmUser = gmList[0];

  let messageData = {
    author: gmUser.id,
    speaker: ChatMessage.getSpeaker({ user: gmUser }),
    whisper: gmList.map((u) => u.id),
  };

  const dpData = {
    gmUsername: gmUser.name,
    totalPoints: totalPoints,
  };

  messageData.content = await foundry.applications.handlebars.renderTemplate(
    "systems/yzecoriolis/templates/sidebar/darkness-points-chat.html",
    dpData
  );
  await ChatMessage.create(messageData);
}

export class DarknessPointDisplay extends Application {
  static initialize() {
    this.dpDisplay = new DarknessPointDisplay();
  }

  static update() {
    this.dpDisplay.update();
  }

  static render() {
    this.dpDisplay.render(true);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "coriolis-darness-points-display",
      template:
        "systems/yzecoriolis/templates/darkness-points/darkness-points-display.html",
      top: 100,
      left: 100,
      height: 120,
      resizable: false,
      popout: false,
      title: game.i18n.localize("YZECORIOLIS.DarknessPoints"),
      background: "none",
    });
  }

  constructor() {
    super();
  }

  activateListeners(html) {
    super.activateListeners(html);
    // eslint-disable-next-line no-unused-vars
    html.find(".minus-button").click((event) => spendDarknessPoints(1));
    // eslint-disable-next-line no-unused-vars
    html.find(".plus-button").click((event) => addDarknessPoints(1));
  }

  getData() {
    return {
      dp: getDarknessPoints(),
      gm: game.user.isGM,
    };
  }

  update() {
    if (this.rendered) {
      this.render(true);
    }
  }
}
