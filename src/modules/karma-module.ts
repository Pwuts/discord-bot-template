/*
**  2020-05-26
**  Pwuts <github@pwuts.nl>
*/

const isAdmin = require('../util/is-admin');
import { CommandRouter } from '../util/command-router';
import KarmaService = require('../services/karma-service');
import { Client, MessageEmbed as Embed, MessageEmbed } from 'discord.js';

export const name = 'KarmaModule';

export const help = {
    name: 'Karma',
    text: '!*iets*(++|--)\n!karma *iets*\n!karmalist'
};

export function hook({ commandRouter, discord }: { commandRouter: CommandRouter, discord: Client })
{
    // Handle karma increment, decrement, reset commands
    discord.on('message', async message => {
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

                let stored = await KarmaService.get(message.guild.id, subject);
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

            const updated = count != '__'
                ? await KarmaService.increment(message.guild.id, subject, count == '++' ? 1 : -1)
                : await KarmaService.reset(message.guild.id, subject);

            message.reply(`karma voor ${subject}: ${updated.karma}`);
        }
    });

    // Return karma info for a subject or user
    commandRouter.handler('karma', async (message, command) => {
        if (!command.args) {
            message.reply(`je hebt ${ (await KarmaService.get(message.guild.id, `<@${message.author.id}>`)).karma } karma`);
            return;
        }

        const subject = command.args.trim();
        const storedKarma = await KarmaService.get(message.guild.id, subject);
        if (storedKarma.userId) {
            message.reply((storedKarma.userId != message.author.id ?
                `<@${storedKarma.userId}> heeft` : 'je hebt') + ` ${storedKarma.karma} karma`);
        } else {
            message.reply(`karma voor ${subject}: ${storedKarma.karma}`);
        }
    });

    // Returns the karma scoreboard
    commandRouter.handler('karmalist', async message => {
        const karmaList = await KarmaService.list(message.guild.id);

        if (karmaList.users.length || karmaList.things.length) {
            const embed = new Embed({
                title: 'Karma scorebord'
            });

            if (karmaList.users.length) {
                embed.addField(
                    'Gebruikers',
                    karmaList.users.map(entry => `${entry.subject}: ${entry.karma}`).join('\n'),
                    true
                );

                if (karmaList.things.length) {
                    embed.addField('\u200b', '\u200b', true);   // horizontal spacer
                }
            }

            if (karmaList.things.length) {
                embed.addField(
                    'Dingen',
                    karmaList.things.map(entry => `${entry.subject}: ${entry.karma}`).join('\n'),
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
