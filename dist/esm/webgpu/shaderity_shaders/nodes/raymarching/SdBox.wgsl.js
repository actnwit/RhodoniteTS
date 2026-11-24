var t=`fn sdBox(position: vec3f, size: vec3f, outDistance: ptr<function, f32>) {
  let q=abs(position)-size;
  *outDistance = length(max(q,vec3f(0.0)))+min(max(q.x,max(q.y,q.z)),0.0);
}
`,a="fragment",i=!0,s={code:t,shaderStage:a,isFragmentShader:i};export{t as code,s as default,i as isFragmentShader,a as shaderStage};
