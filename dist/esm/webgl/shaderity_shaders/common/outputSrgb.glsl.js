var a=`float makeOutputSrgb = float(get_makeOutputSrgb(materialSID, 0u));
rt0.rgb = mix(rt0.rgb, linearToSrgb(rt0.rgb), makeOutputSrgb);
`,e="fragment",g=!0,u={code:a,shaderStage:e,isFragmentShader:g};export{a as code,u as default,g as isFragmentShader,e as shaderStage};
