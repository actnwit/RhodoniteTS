var e=`void sdTorus(in vec3 position, in float radius, in float tubeRadius, out float outDistance) {
  vec2 q = vec2(length(position.xz) - radius, position.y);
  outDistance = length(q) - tubeRadius;
}
`,n="fragment",o=!0,a={code:e,shaderStage:n,isFragmentShader:o};export{e as code,a as default,o as isFragmentShader,n as shaderStage};
