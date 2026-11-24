// src/types/TypeConverter.ts
import { CompositionType } from "../foundation/definitions/CompositionType.js";
import { Logger } from "../foundation/misc/Logger.js";
function fromTensorToCompositionType(vec) {
  switch (vec.className) {
    case "Scalar":
    case "MutableScalar":
      return CompositionType.Scalar;
    case "Vector2":
    case "MutableVector2":
      return CompositionType.Vec2;
    case "Vector3":
    case "MutableVector3":
      return CompositionType.Vec3;
    case "Vector4":
    case "MutableVector4":
    case "Quaternion":
    case "MutableQuaternion":
      return CompositionType.Vec4;
    case "Matrix22":
    case "MutableMatrix22":
      return CompositionType.Mat2;
    case "Matrix33":
    case "MutableMatrix33":
      return CompositionType.Mat3;
    case "Matrix44":
    case "MutableMatrix44":
      return CompositionType.Mat4;
    default:
      Logger.default.error("CompositionType.Unknown");
      return CompositionType.Unknown;
  }
}
export {
  fromTensorToCompositionType
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3R5cGVzL1R5cGVDb252ZXJ0ZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9Mb2dnZXInO1xuXG5leHBvcnQgZnVuY3Rpb24gZnJvbVRlbnNvclRvQ29tcG9zaXRpb25UeXBlKHZlYzogYW55KSB7XG4gIHN3aXRjaCAodmVjLmNsYXNzTmFtZSkge1xuICAgIGNhc2UgJ1NjYWxhcic6XG4gICAgY2FzZSAnTXV0YWJsZVNjYWxhcic6XG4gICAgICByZXR1cm4gQ29tcG9zaXRpb25UeXBlLlNjYWxhcjtcbiAgICBjYXNlICdWZWN0b3IyJzpcbiAgICBjYXNlICdNdXRhYmxlVmVjdG9yMic6XG4gICAgICByZXR1cm4gQ29tcG9zaXRpb25UeXBlLlZlYzI7XG4gICAgY2FzZSAnVmVjdG9yMyc6XG4gICAgY2FzZSAnTXV0YWJsZVZlY3RvcjMnOlxuICAgICAgcmV0dXJuIENvbXBvc2l0aW9uVHlwZS5WZWMzO1xuICAgIGNhc2UgJ1ZlY3RvcjQnOlxuICAgIGNhc2UgJ011dGFibGVWZWN0b3I0JzpcbiAgICBjYXNlICdRdWF0ZXJuaW9uJzpcbiAgICBjYXNlICdNdXRhYmxlUXVhdGVybmlvbic6XG4gICAgICByZXR1cm4gQ29tcG9zaXRpb25UeXBlLlZlYzQ7XG4gICAgY2FzZSAnTWF0cml4MjInOlxuICAgIGNhc2UgJ011dGFibGVNYXRyaXgyMic6XG4gICAgICByZXR1cm4gQ29tcG9zaXRpb25UeXBlLk1hdDI7XG4gICAgY2FzZSAnTWF0cml4MzMnOlxuICAgIGNhc2UgJ011dGFibGVNYXRyaXgzMyc6XG4gICAgICByZXR1cm4gQ29tcG9zaXRpb25UeXBlLk1hdDM7XG4gICAgY2FzZSAnTWF0cml4NDQnOlxuICAgIGNhc2UgJ011dGFibGVNYXRyaXg0NCc6XG4gICAgICByZXR1cm4gQ29tcG9zaXRpb25UeXBlLk1hdDQ7XG4gICAgZGVmYXVsdDpcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdDb21wb3NpdGlvblR5cGUuVW5rbm93bicpO1xuICAgICAgcmV0dXJuIENvbXBvc2l0aW9uVHlwZS5Vbmtub3duO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxjQUFjO0FBRWhCLFNBQVMsNEJBQTRCLEtBQVU7QUFDcEQsVUFBUSxJQUFJLFdBQVc7QUFBQSxJQUNyQixLQUFLO0FBQUEsSUFDTCxLQUFLO0FBQ0gsYUFBTyxnQkFBZ0I7QUFBQSxJQUN6QixLQUFLO0FBQUEsSUFDTCxLQUFLO0FBQ0gsYUFBTyxnQkFBZ0I7QUFBQSxJQUN6QixLQUFLO0FBQUEsSUFDTCxLQUFLO0FBQ0gsYUFBTyxnQkFBZ0I7QUFBQSxJQUN6QixLQUFLO0FBQUEsSUFDTCxLQUFLO0FBQUEsSUFDTCxLQUFLO0FBQUEsSUFDTCxLQUFLO0FBQ0gsYUFBTyxnQkFBZ0I7QUFBQSxJQUN6QixLQUFLO0FBQUEsSUFDTCxLQUFLO0FBQ0gsYUFBTyxnQkFBZ0I7QUFBQSxJQUN6QixLQUFLO0FBQUEsSUFDTCxLQUFLO0FBQ0gsYUFBTyxnQkFBZ0I7QUFBQSxJQUN6QixLQUFLO0FBQUEsSUFDTCxLQUFLO0FBQ0gsYUFBTyxnQkFBZ0I7QUFBQSxJQUN6QjtBQUNFLGFBQU8sUUFBUSxNQUFNLHlCQUF5QjtBQUM5QyxhQUFPLGdCQUFnQjtBQUFBLEVBQzNCO0FBQ0Y7IiwKICAibmFtZXMiOiBbXQp9Cg==
