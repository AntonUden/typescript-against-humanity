export class WhiteCard {
  public readonly id: string;
  public readonly text: string;
  public readonly pick: number;
  public readonly renderHtml: boolean;

  constructor(
    id: string,
    text: string,
    pick: number,
    renderHtml: boolean,
  ) {
    this.id = id;
    this.text = text;
    this.pick = pick;
    this.renderHtml = renderHtml;
  }
}
