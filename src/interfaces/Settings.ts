export interface Settings {
	port: number;

	maxPlayersPerGame: number;

	maxGameNameLength: number;

	maxPlayerNameLength: number;

	minCardsRequiredToStart: number;

	minHandSize: number;
	maxHandSize: number,

	minRoundTime: number;
	maxRoundTime: number;

	minWinScore: number;
	maxWinScore: number;
}