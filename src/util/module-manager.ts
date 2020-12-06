/*
**  2020-12-04
**  Pwuts <github@pwuts.nl>
*/

import { Client, Message, MessageEmbed } from 'discord.js';
import SettingsService from '../services/settings-service';
import { Setting } from '../services/settings-service';
import AdminService from '../services/admin-service';
import SettingsStore from '../stores/settings';

const config = require('../../config').bot;

export class ModuleManager {
    private discord: Client;

    private modules: Module[] = [];
    private helpSections: HelpSection[] = [];
    private commandHandlers: CommandHandler[] = [];

    constructor(discord: Client)
    {
        this.discord = discord;

        this.handler('help', msg => {
            msg.reply('probeer maar wat');

            setTimeout(async () => {
                msg.author.send({
                    embed: {
                        title: 'Okee grapje, hier zijn wat hints:',
                        fields: this.helpSections
                                    .concat((await this.getActiveModules(msg.guild?.id ?? 'DM')).map(module => module.help))
                                    .map(section => ({ name: section.name, value: section.text }))
                    }
                });
            }, 5e3);
        });

        this.handler('module', async (message, command) => {
            const usageString = 'usage: `!module [enable | disable] [module name]`';
            const subCommands = ['disable', 'enable'];

            const args = command.args?.split(' ');
            if (args?.length != 2) {
                message.reply(usageString);
                return;
            }

            if (!subCommands.includes(args[0])) {
                message.reply(usageString);
                return;
            }

            const module = this.findModule(args[1]);

            if (!module) {
                message.reply(`module "${args[1]}" does not exist`);
                return;
            }

            const setEnabled = !!subCommands.indexOf(args[0]);

            if (module.beforeEnable && setEnabled) {
                try {
                    await module.beforeEnable(message.guild?.id);
                } catch (error) {
                    message.reply(`could not enable module "${module.name}": ${error.message}`)
                    return;
                }
            }
            this.setModuleEnabled(message.guild?.id, args[1], setEnabled);

            message.reply(`module "${args[1]}" ${args[0]}d!`);
        }, true);

        this.handler('modules', async message => {
            const embed = new MessageEmbed({
                title: 'Modules',
                description: 'Active and inactive modules for this guild or DM channel'
            });

            const activeModules = await this.getActiveModules(message.guild?.id ?? 'DM');

            if (activeModules.length) {
                embed.addField(
                    'Active modules',
                    activeModules.map(module => module.name).join('\n'),
                    true
                );

                if (activeModules.length < this.modules.length) {
                    embed.addField('\u200b', '\u200b', true);   // horizontal spacer
                }
            }

            if (activeModules.length < this.modules.length) {
                embed.addField(
                    'Inactive modules',
                    this.modules.filter(module => !activeModules.includes(module))
                                .map(module => module.name).join('\n'),
                    true
                );
            }

            message.reply({ embed });
        });

        // general message handler; finds commands and executes applicable handler functions
        this.discord.on('message', async message => {
            const commandMessageMatch = /^!(?<name>[a-zA-Z0-9]+)(?:\s+(?<args>.*)|$)/.exec(message.content);
    
            const activeModulesPromise = this.getActiveModules(message.guild?.id ?? 'DM');
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

                const localAdmin = await AdminService.isLocalAdminMessage(message);
                const globalAdmin = await AdminService.isGlobalAdminMessage(message);

                let authorizations: string[] = [];  // TODO: make less hacky
                if (localAdmin) authorizations.push('admin.local');
                if (globalAdmin) authorizations.push('admin.global');
    
                activeModules = await activeModulesPromise;
    
                activeModules.map(module => module.commandHandlers)
                    .reduce((p, c) => c ? p.concat(c) : p, this.commandHandlers)
                    .forEach(async handler => {
                        if (handler.localAdminOperation || handler.globalAdminOperation) {
                            if (!localAdmin && !globalAdmin) return;
                            if (handler.localAdminOperation && !handler.globalAdminOperation && !localAdmin) return;
                            if (handler.globalAdminOperation && !handler.localAdminOperation && !globalAdmin) return;
                        }

                        if (handler.commands.includes(command.name.toLowerCase())) {
                            handler.callback(message, command, authorizations);
                        }
                    });
            }

            if (!activeModules) activeModules = await activeModulesPromise;

            activeModules.forEach(module => {
                if (!module.messageHandler) return;
    
                module.messageHandler(message, this.discord);
            });
        });
    }

    // Registers a handler not connected to a module. DO NOT USE IN MODULES!
    public handler(commands: string | string[], callback: CommandHandler['callback'],
                   localAdminOperation?: boolean, globalAdminOperation?: boolean)
    {
        if (typeof commands == 'string') {
            commands = [ commands ];
        }
        let reserved: string;
        if (reserved = commands.find(command => config.reservedCommands.includes(command))) {
            // throw new Error(`attempt to register handler for reserved command "${reserved}"`);
        }

        this.commandHandlers.push({
            localAdminOperation,
            globalAdminOperation,
            commands,
            callback
        });
    }

    // Registers a help section not connected to a module. DO NOT USE IN MODULES!
    public registerHelpSection(section: HelpSection)
    {
        if (typeof section !== 'object'
            || typeof section.name !== 'string' || typeof section.text !== 'string') {
            throw new Error('invalid help section');
        }

        this.helpSections.push(section);
    }

    public use(module: Module)
    {
        if (typeof module.name !== 'string') {
            console.error('ERROR: invalid module', module);
            throw new Error(`invalid module`);
        }
        if (module.help == undefined) {
            console.warn(`WARN: module ${module.name} has no help section`);
        }

        this.modules.push(module);
        module.settings?.forEach(s => SettingsService.registerSetting({ ...s, module }));

        let chc = module.commandHandlers?.length ?? 0;
        console.info(
            `${module.name} loaded:`
            + ` ${chc} command handler` + (chc != 1 ? 's' : '')
        );
    }

    private async getActiveModules(serverId: string | 'DM'): Promise<Module[]>
    {
        let activeModules: Module[] = [];

        for (let i = 0; i < this.modules.length; i++) {
            let module = this.modules[i];
            if (serverId !== 'DM' ? await this.moduleIsEnabled(serverId, module.name) : this.moduleAllowsDM(module)) {
                activeModules.push(module);
            }
        }

        return activeModules;
    }

    // Utility methods
    private findModule(moduleName: string): Module
    {
        return this.modules.find(module => module.name == moduleName)
    }

    private moduleExists(moduleName: string): boolean
    {
        return !!this.findModule(moduleName)
    }

    private async moduleIsEnabled(serverId: string, moduleName: string): Promise<boolean>
    {
        if (!this.moduleExists(moduleName)) {
            throw new Error('module does not exist');
        }
        return !!(
            await SettingsStore.getIntOption(serverId, `module.${moduleName}.enabled`)
            ?? config.defaultEnabledModules.includes(moduleName)
        );
    }

    private async setModuleEnabled(serverId: string, moduleName: string, enable: boolean): Promise<void>
    {
        if (!this.moduleExists(moduleName)) {
            throw new Error('module does not exist');
        }
        await SettingsStore.setIntOption(serverId, `module.${moduleName}.enabled`, Number(enable));
    }

    private moduleAllowsDM(module: Module): boolean
    {
        return module.allowDM;
    }
}

export default ModuleManager;

export interface Module {
    name: string,
    help?: HelpSection,
    allowDM: boolean,
    settings?: Setting[],
    commandHandlers?: CommandHandler[],
    messageHandler?: MessageCallback,
    jobs?: ModuleJob[],
    initModule?: (
        { discord, moduleManager }:
            { discord: Client, moduleManager: ModuleManager }
    ) => any,
    beforeEnable?: (
        scope: string,
    ) => Promise<void>,
}

export interface HelpSection {
    name: string,
    text: string,
}

export interface CommandHandler {
    localAdminOperation?: boolean,
    globalAdminOperation?: boolean,
    commands: string[],
    callback: (message: Message, command: { name: string, args: string }, authorizationScopes: string[]) => any,
}

export type MessageCallback =
    (message: Message, discord: Client) => any

export interface ModuleJob {
    interval: number,
    callback: () => void,
}
