/*
**  2020-12-04
**  Pwuts <github@pwuts.nl>
*/

import * as sqlite from 'sqlite';
import * as sqlite3 from 'sqlite3';

let db: sqlite.Database;
sqlite.open({
    filename: `${require.main.path}/../storage/admins.db`,
    driver: sqlite3.cached.Database,
})
.then(dbi => {
    db = dbi;

    db.run(
        `CREATE TABLE IF NOT EXISTS adminUsers (
            scope    TEXT,
            userId   TEXT,
            level    TEXT NOT NULL,
            PRIMARY KEY (scope, userId)
        )`
    );

    db.run(
        `CREATE TABLE IF NOT EXISTS adminRoles (
            server   TEXT,
            roleId   TEXT,
            level    TEXT NOT NULL,
            PRIMARY KEY (server, roleId)
        )`
    );
});

export enum Level {
    admin,
    operator,
    user,
};

export const levelNames = Object.keys(Level).filter(k => isNaN(Number(k)));

const AdminStore = {
    /*** USERS ***/
    async setUserLevel(scope: string, userId: string, level: keyof typeof Level)
    {
        await db.run(
            `INSERT INTO adminUsers VALUES ($scope, $userId, $level)
                ON CONFLICT (scope, userId)
                    DO UPDATE SET level = excluded.level`, {
            $scope: scope,
            $userId: userId,
            $level: level,
        });
    },

    async getUserLevel(scope: string, userId: string)
    {
        const row = await db.get<{ level: keyof typeof Level }>(
            'SELECT level FROM adminUsers WHERE scope = $scope AND userId = $userId', {
            $scope: scope,
            $userId: userId,
        });

        return row?.level;
    },

    async deleteUser(scope: string, userId: string)
    {
        await db.run(
            'DELETE FROM adminUsers WHERE scope = $scope AND userId = $userId', {
            $scope: scope,
            $userId: userId,
        });
    },

    /*** ROLES ***/

    async setRoleLevel(server: string, roleId: string, level: keyof typeof Level)
    {
        await db.run(
            `INSERT INTO adminRoles VALUES ($server, $roleId, $level)
                ON CONFLICT (server, roleId)
                    DO UPDATE SET level = excluded.level`, {
            $server: server,
            $roleId: roleId,
            $level: level,
        });
    },

    async getRoleLevel(server: string, roleId: string)
    {
        const row = await db.get<{ level: keyof typeof Level }>(
            'SELECT level FROM adminRoles WHERE server = $server AND roleId = $roleId', {
            $server: server,
            $roleId: roleId,
        });

        return row?.level;
    },

    async deleteRole(server: string, roleId: string)
    {
        await db.run(
            'DELETE FROM adminRoles WHERE server = $server AND roleId = $roleId', {
            $server: server,
            $roleId: roleId,
        });
    },
};

export default AdminStore;
