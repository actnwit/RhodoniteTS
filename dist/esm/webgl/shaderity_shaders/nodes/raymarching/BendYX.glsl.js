var t=`void bendYX(in vec3 position, in float strength, out vec3 outPosition) {
  float angle = strength * position.y;
  float c = cos(angle);
  float s = sin(angle);
  outPosition = vec3(s * position.y + c * position.x, c * position.y - s * position.x, position.z);
}
`,i="fragment",s=!0,e={code:t,shaderStage:i,isFragmentShader:s};export{t as code,e as default,s as isFragmentShader,i as shaderStage};
