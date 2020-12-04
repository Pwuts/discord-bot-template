/*
**  2020-05-20
**  Pwuts <github@pwuts.nl>
*/

import * as fs from 'fs';
import CommandRouter from './util/command-router';
import { initialize } from './services/discord-service';

const config = require('../config');
const DiscordService = initialize(config.discord.token);

const commandRouter = new CommandRouter(DiscordService.getClient());

// load modules
fs.readdirSync(`${__dirname}/modules/`).forEach(filename => {
    commandRouter.use(require(`${__dirname}/modules/${filename}`).default);
});
