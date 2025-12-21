void pbrDiffuseTransmissionProps(
  in float diffuseTransmissionFactor,
  in vec4 diffuseTransmissionTexture,
  out DiffuseTransmissionProps outDiffuseTransmissionProps) {

#ifdef RN_USE_DIFFUSE_TRANSMISSION
  outDiffuseTransmissionProps.diffuseTransmission = diffuseTransmissionFactor * diffuseTransmissionTexture.a;
  outDiffuseTransmissionProps.diffuseTransmissionColor = diffuseTransmissionColorFactor * diffuseTransmissionColorTexture.rgb;
  outDiffuseTransmissionProps.diffuseTransmissionThickness = 1.0;
#else
  outDiffuseTransmissionProps.diffuseTransmission = 0.0;
  outDiffuseTransmissionProps.diffuseTransmissionColor = vec3(0.0);
  outDiffuseTransmissionProps.diffuseTransmissionThickness = 0.0;
#endif // RN_USE_DIFFUSE_TRANSMISSION
}
