fn sdApplyTransform(position: vec3f, translation: vec3f, xyzEulerAngles: vec3f, scale: vec3f, outTransformedPosition: ptr<function, vec3f>) {
  let transform=createTransformMatrix(translation, xyzEulerAngles, scale);
  let inv=inverseTransform(transform);
  let tp=(inv*vec4f(position, 1.0)).xyz;
  *outTransformedPosition = tp;
}
