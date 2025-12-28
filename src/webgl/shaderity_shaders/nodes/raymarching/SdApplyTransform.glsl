void sdApplyTransform(in vec3 position, in vec3 translation, in vec3 xyzEulerAngles, in vec3 scale, out vec3 outTransformedPosition) {
  mat4 transform=createTransformMatrix(
      translation,
      xyzEulerAngles,
      scale
  );

  mat4 inv=inverseTransform(transform);
  vec3 tp=(inv*vec4(position,1.)).xyz;
  outTransformedPosition = tp;
}
