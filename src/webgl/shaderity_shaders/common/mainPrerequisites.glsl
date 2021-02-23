#ifdef RN_IS_FASTEST_MODE
  float materialSID = u_currentComponentSIDs[0]; // index 0 data is the materialSID

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = int(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.LightComponentTID} */]);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.SkeletalComponentTID} */];
  #endif

#else

  float materialSID = u_materialSID;

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0.0, 0);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = float(get_skinningMode(0.0, 0));
  #endif

#endif
