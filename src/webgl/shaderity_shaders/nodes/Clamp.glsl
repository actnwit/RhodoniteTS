void _clamp(in float value, in float minVal, in float maxVal, out float outValue) {
  outValue = clamp(value, minVal, maxVal);
}
void _clamp(in vec2 value, in vec2 minVal, in vec2 maxVal, out vec2 outValue) {
  outValue = clamp(value, minVal, maxVal);
}
void _clamp(in vec3 value, in vec3 minVal, in vec3 maxVal, out vec3 outValue) {
  outValue = clamp(value, minVal, maxVal);
}
void _clamp(in vec4 value, in vec4 minVal, in vec4 maxVal, out vec4 outValue) {
  outValue = clamp(value, minVal, maxVal);
}
