#ifdef RN_IS_DATATEXTURE_MODE
  uint materialSID = uint(u_currentComponentSIDs[0]); // index 0 data is the materialSID

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0u, 0u);
  #endif

  uint skeletalComponentSID = INVALID_ID;
  #ifdef RN_IS_SKINNING
    #ifdef RN_IS_VERTEX_SHADER
      skeletalComponentSID = a_instanceIds.y;
    #else
      skeletalComponentSID = INVALID_ID;
    #endif
  #endif

#else // RN_IS_UNIFORM_MODE

  uint materialSID = 0u; // materialSID is not used in Uniform mode

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0u, 0u);
  #endif

  uint skeletalComponentSID = INVALID_ID;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = uint(get_skinningMode(0u, 0u));
  #endif

#endif

uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);

#if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
  cameraSID += uint(gl_ViewID_OVR);
#endif

#ifdef RN_IS_VERTEX_SHADER
  init_rand(uvec3(uint(gl_VertexID),0u,0u), uvec3(0u));
#else
  init_rand(uvec3(uint(gl_FragCoord.x), uint(gl_FragCoord.y),0u), uvec3(0u));
#endif

