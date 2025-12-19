void pbrClearcoatProps(
  in float clearcoatFactor,
  in vec4 clearcoatTexture,
  in float clearcoatRoughnessFactor,
  in vec4 clearcoatRoughnessTexture,
  in vec4 clearcoatNormalTexture,
  in mat3 TBN,
  in vec4 positionInWorld,
  in float ior,
  out ClearcoatProps clearcoatProps) {

  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  #if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
    cameraSID += uint(gl_ViewID_OVR);
  #endif

  vec3 viewPosition = get_viewPosition(cameraSID);
  vec3 viewDirection = normalize(viewPosition - positionInWorld.xyz);

  clearcoatProps.clearcoat = clearcoatFactor * clearcoatTexture.r;
  clearcoatProps.clearcoatRoughness = clearcoatRoughnessFactor * clearcoatRoughnessTexture.g;
  vec3 textureNormal_tangent = clearcoatNormalTexture.xyz * vec3(2.0) - vec3(1.0);
  clearcoatProps.clearcoatNormal_inWorld = normalize(TBN * textureNormal_tangent);
  clearcoatProps.VdotNc = saturate(dot(viewDirection, clearcoatProps.clearcoatNormal_inWorld));
  clearcoatProps.clearcoatF0 = vec3(pow((ior - 1.0) / (ior + 1.0), 2.0));
  clearcoatProps.clearcoatF90 = vec3(1.0);
  clearcoatProps.clearcoatFresnel = fresnelSchlick(clearcoatProps.clearcoatF0, clearcoatProps.clearcoatF90, clearcoatProps.VdotNc);
}
