void pbrVolumeProps(
  in float thicknessFactor,
  in vec4 thicknessTexture,
  in float attenuationDistance,
  in vec3 attenuationColor,
  out VolumeProps outVolumeProps) {
#ifdef RN_USE_VOLUME
  outVolumeProps.thickness = thicknessFactor * thicknessTexture.g;
  outVolumeProps.attenuationColor = attenuationColor;
  outVolumeProps.attenuationDistance = attenuationDistance;
#else
  outVolumeProps.thickness = 0.0;
  outVolumeProps.attenuationColor = vec3(1.0);
  outVolumeProps.attenuationDistance = 1e20;
#endif // RN_USE_VOLUME
}
