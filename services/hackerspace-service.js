/*
**  2020-05-20
**  Pwuts <github@pwuts.nl>
*/

const MQTT = require('mqtt');
const axios = require('axios');

// fetch and store SpaceAPI directory
let directory = {};
axios.get('https://directory.spaceapi.io/')
    .then(result => {
        directory = result.data;
        hackerspaces.forEach(space => {
            space.api = space.name in directory ? directory[space.name] : null;
            if (space.api) Object.defineProperty(space, 'info', { get: () => getSpaceInfo(space) });
        });
        console.log('SpaceAPI directory loaded');
    })
    .catch(error => console.error('Could not fetch SpaceAPI directory:', error));

// Gets SpaceAPI data if applicable
function getSpaceInfo(space)
{
    return space.api ? axios.get(space.api).then(result => result.data).catch(console.error) : Promis.promisify(null);
}

let hackerspaces = [
    { id: 'denhaag',    name: 'RevSpace',              location: 'Den Haag (Leidschendam)', aliases: [ 'Revelation Space', 'Leidschendam' ], active: true },
    { id: 'eindhoven',  name: 'Hackalot',              location: 'Eindhoven',               aliases: [ 'Brabant' ],                          active: true },
    { id: 'rotterdam',  name: 'Pixelbar',              location: 'Rotterdam',               aliases: [],                                     active: true },
    { id: 'arnhem',     name: 'Hack42',                location: 'Arnhem',                  aliases: [],                                     active: true },
    { id: 'amersfoort', name: 'Bitlair',               location: 'Amersfoort',              aliases: [],                                     active: true },
    { id: 'wageningen', name: 'NURDSpace',             location: 'Wageningen',              aliases: [],                                     active: true },
    { id: 'venlo',      name: 'TDvenlo',               location: 'Venlo',                   aliases: [],                                     active: true },
    { id: 'enschede',   name: 'TkkrLab',               location: 'Enschede',                aliases: [ 'Overijssel' ],                       active: true },
    { id: 'amsterdam',  name: 'Technologia Incognita', location: 'Amsterdam',               aliases: [ 'TechInc', 'Noord-Holland' ],         active: true },
    { id: 'nijmegen',   name: 'Hackerspace Nijmegen',  location: 'Nijmegen',                aliases: [],                                     active: true },
    { id: 'heerlen',    name: 'ACKspace',              location: 'Heerlen',                 aliases: [],                                     active: true },
    { id: 'leeuwarden', name: 'Frack',                 location: 'Leeuwarden',              aliases: [ 'Friesland' ],                        active: true },
    { id: 'utrecht',    name: 'RandomData',            location: 'Utrecht',                 aliases: [],                                     active: true },
    { id: 'zwolle',     name: 'Bhack',                 location: 'Zwolle',                  aliases: [],                                     active: false },
    { id: 'almere',     name: 'Sk1llz',                location: 'Almere',                  aliases: [ 'Flevoland' ],                        active: false }
];

/* Connect to Revspace MQTT server for realtime space state updates */

const revspaceMqtt = MQTT.connect('mqtt://hoera10jaar.revspace.nl');
revspaceMqtt.on('connect', packet => {
    console.log('Connected to Revspace MQTT broker');
});

revspaceMqtt.subscribe('hoera10jaar/#', { rh: true }, error => error ? console.error('Could not subscribe to Hoera10jaar:', error) : null);

revspaceMqtt.on('message', (topic, message) => {
    const topicFilter = /^hoera10jaar\/(?!spaceapi\/)(?<space>[a-z]+)/.exec(topic);
    let space = topicFilter ? HackerspaceService.find(topicFilter.groups.space) : null;
    if (space === null) {
        return;
    } else if (space === undefined) {
        console.warn(`Unknown hackerspace "${space}"`);
        return;
    }

    space.open = { 'red': false, 'yellow': null, 'green': true }[message];
});


const HackerspaceService = {
    find(searchTerm)
    {
        searchTerm = searchTerm.toLowerCase();
        const spaceId = searchTerm.replace(' ', '');

        return hackerspaces.find(space => space.id == spaceId || space.name.toLowerCase() == spaceId || space.aliases.map(a => a.toLowerCase()).includes(searchTerm)) ?? null;
    },
    list()
    {
        return hackerspaces;
    }
}
module.exports = HackerspaceService;
