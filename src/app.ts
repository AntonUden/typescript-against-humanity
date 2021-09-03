import { Server } from "./Server";

require('console-stamp')(console, '[HH:MM:ss.l]');

let port: any = process.env.PORT || 30000;

const server = new Server({
	port: parseInt(port),
	maxPlayersPerGame: 10,
	maxGameNameLength: 40,
	maxPlayerNameLength: 40,
	minCardsRequiredToStart: 10,
	minHandSize: 5,
	maxHandSize: 50
});