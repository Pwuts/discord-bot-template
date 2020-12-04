import { assertDiscordSnowflake } from './validators';
const config = require('../../config').discord;

// Returns whether user with given ID is a configured admin or not
export = function isAdmin(userId: string)
{
    assertDiscordSnowflake(userId);

    return config.ownerUserIds.includes(userId);
    // FIXME also check in dynamically set admins, stored in DB
}
