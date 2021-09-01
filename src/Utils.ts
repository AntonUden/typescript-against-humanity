export class Utils {
	static getRandomInt(min: number, max: number): number {
		return Math.trunc(Math.random() * (max - min) + min);
	}
}