export const getID = function () {
  return foundry.utils.randomID(16);
};

export const getItemsByType = (itemType) => {
  return game.items.contents.filter((item) => {
    return item.type === itemType;
  });
};

export const getOwnedItemsByType = (actor, itemType) => {
  return actor.items.filter((item) => item.type === itemType);
};

export const getOwnedItemById = (actor, itemId) => {
  return actor.items.find((item) => item.id === itemId);
};

export const getActorEntitiesByType = (actorType) => {
  return game.actors.contents.filter((a) => {
    return a.type === actorType;
  });
};

/**
 * @param  {String} actorId
 * @returns the actor document object.
 */
export const getActorDataById = (actorId) => {
  if (!actorId) {
    return null;
  }
  const actor = game.actors.get(actorId);
  if (!actor) {
    console.warn("actor not found with ID: ", actorId);
    return null;
  }
  return actor;
};

/**
 * @param {Document|number|string} docOrLevel Document or ownership level
 * @returns {boolean}
 */
export const hasOwnerPermissionLevel = (docOrLevel) => {
  if (
    docOrLevel &&
    typeof docOrLevel === "object" &&
    "testUserPermission" in docOrLevel
  ) {
    return docOrLevel.testUserPermission(game.user, "OWNER");
  }
  if (docOrLevel && typeof docOrLevel === "object" && "isOwner" in docOrLevel) {
    return docOrLevel.isOwner;
  }
  const levels = CONST.DOCUMENT_OWNERSHIP_LEVELS;
  return docOrLevel === levels?.OWNER;
};
