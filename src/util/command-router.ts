/*
**  2020-05-26
**  Pwuts <github@pwuts.nl>
*/

import { Client, Message } from 'discord.js';

const config = require('../../config').bot;

interface Module {
    name: string,
    help?: HelpSection,
    hook: ({ discord, commandRouter }: { discord: Client, commandRouter: CommandRouter }) => any
}

interface CommandHandler {
    commands: string[],
    callback: (message: Message, command: { name: string, args: string }, discord: Client) => any,
}

interface HelpSection {
    name: string,
    text: string,
}

let commandHandlers: CommandHandler[] = [];
let helpSections: HelpSection[] = [];

export interface CommandRouter {
    handler(
        commands: string | string[],
        callback: (
            message: Message,
            command: {
                name: string;
                args: string;
            },
            discord: Client
        ) => any
    ): void;
    registerHelpSection(section: HelpSection): void;
    use(module: Module): void;
}

export default function initializeRouter(discord: Client): CommandRouter
{
    const commandRouter = {
        // Set a handler for one or multiple commands
        handler(commands: string | string[], callback: CommandHandler['callback'])
        {
            if (typeof commands == 'string') {
                commands = [ commands ];
            }
            let reserved: string;
            if (reserved = commands.find(command => config.reservedCommands.includes(command))) {
                throw new Error(`ERROR: attempt to register handler for reserved command "${reserved}"`);
            }

            commandHandlers.push({
                commands,
                callback
            });
        },

        registerHelpSection(section: HelpSection)
        {
            if (typeof section !== 'object'
                || typeof section.name !== 'string' || typeof section.text !== 'string') {
                throw new Error('ERROR: invalid help section');
            }

            helpSections.push(section);
        },

        // Set up a module
        use(module: Module)
        {
            if (typeof module.hook !== 'function') {
                throw new Error(`ERROR: invalid module "${module.name}"`);
            }
            module.hook({ commandRouter: this, discord });

            if (module.help == undefined) {
                console.warn(`WARN: module ${module.name} has no help section`);
            } else {
                this.registerHelpSection(module.help);
            }

            console.info(`${module.name} loaded`);
        }
    };

    commandRouter.handler('help', msg => {
        msg.reply('probeer maar wat');

        setTimeout(() => {
            msg.author.send({
                embed: {
                    title: 'Okee grapje, hier zijn wat hints:',
                    fields: helpSections.map(section => ({ name: section.name, value: section.text }))
                }
            });
        }, 5e3);
    });

    // general message handler; finds commands and executes applicable handler functions
    discord.on('message', message => {
        const commandMessageMatch = /^!(?<name>[a-zA-Z0-9]+)(?:\s+(?<args>.*)|$)/.exec(message.content);

        if (commandMessageMatch) {
            const command = {
                name: commandMessageMatch.groups.name,
                args: commandMessageMatch.groups.args ?? null
            };
            console.debug(`Command from ${message.author.username}:`, command);

            commandHandlers.forEach(handler => {
                if (handler.commands.includes(command.name.toLowerCase())) {
                    handler.callback(message, command, discord);
                }
            });
        }
    });

    return commandRouter;
}
