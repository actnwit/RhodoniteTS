fn pbrNormalProps(positionInWorld: vec4<f32>, normalInWorld: vec3f, tangentInWorld: vec3f, binormalInWorld: vec3f,
  normalTexture: vec4<f32>, normalTexUv: vec2f, normalScale: f32, outNormalInWorld: ptr<function, vec3f>, outGeomNormalInWorld: ptr<function, vec3f>, outTBN: ptr<function, mat3x3<f32>>) {

  let cameraSID = uniformDrawParameters.cameraSID;

  let viewPosition = get_viewPosition(cameraSID);
  let viewVector = viewPosition - positionInWorld.xyz;
  let viewDirection = normalize(viewVector);

  let TBN = getTBN(normalInWorld, tangentInWorld, binormalInWorld, viewVector, normalTexUv);

  *outNormalInWorld = normalize(normalInWorld);
  *outGeomNormalInWorld = *outNormalInWorld;
  *outTBN = getTBN(normalInWorld, tangentInWorld, binormalInWorld, viewVector, normalTexUv);

  #ifdef RN_USE_NORMAL_TEXTURE
    let normalTexValue: vec3f = normalTexture.xyz;
    if(normalTexValue.b >= 128.0 / 255.0) {
      // normal texture is existence
      let normalTex = normalTexValue * 2.0 - 1.0;
      let scaledNormal = normalize(normalTex * vec3(normalScale, normalScale, 1.0));
      *outNormalInWorld = normalize(TBN * scaledNormal);
    }
  #endif
}
