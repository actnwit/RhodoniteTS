// This code idea is from https://qiita.com/junkjunctions/items/5a6d8bed8df8eb3acceb

export interface EnumIO {
  readonly index: number;
  toString(): string;
  toJSON(): number;
}

