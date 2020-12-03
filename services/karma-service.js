/*
**  2020-05-21
**  Pwuts <github@pwuts.nl>
*/

const fs = require('fs');
const karmaStoreFile = 'karma.json';

let karmaStore = [];

// read karma store file (if applicable) and load karmaStore
fs.readFile(karmaStoreFile, (error, data) => {
    if (error) {
        if (error.code == 'ENOENT') {
            karmaStore = require('../config/karma').defaultKarmaStore;

            fs.writeFile(karmaStoreFile, JSON.stringify(karmaStore), error => error ? console.error('Could not create karma.json:', error) : null);
            console.debug('created karma.json:', karmaStore);
            return;
        }
        else throw error;
    }

    const readKarmaStore = JSON.parse(data.toString());
    console.debug('karma.json:', readKarmaStore);
    karmaStore = readKarmaStore;
});

// Forgiving search function for stored subjects
function findEntry(subject)
{
    return karmaStore.find(entry => `<@${entry.userId}>` == subject || entry.name.toLowerCase() == subject.toLowerCase());
}

const KarmaService = {
    // Returns the current karma status for given subject: 0 if not stored
    get(subject)
    {
        return findEntry(subject) ?? { subject, karma: 0 }
    },

    // Takes either a string subject or a Discord.User and mutates its karma
    increment(subject, dk = 1)
    {
        if (typeof subject == 'object') {
            return this.incrementUser(subject, dk);
        }

        const entry = findEntry(subject);

        if (!entry) {
            const newEntry = { name: subject, karma: dk };
            karmaStore.push(newEntry);
            return newEntry;
        }

        entry.karma += dk;
        return entry;
    },

    // Takes a Discord.User and mutates the user's karma
    incrementUser(user, dk = 1)
    {
        const entry = findEntry(`<@${user.id}>`);

        if (!entry) {
            const newEntry = { name: user.username, karma: dk, userId: user.id };
            karmaStore.push(newEntry);
            return newEntry;
        }

        if (entry.name != user.username) entry.name = user.username;    // update display name if necessary

        entry.karma += dk;
        return entry;
    },

    // Resets (and by default, removes) entry in karmaStore
    reset(subject, rm = true)
    {
        if (typeof subject == 'object') {
            subject = `<@${subject.id}>`;
        }

        const index = karmaStore.findIndex(entry => `<@${entry.userId}>` == subject || entry.name.toLowerCase() == subject.toLowerCase());

        if (index > -1) {
            const entry = karmaStore[index];

            if (rm) {
                karmaStore.splice(index, 1);    // remove entry from karmaStore

                return {...entry, karma: 0};
            }

            entry.karma = 0;
            return entry;
        }

        return { name: subject, karma: 0 }
    },

    // Returns a sorted, grouped karma list
    list()
    {
        const sortedKarmaStore = karmaStore
            .sort((a, b) => b.karma - a.karma)                                        // sort by karma
            .sort((a, b) => a.karma != b.karma ? 0 : a.name.localeCompare(b.name));   // if karma equal, sort by subject

        return {
            users: sortedKarmaStore.filter(entry => entry.userId),
            things: sortedKarmaStore.filter(entry => !entry.userId)
        }
    },

    // Write the karmaStore to disk
    write()
    {
        fs.writeFile(karmaStoreFile, JSON.stringify(karmaStore), error => error ? console.error('Could not save karmaStore:', error) : null);
        // console.debug('karmaStore:', karmaStore);
    }
};
module.exports = KarmaService;
