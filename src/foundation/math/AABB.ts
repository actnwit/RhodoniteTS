import Vector3 from './Vector3';
import Matrix44 from './Matrix44';
import MutableVector3 from './MutableVector3';
import {Index} from '../../types/CommonTypes';
import { MathUtil } from './MathUtil';

export default class AABB {
  private __min: MutableVector3 = new MutableVector3(
    Number.MAX_VALUE,
    Number.MAX_VALUE,
    Number.MAX_VALUE
  );
  private __max: MutableVector3 = new MutableVector3(
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
    -Number.MAX_VALUE
  );
  private __centerPoint = MutableVector3.zero();
  private __lengthCenterToCorner = 0;
  private __isCenterPointDirty = false;
  private __isLengthCenterToCornerDirty = false;
  private static __tmpVector3 = MutableVector3.zero();

  constructor() {}

  clone() {
    const instance = new AABB();
    instance.__max = this.__max.clone();
    instance.__min = this.__min.clone();
    instance.__centerPoint = this.__centerPoint.clone();
    instance.__lengthCenterToCorner = this.__lengthCenterToCorner;
    instance.__isCenterPointDirty = this.__isCenterPointDirty;
    instance.__isLengthCenterToCornerDirty = this.__isLengthCenterToCornerDirty;

    return instance;
  }

  copyComponents(aabb: AABB) {
    this.__max.copyComponents(aabb.__max);
    this.__min.copyComponents(aabb.__min);
    this.__centerPoint.copyComponents(aabb.__centerPoint);
    this.__lengthCenterToCorner = aabb.__lengthCenterToCorner;
    this.__isCenterPointDirty = aabb.__isCenterPointDirty;
    this.__isLengthCenterToCornerDirty = aabb.__isLengthCenterToCornerDirty;
    return this;
  }

  initialize() {
    this.__min.setComponents(
      Number.MAX_VALUE,
      Number.MAX_VALUE,
      Number.MAX_VALUE
    );
    this.__max.setComponents(
      -Number.MAX_VALUE,
      -Number.MAX_VALUE,
      -Number.MAX_VALUE
    );
    this.__centerPoint.zero();
    this.__lengthCenterToCorner = 0;
    this.__isCenterPointDirty = false;
    this.__isLengthCenterToCornerDirty = false;
  }

  set minPoint(val: Vector3) {
    this.__min.copyComponents(val);
    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;
  }

  get minPoint() {
    return this.__min as Vector3;
  }

  set maxPoint(val: Vector3) {
    this.__max.copyComponents(val);
    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;
  }

  get maxPoint() {
    return this.__max as Vector3;
  }

  isVanilla() {
    if (
      this.__min.x >= Number.MAX_VALUE &&
      this.__min.y >= Number.MAX_VALUE &&
      this.__min.z >= Number.MAX_VALUE &&
      this.__max.x <= -Number.MAX_VALUE &&
      this.__max.y <= -Number.MAX_VALUE &&
      this.__max.z <= -Number.MAX_VALUE
    ) {
      return true;
    } else {
      return false;
    }
  }

  addPosition(positionVector: Vector3) {
    this.__min.x =
      positionVector.x < this.__min.x ? positionVector.x : this.__min.x;
    this.__min.y =
      positionVector.y < this.__min.y ? positionVector.y : this.__min.y;
    this.__min.z =
      positionVector.z < this.__min.z ? positionVector.z : this.__min.z;

    this.__max.x =
      this.__max.x < positionVector.x ? positionVector.x : this.__max.x;
    this.__max.y =
      this.__max.y < positionVector.y ? positionVector.y : this.__max.y;
    this.__max.z =
      this.__max.z < positionVector.z ? positionVector.z : this.__max.z;

    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    return positionVector;
  }

  addPositionWithArray(array: number[], index: Index) {
    this.__min.x =
      array[index + 0] < this.__min.x ? array[index + 0] : this.__min.x;
    this.__min.y =
      array[index + 1] < this.__min.y ? array[index + 1] : this.__min.y;
    this.__min.z =
      array[index + 2] < this.__min.z ? array[index + 2] : this.__min.z;
    this.__max.x =
      this.__max.x < array[index + 0] ? array[index + 0] : this.__max.x;
    this.__max.y =
      this.__max.y < array[index + 1] ? array[index + 1] : this.__max.y;
    this.__max.z =
      this.__max.z < array[index + 2] ? array[index + 2] : this.__max.z;

    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    return array;
  }

  mergeAABB(aabb: AABB) {
    let isUpdated = false;

    if (aabb.isVanilla()) {
      return isUpdated;
    }

    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    if (this.isVanilla()) {
      this.__min.copyComponents(aabb.minPoint);
      this.__max.copyComponents(aabb.maxPoint);
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

    return isUpdated;
  }

  get centerPoint() {
    if (this.__isCenterPointDirty) {
      MutableVector3.addTo(this.__min, this.__max, this.__centerPoint).divide(
        2
      );
      this.__isCenterPointDirty = false;
    }
    return this.__centerPoint;
  }

  get lengthCenterToCorner() {
    if (this.__isLengthCenterToCornerDirty) {
      this.__lengthCenterToCorner = Vector3.lengthBtw(
        this.centerPoint,
        this.maxPoint
      );
      this.__isLengthCenterToCornerDirty = false;
    }
    return this.__lengthCenterToCorner;
  }

  get sizeX() {
    return this.__max.x - this.__min.x;
  }

  get sizeY() {
    return this.__max.y - this.__min.y;
  }

  get sizeZ() {
    return this.__max.z - this.__min.z;
  }

  static multiplyMatrix(matrix: Matrix44, aabb: AABB) {
    if (aabb.isVanilla()) {
      return aabb.clone();
    }
    const newAabb = new AABB();

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
      return outAabb.copyComponents(aabb);
    }
    outAabb.initialize();

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    return outAabb;
  }

  toString() {
    return (
      'AABB_min: ' +
      this.__min +
      '\n' +
      'AABB_max: ' +
      this.__max +
      '\n' +
      'centerPoint: ' +
      this.__centerPoint +
      '\n' +
      'lengthCenterToCorner: ' +
      this.__lengthCenterToCorner
    );
  }

  toStringApproximately() {
    return (
      'AABB_max: ' +
      this.__max.toStringApproximately() +
      '\n' +
      'AABB_min: ' +
      this.__min.toStringApproximately() +
      '\n' +
      'centerPoint: ' +
      this.__centerPoint.toStringApproximately() +
      '\n' +
      'lengthCenterToCorner: ' +
      MathUtil.financial(this.__lengthCenterToCorner)
    );
  }
}
