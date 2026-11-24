var o=`float x = float((gl_VertexID & 1) << 2);
float y = float((gl_VertexID & 2) << 1);
v_texcoord_0.x = x * 0.5;
v_texcoord_0.y = y * 0.5;
gl_Position = vec4(x - 1.0, y - 1.0, 0, 1);
`,a="fragment",r=!0,n={code:o,shaderStage:a,isFragmentShader:r};export{o as code,n as default,r as isFragmentShader,a as shaderStage};
