import { CompositionType } from '../foundation/definitions/CompositionType';
import { Logger } from '../foundation/misc/Logger';

export function fromTensorToCompositionType(vec: any) {
  switch (vec.className) {
    case 'Scalar':
    case 'MutableScalar':
      return CompositionType.Scalar;
    case 'Vector2':
    case 'MutableVector2':
      return CompositionType.Vec2;
    case 'Vector3':
    case 'MutableVector3':
      return CompositionType.Vec3;
    case 'Vector4':
    case 'MutableVector4':
    case 'Quaternion':
    case 'MutableQuaternion':
      return CompositionType.Vec4;
    case 'Matrix22':
    case 'MutableMatrix22':
      return CompositionType.Mat2;
    case 'Matrix33':
    case 'MutableMatrix33':
      return CompositionType.Mat3;
    case 'Matrix44':
    case 'MutableMatrix44':
      return CompositionType.Mat4;
    default:
      Logger.error('CompositionType.Unknown');
      return CompositionType.Unknown;
  }
}
