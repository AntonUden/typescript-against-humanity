import { Server } from "./Server";

require('console-stamp')(console, '[HH:MM:ss.l]');

let port: any = process.env.PORT || 30000;

new Server({
	port: parseInt(port),

	maxPlayersPerGame: 10,

	maxGameNameLength: 40,
	maxPlayerNameLength: 40,

	minCardsRequiredToStart: 10,

	customSettingsLimit: {
		minHandSize: 5,
		maxHandSize: 100,

		minRoundTime: 1,
		maxRoundTime: 600,

		minWinScore: 1,
		maxWinScore: 9999
	}
});