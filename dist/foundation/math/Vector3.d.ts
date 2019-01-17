import Vector2 from './Vector2';
import Vector4 from './Vector4';
import { IVector3 } from './IVector';
export default class Vector3 implements IVector3 {
    v: TypedArray;
    constructor(x?: number | TypedArray | Vector2 | IVector3 | Vector4 | Array<number> | null, y?: number, z?: number);
    readonly className: string;
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
    isStrictEqual(vec: Vector3): boolean;
    isEqual(vec: Vector3, delta?: number): boolean;
    /**
     * Zero Vector
     */
    static zero(): Vector3;
    static one(): Vector3;
    static dummy(): Vector3;
    isDummy(): boolean;
    clone(): Vector3;
    length(): number;
    /**
     * to square length(static verison)
     */
    static lengthSquared(vec3: Vector3): number;
    lengthTo(vec3: Vector3): number;
    static lengthBtw(lhv: Vector3, rhv: Vector3): number;
    /**
     * dot product
     */
    dotProduct(vec3: Vector3): number;
    /**
     * dot product(static version)
     */
    static dotProduct(lv: Vector3, rv: Vector3): number;
    /**
    * cross product(static version)
    */
    static cross(lv: Vector3, rv: Vector3): Vector3;
    /**
     * normalize(static version)
     */
    static normalize(vec3: Vector3): Vector3;
    /**
     * add value（static version）
     */
    static add(lv: Vector3, rv: Vector3): Vector3;
    /**
     * subtract(subtract)
     */
    static subtract(lv: Vector3, rv: Vector3): Vector3;
    /**
     * divide(static version)
     */
    static divide(vec3: Vector3, val: number): Vector3;
    /**
     * multiply(static version)
     */
    static multiply(vec3: Vector3, val: number): Vector3;
    /**
     * multiply vector(static version)
     */
    static multiplyVector(vec3: Vector3, vec: Vector3): Vector3;
    static angleOfVectors(lhv: Vector3, rhv: Vector3): number;
    /**
     * divide vector(static version)
     */
    static divideVector(lvec3: Vector3, rvec3: Vector3): Vector3;
    /**
     * change to string
     */
    toString(): string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly raw: TypedArray;
}
