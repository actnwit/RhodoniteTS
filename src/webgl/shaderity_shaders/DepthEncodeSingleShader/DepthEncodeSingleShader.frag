

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

in vec4 v_position_inLocal;

/* shaderity: @{renderTargetBegin} */

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

/* shaderity: @{mainPrerequisites} */
  float depth;
  bool isPointLight = get_isPointLight(uint(materialSID), 0u);
  if(isPointLight){
    float zNear = get_zNearInner(uint(materialSID), 0u);
    float zFar = get_zFarInner(uint(materialSID), 0u);
    float normalizationCoefficient = 1.0 / (zFar - zNear);
    depth = normalizationCoefficient * length(v_position_inLocal);
  }else{
    depth = gl_FragCoord.z;
  }

  float depthPow = get_depthPow(uint(materialSID), 0u);
  float depthData = pow(depth, depthPow);
  vec4 encodedDepth = encodeDepthToRGBA(depthData);

  rt0 = encodedDepth;


}
