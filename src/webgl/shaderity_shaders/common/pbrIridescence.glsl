
// XYZ to REC709(sRGB) conversion matrix
const mat3 XYZ_TO_REC709 = mat3(
     3.2404542, -0.9692660,  0.0556434,
    -1.5371385,  1.8760108, -0.2040259,
    -0.4985314,  0.0415560,  1.0572252
);

// Assume air interface for top
vec3 Fresnel0ToIor(vec3 F0) {
    vec3 sqrtF0 = sqrt(F0);
    return (vec3(1.0) + sqrtF0) / (vec3(1.0) - sqrtF0);
}

// Conversion from IOR to F0
// ior is a value between 1.0 and 3.0. 1.0 is air interface
vec3 IorToFresnel0(vec3 transmittedIor, float incidentIor) {
    return sq((transmittedIor - vec3(incidentIor)) / (transmittedIor + vec3(incidentIor)));
}
float IorToFresnel0(float transmittedIor, float incidentIor) {
    return sq((transmittedIor - incidentIor) / (transmittedIor + incidentIor));
}

/**
 * From: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence#analytic-spectral-integration
 */
vec3 evalSensitivity(float OPD, vec3 shift) {
    float phase = 2.0 * M_PI * OPD * 1.0e-9;
    vec3 val = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
    vec3 pos = vec3(1.6810e+06, 1.7953e+06, 2.2084e+06);
    vec3 var = vec3(4.3278e+09, 9.3046e+09, 6.6121e+09);

    vec3 xyz = val * sqrt(2.0 * M_PI * var) * cos(pos * phase + shift) * exp(-(phase * phase) * var);
    xyz.x += 9.7470e-14 * sqrt(2.0 * M_PI * 4.5282e+09) * cos(2.2399e+06 * phase + shift[0]) * exp(-4.5282e+09 * (phase * phase));
    xyz /= 1.0685e-7;

    vec3 rgb = XYZ_TO_REC709 * xyz;
    return rgb;
}


/**
 * From: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence#iridescence-fresnel
 */
vec3 calcIridescence(float outsideIor, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0) {


  // iridescenceIor is the index of refraction of the thin-film layer
  // Force iridescenceIor -> outsideIOR when thinFilmThickness -> 0.0
  float iridescenceIor = mix(outsideIor, eta2, smoothstep(0.0, 0.03, thinFilmThickness));

  // To calculate the reflectances R12 and R23 at the viewing angles (angle hitting the thin-film layer)
  // and (angle after refraction in the thin-film) Schlick Fresnel is again used.
  // This approximation allows to eliminate the split into S and P polarization for the exact Fresnel equations.
  // can be calculated using Snell's law (with  being outsideIor and being iridescenceIor):
  float sinTheta2Sq = sq(outsideIor / iridescenceIor) * (1.0 - sq(cosTheta1));
  float cosTheta2Sq = 1.0 - sinTheta2Sq;

  // Handle total internal reflection
  if (cosTheta2Sq < 0.0) {
      return vec3(1.0);
  }

  float cosTheta2 = sqrt(cosTheta2Sq);

  /// Material Interfaces
  // The iridescence model defined by Belcour/Barla models two material interfaces
  // - one from the outside to the thin-film layer
  // and another one from the thin-film to the base material. These two interfaces are defined as follows:

  // First interface (from the outside to the thin-film layer)
  float R0 = IorToFresnel0(iridescenceIor, outsideIor);
  float R12 = fresnel(R0, cosTheta1);
  float R21 = R12;
  float T121 = 1.0 - R12;

  // Second interface (from the thin-film to the base material)
  vec3 baseIor = Fresnel0ToIor(baseF0 + 0.0001); // guard against 1.0
  vec3 R1 = IorToFresnel0(baseIor, iridescenceIor);
  vec3 R23 = fresnel(R1, cosTheta2);

  // phi12 and phi23 define the base phases per interface and are approximated with 0.0
  // if the IOR of the hit material (iridescenceIor or baseIor) is higher
  // than the IOR of the previous material (outsideIor or iridescenceIor) and π otherwise.
  // Also here, polarization is ignored.  float phi12 = 0.0;

  // First interface (from the outside to the thin-film layer)
  float phi12 = 0.0;
  if (iridescenceIor < outsideIor) phi12 = M_PI;
  float phi21 = M_PI - phi12;

  // Second interface (from the thin-film to the base material)
  vec3 phi23 = vec3(0.0);
  if (baseIor[0] < iridescenceIor) phi23[0] = M_PI;
  if (baseIor[1] < iridescenceIor) phi23[1] = M_PI;
  if (baseIor[2] < iridescenceIor) phi23[2] = M_PI;

  // OPD (optical path difference)
  float OPD = 2.0 * iridescenceIor * thinFilmThickness * cosTheta2;
  // Phase shift
  vec3 phi = vec3(phi21) + phi23;

  // Compound terms
  vec3 R123 = clamp(R12 * R23, 1e-5, 0.9999);
  vec3 r123 = sqrt(R123);
  vec3 Rs = (T121 * T121) * R23 / (vec3(1.0) - R123);

  // Reflectance term for m = 0 (DC term amplitude)
  vec3 C0 = R12 + Rs;
  vec3 I = C0;

  // Reflectance term for m > 0 (pairs of diracs)
  vec3 Cm = Rs - T121;
  for (int m = 1; m <= 2; ++m)
  {
      Cm *= r123;
      vec3 Sm = 2.0 * evalSensitivity(float(m) * OPD, float(m) * phi);
      I += Cm * Sm;
  }

  vec3 F_iridescence = max(I, vec3(0.0));

  return F_iridescence;
}
