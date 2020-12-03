/*
**  2020-12-03
**  Pwuts <github@pwuts.nl>
*/

import * as sqlite from 'sqlite';
import * as sqlite3 from 'sqlite3';
import { assertDiscordSnowflake, assertInteger } from '../util/validators';

let db: sqlite.Database;
sqlite.open({
    filename: `${require.main.path}/../storage/karma.db`,
    driver: sqlite3.cached.Database,
})
.then(dbi => {
    db = dbi;

    db.run(
        `CREATE TABLE IF NOT EXISTS karma (
            server   TEXT,
            subject  TEXT,
            userId   TEXT,
            karma    INTEGER NOT NULL,
            PRIMARY KEY (server, subject),
            UNIQUE (server, userId)
        )`
    );
});

export type KarmaEntry = {
    server: string,
    subject: string,
    userId?: string,
    karma: number,
};

const KarmaStore = {
    async getKarmaByUserId(serverId: string, userId: string): Promise<KarmaEntry>
    {
        assertDiscordSnowflake(serverId);
        assertDiscordSnowflake(userId);

        return db.get<KarmaEntry>('SELECT * FROM karma WHERE server = $server AND userId = $userId', {
            $server: serverId,
            $userId: userId,
        });
    },

    async getKarmaBySubject(serverId: string, subject: string): Promise<KarmaEntry>
    {
        assertDiscordSnowflake(serverId);

        return db.get<KarmaEntry>('SELECT * FROM karma WHERE server = $server AND LOWER(subject) = LOWER($subject)', {
            $server: serverId,
            $subject: subject,
        });
    },

    async setKarma(karmaEntry: KarmaEntry)
    {
        assertDiscordSnowflake(karmaEntry.server);
        assertInteger(karmaEntry.karma);

        const isUser = !!karmaEntry.userId;
        if (isUser) assertDiscordSnowflake(karmaEntry.userId);

        const insert = await db.prepare(
            `INSERT INTO karma (server, subject, ${isUser ? 'userId, ' : ''}karma) VALUES ($server, $subject, ${isUser ? '$userId, ' : ''}$karma)
                ON CONFLICT (server, ${isUser ? 'userId' : 'subject'})
                    DO UPDATE SET karma=excluded.karma${isUser ? ', subject=excluded.subject' : ''}`);
        await insert.run({
            $server: karmaEntry.server,
            $subject: karmaEntry.subject,
            $userId: karmaEntry.userId,
            $karma: karmaEntry.karma,
        });

        insert.finalize();
        return karmaEntry;
    },

    async mutateKarma(karmaEntry: KarmaEntry, delta: number)
    {
        assertDiscordSnowflake(karmaEntry.server);
        if (karmaEntry.userId) assertDiscordSnowflake(karmaEntry.userId);
        assertInteger(delta);

        const update = await db.prepare(
            `UPDATE karma
                SET karma = karma + ${delta}
                WHERE server = $server
                  AND (
                    (userId IS NOT NULL AND userID = $userId)
                    OR LOWER(subject) = LOWER($subject)
                  )`);
        await update.run({
            $server: karmaEntry.server,
            $subject: karmaEntry.subject,
            $userId: karmaEntry.userId,
        });
        karmaEntry.karma += delta;

        update.finalize();
        return karmaEntry;
    },

    async deleteKarma(karmaEntry: KarmaEntry)
    {
        assertDiscordSnowflake(karmaEntry.server);
        if (karmaEntry.userId) assertDiscordSnowflake(karmaEntry.userId);

        const deleet = await db.prepare(
            `DELETE FROM karma
                WHERE server = $server
                  AND (
                    (userId IS NOT NULL AND userID = $userId)
                    OR LOWER(subject) = LOWER($subject)
                  )
                LIMIT 1`);
        await deleet.run({
            $server: karmaEntry.server,
            $subject: karmaEntry.subject,
            $userId: karmaEntry.userId,
        });
        deleet.finalize();
    },

    async list(serverId: string): Promise<KarmaEntry[]>
    {
        assertDiscordSnowflake(serverId);

        return db.all<KarmaEntry[]>('SELECT * FROM karma WHERE server = $server', {
            $server: serverId
        });
    }
};
export default KarmaStore;
