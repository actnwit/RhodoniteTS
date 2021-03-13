import {CompositionType} from '../foundation/definitions/CompositionType';

export function fromTensorToCompositionType(vec: any) {
  switch (vec.className) {
    case 'Scalar' || 'MutableScalar':
      return CompositionType.Scalar;
    case 'Vector2' || 'MutableVector2':
      return CompositionType.Vec2;
    case 'Vector3' || 'MutableVector3':
      return CompositionType.Vec3;
    case 'Vector4' || 'MutableVector4' || 'Quaternion' || 'MutableQuaternion':
      return CompositionType.Vec4;
    case 'Matrix22' || 'MutableMatrix22':
      return CompositionType.Mat2;
    case 'Matrix33' || 'MutableMatrix33':
      return CompositionType.Mat3;
    case 'Matrix44' || 'MutableMatrix44':
      return CompositionType.Mat4;
    default:
      console.error('CompositionType.Unknown');
      return CompositionType.Unknown;
  }
}
