fn sdApplyWorldMatrix(position: vec3f, outTransformedPosition: ptr<function, vec3f>) {
  let transform = get_worldMatrix(u32(a_instanceIds.x));
  let inv=inverseTransform(transform);
  let tp=(inv*vec4f(position, 1.0)).xyz;
  *outTransformedPosition = tp;
}
