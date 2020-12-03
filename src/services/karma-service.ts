/*
**  2020-05-21
**  Pwuts <github@pwuts.nl>
*/

import { User } from 'discord.js';
import KarmaStore, { KarmaEntry } from '../stores/karma';

// Forgiving search function for stored subjects
function findEntry(serverId: string, subject: string): Promise<KarmaEntry>
{
    const userId = /<@(?<snowflake>\d{18}>)/.exec(subject)?.groups?.snowflake;
    return userId
        ? KarmaStore.getKarmaByUserId(serverId, userId)
        : KarmaStore.getKarmaBySubject(serverId, subject);
}

const KarmaService = {
    // Returns the current karma status for given subject: 0 if not stored
    async get(serverId: string, subject: string): Promise<KarmaEntry>
    {
        return await findEntry(serverId, subject) ?? { server: serverId, subject, karma: 0 }
    },

    // Takes either a string subject or a Discord.User and mutates its karma
    async increment(serverId: string, subject: string | User, dk = 1)
    {
        if (typeof subject == 'object') {
            return KarmaService.incrementUser(serverId, subject, dk);
        }

        const entry = await KarmaStore.getKarmaBySubject(serverId, subject);

        if (!entry) {
            const newEntry: KarmaEntry = { server: serverId, subject, karma: dk };
            return KarmaStore.setKarma(newEntry);
        }

        return KarmaStore.mutateKarma(entry, dk);
    },

    // Takes a Discord.User and mutates the user's karma
    async incrementUser(serverId: string, user: User, dk = 1)
    {
        const entry = await KarmaStore.getKarmaByUserId(serverId, user.id);

        if (!entry) {
            const newEntry: KarmaEntry = {
                server: serverId,
                subject: user.username,
                userId: user.id,
                karma: dk,
            };
            return KarmaStore.setKarma(newEntry);
        }

        if (entry.subject != user.username) entry.subject = user.username;    // update display name if necessary
        return KarmaStore.mutateKarma(entry, dk);
    },

    // Resets (and by default, removes) entry in karmaStore
    async reset(serverId: string, subject: string | User, rm = true)
    {
        if (typeof subject == 'object') {
            subject = `<@${subject.id}>`;
        }

        const entry = await findEntry(serverId, subject);

        if (entry) {
            if (rm) {
                KarmaStore.deleteKarma(entry);
            } else {
                entry.karma = 0;
                KarmaStore.setKarma(entry);
                return entry;
            }
        }

        return { name: subject, karma: 0 }
    },

    // Returns a sorted, grouped karma list
    async list(serverId: string)
    {
        // const sortedKarmaStore = karmaStore
        //     .sort((a, b) => b.karma - a.karma)                                        // sort by karma
        //     .sort((a, b) => a.karma != b.karma ? 0 : a.name.localeCompare(b.name));   // if karma equal, sort by subject
        const karmaList = await KarmaStore.list(serverId);

        return {
            users: karmaList.filter(entry => entry.userId),
            things: karmaList.filter(entry => !entry.userId)
        }
    },
};
export = KarmaService;
