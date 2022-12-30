#ifdef WEBGL2_MULTI_VIEW
#extension GL_OVR_multiview : require
  #ifdef WEBXR_MULTI_VIEW_VIEW_NUM_2
layout(num_views=2) in;
  #endif
#endif
