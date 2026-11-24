var s=`fn opSmoothIntersection(lhs: f32, rhs: f32, smoothness: f32, outValue: ptr<function, f32>) {
  let k = max(smoothness, 0.0001);
  let h = clamp(0.5 - 0.5 * (rhs - lhs) / k, 0.0, 1.0);
  *outValue = mix(rhs, lhs, h) + k * h * (1.0 - h);
}
`,t="fragment",n=!0,o={code:s,shaderStage:t,isFragmentShader:n};export{s as code,o as default,n as isFragmentShader,t as shaderStage};
