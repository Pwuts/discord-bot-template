/*
**  2020-05-20
**  Pwuts <github@pwuts.nl>
*/

import CommandRouter from './util/command-router';
import * as Discord from 'discord.js';
const config = require('../config');

const discord = new Discord.Client();

const commandRouter = CommandRouter(discord);

commandRouter.registerHelpSection({
    name: 'Meta',
    text: '!help\n!ping'
});

commandRouter.handler(['ping', 'pong'], (msg, command) => {
    if (command.name == 'ping') {
        msg.reply(`pong (${Date.now() - msg.createdTimestamp} ms)`);
    } else {
        msg.reply('dat is mijn tekst >:(');
    }
});

const KarmaModule = require('./modules/karma-module');
const HackerspaceModule = require('./modules/hackerspace-module');

// load modules
commandRouter.use(KarmaModule);
commandRouter.use(HackerspaceModule);

discord.on('ready', () => {
    console.log(`Logged in as ${discord.user.tag}!`);
});

discord.login(config.discord.token);
