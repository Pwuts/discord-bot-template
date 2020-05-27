/*
**  2020-05-26
**  Pwuts <github@pwuts.nl>
*/

let commandHandlers = [];

module.exports = function CommandRouter(discord)
{
    const CommandRouter = {
        // Set a handler for one or multiple commands
        handler(command, callback) {
            commandHandlers.push({
                commands: Array.isArray(command) ? command : [ command ],
                callback
            });
        },

        // Set up a module
        use(module) {
            module(this, discord);
            console.info(`${module.name} loaded`);
        }
    };

    // general message handler; finds commands and executes applicable handler functions
    discord.on('message', message => {
        const commandMessageMatch = /^!(?<name>[a-zA-Z0-9]+)(?:\s+(?<args>.*)|$)/.exec(message.content);

        if (commandMessageMatch) {
            const command = {
                name: commandMessageMatch.groups.name,
                args: commandMessageMatch.groups.args ?? null
            };
            console.debug(`Command from ${message.author.username}:`, command);

            commandHandlers.forEach(handler => {
                if (handler.commands.includes(command.name.toLowerCase())) {
                    handler.callback(message, command, discord);
                }
            });
        }
    });

    return CommandRouter;
}
