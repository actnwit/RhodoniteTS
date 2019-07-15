import Vector3 from './Vector3';
import Matrix44 from './Matrix44';
import { Index } from '../../types/CommonTypes';
export default class AABB {
    private __min;
    private __max;
    private __centerPoint;
    private __lengthCenterToCorner;
    private __isCenterPointDirty;
    private __isLengthCenterToCornerDirty;
    private static __tmpVector3;
    constructor();
    clone(): AABB;
    minPoint: Vector3;
    maxPoint: Vector3;
    isVanilla(): boolean;
    addPosition(positionVector: Vector3): Vector3;
    addPositionWithArray(array: number[], index: Index): number[];
    mergeAABB(aabb: AABB): boolean;
    readonly centerPoint: Vector3;
    readonly lengthCenterToCorner: number;
    readonly sizeX: number;
    readonly sizeY: number;
    readonly sizeZ: number;
    static multiplyMatrix(matrix: Matrix44, aabb: AABB): AABB;
    static multiplyMatrixTo(matrix: Matrix44, aabb: AABB, outAabb: AABB): AABB;
    toString(): string;
}
