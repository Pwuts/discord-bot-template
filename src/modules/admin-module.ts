/*
**  2020-12-03
**  Pwuts <github@pwuts.nl>
*/

import AdminService from '../services/admin-service';
import AdminStore, { Level, levelNames } from '../stores/admins';
import { Module } from '../util/module-manager';
import { parseDiscordUserTag, parseDiscordRoleTag } from '../util/validators';

const AdminModule: Module = {
    name: 'AdminModule',

    allowDM: true,

    help: {
        name: 'Admin',
        text: `!setRights [local|global] [${levelNames.join('|')}] [user]\n!removeRights [local|global] [user]`,
    },

    commandHandlers: [
        {   // Assign bot rights to a user
            adminOnly: true,
            commands: [ 'setrights' ],
            callback: async (message, command) => {
                const usageString = `usage: \`!setRights [local|global] [${levelNames.join('|')}] [user]\``;
                const scopes = ['local', 'global'];

                if (!command.args) {
                    message.reply(usageString);
                    return;
                }
                const args = command.args?.split(' ');

                let userId: string, roleId: string, level: string, scopeSize: string, scope: string;

                if (args.length == 2 && levelNames.includes(args[0])
                    && ((userId = parseDiscordUserTag(args[1])) || (roleId = parseDiscordRoleTag(args[1])))) {
                    scopeSize = 'local';
                    level = args[0];
                }
                else if (args.length == 3 && scopes.includes(args[0]) && levelNames.includes(args[1])
                    && ((userId = parseDiscordUserTag(args[2])) || (roleId = parseDiscordRoleTag(args[2])))) {
                    scopeSize = args[0];
                    level = args[1];
                }

                if (scopeSize == 'local') {
                    if (!message.guild) {
                        message.reply('local admins can only be set in server context');
                        return;
                    }

                    scope = message.guild.id;
                } else {
                    scope = 'global';
                }

                const isUser = !!userId;

                if (level == 'user') {
                    isUser ? AdminStore.deleteUser(scope, userId)
                        : AdminStore.deleteRole(scope, roleId);
                    message.reply(`${scopeSize} rights removed from ${isUser ? `<@${userId}>` : `<@&${roleId}>`}`);
                    return;
                }

                if (scope == 'global' && !AdminService.globalAdminsAllowed) {
                    message.reply('global admins have been disabled in the bot configuration');
                }

                isUser ? AdminStore.setUserLevel(scope, userId, level as keyof typeof Level)
                    : AdminStore.setRoleLevel(scope, roleId, level as keyof typeof Level);

                message.reply(`${isUser ? `<@${userId}>` : `<@&${roleId}>`} granted ${scopeSize} ${level}`);
            }
        },

        {   // Remove bot rights from a user
            adminOnly: true,
            commands: [ 'removerights' ],
            callback: async (message, command) => {
                const usageString = 'usage: `!removeRights [local|global] [user]`';
                const scopes = ['local', 'global'];

                if (!command.args) {
                    message.reply(usageString);
                    return;
                }
                const args = command.args?.split(' ');

                let userId: string, roleId: string, scopeSize: string, scope: string;

                if (args.length == 1
                    && ((userId = parseDiscordUserTag(args[0])) || (roleId = parseDiscordRoleTag(args[0])))) {
                    scopeSize = 'local';
                }
                else if (args.length == 2 && scopes.includes(args[0])
                    && ((userId = parseDiscordUserTag(args[1])) || (roleId = parseDiscordRoleTag(args[1])))) {
                    scopeSize = args[0];
                }

                if (scopeSize == 'local') {
                    if (!message.guild) {
                        message.reply('local admins only exist in server context');
                        return;
                    }

                    scope = message.guild.id;
                } else {
                    scope = 'global';
                }

                const isUser = !!userId;

                isUser ? AdminStore.deleteUser(scope, userId)
                : AdminStore.deleteRole(scope, roleId);

                message.reply(`${scopeSize} rights removed from ${isUser ? `<@${userId}>` : `<@&${roleId}>`}`);
            }
        },
    ],
}

export default AdminModule;
