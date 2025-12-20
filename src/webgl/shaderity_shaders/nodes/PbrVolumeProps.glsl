void pbrVolumeProps(
  in float thicknessFactor,
  in vec4 thicknessTexture,
  in float attenuationDistance,
  in vec3 attenuationColor,
  out VolumeProps outVolumeProps) {
  outVolumeProps.thickness = thicknessFactor * thicknessTexture.g;
  outVolumeProps.attenuationColor = attenuationColor;
  outVolumeProps.attenuationDistance = attenuationDistance;
}
