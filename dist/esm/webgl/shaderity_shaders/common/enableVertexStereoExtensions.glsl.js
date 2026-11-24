var i=`#ifdef WEBGL2_MULTI_VIEW
#extension GL_OVR_multiview : require
  #ifdef WEBXR_MULTI_VIEW_VIEW_NUM_2
layout(num_views=2) in;
  #endif
#endif
`,_="fragment",d=!0,f={code:i,shaderStage:_,isFragmentShader:d};export{i as code,f as default,d as isFragmentShader,_ as shaderStage};
