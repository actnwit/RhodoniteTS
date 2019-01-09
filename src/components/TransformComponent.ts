import Vector2 from '../math/Vector2';
import Vector3 from '../math/Vector3';
import Vector4 from '../math/Vector4';
import Quaternion from '../math/Quaternion';
import Matrix33 from '../math/Matrix33';
import Matrix44 from '../math/Matrix44';
import MathClassUtil from '../math/MathClassUtil';
import is from '../misc/IsUtil';
import Component from '../core/Component';
import ComponentRepository from '../core/ComponentRepository';
import MemoryManager from '../core/MemoryManager';
import BufferView from '../memory/BufferView';
import Accessor from '../memory/Accessor';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { CompositionTypeEnum, ComponentTypeEnum } from '../main';
import { BufferUse, BufferUseEnum } from '../definitions/BufferUse';

// import AnimationComponent from './AnimationComponent';

export default class TransformComponent extends Component {
  private _translate: Vector3 = Vector3.dummy();
  private _rotate: Vector3 = Vector3.dummy();
  private _scale: Vector3 = Vector3.dummy();
  private _quaternion: Quaternion = Quaternion.dummy();
  private _matrix: Matrix44 = Matrix44.dummy();
  private _invMatrix: Matrix44 = Matrix44.dummy();
  private _normalMatrix: Matrix33 = Matrix33.dummy();

  private _is_translate_updated: boolean;
  private _is_euler_angles_updated: boolean;
  private _is_scale_updated: boolean;
  private _is_quaternion_updated: boolean;
  private _is_trs_matrix_updated: boolean;
  private _is_inverse_trs_matrix_updated: boolean;
  private _is_normal_trs_matrix_updated: boolean;

  private static __tmpMat_updateRotation: Matrix44 = Matrix44.identity();
  private static __tmpMat_quaternionInner: Matrix44 = Matrix44.identity();

  private __toUpdateAllTransform = true;

  _updateCount: number = Math.floor( Math.random() * 10000000001 );
  _dirty: boolean;

  // dependencies
  private _dependentAnimationComponentId: number = 0;

  constructor(entityUid: EntityUID, componentSid: ComponentSID) {
    super(entityUid, componentSid);

    const thisClass = TransformComponent;

    this.registerMember(BufferUse.CPUGeneric, 'translate', Vector3, CompositionType.Vec3, ComponentType.Float);
    this.registerMember(BufferUse.CPUGeneric, 'rotate', Vector3, CompositionType.Vec3, ComponentType.Float);
    this.registerMember(BufferUse.CPUGeneric, 'scale', Vector3, CompositionType.Vec3, ComponentType.Float);
    this.registerMember(BufferUse.CPUGeneric, 'quaternion', Quaternion, CompositionType.Vec4, ComponentType.Float);
    this.registerMember(BufferUse.CPUGeneric, 'matrix', Matrix44, CompositionType.Mat4, ComponentType.Float);
    this.registerMember(BufferUse.CPUGeneric, 'invMatrix', Matrix44, CompositionType.Mat4, ComponentType.Float);
    this.registerMember(BufferUse.CPUGeneric, 'normalMatrix', Matrix33, CompositionType.Mat3, ComponentType.Float);

    this.submitToAllocation();

    this._quaternion.identity();
    this._matrix.identity();
    this._translate.zero();
    this._rotate.zero();
    this._scale.one();

    this._invMatrix.identity();
    this._normalMatrix.identity();

    this._is_translate_updated = true;
    this._is_euler_angles_updated = true;
    this._is_scale_updated = true;
    this._is_quaternion_updated = true;
    this._is_trs_matrix_updated = true;
    this._is_inverse_trs_matrix_updated = true;
    this._is_normal_trs_matrix_updated = true;

    this._updateCount = 0;
    this._dirty = true;
  }

  static get renderedPropertyCount() {
    return null
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.TransformComponentTID;
  }

  //$create() {
    // Define process dependencies with other components.
    // If circular depenencies are detected, the error will be repoated.

    //this.registerDependency(AnimationComponent.componentTID, false);

  //}

  set toUpdateAllTransform(flag: boolean) {
    this.__toUpdateAllTransform = flag;
  }

  get toUpdateAllTransform(): boolean {
    return this.__toUpdateAllTransform;
  }

  _needUpdate() {
    this._updateCount++;
    this._dirty = true;
  }

