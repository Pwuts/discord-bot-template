/*
**  2020-12-03
**  Pwuts <github@pwuts.nl>
*/

import HookStore from '../stores/hooks';
import { Module } from '../util/module-manager';
import { parseDiscordChannelTag } from '../util/validators';


const HookModule: Module = {
    name: 'HookModule',

    allowDM: false,

    help: {
        name: 'Hooks',
        text: '!useChannel [channel?] for [hook name]',
    },

    commandHandlers: [
        {   // Links a channel to a message hook
            commands: [ 'usechannel' ],
            callback: async (message, command) => {
                const usageString = 'usage: `!useChannel [channel?] for [hook name]`';
                if (!command.args) {
                    message.reply(usageString);
                    return;
                }
    
                const args = command.args.split(' ');
                if (args.length == 2 && args[0] == 'for') {
                    // TODO: check if hook actually exists
                    HookStore.setHookChannel(message.guild.id, args[1], message.channel.id);
                    message.reply(`hook "${args[1]}" assigned to this channel`);
                }
                else if (args.length == 3 && args[1] == 'for') {
                    let snowflake: string;
                    if (!(snowflake = parseDiscordChannelTag(args[0]))) {
                        message.reply(usageString);
                        return;
                    }

                    HookStore.setHookChannel(message.guild.id, args[2], snowflake);
                    message.reply(`hook "${args[1]}" assigned to channel ${args[0]}`);
                }
            }
        },
    ],
}

export default HookModule;
