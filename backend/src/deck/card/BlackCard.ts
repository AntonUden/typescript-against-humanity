export class BlackCard {
  public readonly id: string;
  public readonly text: string;
  public readonly renderHtml: boolean;

  constructor(
    id: string,
    text: string,
    renderHtml: boolean,
  ) {
    this.id = id;
    this.text = text;
    this.renderHtml = renderHtml;
  }
}
