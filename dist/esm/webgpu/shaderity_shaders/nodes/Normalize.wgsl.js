var a=`
fn _normalizeVec2f(value: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = normalize(value);
}

fn _normalizeVec3f(value: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = normalize(value);
}

fn _normalizeVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = normalize(value);
}
`,u="fragment",l=!0,f={code:a,shaderStage:u,isFragmentShader:l};export{a as code,f as default,l as isFragmentShader,u as shaderStage};
