// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag, systemTrackers } from './scripts/constants.js';
import { registerSettings } from './scripts/settings.js';
import { AmmoTracker } from './scripts/AmmoTracker.js';

export let socket;
let trackers = [];

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                              Main
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Hooks.once('init', () => {
    console.log(`${moduleTag} | Initializing...`);
    registerSettings().then(() => {
        console.log(`${moduleTag} | Initialized`);
    }).catch((e) => {
        console.error(`${moduleTag} | Error during initialization: ${e}`);
    });
});

Hooks.on('socketlib.ready', () => {
    console.log(`${moduleTag} | Socketlib ready. Registering module ${moduleName}...`);
    socket = socketlib.registerModule(moduleName);
    console.log(`${moduleTag} | Registering recover client...`);
    socket.register('recoverClient', recoverClient);
});

Hooks.on('ready', async () => {
    console.log(`${moduleTag} | ready event handler start`);
    Hooks.callAll('ammo-tracker.ready', AmmoTracker);

    // Enable watcher.
    console.log(`${moduleTag} | Enabling watcher...`);
    watcher();

    if (!game.user.isGM) {
        console.log(`${moduleTag} | Non-GM detected. Returning.`);
        return;
    }

    // Fetch running combats and create trackers
    const combats = game.combats._source;

    for (let combat of combats) {
        console.log(`${moduleTag} | Adding ammo tracker for existing combat ${combat._id}`);
        let tracker = new AmmoTracker(combat._id, true);
        if (tracker.combat.round !== 0) {
            console.log(`${moduleTag} | Combat ${combat._id} has already started, starting tracker...`);
            tracker.started = true;
        }
        trackers.push(tracker);
    }

    console.log(`${moduleTag} | Ready`);
});

Hooks.on('createCombat', async (...args) => {
    console.log(`${moduleTag} | Combat creation detected...`);
    if (!game.user.isGM) {
        console.log(`${moduleTag} | Non-GM user detected. Returning.`);
        return;
    }
    const system = game.system.id;
    console.log(`${moduleTag} | Using game system ${game.system.id} for combat ${args[0]._id}...`);

    const tracker = new systemTrackers[system](args[0]._id);
    console.log(`${moduleTag} | Created new tracker.`);
    trackers.push(tracker);
});

Hooks.on('updateCombat', async (...args) => {
    console.log(`${moduleTag} | Combat update detected...`);
    if (!game.user.isGM) {
        console.log(`${moduleTag} | Non-GM user detected. Returning.`);
        return;
    }
    if (args[0].round === 0) {
        console.log(`${moduleTag} | Combat has not started yet. Returning.`);
        return true;
    }

    let trackerStarted = false;
    for (let tracker of trackers) {
        if (tracker.combatId == args[0]._id) {
            if (!tracker.started) {
                tracker.started = true;
                await tracker.startTracker();
            }
            trackerStarted = true;
            break;
        }
    }

    if (trackerStarted) {
        console.log(`${moduleTag} | Combat tracker was successfully started for combat ${args[0]._id}`);
    } else {
        console.log(`${moduleTag} | No combat tracker was found for combat ${args[0]._id}`);
    }
});

Hooks.on('deleteCombat', async (...args) => {
    if (!game.user.isGM) {
        console.log(`${moduleTag} | Non-GM user detected. Returning.`);
        return;
    }

    let trackerEnded = false;
    for (let tracker of trackers) {
        if (tracker.combatId == args[0]._id) {
            if (tracker.started) {
                tracker.ended = true;
                await tracker.endTracker();
                console.log(`${moduleTag} | Ended tracking.`);
                trackerEnded = true;
            }
        }
    }

    if (!trackerEnded) {
        console.log(`${moduleTag} | Failed to end tracker for combat ${args[0]._id}`);
    }
});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Watcher
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function watcher () {
    $(document).on('click', '.at-recover-btn', async button => {
        const dataset = button.currentTarget.dataset;
        if (!game.user.isGM) {
            socket.executeAsGM(recoverClient, dataset);
            return;
        }

        await recoverClient(dataset);
    });
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                       Recover - Client
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export const recoverClient = async function (dataset) {
    let currentTracker = trackers.find(
        tracker => tracker.combatId == dataset.combatId
    );
    console.debug(currentTracker);

    if (currentTracker != undefined) {
        await currentTracker.recover(dataset.actorId);
    }
};
