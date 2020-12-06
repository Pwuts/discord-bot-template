/*
**  2020-05-20
**  Pwuts <github@pwuts.nl>
*/

import * as fs from 'fs';
import ModuleManager from './util/module-manager';
import { initialize } from './services/discord-service';

const config = require('../config');
const DiscordService = initialize(config.discord.token);

const moduleManager = new ModuleManager(DiscordService.getClient());

// load modules
fs.readdirSync(`${__dirname}/modules/`).forEach(filename => {
    moduleManager.use(require(`${__dirname}/modules/${filename}`).default);
});
