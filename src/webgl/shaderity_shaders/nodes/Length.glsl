void _length(in vec2 value, out float outValue) {
  outValue = length(value);
}
void _length(in vec3 value, out float outValue) {
  outValue = length(value);
}
void _length(in vec4 value, out float outValue) {
  outValue = length(value);
}
void _length(in uvec2 value, out float outValue) {
  outValue = length(vec2(value));
}
void _length(in uvec3 value, out float outValue) {
  outValue = length(vec3(value));
}
void _length(in uvec4 value, out float outValue) {
  outValue = length(vec4(value));
}

