//import GLBoost from '../../globals';
import Vector2 from './Vector2';
import ImmutableVector3 from './ImmutableVector3';
import Vector4 from './ImmutableVector4';
import ImmutableQuaternion from './ImmutableQuaternion';
import ImmutableMatrix33 from './ImmutableMatrix33';
import ImmutableMatrix44 from './ImmutableMatrix44';

export default class MathClassUtil {
  constructor() {

  }


  static arrayToVector(element:Array<number>) {
    if (Array.isArray(element)) {
      if(typeof(element[3]) !== 'undefined') {
        return new Vector4(element[0], element[1], element[2], element[3]);
      } else if (typeof(element[2]) !== 'undefined') {
        return new ImmutableVector3(element[0], element[1], element[2]);
      } else {
        return new Vector2(element[0], element[1]);
      }
    } else {
      return element;
    }
  }

  static arrayToVectorOrMatrix(element:Array<number>) {
    if (Array.isArray(element)) {
      if(typeof(element[15]) !== 'undefined') {
        return new ImmutableMatrix44(element);
      } else if(typeof(element[8]) !== 'undefined') {
        return new ImmutableMatrix33(element);
      } else if(typeof(element[3]) !== 'undefined') {
        return new Vector4(element[0], element[1], element[2], element[3]);
      } else if (typeof(element[2]) !== 'undefined') {
        return new ImmutableVector3(element[0], element[1], element[2]);
      } else {
        return new Vector2(element[0], element[1]);
      }
    } else {
      return element;
    }
  }

  static cloneOfMathObjects(element:any) {
    if(element instanceof ImmutableMatrix44) {
      return element.clone();
    } else if (element instanceof ImmutableMatrix33) {
      return element.clone();
    } else if (element instanceof Vector4) {
      return element.clone();
    } else if (element instanceof ImmutableVector3) {
      return element.clone();
    } else if (element instanceof Vector2) {
      return element.clone();
    } else {
      return element;
    }

  }

  static isAcceptableArrayForQuaternion(element: Array<number>) {
    if (Array.isArray(element)) {
      if(typeof(element[3]) !== 'undefined') {
        return true;
      }
    }
    return false;
  }

  static arrayToQuaternion(element:Array<number>) {
    return new ImmutableQuaternion(element[0], element[1], element[2], element[3]);
  }

  static makeSubArray(array:Array<any>, componentN:number) {
    if (componentN === 4) {
      return [array[0], array[1], array[2], array[3]];
    } else if (componentN === 3) {
      return [array[0], array[1], array[2]];
    } else if (componentN === 2) {
      return [array[0], array[1]];
    } else {
      return array[0];
    }
  }

  static vectorToArray(element:Vector2|ImmutableVector3|Vector4|ImmutableQuaternion) {
    if(element instanceof Vector2) {
      return [element.x, element.y];
    } else if (element instanceof ImmutableVector3) {
      return [element.x, element.y, element.z];
    } else if (element instanceof Vector4 || element instanceof ImmutableQuaternion) {
      return [element.x, element.y, element.z, element.w];
    } else {
      return element;
    }
  }

  /**
   * discriminate which Vector instance 
   * @param element any Vector instance  
   * @return number of Vector instance
   */
  static compomentNumberOfVector(element: Vector2 | ImmutableVector3 |  Vector4 | ImmutableQuaternion | Array<any>): number {
    if(element instanceof Vector2) {
      return 2;
    } else if (element instanceof ImmutableVector3) {
      return 3;
    } else if (element instanceof Vector4 || element instanceof ImmutableQuaternion) {
      return 4;
    } else if (Array.isArray(element)) {
      return element.length;
    } else {
      return 0;
    }
  }

  // values range must be [-1, 1]
  static packNormalizedVec4ToVec2(x:number, y:number, z:number, w:number, criteria:number) {
    let v0 = 0.0;
    let v1 = 0.0;
    
    x = (x + 1)/2.0;
    y = (y + 1)/2.0;
    z = (z + 1)/2.0;
    w = (w + 1)/2.0;

    let ir = Math.floor(x*(criteria-1.0));
    let ig = Math.floor(y*(criteria-1.0));
    let irg = ir*criteria + ig;
    v0 = irg / criteria; 

    let ib =  Math.floor(z*(criteria-1.0));
    let ia =  Math.floor(w*(criteria-1.0));
    let iba = ib*criteria + ia;
    v1 =iba / criteria; 
    
    return [v0, v1];
  }

  static unProject(windowPosVec3:ImmutableVector3, inversePVMat44:ImmutableMatrix44, viewportVec4:Vector4, zNear:number, zFar:number) {
    const input = new Vector4(
      (windowPosVec3.x - viewportVec4.x) / viewportVec4.z * 2 - 1.0,
      (windowPosVec3.y - viewportVec4.y) / viewportVec4.w * 2 - 1.0,
//      (windowPosVec3.z - zNear) / (zFar - zNear),
      2 * windowPosVec3.z - 1.0,
      1.0
    );

    const PVMat44 = inversePVMat44;//Matrix44.transpose(inversePVMat44);

    const out = PVMat44.multiplyVector(input);
//    const a = input.x * PVMat44.m03 + input.y * PVMat44.m13 + input.z * PVMat44.m23 + PVMat44.m33;
//    const a = input.x * PVMat44.m30 + input.y * PVMat44.m31 + input.z * PVMat44.m32 + PVMat44.m33;

    if (out.w === 0) {
      console.warn("Zero division!");
    }

    const output = new ImmutableVector3(out.multiply(1/out.w));

    return output;
  }
}

//GLBoost["MathClassUtil"] = MathClassUtil;
