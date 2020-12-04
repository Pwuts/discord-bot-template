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
        assertDiscordSnowflake(serverId);

        const insert = await db.prepare('INSERT INTO settingsText VALUES ($server, $name, $value)');
        await insert.run({
            $server: serverId,
            $name: optionName,
            $value: value,
        });
        insert.finalize();
    },

    async getTextOption(serverId: string, optionName: string)
    {
        assertDiscordSnowflake(serverId);

        const row = await db.get('SELECT value FROM settingsText WHERE server = $server AND name = $name', {
            $server: serverId,
            $name: optionName,
        });

        return row?.value;
    },

    async setIntOption(serverId: string, optionName: string, value: number)
    {
        assertDiscordSnowflake(serverId);
        assertInteger(value);

        const insert = await db.prepare('INSERT INTO settingsInt VALUES ($server, $name, $value)');
        await insert.run({
            $server: serverId,
            $name: optionName,
            $value: value,
        });
        insert.finalize();
    },

    async getIntOption(serverId: string, optionName: string)
    {
        assertDiscordSnowflake(serverId);

        const row = await db.get('SELECT value FROM settingsInt WHERE server = $server AND name = $name', {
            $server: serverId,
            $name: optionName,
        });

        return row?.value;
    },
};

export default SettingsStore;
