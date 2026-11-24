var n=`void twistX(in vec3 position, in float strength, out vec3 outPosition) {
  float angle = strength * position.x;
  float c = cos(angle);
  float s = sin(angle);
  outPosition = vec3(position.x, c * position.y - s * position.z, s * position.y + c * position.z);
}
`,i="fragment",s=!0,e={code:n,shaderStage:i,isFragmentShader:s};export{n as code,e as default,s as isFragmentShader,i as shaderStage};
