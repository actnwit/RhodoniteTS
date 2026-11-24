var a=`fn vector3AndScalarToVector4(xyz: vec3<f32>, w: f32, outValue: ptr<function, vec4<f32>>) {
  (*outValue).x = xyz.x;
  (*outValue).y = xyz.y;
  (*outValue).z = xyz.z;
  (*outValue).w = w;
}
`,n="fragment",u=!0,o={code:a,shaderStage:n,isFragmentShader:u};export{a as code,o as default,u as isFragmentShader,n as shaderStage};
