var o=`let x = f32((vertexIdx & 1u) << 2u);
let y = f32((vertexIdx & 2u) << 1u);
output.texcoord_0.x = x * 0.5;
output.texcoord_0.y = y * 0.5;
output.texcoord_0.y = 1.0 - output.texcoord_0.y;
output.position = vec4f(x - 1.0, y - 1.0, 0, 1);
`,u="fragment",x=!0,r={code:o,shaderStage:u,isFragmentShader:x};export{o as code,r as default,x as isFragmentShader,u as shaderStage};
