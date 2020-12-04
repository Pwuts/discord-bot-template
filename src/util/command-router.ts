/*
**  2020-05-26
**  Pwuts <github@pwuts.nl>
*/

import { Client, Message } from 'discord.js';
import SettingsStore from '../stores/settings';

const config = require('../../config').bot;

export interface Module {
    name: string,
    help?: HelpSection,
    allowDM: boolean,
    commandHandlers?: CommandHandler[],
    messageHandler?: MessageCallback,
    hook?: ({ discord, commandRouter }: { discord: Client, commandRouter: CommandRouter }) => any
}

export interface HelpSection {
    name: string,
    text: string,
}

export interface CommandHandler {
    commands: string[],
    callback: (message: Message, command: { name: string, args: string }, discord: Client) => any,
}

export type MessageCallback =
    (message: Message, discord: Client) => any

const modules: Module[] = [];

let commandHandlers: CommandHandler[] = [];
let helpSections: HelpSection[] = [];

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
                // throw new Error(`ERROR: attempt to register handler for reserved command "${reserved}"`);
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
            if (typeof module.name !== 'string') {
                throw new Error(`ERROR: invalid module`);
            }
            if (module.help == undefined) {
                console.warn(`WARN: module ${module.name} has no help section`);
            }

            modules.push(module);

            console.info(`${module.name} loaded`);
        }
    };

    commandRouter.handler('help', msg => {
        msg.reply('probeer maar wat');

        setTimeout(async () => {
            msg.author.send({
                embed: {
                    title: 'Okee grapje, hier zijn wat hints:',
                    fields: helpSections.concat((await getActiveModules(msg.guild?.id || 'DM')).map(module => module.help))
                                        .map(section => ({ name: section.name, value: section.text }))
                }
            });
        }, 5e3);
    });

    // general message handler; finds commands and executes applicable handler functions
    discord.on('message', async message => {
        const commandMessageMatch = /^!(?<name>[a-zA-Z0-9]+)(?:\s+(?<args>.*)|$)/.exec(message.content);

        const activeModulesPromise = getActiveModules(message.guild?.id ?? 'DM');
        let activeModules: Module[];

        if (commandMessageMatch) {
            const command = {
                name: commandMessageMatch.groups.name,
                args: commandMessageMatch.groups.args ?? null
            };
            console.debug(
                `Command from ${message.author.username}:`, command,
                'in', message.guild ? `guild "${message.guild.name}"` : 'DM'
            );

            activeModules = await activeModulesPromise;

            activeModules.map(module => module.commandHandlers)
                .reduce((p, c) => c ? p.concat(c) : p, commandHandlers)
                .forEach(handler => {
                    if (handler.commands.includes(command.name.toLowerCase())) {
                        handler.callback(message, command, discord);
                    }
                });
        }

        if (!activeModules) activeModules = await activeModulesPromise;

        activeModules.forEach(module => {
            if (!module.messageHandler) return;

            module.messageHandler(message, discord);
        });
    });

    return commandRouter;
}

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

async function getActiveModules(serverId: string | 'DM'): Promise<Module[]>
{
    let activeModules = [];

    for (let i = 0; i < modules.length; i++) {
        let module = modules[i];
        if (serverId !== 'DM' ? await moduleIsEnabled(serverId, module.name) : moduleAllowsDM(module)) {
            activeModules.concat(module);
        }
    }

    return activeModules;
}

async function moduleIsEnabled(serverId: string, moduleName: string): Promise<boolean>
{
    return !!(await SettingsStore.getIntOption(serverId, `module.${moduleName}.enabled`));
}

function moduleAllowsDM(module: Module): boolean
{
    return module.allowDM;
}
