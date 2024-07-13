void _smoothstep(in float value, in float edge0, in float edge1, out float outValue) {
  outValue = smoothstep(edge0, edge1, value);
}
void _smoothstep(in vec2 value, in vec2 edge0, in vec2 edge1, out vec2 outValue) {
  outValue = smoothstep(edge0, edge1, value);
}
void _smoothstep(in vec3 value, in vec3 edge0, in vec3 edge1, out vec3 outValue) {
  outValue = smoothstep(edge0, edge1, value);
}
void _smoothstep(in vec4 value, in vec4 edge0, in vec4 edge1, out vec4 outValue) {
  outValue = smoothstep(edge0, edge1, value);
}
