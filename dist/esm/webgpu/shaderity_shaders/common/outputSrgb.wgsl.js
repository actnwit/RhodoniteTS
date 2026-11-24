var r=`let makeOutputSrgb = get_makeOutputSrgb(materialSID, 0);
rt0 = vec4f(select(rt0.rgb, linearToSrgb(rt0.rgb), makeOutputSrgb), rt0.a);
`,a="fragment",g=!0,u={code:r,shaderStage:a,isFragmentShader:g};export{r as code,u as default,g as isFragmentShader,a as shaderStage};
