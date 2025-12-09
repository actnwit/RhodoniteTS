#ifdef RN_IS_DATATEXTURE_MODE
  uint materialSID = uint(u_currentComponentSIDs[0]); // index 0 data is the materialSID

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0u, 0u);
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

  uint materialSID = 0u; // materialSID is not used in Uniform mode

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0u, 0u);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = float(get_skinningMode(0u, 0u));
  #endif

#endif

uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);

#if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
  cameraSID += uint(gl_ViewID_OVR);
#endif
