#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec4 v_position_inLocal;

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

vec4 encodeDepthToRGBA(float depth){
  float r = depth;
  float g = fract(r * 255.0);
  float b = fract(g * 255.0);
  float a = fract(b * 255.0);
  float coef = 1.0 / 255.0;
  r -= g * coef;
  g -= b * coef;
  b -= a * coef;
  return vec4(r, g, b, a);
}

void main (){

#pragma shaderity: require(../common/mainPrerequisites.glsl)
  float depth;
  bool isPointLight = get_isPointLight(materialSID, 0);
  if(isPointLight){
    float zNear = get_zNearInner(materialSID, 0);
    float zFar = get_zFarInner(materialSID, 0);
    float normalizationCoefficient = 1.0 / (zFar - zNear);
    depth = normalizationCoefficient * length(v_position_inLocal);
  }else{
    depth = gl_FragCoord.z;
  }

  float depthPow = get_depthPow(materialSID, 0);
  float depthData = pow(depth, depthPow);
  vec4 encodedDepth = encodeDepthToRGBA(depthData);

  rt0 = encodedDepth;

#pragma shaderity: require(../common/glFragColor.glsl)
}
