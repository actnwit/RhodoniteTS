float d_Charlie(float sheenPerceptualRoughness, float NoH) {
  // Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
  float alphaG = sheenPerceptualRoughness * sheenPerceptualRoughness;
  float invAlpha  = 1.0 / alphaG;
  float cos2h = NoH * NoH;
  float sin2h = 1.0 - cos2h;
  return (2.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * PI);
}

// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen#sheen-visibility
float sheenSimpleVisibility(float NdotL, float NdotV) {
  return 1.0 / (4.0 * (NdotL + NdotV - NdotL * NdotV));
}

// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen#sheen-visibility
float charlieL(float x, float alphaG) {
  float oneMinusAlphaSq = (1.0 - alphaG) * (1.0 - alphaG);
  float a = mix(21.5473, 25.3245, oneMinusAlphaSq);
  float b = mix(3.82987, 3.32435, oneMinusAlphaSq);
  float c = mix(0.19823, 0.16801, oneMinusAlphaSq);
  float d = mix(-1.97760, -1.27393, oneMinusAlphaSq);
  float e = mix(-4.32054, -4.85967, oneMinusAlphaSq);
  return a / (1.0 + b * pow(x, c)) + d * x + e;
}

float lambdaSheen(float cosTheta, float alphaG)
{
  return abs(cosTheta) < 0.5 ? exp(charlieL(cosTheta, alphaG)) : exp(2.0 * charlieL(0.5, alphaG) - charlieL(1.0 - cosTheta, alphaG));
}

float sheenCharlieVisibility(float NdotL, float NdotV, float sheenPerceptualRoughness) {
  float alphaG = sheenPerceptualRoughness * sheenPerceptualRoughness;
  float sheenVisibility = 1.0 / ((1.0 + lambdaSheen(NdotV, alphaG) + lambdaSheen(NdotL, alphaG)) * (4.0 * NdotV * NdotL));
  return sheenVisibility;
}

vec3 sheen_brdf(vec3 sheenColor, float sheenPerceptualRoughness, float NdotL, float NdotV, float NdotH) {
  float sheenDistribution = d_Charlie(sheenPerceptualRoughness, NdotH);
  float sheenVisibility = sheenCharlieVisibility(NdotL, NdotV, sheenPerceptualRoughness);
  return sheenColor * sheenDistribution * sheenVisibility;
}
