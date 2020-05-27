/*
**  2020-05-20
**  Pwuts <github@pwuts.nl>
*/

const Discord = require('discord.js');
const config = require('./config').Discord;

const KarmaModule = require('./modules/karma-module');
const HackerspaceModule = require('./modules/hackerspace-module');

const discord = new Discord.Client();
const commandRouter = require('./util/command-router')(discord);

// load modules
commandRouter.use(KarmaModule);
commandRouter.use(HackerspaceModule);

commandRouter.handler('help', msg => {
    msg.reply('probeer maar wat');

    setTimeout(() => {
        msg.author.send({
            embed: {
                title: 'Okee grapje, hier zijn wat hints:',
                fields: [
                    {
                        name: 'Hackerspaces',
                        value: '!hackerspaces\n!hackerspace *naam|locatie*',
                    },
                    {
                        name: 'Karma',
                        value: '!*iets*(++|--)\n!karma *iets*\n!karmalist'
                    },
                    {
                        name: 'Meta',
                        value: '!help\n!ping'
                    }
                ]
            }
        });
    }, 10e3);
});

commandRouter.handler(['ping', 'pong'], (msg, command) => {
    if (command.name == 'ping') {
        msg.reply(`pong (${Date.now() - msg.createdTimestamp} ms)`);
    } else {
        msg.reply('dat is mijn tekst >:(');
    }
});


discord.on('ready', () => {
    console.log(`Logged in as ${discord.user.tag}!`);
});

discord.login(config.token);
