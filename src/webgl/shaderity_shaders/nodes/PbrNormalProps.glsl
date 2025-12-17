void pbrNormalProps(in vec3 normalInWorld, in vec3 tangentInWorld, in vec3 binormalInWorld, in vec4 normalTexture, in float normalScale, out vec4 outColor) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  #if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
    cameraSID += uint(gl_ViewID_OVR);
  #endif

  vec3 viewPosition = get_viewPosition(cameraSID);
  vec3 viewVector = viewPosition - v_position_inWorld.xyz;
  vec3 viewDirection = normalize(viewVector);

  outColor = vertexColor * baseColorFactor * baseColorTexture;
}
