import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import type { CompositionTypeEnum } from '../../definitions/CompositionType';
import type { Matrix33 } from '../../math/Matrix33';
import type { Matrix44 } from '../../math/Matrix44';
import type { Scalar } from '../../math/Scalar';
import type { Vector2 } from '../../math/Vector2';
import type { Vector3 } from '../../math/Vector3';
import type { Vector4 } from '../../math/Vector4';

/**
 * Union type representing all possible default values that can be assigned to a Socket.
 * Includes mathematical types like vectors, scalars, and matrices.
 */
export type SocketDefaultValue = Vector4 | Vector3 | Vector2 | Scalar | Matrix44 | Matrix33;

/**
 * Represents a socket in the material system that defines an input/output connection point
 * for shader parameters. A socket has a name, composition type, component type, and optional default value.
 *
 * @template Name - The string literal type for the socket name
 * @template N - The composition type enum value (e.g., Scalar, Vec2, Vec3, etc.)
 * @template T - The component type enum value (e.g., Float, Int, Bool, etc.)
 * @template V - The default value type that extends SocketDefaultValue
 */
export class Socket<
  Name extends string,
  N extends CompositionTypeEnum,
  T extends ComponentTypeEnum,
  V extends SocketDefaultValue,
> {
  /**
   * Creates a new Socket instance with the specified name, types, and optional default value.
   *
   * @param name - The unique identifier name for this socket
   * @param compositionType - The composition type that defines the structure (scalar, vector, matrix)
   * @param componentType - The component type that defines the data type (float, int, bool, etc.)
   * @param defaultValue - Optional default value for the socket when no input is connected
   */
  constructor(
    public readonly name: Name,
    public readonly compositionType: N,
    public readonly componentType: T,
    public readonly defaultValue?: V
  ) {}
}
