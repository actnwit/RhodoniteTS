// This code idea is from https://qiita.com/junkjunctions/items/5a6d8bed8df8eb3acceb

export interface EnumIO {
  readonly index: number;
  toString(): string;
  toJSON(): number;
}

export class EnumClass implements EnumIO {
  readonly index: number;
  protected readonly str: string;

  constructor({index, str} : {index: number, str: string}) {
    this.index = index;
    this.str = str;
  }

  toString(): string {
    return this.str;
  }

  toJSON(): number {
    return this.index;
  }
}

export function _from({ typeList, index }: { typeList: Array<EnumIO>, index: number }): EnumIO {
  const match = typeList.find(type => type.index === index);
  if (!match) {
    throw new Error(`Invalid PrimitiveMode index: [${index}]`);
  }

  return match;
}

