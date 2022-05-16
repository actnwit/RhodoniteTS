
vec2 uvTransform(vec2 scale, vec2 offset, float rotation, vec2 uv) {
  mat3 translationMat = mat3(1,0,0, 0,1,0, offset.x, offset.y, 1);
  mat3 rotationMat = mat3(
      cos(rotation), -sin(rotation), 0,
      sin(rotation), cos(rotation), 0,
                  0,             0, 1
  );
  mat3 scaleMat = mat3(scale.x,0,0, 0,scale.y,0, 0,0,1);

  mat3 matrix = translationMat * rotationMat * scaleMat;
  vec2 uvTransformed = ( matrix * vec3(uv.xy, 1) ).xy;

  return uvTransformed;
}
