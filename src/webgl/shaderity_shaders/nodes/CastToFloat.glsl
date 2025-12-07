// bool to float - Scalar
void castToFloat(in bool value, out float outValue) {
  outValue = value ? 1.0 : 0.0;
}

// int to float - Scalar
void castToFloat(in int value, out float outValue) {
  outValue = float(value);
}

// uint to float - Scalar
void castToFloat(in uint value, out float outValue) {
  outValue = float(value);
}

// bool to float - Vector2
void castToFloat(in bvec2 value, out vec2 outValue) {
  outValue = vec2(value.x ? 1.0 : 0.0, value.y ? 1.0 : 0.0);
}

// int to float - Vector2
void castToFloat(in ivec2 value, out vec2 outValue) {
  outValue = vec2(value);
}

// uint to float - Vector2
void castToFloat(in uvec2 value, out vec2 outValue) {
  outValue = vec2(value);
}

// bool to float - Vector3
void castToFloat(in bvec3 value, out vec3 outValue) {
  outValue = vec3(value.x ? 1.0 : 0.0, value.y ? 1.0 : 0.0, value.z ? 1.0 : 0.0);
}

// int to float - Vector3
void castToFloat(in ivec3 value, out vec3 outValue) {
  outValue = vec3(value);
}

// uint to float - Vector3
void castToFloat(in uvec3 value, out vec3 outValue) {
  outValue = vec3(value);
}

// bool to float - Vector4
void castToFloat(in bvec4 value, out vec4 outValue) {
  outValue = vec4(value.x ? 1.0 : 0.0, value.y ? 1.0 : 0.0, value.z ? 1.0 : 0.0, value.w ? 1.0 : 0.0);
}

// int to float - Vector4
void castToFloat(in ivec4 value, out vec4 outValue) {
  outValue = vec4(value);
}

// uint to float - Vector4
void castToFloat(in uvec4 value, out vec4 outValue) {
  outValue = vec4(value);
}

