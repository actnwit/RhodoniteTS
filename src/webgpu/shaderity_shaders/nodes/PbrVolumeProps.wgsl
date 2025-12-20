fn pbrVolumeProps(
  thicknessFactor: f32,
  thicknessTexture: vec4<f32>,
  attenuationDistance: f32,
  attenuationColor: vec3<f32>,
  outVolumeProps: ptr<function, VolumeProps>) {
  (*outVolumeProps).thickness = thicknessFactor * thicknessTexture.g;
  (*outVolumeProps).attenuationColor = attenuationColor;
  (*outVolumeProps).attenuationDistance = attenuationDistance;
}
