#ifdef RN_IS_FASTEST_MODE
  float materialSID = u_currentComponentSIDs[0];

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = int(u_currentComponentSIDs[${WellKnownComponentTIDs.LightComponentTID}]);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = u_currentComponentSIDs[${WellKnownComponentTIDs.SkeletalComponentTID}];
  #endif

#elif

  float materialSID = u_materialSID;

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = u_lightNumber;
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = float(u_skinningMode);
  #endif

#endif
