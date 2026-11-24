var n=`void sdRoundBox(in vec3 position, in vec3 size, in float radius, out float outDistance) {
  vec3 q = abs(position) - size;
  outDistance = length(max(q, 0.0)) - radius;
}
`,t="fragment",a=!0,o={code:n,shaderStage:t,isFragmentShader:a};export{n as code,o as default,a as isFragmentShader,t as shaderStage};