  set translate(vec: Vector3) {
    this._translate.v[0] = vec.v[0];
    this._translate.v[1] = vec.v[1];
    this._translate.v[2] = vec.v[2];
    this._is_translate_updated = true;
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  get translate() {
    return this.translateInner.clone();
  }

  get translateInner() {
    if (this._is_translate_updated) {
      return this._translate;
    } else if (this._is_trs_matrix_updated) {
      this._translate.x = this._matrix.m03;
      this._translate.y = this._matrix.m13;
      this._translate.z = this._matrix.m23;
      this._is_translate_updated = true;
    }
    return this._translate;
  }

  set rotate(vec: Vector3) {

    this._rotate.v[0] = vec.v[0];
    this._rotate.v[1] = vec.v[1];
    this._rotate.v[2] = vec.v[2];
    this._is_euler_angles_updated = true;
    this._is_quaternion_updated = false;
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  get rotate() {
    return this.rotateInner.clone();
  }

  get rotateInner() {
    if (this._is_euler_angles_updated) {
      return this._rotate;
    } else if (this._is_trs_matrix_updated) {
      this._rotate = this._matrix.toEulerAngles();
    } else if (this._is_quaternion_updated) {
      this._rotate = (new Matrix44(this._quaternion)).toEulerAngles();
    }

    this._is_euler_angles_updated = true;
    return this._rotate;
  }

  set scale(vec: Vector3) {
    this._scale.v[0] = vec.v[0];
    this._scale.v[1] = vec.v[1];
    this._scale.v[2] = vec.v[2];
    this._is_scale_updated = true;
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  get scale() {
    return this.scaleInner.clone();
  }

  get scaleInner() {
    if (this._is_scale_updated) {
      return this._scale;
    } else if (this._is_trs_matrix_updated) {
      let m = this._matrix;
      this._scale.x = Math.sqrt(m.m00*m.m00 + m.m01*m.m01 + m.m02*m.m02);
      this._scale.y = Math.sqrt(m.m10*m.m10 + m.m11*m.m11 + m.m12*m.m12);
      this._scale.z = Math.sqrt(m.m20*m.m20 + m.m21*m.m21 + m.m22*m.m22);
      this._is_scale_updated = true;
    }
    
    return this._scale;
  }

  set quaternion(quat: Quaternion) {
    this._quaternion.v[0] = quat.v[0];
    this._quaternion.v[1] = quat.v[1];
    this._quaternion.v[2] = quat.v[2];
    this._is_quaternion_updated = true;
    this._is_euler_angles_updated = false;
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();
  }

  get quaternion() {
    return this.quaternionInner.clone();
  }

  get quaternionInner(): Quaternion {
    if (this._is_quaternion_updated) {
      return this._quaternion;
    } else if (!this._is_quaternion_updated) {
      if (this._is_trs_matrix_updated) {
        this._is_quaternion_updated = true;
        this._quaternion.fromMatrix(this._matrix);
        return this._quaternion;
      } else if (this._is_euler_angles_updated) {
        TransformComponent.__tmpMat_quaternionInner.rotateXYZ(this._rotate.x, this._rotate.y, this._rotate.z);
        this._is_quaternion_updated = true;
        this._quaternion.fromMatrix(TransformComponent.__tmpMat_quaternionInner);
        return this._quaternion;
      }
    }
    return this._quaternion;
  }

  set matrix(mat: Matrix44) {
    this._matrix = mat.clone();
    this._is_trs_matrix_updated = true;
    this._is_translate_updated = false;
    this._is_euler_angles_updated = false;
    this._is_quaternion_updated = false;
    this._is_scale_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    this.__updateTransform();

  }

  get matrix() {
    return this.matrixInner.clone();
  }

  get matrixInner() {

    if (this._is_trs_matrix_updated) {
      return this._matrix;
    }

    // Clear and set Scale
    const scale = this.scaleInner;
    const n00 = scale.v[0];
    // const n01 = 0;
    // const n02 = 0;
    // const n03 = 0;
    // const n10 = 0;
    const n11 = scale.v[1];
    // const n12 = 0;
    // const n13 = 0;
    // const n20 = 0;
    // const n21 = 0;
    const n22 = scale.v[2];
    // const n23 = 0;
    // const n30 = 0;
    // const n31 = 0;
    // const n32 = 0;
    // const n33 = 1;

    const q = this.quaternionInner;
    const sx = q.v[0] * q.v[0];
    const sy = q.v[1] * q.v[1];
    const sz = q.v[2] * q.v[2];
    const cx = q.v[1] * q.v[2];
    const cy = q.v[0] * q.v[2];
    const cz = q.v[0] * q.v[1];
    const wx = q.v[3] * q.v[0];
    const wy = q.v[3] * q.v[1];
    const wz = q.v[3] * q.v[2];

    const m00 = 1.0 - 2.0 * (sy + sz);
    const m01 = 2.0 * (cz - wz);
    const m02 = 2.0 * (cy + wy);
    // const m03 = 0.0;
    const m10 = 2.0 * (cz + wz);
    const m11 = 1.0 - 2.0 * (sx + sz);
    const m12 = 2.0 * (cx - wx);
    // const m13 = 0.0;
    const m20 = 2.0 * (cy - wy);
    const m21 = 2.0 * (cx + wx);
    const m22 = 1.0 - 2.0 * (sx + sy);

    // const m23 = 0.0;
    // const m30 = 0.0;
    // const m31 = 0.0;
    // const m32 = 0.0;
    // const m33 = 1.0;

    const translate = this.translateInner;

    // TranslateMatrix * RotateMatrix * ScaleMatrix
    this._matrix.m00 = m00*n00;
    this._matrix.m01 = m01*n11;
    this._matrix.m02 = m02*n22;
    this._matrix.m03 = translate.v[0];

    this._matrix.m10 = m10*n00;
    this._matrix.m11 = m11*n11;
    this._matrix.m12 = m12*n22;
    this._matrix.m13 = translate.v[1];

    this._matrix.m20 = m20*n00;
    this._matrix.m21 = m21*n11;
    this._matrix.m22 = m22*n22;
    this._matrix.m23 = translate.v[2];

    this._matrix.m30 = 0;
    this._matrix.m31 = 0;
    this._matrix.m32 = 0;
    this._matrix.m33 = 1;

    this._is_trs_matrix_updated = true;

    return this._matrix;
  }

  get inverseMatrix() {
    return this.inverseMatrixInner.clone();
  }

  get inverseMatrixInner() {
    if (!this._is_inverse_trs_matrix_updated) {
      this._invMatrix = this.matrix.invert();
      this._is_inverse_trs_matrix_updated = true;
    }
    return this._invMatrix;
  }

  get normalMatrix() {
    return this.normalMatrixInner.clone(); 
  }

  get normalMatrixInner() {
    if (!this._is_normal_trs_matrix_updated) {
      this._normalMatrix = new Matrix33(Matrix44.invert(this.matrix).transpose());
      this._is_normal_trs_matrix_updated = true;
    }
    return this._normalMatrix; 
  }
  

  /**
   * Set multiple transform information at once. By using this method,
   * we reduce the cost of automatically updating other transform components inside this class.
   * This method may be useful for animation processing and so on.
   * 
   * The transform components of these arguments must not be mutually discrepant.
   * for example. The transform components of matrix argument (translate, rotate/quaternion, scale)
   * must be equal to translate, rotate, scale, quaternion arguments.
   * And both rotate and quaternion arguments must be same rotation.
   * If there is an argument passed with null or undefined, it is interpreted as unchanged.
   * 
   * @param {*} translate 
   * @param {*} rotate 
   * @param {*} scale 
   * @param {*} quaternion 
   * @param {*} matrix 
   */
  
  setTransform(translate: Vector3, rotate: Vector3, scale: Vector3, quaternion: Quaternion, matrix: Matrix44) {
    this._is_trs_matrix_updated = false;
    this._is_inverse_trs_matrix_updated = false;
    this._is_normal_trs_matrix_updated = false;

    // Matrix
    if (matrix != null) {
      this._matrix = matrix.clone();
      this._is_trs_matrix_updated = true;
      this._is_translate_updated = false;
      this._is_euler_angles_updated = false;
      this._is_quaternion_updated = false;
      this._is_scale_updated = false;
    }

    // Translate
    if (translate != null) {
      this._translate = translate.clone();
      this._is_translate_updated = true;
    }

    // Roatation
    if (rotate != null && quaternion != null) {
      this._rotate = rotate.clone();
      this._quaternion = quaternion.clone();
      this._is_euler_angles_updated = true;
      this._is_quaternion_updated = true;
    } else if (rotate != null) {
      this._rotate = rotate.clone();
      this._is_euler_angles_updated = true;
      this._is_quaternion_updated = false;
     } else if (quaternion != null) {
      this._quaternion = quaternion.clone();
      this._is_euler_angles_updated = false;
      this._is_quaternion_updated = true;
    }
    
    // Scale
    if (scale != null) {
      this._scale = scale.clone();
      this._is_scale_updated = true;
    }

    this.__updateTransform();
  }

  __updateTransform() {
    if (this.__toUpdateAllTransform) {
      this.__updateRotation();
      this.__updateTranslate();
      this.__updateScale();
    }

    //this.__updateMatrix();
    this._needUpdate();
  }

  __updateRotation() {
    if (this._is_euler_angles_updated && !this._is_quaternion_updated) {
      TransformComponent.__tmpMat_updateRotation.rotateXYZ(this._rotate.x, this._rotate.y, this._rotate.z);
      this._quaternion.fromMatrix(TransformComponent.__tmpMat_updateRotation);
      this._is_quaternion_updated = true;
    } else if (!this._is_euler_angles_updated && this._is_quaternion_updated) {
      this._rotate = (new Matrix44(this._quaternion)).toEulerAngles();
      this._is_euler_angles_updated = true;
    } else if (!this._is_euler_angles_updated && !this._is_quaternion_updated && this._is_trs_matrix_updated) {
      const m = this._matrix;
      this._quaternion.fromMatrix(m);
      this._is_quaternion_updated = true;
      this._rotate = m.toEulerAngles();
      this._is_euler_angles_updated = true;
    }
  }

  __updateTranslate() {
    if (!this._is_translate_updated && this._is_trs_matrix_updated) {
      const m = this._matrix;
      this._translate.x = m.m03;
      this._translate.y = m.m13;
      this._translate.z = m.m23;
      this._is_translate_updated = true;
    }
  }

  __updateScale() {
    if (!this._is_scale_updated && this._is_trs_matrix_updated) {
      const m = this._matrix;
      this._scale.x = Math.sqrt(m.m00*m.m00 + m.m01*m.m01 + m.m02*m.m02);
      this._scale.y = Math.sqrt(m.m10*m.m10 + m.m11*m.m11 + m.m12*m.m12);
      this._scale.z = Math.sqrt(m.m20*m.m20 + m.m21*m.m21 + m.m22*m.m22);
      this._is_scale_updated = true;
    }
  }

  __updateMatrix() {
    if (!this._is_trs_matrix_updated && this._is_translate_updated && this._is_quaternion_updated && this._is_scale_updated) {
      const rotationMatrix = new Matrix44(this._quaternion);
  
      let scale = this._scale;
  
      this._matrix = Matrix44.multiply(rotationMatrix, Matrix44.scale(scale));
      let translateVec = this._translate;
      this._matrix.m03 = translateVec.x;
      this._matrix.m13 = translateVec.y;
      this._matrix.m23 = translateVec.z;
  
      this._is_trs_matrix_updated = true;
    }
  }
  

  setPropertiesFromJson(arg: JSON) {
    let json = arg;
    if (typeof arg === "string") {
      json = JSON.parse(arg);
    }
    for(let key in json) {
      if(json.hasOwnProperty(key) && key in this) {
        if (key === "quaternion") {
          this[key] = new Quaternion((json as any)[key] as Array<number>);
        } else if (key === 'matrix') {
          this[key] = new Matrix44((json as any)[key] as Array<number>);
        } else {
          (this as any)[key] = new Vector3((json as any)[key] as Array<number>);
        }
      }
    }
  }

  setRotationFromNewUpAndFront(UpVec: Vector3, FrontVec: Vector3) {
    let yDir = UpVec;
    let xDir = Vector3.cross(yDir, FrontVec);
    let zDir = Vector3.cross(xDir, yDir);
    
    let rotateMatrix = Matrix44.identity();

    rotateMatrix.m00 = xDir.x;
    rotateMatrix.m10 = xDir.y;
    rotateMatrix.m20 = xDir.z;
  
    rotateMatrix.m01 = yDir.x;
    rotateMatrix.m11 = yDir.y;
    rotateMatrix.m21 = yDir.z;
  
    rotateMatrix.m02 = zDir.x;
    rotateMatrix.m12 = zDir.y;
    rotateMatrix.m22 = zDir.z;
  
    this.rotateMatrix44 = rotateMatrix;
  }

  headToDirection(fromVec: Vector3, toVec: Vector3) {
    const fromDir = Vector3.normalize(fromVec);
    const toDir = Vector3.normalize(toVec);
    const rotationDir = Vector3.cross(fromDir, toDir);
    const cosTheta = Vector3.dotProduct(fromDir, toDir);
    let theta = Math.acos(cosTheta);
    this.quaternion = Quaternion.axisAngle(rotationDir, theta);
  }

  set rotateMatrix44(rotateMatrix: Matrix44) {
    this.quaternion.fromMatrix(rotateMatrix);
  }

  get rotateMatrix44() {
    return new Matrix44(this.quaternion);
  }
}

ComponentRepository.registerComponentClass(TransformComponent.componentTID, TransformComponent);