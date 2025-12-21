fn pbrSheenProps(
  diffuseTransmissionFactor: f32,
  diffuseTransmissionTexture: vec4<f32>,
  outDiffuseTransmissionProps: ptr<function, DiffuseTransmissionProps>) {

#ifdef RN_USE_DIFFUSE_TRANSMISSION
  (*outDiffuseTransmissionProps).diffuseTransmission = diffuseTransmissionFactor * diffuseTransmissionTexture.a;
  (*outDiffuseTransmissionProps).diffuseTransmissionColor = diffuseTransmissionColorFactor * diffuseTransmissionColorTexture.rgb;
  (*outDiffuseTransmissionProps).diffuseTransmissionThickness = 1.0;
#else
  (*outDiffuseTransmissionProps).diffuseTransmission = 0.0;
  (*outDiffuseTransmissionProps).diffuseTransmissionColor = vec3<f32>(0.0);
  (*outDiffuseTransmissionProps).diffuseTransmissionThickness = 0.0;
#endif // RN_USE_DIFFUSE_TRANSMISSION
}
