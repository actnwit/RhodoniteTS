import Vector2 from './Vector2';
import Vector3 from './Vector3';
import Vector4 from './Vector4';
import Quaternion from './Quaternion';
import Matrix33 from './Matrix33';
import Matrix44 from './Matrix44';
export default class MathClassUtil {
    constructor();
    static arrayToVector(element: Array<number>): Vector3 | Vector4 | Vector2;
    static arrayToVectorOrMatrix(element: Array<number>): Vector3 | Vector4 | Matrix33 | Matrix44 | Vector2;
    static cloneOfMathObjects(element: any): any;
    static isAcceptableArrayForQuaternion(element: Array<number>): boolean;
    static arrayToQuaternion(element: Array<number>): Quaternion;
    static makeSubArray(array: Array<any>, componentN: number): any;
    static vectorToArray(element: Vector2 | Vector3 | Vector4 | Quaternion): number[];
    /**
     * discriminate which Vector instance
     * @param element any Vector instance
     * @return number of Vector instance
     */
    static compomentNumberOfVector(element: Vector2 | Vector3 | Vector4 | Quaternion | Array<any>): number;
    static packNormalizedVec4ToVec2(x: number, y: number, z: number, w: number, criteria: number): number[];
    static unProject(windowPosVec3: Vector3, inversePVMat44: Matrix44, viewportVec4: Vector4, zNear: number, zFar: number): Vector3;
}
