export class Utils {
	static getRandomInt(min: number, max: number): number {
		return Math.trunc(Math.random() * (max - min) + min);
	}

	// https://stackoverflow.com/a/2450976
	static shuffle<T>(array: T[]): T[] {
		var currentIndex = array.length, randomIndex;

		// While there remain elements to shuffle...
		while (currentIndex != 0) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[array[currentIndex], array[randomIndex]] = [
				array[randomIndex], array[currentIndex]];
		}

		return array;
	}
}