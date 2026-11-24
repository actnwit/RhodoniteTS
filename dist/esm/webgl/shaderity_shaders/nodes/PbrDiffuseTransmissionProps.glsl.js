var n=`void pbrDiffuseTransmissionProps(
  in float diffuseTransmissionFactor,
  in vec4 diffuseTransmissionTexture,
  in vec3 diffuseTransmissionColorFactor,
  in vec4 diffuseTransmissionColorTexture,
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
`,o="fragment",r=!0,f={code:n,shaderStage:o,isFragmentShader:r};export{n as code,f as default,r as isFragmentShader,o as shaderStage};
