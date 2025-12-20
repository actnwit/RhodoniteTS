void pbrSheenProps(
  in vec3 sheenColorFactor,
  in vec4 sheenColorTexture,
  in float sheenRoughnessFactor,
  in vec4 sheenRoughnessTexture,
  in vec4 positionInWorld,
  in vec3 normalInWorld,
  out SheenProps outSheenProps) {

  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  #if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
    cameraSID += uint(gl_ViewID_OVR);
  #endif

  vec3 viewPosition = get_viewPosition(cameraSID);
  vec3 viewDirection = normalize(viewPosition - positionInWorld.xyz);
  float NdotV = saturate(dot(normalInWorld, viewDirection));

  outSheenProps.sheenColor = sheenColorFactor * sheenColorTexture.rgb;
  outSheenProps.sheenRoughness = sheenRoughnessFactor * sheenRoughnessTexture.a;
  outSheenProps.albedoSheenScalingNdotV = 1.0 - max3(outSheenProps.sheenColor) * texture(u_sheenLutTexture, vec2(NdotV, outSheenProps.sheenRoughness)).r;
}
