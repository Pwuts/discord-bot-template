/*
**  2020-05-26
**  Pwuts <github@pwuts.nl>
*/

const HackerspaceService = require('../services/hackerspace-service');
const Embed = require('discord.js').MessageEmbed;

module.exports = function HackerspaceModule(commandRouter)
{
    // Returns info for the requested hackerspace
    commandRouter.handler('hackerspace', async (msg, command) => {
        if (!command.args) {
            msg.reply('welke hackerspace?');
            return;
        }

        // search for requested hackerspace
        const space = HackerspaceService.find(command.args.toLowerCase());
        if (!space) {
            msg.reply('huh wat, bestaat die?');
            return;
        }
        if (!space.active) {    // some spaces aren't active anymore
            msg.reply(`${space.name} is niet meer :'(`);
            return;
        }

        let spaceInfo;
        if (space.api && (spaceInfo = await space.info)) {
            try {
                const infoBox = new Embed({ // construct embed with info about the hackerspace
                    title: space.name,
                    description: space.location,
                    url: spaceInfo.url,
                    color: typeof space.open == 'boolean' ? space.open ? 'GREEN' : 'RED' : 'YELLOW',
                    fields: [
                        {
                            name: 'Status',
                            value: typeof space.open == 'boolean' ? `${space.name} is ${space.open ? '*open*' : '*dicht*'}` : `onbekend :(`
                        }
                    ],
                    footer: { text: spaceInfo.location.address }
                });
                if (spaceInfo.state.icon) infoBox.setThumbnail(spaceInfo.state.icon[space.open ? 'open' : 'closed']);
                if (spaceInfo.state.message) infoBox.addField('Bericht', spaceInfo.state.message);

                msg.reply({ embed: infoBox });
            } catch (error) {   // fallback to simple "open/closed" response when constructing embed fails
                msg.reply(`${space.name} heeft hun Space API niet op orde dus nu ben ik stuk.`);
                console.error('building space info box failed:', error, spaceInfo);
                msg.channel.send(`maarre, de space status is ${typeof space.open == 'boolean' ? space.open ? '**open**' : '**dicht**' : `onbekend :(`}`);
            }
        }
        else if (typeof space.open == 'boolean') {
            msg.reply(`${space.name} is ${space.open ? '**open**' : '**dicht**'}`);
        }
        else msg.reply(`status van ${space.name} onbekend :(`);
    });

    // Returns a list of all hackerspaces in NL
    commandRouter.handler('hackerspaces', async msg => {
        const spaces = HackerspaceService.list();
        const spaceList = new Embed({
            title: 'Hackerspaces in Nederland',
            url: 'https://hackerspaces.nl',
            thumbnail: { url: 'https://hackerspaces.nl/hsmap/hs.png' }
        });

        // fetch SpaceAPI data for every space and add to embed
        for (let i = 0; i < spaces.length; i++) {
            const space = spaces[i];
            info = await space.info;
            spaceList.addField(space.location,
                `**${info ? `[${space.name}](${info.url})` : space.name}**\n` +
                `${space.active ? space.open ? '*open*' : '*dicht*' : 'dood :('}`,
                true
            );
        }
        msg.reply({ embed: spaceList });
    });
}
