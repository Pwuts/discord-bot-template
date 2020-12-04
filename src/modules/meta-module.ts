/*
**  2020-12-04
**  Pwuts <github@pwuts.nl>
*/

import { Module } from '../util/command-router';

const MetaModule: Module = {
    name: 'MetaModule',

    allowDM: true,

    help: {
        name: 'Meta',
        text: '!help\n!ping'
    },

    commandHandlers: [
        {   // Returns info for the requested hackerspace
            commands: ['ping', 'pong'],
            callback: (msg, command) => {
                if (command.name == 'ping') {
                    msg.reply(`pong (${Date.now() - msg.createdTimestamp} ms)`);
                } else {
                    msg.reply('dat is mijn tekst >:(');
                }
            }
        },
    ],
}

export default MetaModule;
