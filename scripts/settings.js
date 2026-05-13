// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag } from './constants.js';

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export async function registerSettings () {
    console.log(`${moduleTag} | Registering trackMagic for module ${moduleName}...`);
    await game.settings.register(moduleName, 'trackMagic', {
        name: '[Experimental] Track Magical Ammunition',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });

    console.log(`${moduleTag} | Registering chat-trackers for module ${moduleName}...`);
    await game.settings.register(moduleName, 'chat-trackers', {
        name: 'Internal Trackers',
        scope: 'world',
        config: false,
        type: Object,
    });
}
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
