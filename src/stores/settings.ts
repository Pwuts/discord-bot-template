/*
**  2020-12-03
**  Pwuts <github@pwuts.nl>
*/

import * as sqlite from 'sqlite';
import * as sqlite3 from 'sqlite3';
import { assertDiscordSnowflake, assertInteger } from '../util/validators';

let db: sqlite.Database;
sqlite.open({
    filename: `${require.main.path}/../storage/settings.db`,
    driver: sqlite3.cached.Database,
})
.then(dbi => {
    db = dbi;

    db.run(
        `CREATE TABLE IF NOT EXISTS settingsText (
            server   TEXT,
            name     TEXT,
            value    TEXT NOT NULL,
            PRIMARY KEY (server, name)
        )`
    );
    db.run(
        `CREATE TABLE IF NOT EXISTS settingsInt (
            server   TEXT,
            name     TEXT,
            value    INTEGER NOT NULL,
            PRIMARY KEY (server, name)
        )`
    );
});

const SettingsStore = {
    async setTextOption(serverId: string, optionName: string, value: string)
    {
        serverId == 'global' || assertDiscordSnowflake(serverId);

        await db.run(
            `INSERT INTO settingsText VALUES ($server, $name, $value)
                ON CONFLICT (server, name)
                    DO UPDATE SET value = excluded.value`, {
            $server: serverId,
            $name: optionName,
            $value: value,
        });
    },

    async getTextOption(serverId: string, optionName: string)
    {
        serverId == 'global' || assertDiscordSnowflake(serverId);

        const row = await db.get<{ value: string }>(
            'SELECT value FROM settingsText WHERE server = $server AND name = $name', {
            $server: serverId,
            $name: optionName,
        });

        return row?.value;
    },

    async listTextOption(optionName: string)
    {
        return await db.all<{ server: string, value: string }[]>(
            'SELECT server, value FROM settingsText WHERE name = $name', {
            $name: optionName,
        });
    },

    async setIntOption(serverId: string, optionName: string, value: number)
    {
        serverId == 'global' || assertDiscordSnowflake(serverId);
        assertInteger(value);

        await db.run(
            `INSERT INTO settingsInt VALUES ($server, $name, $value)
                ON CONFLICT (server, name)
                    DO UPDATE SET value = excluded.value`, {
            $server: serverId,
            $name: optionName,
            $value: value,
        });
    },

    async getIntOption(serverId: string, optionName: string)
    {
        serverId == 'global' || assertDiscordSnowflake(serverId);

        const row = await db.get<{ value: number }>(
            'SELECT value FROM settingsInt WHERE server = $server AND name = $name', {
            $server: serverId,
            $name: optionName,
        });

        return row?.value;
    },

    async listIntOption(optionName: string)
    {
        return await db.all<{ server: string, value: number }[]>(
            'SELECT server, value FROM settingsInt WHERE name = $name', {
            $name: optionName,
        });
    },
};

export default SettingsStore;
