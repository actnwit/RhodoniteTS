// This code idea is from https://qiita.com/junkjunctions/items/5a6d8bed8df8eb3acceb

export interface EnumIO {
  readonly index: number;
  readonly str: string;
  toString(): string;
  toJSON(): number;
}

export class EnumClass implements EnumIO {
  readonly index: number;
  readonly str: string;
  private static __indices: Map<Function, number[]> = new Map();
  private static __strings: Map<Function, string[]> = new Map();

  constructor({index, str, noCheckStrUnique} : {index: number, str: string, noCheckStrUnique?: boolean}) {
    if (EnumClass.__indices.get(this.constructor) == null) {
      EnumClass.__indices.set(this.constructor, []);
    }
    if (EnumClass.__strings.get(this.constructor) == null) {
      EnumClass.__strings.set(this.constructor, []);
    }
    if (EnumClass.__indices.get(this.constructor)!.indexOf(index) !== -1) {
      throw new Error('Dont use duplicate index.');
    }
    if (noCheckStrUnique !== true) {
      if (EnumClass.__strings.get(this.constructor)!.indexOf(str) !== -1) {
        throw new Error('Dont use duplicate str.');
      }
    }

    this.index = index;
    this.str = str;

    EnumClass.__indices.get(this.constructor)!.push(index);
    EnumClass.__strings.get(this.constructor)!.push(str);
  }

  toString(): string {
    return this.str;
  }

  toJSON(): number {
    return this.index;
  }
}

export function _from({ typeList, index }: { typeList: Array<EnumIO>, index: number }): EnumIO|undefined {
  const match = typeList.find(type => type.index === index);
  if (!match) {
    return void 0;
  }

  return match;
}

export function _fromString({ typeList, str }: { typeList: Array<EnumIO>, str: string }): EnumIO|undefined {
  const match = typeList.find(type => type.str.toLowerCase() === str.toLowerCase());
  if (!match) {
    return void 0;
  }

  return match;
}

export function _fromStringCaseSensitively({ typeList, str }: { typeList: Array<EnumIO>, str: string }): EnumIO|undefined {
  const match = typeList.find(type => type.str === str);
  if (!match) {
    return void 0;
  }

  return match;
}
