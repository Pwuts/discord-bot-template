/*
**  2020-12-04
**  Pwuts <github@pwuts.nl>
*/

import { Client, MessageEmbed } from "discord.js";
import HookStore from '../stores/hooks';

let discord: Client;

export function initialize(token: string) {
    discord = new Client();

    discord.on('ready', () => {
        console.log(`DiscordClient: logged in as ${discord.user.tag}!`);
    });

    discord.login(token);

    return DiscordService;
}

const DiscordService = {
    getClient()
    {
        return discord;
    },

    async sendHookMessage(hookName: string, message: string | MessageEmbed, serverId?: string)
    {
        const channelId = await HookStore.getHookChannel(serverId, hookName);

        const channel = channelId
            ? await discord.channels.fetch(channelId)
            : (await discord.guilds.fetch(serverId))?.systemChannel;

        if (channelId && !channel) throw new Error(`bot not connected to channel ${channelId}`);
        if (!channelId && !channel) throw new Error(`bot not connected to server ${serverId}`);
        if (!channel.isText()) throw new Error('cannot send message to non-text channel');

        channel.send(message);
    }
};

export default DiscordService;
