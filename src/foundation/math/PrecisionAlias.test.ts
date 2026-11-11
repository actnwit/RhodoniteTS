import { LogQuaternion, LogQuaternionD, LogQuaternionF } from './LogQuaternion';
import { Matrix22, Matrix22D, Matrix22F } from './Matrix22';
import { Matrix33, Matrix33D, Matrix33F } from './Matrix33';
import { Matrix44, Matrix44D, Matrix44F } from './Matrix44';
import { MutableMatrix22, MutableMatrix22D, MutableMatrix22F } from './MutableMatrix22';
import { MutableMatrix33, MutableMatrix33D, MutableMatrix33F } from './MutableMatrix33';
import { MutableMatrix44, MutableMatrix44D, MutableMatrix44F } from './MutableMatrix44';
import { MutableQuaternion, MutableQuaternionD, MutableQuaternionF } from './MutableQuaternion';
import { MutableScalar, MutableScalarD, MutableScalarF } from './MutableScalar';
import { MutableVector2, MutableVector2D, MutableVector2F } from './MutableVector2';
import { MutableVector3, MutableVector3D, MutableVector3F } from './MutableVector3';
import { MutableVector4, MutableVector4D, MutableVector4F } from './MutableVector4';
import { Quaternion, QuaternionD, QuaternionF } from './Quaternion';
import { Scalar, ScalarD, ScalarF } from './Scalar';
import { Vector2, Vector2D, Vector2F } from './Vector2';
import { Vector3, Vector3D, Vector3F } from './Vector3';
import { Vector4, Vector4D, Vector4F } from './Vector4';

describe('precision aliases', () => {
  it('exposes F aliases for the 32-bit classes', () => {
    expect(Matrix22F).toBe(Matrix22);
    expect(Matrix33F).toBe(Matrix33);
    expect(Matrix44F).toBe(Matrix44);
    expect(MutableMatrix22F).toBe(MutableMatrix22);
    expect(MutableMatrix33F).toBe(MutableMatrix33);
    expect(MutableMatrix44F).toBe(MutableMatrix44);
    expect(QuaternionF).toBe(Quaternion);
    expect(MutableQuaternionF).toBe(MutableQuaternion);
    expect(LogQuaternionF).toBe(LogQuaternion);
    expect(Vector2F).toBe(Vector2);
    expect(Vector3F).toBe(Vector3);
    expect(Vector4F).toBe(Vector4);
    expect(MutableVector2F).toBe(MutableVector2);
    expect(MutableVector3F).toBe(MutableVector3);
    expect(MutableVector4F).toBe(MutableVector4);
    expect(ScalarF).toBe(Scalar);
    expect(MutableScalarF).toBe(MutableScalar);
  });

  it('exposes D classes backed by Float64Array', () => {
    expect(Matrix22D.identity()._v).toBeInstanceOf(Float64Array);
    expect(Matrix33D.identity()._v).toBeInstanceOf(Float64Array);
    expect(Matrix44D.identity()._v).toBeInstanceOf(Float64Array);
    expect(MutableMatrix22D.identity()._v).toBeInstanceOf(Float64Array);
    expect(MutableMatrix33D.identity()._v).toBeInstanceOf(Float64Array);
    expect(MutableMatrix44D.identity()._v).toBeInstanceOf(Float64Array);
    expect(QuaternionD.identity()._v).toBeInstanceOf(Float64Array);
    expect(MutableQuaternionD.identity()._v).toBeInstanceOf(Float64Array);
    expect(LogQuaternionD.fromCopy3(1, 2, 3)._v).toBeInstanceOf(Float64Array);
    expect(Vector2D.zero()._v).toBeInstanceOf(Float64Array);
    expect(Vector3D.zero()._v).toBeInstanceOf(Float64Array);
    expect(Vector4D.zero()._v).toBeInstanceOf(Float64Array);
    expect(MutableVector2D.zero()._v).toBeInstanceOf(Float64Array);
    expect(MutableVector3D.zero()._v).toBeInstanceOf(Float64Array);
    expect(MutableVector4D.zero()._v).toBeInstanceOf(Float64Array);
    expect(ScalarD.zero()._v).toBeInstanceOf(Float64Array);
    expect(MutableScalarD.zero()._v).toBeInstanceOf(Float64Array);
  });

  it('allows using the F alias to create matrices', () => {
    const mat = Matrix44F.fromCopy16RowMajor(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    expect(mat._v).toBeInstanceOf(Float32Array);
    expect(mat.isEqual(Matrix44.identity())).toBe(true);
  });
});
