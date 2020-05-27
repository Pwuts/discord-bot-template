const config = require('../config').Discord;

// Returns whether user with given ID is a configured admin or not
module.exports = function (userId)
{
    return config.adminUserIds.includes(userId);
}
