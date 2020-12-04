import { assertDiscordSnowflake } from "../util/validators";
import AdminStore, { Level } from '../stores/admins';
import { Message } from "discord.js";
const config = require('../../config');

const AdminService = {
    async isAdminMessage(message: Message): Promise<boolean>
    {
        return await AdminService.getMessageAuthorLevel(message) == 'admin'
    },

    async getMessageAuthorLevel(message: Message): Promise<keyof typeof Level>
    {
        if (config.discord.ownerUserIds.includes(message.author.id)) return 'admin';

        const userLevel = await AdminService.getUserLevel(message.author.id, message.guild?.id);
        let highestRoleLevel: string;

        if (message.guild) {
            let roleLevels: { [roleId: string]: keyof typeof Level} = {};
            Promise.all(message.member.roles.cache.map(async ({ id }) => roleLevels[id] = await AdminService.getRoleLevel(id, message.guild.id)));
            highestRoleLevel = Object.entries(roleLevels).sort((a, b) => Level[a[1]] - Level[b[1]])[0][1]
        }

        if (highestRoleLevel) {
            return Level[Math.max(Level[userLevel], Level[highestRoleLevel])] as keyof typeof Level;
        }

        return userLevel;
    },

    async getUserLevel(userId: string, scope: string = 'global'): Promise<keyof typeof Level>
    {
        if (scope == 'global' && !AdminService.globalAdminsAllowed) return 'user';

        return await AdminStore.getUserLevel(scope, userId) ?? 'user'
    },

    async getRoleLevel(roleId: string, server: string): Promise<keyof typeof Level>
    {
        return await AdminStore.getRoleLevel(server, roleId) ?? 'user'
    },

    async userIsAdmin(userId: string, scope: string = 'global')
    {
        return await AdminService.getUserLevel(userId, scope) == 'admin'
    },

    setUserRights(scope: string, userId: string, level: keyof typeof Level)
    {
        AdminService.assertScopeNotGlobalOrAllowed(scope);
        scope == 'global' || assertDiscordSnowflake(scope);
        assertDiscordSnowflake(userId);

        AdminStore.setUserLevel(scope, userId, level);
    },

    removeUserRights(scope: string, userId: string)
    {
        scope == 'global' || assertDiscordSnowflake(scope);
        assertDiscordSnowflake(userId);

        AdminStore.deleteUser(scope, userId);
    },

    setRoleRights(serverId: string, userId: string, level: keyof typeof Level)
    {
        assertDiscordSnowflake(serverId);
        assertDiscordSnowflake(userId);

        AdminStore.setRoleLevel(serverId, userId, level);
    },

    removeRoleRights(serverId: string, userId: string)
    {
        assertDiscordSnowflake(serverId);
        assertDiscordSnowflake(userId);

        AdminStore.deleteRole(serverId, userId);
    },

    globalAdminsAllowed: config.bot.allowGlobalAdmins,

    assertScopeNotGlobalOrAllowed(scope: string)
    {
        if (scope == 'global' && !AdminService.globalAdminsAllowed)
                throw new Error('global admins have been disabled');
    }
}

export default AdminService;
