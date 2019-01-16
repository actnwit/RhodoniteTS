declare class _Vector2<T extends TypedArray, S extends TypedArrayConstructor> {
    v: TypedArray;
    private __typedArray;
    constructor(typedArray: S, x: number | TypedArray, y?: number);
    readonly className: string;
    clone(): _Vector2<TypedArray, S>;
    multiply(val: number): this;
    isStrictEqual(vec: _Vector2<T, S>): boolean;
    isEqual(vec: _Vector2<T, S>, delta?: number): boolean;
    static multiply<T extends TypedArray, S extends TypedArrayConstructor>(typedArray: S, vec2: _Vector2<T, S>, val: number): _Vector2<TypedArray, S>;
    x: number;
    y: number;
    readonly raw: TypedArray;
}
export declare class Vector2_F64 extends _Vector2<Float64Array, Float64ArrayConstructor> {
    constructor(x: number | TypedArray, y?: number);
}
export default Vector2_F64;
