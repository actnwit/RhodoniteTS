void sdApplyWorldMatrix(in vec3 position, out vec3 outTransformedPosition) {
  mat4 transform = get_worldMatrix(uint(v_instanceIds.x));

  mat4 inv=inverseTransform(transform);
  vec3 tp=(inv*vec4(position,1.)).xyz;
  outTransformedPosition = tp;
}
