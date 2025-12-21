void pbrClearcoatProps(
  in float clearcoatFactor,
  in vec4 clearcoatTexture,
  in float clearcoatRoughnessFactor,
  in vec4 clearcoatRoughnessTexture,
  in vec4 clearcoatNormalTexture,
  out ClearcoatProps clearcoatProps) {

#ifdef RN_USE_CLEARCOAT
  clearcoatProps.clearcoat = clearcoatFactor * clearcoatTexture.r;
  clearcoatProps.clearcoatRoughness = clearcoatRoughnessFactor * clearcoatRoughnessTexture.g;
  vec3 textureNormal_tangent = clearcoatNormalTexture.xyz * vec3(2.0) - vec3(1.0);
  clearcoatProps.clearcoatNormal_inTangent = textureNormal_tangent;
#else
  clearcoatProps.clearcoat = 0.0;
  clearcoatProps.clearcoatRoughness = 0.0;
  clearcoatProps.clearcoatNormal_inTangent = vec3(0.0, 0.0, 0.0);
#endif // RN_USE_CLEARCOAT
}
