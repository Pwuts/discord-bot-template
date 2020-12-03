Discord NodeJS Bot Template
===========================
A template for making large or small Discord bots to run on NodeJS.

## Structure

For reusability and maintainability of course :)

### Bot Modules

Non-miscellaneous commands are added using modules. A module can register command
handlers using the [`CommandRouter`](#commandrouter), or register its own message
handlers.

A conforming bot module should export:
```TS
function (commandRouter: typeof CommandRouter, discord?: Discord.Client): any
```
Both parameters are passed by the `CommandRouter` when the bot module is loaded
with `commandRouter.use(Module)`.

### Services

If a bot module uses resources that might also be useful for other modules, or
which are so complex they need abstraction into external functions or classes,
this functionality is hosted in a service.

Services should (for consistency) export an `object`.

### CommandRouter

The `CommandRouter` module provides an easy interface for installing bot modules
and handling commands. A `CommandRouter` needs to be initialized with an instance
of `DiscordClient`. The resulting `commandRouter` can load bot modules, or command
handlers can be registered directly with `commandRouter.handler()`.

A callback registered with the `CommandRouter` is called with 3 arguments:
```TS
function callback(
    message: Discord.Message,                     // the received message
    command: { name: string, args: string|null }, // the received command + arguments
    discord: Discord.Client                       // the CommandRouter's Client instance
)
```

### Util

The `util` folder contains the `CommandRouter` module and the `isAdmin` function
module which simply returns whether the given user ID is contained in the configured
bot admin list (see [configuration](#configuration)).

## Configuration

To keep things tidy (without too much hardcoded stuff), we have `config/index[.example].js`.
To use the bot, you do need to create `config/index.js` from the example file provided.
The same goes for `config/karma[.example].js`, to use the karma module.

The default `index.js` example contains:
* `discord`
    * `token` (used to log in to Discord as a registered bot)
    * `ownerUserIds` (array of user ID's configured as bot owners)
* `bot`
    * `reservedCommands` (an array of commands unavailable for modules to register)

And `karma[.example].js`:
* `defaultKarmaStore` (used when no `karma.json` is present yet)

## Example

Example usage of everything described above:
```TS
const Discord = require('discord.js');
const config = require('./config');

const discord = new Discord.Client();

// Create an instance of CommandRouter
const commandRouter = require('./util/command-router')(discord);

// Set a command handler directly
commandRouter.handler('ping', (message: Discord.Message) => {
    message.reply(`pong (${Date.now() - message.createdTimestamp} ms)`);
});

commandRouter.registerHelpSection({
    name: 'Meta',
    text: '!help\n!ping'
});

// Load a module
const KarmaModule = require('./modules/karma-module');

// Attach module
commandRouter.use(KarmaModule);

discord.login(config.discord.token);
```
