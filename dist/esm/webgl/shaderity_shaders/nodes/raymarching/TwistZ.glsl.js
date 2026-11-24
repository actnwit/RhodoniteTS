var n=`void twistZ(in vec3 position, in float strength, out vec3 outPosition) {
  float angle = strength * position.z;
  float c = cos(angle);
  float s = sin(angle);
  outPosition = vec3(c * position.x - s * position.y, s * position.x + c * position.y, position.z);
}
`,i="fragment",s=!0,e={code:n,shaderStage:i,isFragmentShader:s};export{n as code,e as default,s as isFragmentShader,i as shaderStage};
