void _remap(in float value, in float sourceMin, in float sourceMax, in float targetMin, in float targetMax, out float outValue) {
  float t = (value - sourceMin) / (sourceMax - sourceMin);
  outValue = targetMin + t * (targetMax - targetMin);
}
void _remap(in vec2 value, in vec2 sourceMin, in vec2 sourceMax, in vec2 targetMin, in vec2 targetMax, out vec2 outValue) {
  vec2 t = (value - sourceMin) / (sourceMax - sourceMin);
  outValue = targetMin + t * (targetMax - targetMin);
}
void _remap(in vec3 value, in vec3 sourceMin, in vec3 sourceMax, in vec3 targetMin, in vec3 targetMax, out vec3 outValue) {
  vec3 t = (value - sourceMin) / (sourceMax - sourceMin);
  outValue = targetMin + t * (targetMax - targetMin);
}
void _remap(in vec4 value, in vec4 sourceMin, in vec4 sourceMax, in vec4 targetMin, in vec4 targetMax, out vec4 outValue) {
  vec4 t = (value - sourceMin) / (sourceMax - sourceMin);
  outValue = targetMin + t * (targetMax - targetMin);
}
