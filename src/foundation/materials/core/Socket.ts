import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { Matrix33 } from '../../math/Matrix33';
import { Matrix44 } from '../../math/Matrix44';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';

export type SocketDefaultValue = Vector4 | Vector3 | Vector2 | Scalar | Matrix44 | Matrix33 | boolean;

export class Socket<
  Name extends string,
  N extends CompositionTypeEnum,
  T extends ComponentTypeEnum,
  V extends SocketDefaultValue
> {
  constructor(
    public readonly name: Name,
    public readonly compositionType: N,
    public readonly componentType: T,
    public readonly defaultValue?: V
  ) {}
}
