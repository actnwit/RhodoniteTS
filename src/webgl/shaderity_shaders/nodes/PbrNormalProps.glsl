void pbrNormalProps(in vec4 positionInWorld, in vec3 normalInWorld, in vec3 tangentInWorld, in vec3 binormalInWorld,
  in vec4 normalTexture, in vec2 normalTexUv, in float normalScale, out vec3 normalInWorldOut, out vec3 geomNormalInWorldOut, out mat3 TBNOut) {

  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  #if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
    cameraSID += uint(gl_ViewID_OVR);
  #endif

  vec3 viewPosition = get_viewPosition(cameraSID);
  vec3 viewVector = viewPosition - positionInWorld.xyz;
  vec3 viewDirection = normalize(viewVector);

  mat3 TBN = getTBN(normalInWorld, tangentInWorld, binormalInWorld, viewVector, normalTexUv);

  normalInWorldOut = normalize(normalInWorld);
  geomNormalInWorldOut = normalInWorldOut;
  TBNOut = TBN;

  #ifdef RN_USE_NORMAL_TEXTURE
    vec3 normalTexValue = normalTexture.xyz;
    if(normalTexValue.b >= 128.0 / 255.0) {
      // normal texture is existence
      vec3 normalTex = normalTexValue * 2.0 - 1.0;
      vec3 scaledNormal = normalize(normalTex * vec3(normalScale, normalScale, 1.0));
      normalInWorldOut = normalize(TBN * scaledNormal);
    }
  #endif
}
