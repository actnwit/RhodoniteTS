import { Byte, TypedArray } from '../../types/CommonTypes';
export declare const valueWithDefault: <T>({ value, defaultValue }: {
    value?: T | undefined;
    defaultValue: T;
}) => T;
export declare const ifExistsThen: <T>(callback: (value: T) => void, value?: T | undefined) => value is T;
export declare const ifExistsThenWithReturn: <T>(callback: (value: T) => T, value?: T | undefined) => T | undefined;
export declare const ifDefinedThen: <T>(callback: (value: T) => void, value?: T | undefined) => value is T;
export declare const ifDefinedThenWithReturn: <T>(callback: (value: T) => T, value?: T | undefined) => T | undefined;
export declare const ifUndefinedThen: <T>(callback: () => void, value?: T | undefined) => value is T;
export declare const ifUndefinedThenWithReturn: <T>(callback: () => T, value?: T | undefined) => T;
export declare const ifNotExistsThen: <T>(callback: () => void, value?: T | undefined) => void;
export declare const ifNotExistsThenWithReturn: <T>(callback: () => T, value?: T | undefined) => T;
export declare const defaultValue: <T>(defaultValue: T, value?: T | undefined) => T;
export declare const valueWithCompensation: <T>({ value, compensation, }: {
    value?: T | undefined;
    compensation: () => T;
}) => T;
export declare const nullishToEmptyArray: <T>(value?: T[] | null | undefined) => T[];
export declare const nullishToEmptyMap: <M, N>(value?: Map<M, N> | null | undefined) => Map<M, N>;
interface CompareResult {
    result: boolean;
    greater: number;
    less: number;
}
export declare const greaterThan: (it: number, than: number) => CompareResult;
export declare const lessThan: (it: number, than: number) => CompareResult;
export declare const addLineNumberToCode: (shaderString: string) => string;
export declare function assertExist<T>(val: T): asserts val is NonNullable<T>;
export declare function deepCopyUsingJsonStringify(obj: {
    [k: string]: any;
}): any;
export declare function downloadArrayBuffer(fileNameToDownload: string, arrayBuffer: ArrayBuffer): void;
export declare function downloadTypedArray(fileNameToDownload: string, typedArray: TypedArray): void;
export declare const MiscUtil: Readonly<{
    isMobileVr: () => boolean;
    isMobile: () => boolean;
    isIOS: () => boolean;
    isSafari: () => boolean;
    preventDefaultForDesktopOnly: (e: Event) => void;
    isObject: (o: any) => boolean;
    fillTemplate: (templateString: string, templateVars: string) => any;
    isNode: () => boolean;
    concatArrayBuffers: (segments: ArrayBuffer[], sizes: Byte[], offsets: Byte[], finalSize?: Byte) => ArrayBufferLike;
    concatArrayBuffers2: ({ finalSize, srcs, srcsOffset, srcsCopySize, }: {
        finalSize: Byte;
        srcs: ArrayBuffer[];
        srcsOffset: Byte[];
        srcsCopySize: Byte[];
    }) => ArrayBufferLike;
    addLineNumberToCode: (shaderString: string) => string;
    downloadArrayBuffer: typeof downloadArrayBuffer;
    downloadTypedArray: typeof downloadTypedArray;
}>;
export {};
