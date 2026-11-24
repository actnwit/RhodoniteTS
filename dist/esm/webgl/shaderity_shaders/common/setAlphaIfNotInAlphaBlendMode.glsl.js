var a=`#ifdef RN_IS_ALPHA_MODE_BLEND
#else
  rt0.a = 1.0;
#endif
`,r="fragment",d=!0,t={code:a,shaderStage:r,isFragmentShader:d};export{a as code,t as default,d as isFragmentShader,r as shaderStage};
