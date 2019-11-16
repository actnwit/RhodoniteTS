import Vector3 from './Vector3';
import Vector4 from './Vector4';
import Matrix44 from './Matrix44';
import MutableVector3 from './MutableVector3';
import { Index } from '../../types/CommonTypes';

export default class AABB {
  private __min: MutableVector3 = new MutableVector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
  private __max: MutableVector3 = new MutableVector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
  private __centerPoint = Vector3.zero();
  private __lengthCenterToCorner = 0;
  private __isCenterPointDirty = false;
  private __isLengthCenterToCornerDirty = false;
  private static __tmpVector3 = MutableVector3.zero();

  constructor() {
  }

  clone() {
    let instance = new AABB();
    instance.__max = this.__max.clone();
    instance.__min = this.__min.clone();
    instance.__centerPoint = this.__centerPoint.clone();
    instance.__lengthCenterToCorner = this.__lengthCenterToCorner;

    return instance;
  }

  initialize() {
    this.__min.x = Number.MAX_VALUE;
    this.__min.y = Number.MAX_VALUE;
    this.__min.z = Number.MAX_VALUE;
    this.__max.x = -Number.MAX_VALUE;
    this.__max.y = -Number.MAX_VALUE;
    this.__max.z = -Number.MAX_VALUE;
    this.__centerPoint.v[0] = 0;
    this.__centerPoint.v[1] = 0;
    this.__centerPoint.v[2] = 0;
    this.__lengthCenterToCorner = 0;
    this.__isCenterPointDirty = false;
    this.__isLengthCenterToCornerDirty = false;
  }

  set minPoint(val: Vector3) {
    this.__min = new MutableVector3(val);
  }

  get minPoint() {
    return new Vector3(this.__min);
  }

  set maxPoint(val: Vector3) {
    this.__max = new MutableVector3(val);
  }

  get maxPoint() {
    return new Vector3(this.__max);
  }

  isVanilla() {
    if (this.__min.x >= Number.MAX_VALUE && this.__min.y >= Number.MAX_VALUE && this.__min.z >= Number.MAX_VALUE
      && this.__max.x <= -Number.MAX_VALUE && this.__max.y <= -Number.MAX_VALUE && this.__max.z <= -Number.MAX_VALUE) {
      return true;
    } else {
      return false;
    }
  }

  addPosition(positionVector: Vector3) {
    this.__min.x = (positionVector.x < this.__min.x) ? positionVector.x : this.__min.x;
    this.__min.y = (positionVector.y < this.__min.y) ? positionVector.y : this.__min.y;
    this.__min.z = (positionVector.z < this.__min.z) ? positionVector.z : this.__min.z;

    this.__max.x = (this.__max.x < positionVector.x) ? positionVector.x : this.__max.x;
    this.__max.y = (this.__max.y < positionVector.y) ? positionVector.y : this.__max.y;
    this.__max.z = (this.__max.z < positionVector.z) ? positionVector.z : this.__max.z;

    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    return positionVector;
  }

  addPositionWithArray(array: number[], index: Index) {
    this.__min.x = (array[index+0] < this.__min.x) ? array[index+0] : this.__min.x;
    this.__min.y = (array[index+1] < this.__min.y) ? array[index+1] : this.__min.y;
    this.__min.z = (array[index+2] < this.__min.z) ? array[index+2] : this.__min.z;
    this.__max.x = (this.__max.x < array[index+0]) ? array[index+0] : this.__max.x;
    this.__max.y = (this.__max.y < array[index+1]) ? array[index+1] : this.__max.y;
    this.__max.z = (this.__max.z < array[index+2]) ? array[index+2] : this.__max.z;

    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    return array;
  }

  mergeAABB(aabb: AABB) {
    var isUpdated = false;

    if (aabb.isVanilla()) {
      return isUpdated;
    }

    if (this.isVanilla()) {
      this.__min.x = aabb.minPoint.x;
      this.__min.y = aabb.minPoint.y;
      this.__min.z = aabb.minPoint.z;
      this.__max.x = aabb.maxPoint.x;
      this.__max.y = aabb.maxPoint.y;
      this.__max.z = aabb.maxPoint.z;
      isUpdated = true;
      return isUpdated;
    }

    if (aabb.minPoint.x < this.__min.x) {
      this.__min.x = aabb.minPoint.x;
      isUpdated = true;
    }
    if (aabb.minPoint.y < this.__min.y) {
      this.__min.y = aabb.minPoint.y;
      isUpdated = true;
    }
    if (aabb.minPoint.z < this.__min.z) {
      this.__min.z = aabb.minPoint.z;
      isUpdated = true;
    }
    if (this.__max.x < aabb.maxPoint.x) {
      this.__max.x = aabb.maxPoint.x;
      isUpdated = true;
    }
    if (this.__max.y < aabb.maxPoint.y) {
      this.__max.y = aabb.maxPoint.y;
      isUpdated = true;
    }
    if (this.__max.z < aabb.maxPoint.z) {
      this.__max.z = aabb.maxPoint.z;
      isUpdated = true;
    }

    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    return isUpdated;
  }


