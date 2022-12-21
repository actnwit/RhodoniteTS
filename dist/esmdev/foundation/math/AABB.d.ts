import { Vector3 } from './Vector3';
import { Matrix44 } from './Matrix44';
import { MutableVector3 } from './MutableVector3';
import { Index } from '../../types/CommonTypes';
/**
 * A 3D axis-aligned bounding box.
 */
export declare class AABB {
    private __min;
    private __max;
    private __centerPoint;
    private __lengthCenterToCorner;
    private __isCenterPointDirty;
    private __isLengthCenterToCornerDirty;
    private static __tmpVector3;
    private __isVanilla;
    constructor();
    /**
     * Clone this AABB.
     * @returns a cloned AABB.
     */
    clone(): AABB;
    /**
     * Copy inner components from another AABB.
     * @param aabb
     * @returns this
     */
    copyComponents(aabb: AABB): this;
    /**
     * initialize this AABB.
     */
    initialize(): void;
    set minPoint(val: Vector3);
    get minPoint(): Vector3;
    set maxPoint(val: Vector3);
    get maxPoint(): Vector3;
    /**
     * return whether this AABB is vanilla (not initialized) or not.
     * @returns true if this AABB is vanilla.
     */
    isVanilla(): boolean;
    /**
     * add a position for updating AABB.
     * @param positionVector
     * @returns given positionVector.
     */
    addPosition(positionVector: Vector3): Vector3;
    /**
     * add a position for updating AABB.
     * @param array a position array.
     * @param index index of the position array to adding.
     * @returns given array.
     */
    addPositionWithArray(array: number[], index: Index): number[];
    /**
     * merge with another AABB.
     * @param aabb another AABB to merge
     * @returns merge succeeded or not.
     */
    mergeAABB(aabb: AABB): boolean;
    /**
     * the center of this AABB.
     */
    get centerPoint(): MutableVector3;
    /**
     * the length from center to corner of this AABB.
     */
    get lengthCenterToCorner(): number;
    /**
     * the length from min x to max x of this AABB.
     */
    get sizeX(): number;
    /**
     * the length from min y to max y of this AABB.
     */
    get sizeY(): number;
    /**
     * the length from min z to max z of this AABB.
     */
    get sizeZ(): number;
    /**
     * multiply this AABB with a given matrix.
     * @param matrix a matrix to convert aabb.
     * @param aabb given AABB to convert.
     * @param outAabb converted AABB by given matrix.
     * @returns converted AABB.
     */
    static multiplyMatrixTo(matrix: Matrix44, aabb: AABB, outAabb: AABB): AABB;
    /**
     * toString method.
     */
    toString(): string;
    /**
     * toString method (the numbers are Approximate)
     */
    toStringApproximately(): string;
}
