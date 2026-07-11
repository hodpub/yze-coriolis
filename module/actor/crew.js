import {
  getActorDataById,
  getActorEntitiesByType,
  hasOwnerPermissionLevel,
} from "../util.js";

// buildCrewOptionsArray returns an array of objects detailing possible crew
// position data that the character sheet can select from. This does not show
// any option for a ship the user cannot see.
export function buildCrewOptionsArray() {
  const createCrewObject = (position, shipId) => {
    return {
      position: position,
      shipId: shipId,
    };
  };
  const createOption = (label, position, shipId) => {
    let opt = {
      label: label,
      value: createCrewObject(position, shipId),
    };
    opt.key = JSON.stringify(opt.value);
    return opt;
  };

  let options = [];
  // options for without a ship association
  let baseOptions = Object.keys(CONFIG.YZECORIOLIS.crewPositions).map((c) => {
    return createOption(CONFIG.YZECORIOLIS.crewPositions[c], c, "");
  });

  options.push(...baseOptions);

  const allShips = getActorEntitiesByType("ship");
  // create options for all other ships in the world.
  for (let e of allShips) {
    let shipData = e;
    if (!hasOwnerPermissionLevel(e)) {
      continue;
    }
    options.push(
      ...baseOptions.map((bo) => {
        return createOption(
          `${shipData.name} - ${bo.label}`,
          bo.value.position,
          shipData._id
        );
      })
    );
  }
  return options;
}

// resetCrewForShip takes all crew from current ship and blanks out their IDs.
export async function resetCrewForShip(shipId) {
  // There's a potential race here if we have multiple GMs, but since the end
  // result is the same I'm not worried about trying to figure out which one
  // should do the update call.
  if (!game.user.isGM) {
    return;
  }
  for (let e of game.actors.contents) {
    let charData = e;
    if (charData.type === "character" || charData.type === "npc") {
      if (charData.system.bio.crewPosition.shipId === shipId) {
        await e.update({ "system.bio.crewPosition.shipId": "" });
      }
    }
  }
  return null;
}

export function getCrewForShip(shipId) {
  const crewArray = [];
  for (let e of game.actors.contents) {
    const actorData = getActorDataById(e.id);
    if (actorData.type === "character" || actorData.type === "npc") {
      if (actorData.system.bio.crewPosition.shipId === shipId) {
        crewArray.push(actorData);
      }
    }
  }
  return crewArray;
}
