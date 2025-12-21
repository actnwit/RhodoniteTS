fn pbrVolumeProps(
  thicknessFactor: f32,
  thicknessTexture: vec4<f32>,
  attenuationDistance: f32,
  attenuationColor: vec3<f32>,
  outVolumeProps: ptr<function, VolumeProps>) {
#ifdef RN_USE_VOLUME
  (*outVolumeProps).thickness = thicknessFactor * thicknessTexture.g;
  (*outVolumeProps).attenuationColor = attenuationColor;
  (*outVolumeProps).attenuationDistance = attenuationDistance;
#else
  (*outVolumeProps).thickness = 0.0;
  (*outVolumeProps).attenuationColor = vec3<f32>(1.0);
  (*outVolumeProps).attenuationDistance = 1e20;
#endif // RN_USE_VOLUME
}
