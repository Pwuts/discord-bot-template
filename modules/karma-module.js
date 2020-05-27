/*
**  2020-05-26
**  Pwuts <github@pwuts.nl>
*/

const KarmaService = require('../services/karma-service');
const isAdmin = require('../util/is-admin');

module.exports = function KarmaModule(commandRouter, discord)
{
    // Handle karma increment, decrement, reset commands
    discord.on('message', message => {
        const karmaMessageMatch = /^! *(?:(?<subject>[a-zA-Z0-9 \-_()]+)|(?<user><@!?\d{18}>)|(?<emoji>(?:<:[A-Za-z0-9_]+:\d{18}>)+)) *(?<count>\+\+|--|__)/.exec(message.content);

        if (karmaMessageMatch) {
            const karmaCommand = Object.assign({}, karmaMessageMatch.groups);

            const count = karmaCommand.count;
            if (count == '__' && !isAdmin(message.author.id)) return;   // only admins can reset karma

            let subject;
            if (karmaCommand.emoji) {
                subject = karmaCommand.emoji;
            } else if (karmaCommand.user) {
                subject = message.mentions.users.get(/\<@!?(?<id>\d{18})\>/.exec(karmaCommand.user).groups.id);
            } else {
                subject = karmaCommand.subject.trim();
                const stored = KarmaService.get(subject);
                if (stored && stored.userId) subject = `<@${stored.userId}>`;
            }

            const updated = count != '__' ? KarmaService.increment(subject, count == '++' ? 1 : -1) : KarmaService.reset(subject);

            message.reply(`karma voor ${subject}: ${updated.karma}`);

            KarmaService.write();
            return;
        }
    });

    // Return karma info for a subject or user
    commandRouter.handler('karma', (message, command) => {
        if (!command.args) {
            message.reply(`je hebt ${ KarmaService.get(`<@${message.author.id}>`).karma } karma`);
            return;
        }

        const subject = command.args.trim();
        const storedKarma = KarmaService.get(subject);
        if (storedKarma.userId) {
            message.reply(`<@${storedKarma.userId}> heeft ${storedKarma.karma} karma`);
        } else {
            message.reply(`karma voor ${subject}: ${storedKarma.karma}`);
        }
    });

    // Returns the karma scoreboard
    commandRouter.handler('karmalist', message => {
        const karmaList = KarmaService.list();
        message.reply({
            embed: {
                title: 'Karma scorebord',
                fields: [
                    {
                        name: 'Gebruikers',
                        value: karmaList.users.map(entry => `${entry.name}: ${entry.karma}`).join('\n'),
                        inline: true
                    },
                    {
                        name: '\u200b',
                        value: '\u200b',
                        inline: true
                    },
                    {
                        name: 'Dingen',
                        value: karmaList.things.map(entry => `${entry.name}: ${entry.karma}`).join('\n'),
                        inline: true
                    }
                ]
            }
        });
    });
}
