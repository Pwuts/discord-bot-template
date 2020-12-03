const config = require('../config').discord;

// Returns whether user with given ID is a configured admin or not
module.exports = function (userId)
{
    return config.adminUserIds.includes(userId);
}
