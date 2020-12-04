/*
**  2020-05-20
**  Pwuts <github@pwuts.nl>
*/

import * as fs from 'fs';
import * as Discord from 'discord.js';
import CommandRouter from './util/command-router';

const config = require('../config');

const discord = new Discord.Client();

const commandRouter = new CommandRouter(discord);

// load modules
fs.readdirSync(`${__dirname}/modules/`).forEach(filename => {
    commandRouter.use(require(`${__dirname}/modules/${filename}`).default);
});

discord.on('ready', () => {
    console.log(`Logged in as ${discord.user.tag}!`);
});

discord.login(config.discord.token);
