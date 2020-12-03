/*
**  2020-05-26
**  Pwuts <github@pwuts.nl>
*/

const KarmaService = require('../services/karma-service');
const isAdmin = require('../util/is-admin');
const Embed = require('discord.js').MessageEmbed;

module.exports.name = 'KarmaModule';

module.exports.help = {
    name: 'Karma',
    text: '!*iets*(++|--)\n!karma *iets*\n!karmalist'
};

module.exports.hook = function ({ commandRouter, discord })
{
    // Handle karma increment, decrement, reset commands
    discord.on('message', message => {
        const karmaMessageMatch = /^! *(?:(?<subject>[a-zA-Z0-9 \-_()]+)|(?<user><@!?\d{18}>)|(?<emoji>(?:<:[A-Za-z0-9_]+:\d{18}>)+)) *(?<count>\+\+|--|__)/.exec(message.content);

        if (karmaMessageMatch) {
            const karmaCommand = Object.assign({}, karmaMessageMatch.groups);

            const count = karmaCommand.count;
            if (count == '__' && !isAdmin(message.author.id)) return;

            let subject, subjectUserId;
            if (karmaCommand.emoji) {
                subject = karmaCommand.emoji;
            }
            else if (karmaCommand.user) {
                subjectUserId = /\<@!?(?<id>\d{18})\>/.exec(karmaCommand.user).groups.id;
                subject = message.mentions.users.get(subjectUserId);
            }
            else {
                subject = karmaCommand.subject.trim();
                if (!subject.length) return;

                const stored = KarmaService.get(subject);
                if (stored.userId) {
                    subjectUserId = stored.userId;
                    subject = `<@${stored.userId}>`;
                }
            }

            if (subjectUserId && count != '__' && subjectUserId == message.author.id) {
                message.reply('Je kunt jezelf geen karma geven.')
                    .then(message => message.delete({ timeout: 10e3 }));
                return;
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
            message.reply((storedKarma.userId != message.author.id ?
                `<@${storedKarma.userId}> heeft` : 'je hebt') + ` ${storedKarma.karma} karma`);
        } else {
            message.reply(`karma voor ${subject}: ${storedKarma.karma}`);
        }
    });

    // Returns the karma scoreboard
    commandRouter.handler('karmalist', message => {
        const karmaList = KarmaService.list();

        if (karmaList.users.length || karmaList.things.length) {
            const embed = new Embed({
                title: 'Karma scorebord'
            });

            if (karmaList.users.length) {
                embed.addField(
                    'Gebruikers',
                    karmaList.users.map(entry => `${entry.name}: ${entry.karma}`).join('\n'),
                    true
                );

                if (karmaList.things.length) {
                    embed.addField('\u200b', '\u200b', true);   // horizontal spacer
                }
            }

            if (karmaList.things.length) {
                embed.addField(
                    'Dingen',
                    karmaList.things.map(entry => `${entry.name}: ${entry.karma}`).join('\n'),
                    true
                );
            }

            message.reply({ embed });
        } else {
            message.reply('De karmalijst is nog leeg')
                .then(message => message.delete({ timeout: 10e3 }));
        }
    });
}
