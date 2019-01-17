export interface EnumIO {
    readonly index: number;
    readonly str: string;
    toString(): string;
    toJSON(): number;
}
export declare class EnumClass implements EnumIO {
    readonly index: number;
    readonly str: string;
    private static __indices;
    private static __strings;
    constructor({ index, str }: {
        index: number;
        str: string;
    });
    toString(): string;
    toJSON(): number;
}
export declare function _from({ typeList, index }: {
    typeList: Array<EnumIO>;
    index: number;
}): EnumIO;
export declare function _fromString({ typeList, str }: {
    typeList: Array<EnumIO>;
    str: string;
}): EnumIO;
