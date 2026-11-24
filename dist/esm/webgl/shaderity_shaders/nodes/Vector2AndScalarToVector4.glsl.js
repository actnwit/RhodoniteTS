var t=`
void vector2AndScalarToVector4(in vec2 xy, in float z, in float w, out vec4 outValue) {
  outValue.x = xy.x;
  outValue.y = xy.y;
  outValue.z = z;
  outValue.w = w;
}
`,n="fragment",o=!0,u={code:t,shaderStage:n,isFragmentShader:o};export{t as code,u as default,o as isFragmentShader,n as shaderStage};
