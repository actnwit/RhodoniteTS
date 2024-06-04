#ifdef RN_IS_DATATEXTURE_MODE
  float materialSID = u_currentComponentSIDs[0]; // index 0 data is the materialSID

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0.0, 0);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    #ifdef RN_IS_VERTEX_SHADER
      skeletalComponentSID = a_instanceInfo.y;
    #else
      skeletalComponentSID = -1.0;
    #endif
  #endif

#else // RN_IS_UNIFORM_MODE

  float materialSID = -1.0; // materialSID is not used in Uniform mode

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0.0, 0);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = float(get_skinningMode(0.0, 0));
  #endif

#endif

float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */];

#if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
// if (u_isMainVr == 1) {
  cameraSID += float(gl_ViewID_OVR);
// }
#endif
