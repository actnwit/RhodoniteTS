var t=`void bendZX(in vec3 position, in float strength, out vec3 outPosition) {
  float angle = strength * position.z;
  float c = cos(angle);
  float s = sin(angle);
  outPosition = vec3(s * position.z + c * position.x, position.y, c * position.z - s * position.x);
}
`,i="fragment",s=!0,e={code:t,shaderStage:i,isFragmentShader:s};export{t as code,e as default,s as isFragmentShader,i as shaderStage};
