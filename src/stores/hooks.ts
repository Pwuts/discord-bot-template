/*
**  2020-12-03
**  Pwuts <github@pwuts.nl>
*/

import * as sqlite from 'sqlite';
import * as sqlite3 from 'sqlite3';
import { assertDiscordSnowflake } from '../util/validators';

let db: sqlite.Database;
sqlite.open({
    filename: `${require.main.path}/../storage/hooks.db`,
    driver: sqlite3.cached.Database
})
.then(dbi => {
    db = dbi;

    db.run(
        `CREATE TABLE IF NOT EXISTS hookChannels (
            server    TEXT,
            hookName  TEXT,
            channel   TEXT NOT NULL,
            PRIMARY KEY (server, hookName)
        )`
    );
});

export const HookStore = {
    async setHookChannel(serverId: string, hookName: string, channelId: string)
    {
        assertDiscordSnowflake(serverId);
        assertDiscordSnowflake(channelId);

        await db.run(
            `INSERT INTO hookChannels VALUES ($server, $hookName, $channel)
                ON CONFLICT (server, hookName)
                    DO UPDATE SET channel = excluded.channel`, {
            $server: serverId,
            $hookName: hookName,
            $channel: channelId,
        });
    },

    async getHookChannel(serverId: string, hookName: string): Promise<string>
    {
        assertDiscordSnowflake(serverId);

        const row = await db.get(
            'SELECT value FROM hookChannels WHERE server = $server AND hookName = $hookName', {
            $server: serverId,
            $hookName: hookName,
        });

        return row?.channel;
    },

    async listHookChannels(hookName: string)
    {
        return await db.all<{ server: string, channel: string }[]>(
            'SELECT server, channel FROM hookChannels WHERE hookName = $hookName', {
            $hookName: hookName,
        });
    },
};
export default HookStore;