  get centerPoint() {
    if (this.__isCenterPointDirty) {
      this.__centerPoint = Vector3.add(this.__min, this.__max).divide(2);
      this.__isCenterPointDirty = false;
    }
    return this.__centerPoint;
  }

  get lengthCenterToCorner() {
    if (this.__isLengthCenterToCornerDirty) {
      const lengthCenterToCorner = Vector3.lengthBtw(this.centerPoint, this.maxPoint);
      this.__lengthCenterToCorner = (lengthCenterToCorner !== lengthCenterToCorner) ? 0 : lengthCenterToCorner;
      this.__isLengthCenterToCornerDirty = false;
    }
    return this.__lengthCenterToCorner;
  }

  get sizeX() {
    return (this.__max.x - this.__min.x);
  }

  get sizeY() {
    return (this.__max.y - this.__min.y);
  }

  get sizeZ() {
    return (this.__max.z - this.__min.z);
  }

  static multiplyMatrix(matrix: Matrix44, aabb: AABB) {
     if (aabb.isVanilla()) {
       return aabb.clone();
     }
    var newAabb = new AABB();

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    newAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    newAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    newAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    newAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    newAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    newAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    newAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    newAabb.addPosition(AABB.__tmpVector3);

    return newAabb;
  }

  static multiplyMatrixTo(matrix: Matrix44, aabb: AABB, outAabb: AABB) {
    if (aabb.isVanilla()) {
      return aabb.clone();
    }

   AABB.__tmpVector3.x = aabb.__min.x;
   AABB.__tmpVector3.y = aabb.__min.y;
   AABB.__tmpVector3.z = aabb.__min.z;
   matrix.multiplyVectorToVec3(AABB.__tmpVector3 as any as Vector4, AABB.__tmpVector3);
   outAabb.addPosition(AABB.__tmpVector3);

   AABB.__tmpVector3.x = aabb.__max.x;
   AABB.__tmpVector3.y = aabb.__min.y;
   AABB.__tmpVector3.z = aabb.__min.z;
   matrix.multiplyVectorToVec3(AABB.__tmpVector3 as any as Vector4, AABB.__tmpVector3);
   outAabb.addPosition(AABB.__tmpVector3);

   AABB.__tmpVector3.x = aabb.__min.x;
   AABB.__tmpVector3.y = aabb.__max.y;
   AABB.__tmpVector3.z = aabb.__min.z;
   matrix.multiplyVectorToVec3(AABB.__tmpVector3 as any as Vector4, AABB.__tmpVector3);
   outAabb.addPosition(AABB.__tmpVector3);

   AABB.__tmpVector3.x = aabb.__min.x;
   AABB.__tmpVector3.y = aabb.__min.y;
   AABB.__tmpVector3.z = aabb.__max.z;
   matrix.multiplyVectorToVec3(AABB.__tmpVector3 as any as Vector4, AABB.__tmpVector3);
   outAabb.addPosition(AABB.__tmpVector3);

   AABB.__tmpVector3.x = aabb.__min.x;
   AABB.__tmpVector3.y = aabb.__max.y;
   AABB.__tmpVector3.z = aabb.__max.z;
   matrix.multiplyVectorToVec3(AABB.__tmpVector3 as any as Vector4, AABB.__tmpVector3);
   outAabb.addPosition(AABB.__tmpVector3);

   AABB.__tmpVector3.x = aabb.__max.x;
   AABB.__tmpVector3.y = aabb.__min.y;
   AABB.__tmpVector3.z = aabb.__max.z;
   matrix.multiplyVectorToVec3(AABB.__tmpVector3 as any as Vector4, AABB.__tmpVector3);
   outAabb.addPosition(AABB.__tmpVector3);

   AABB.__tmpVector3.x = aabb.__max.x;
   AABB.__tmpVector3.y = aabb.__max.y;
   AABB.__tmpVector3.z = aabb.__min.z;
   matrix.multiplyVectorToVec3(AABB.__tmpVector3 as any as Vector4, AABB.__tmpVector3);
   outAabb.addPosition(AABB.__tmpVector3);

   AABB.__tmpVector3.x = aabb.__max.x;
   AABB.__tmpVector3.y = aabb.__max.y;
   AABB.__tmpVector3.z = aabb.__max.z;
   matrix.multiplyVectorToVec3(AABB.__tmpVector3 as any as Vector4, AABB.__tmpVector3);
   outAabb.addPosition(AABB.__tmpVector3);

   return outAabb;
 }

  toString() {
    return 'AABB_min: ' + this.__min + '\n' + 'AABB_max: ' + this.__max + '\n'
      + 'centerPoint: ' + this.__centerPoint + '\n' + 'lengthCenterToCorner: ' + this.__lengthCenterToCorner;
  }
}

