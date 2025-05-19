

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */

uniform int u_envHdriFormat; // initialValue=0
uniform float u_envRotation; // initialValue=0
uniform vec4 u_diffuseColorFactor; // initialValue=(1,1,1,1)
uniform samplerCube u_colorEnvTexture; // initialValue=(0,black)
uniform bool u_makeOutputSrgb; // initialValue=true
uniform bool u_inverseEnvironment; // initialValue=false

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}

void main() {
/* shaderity: @{mainPrerequisites} */

  // diffuseColor
  vec3 diffuseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;
  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0);
  if (v_color != diffuseColor && diffuseColorFactor.rgb != diffuseColor) {
    diffuseColor = v_color * diffuseColorFactor.rgb;
    alpha = diffuseColorFactor.a;
  } else if (v_color == diffuseColor) {
    diffuseColor = diffuseColorFactor.rgb;
    alpha = diffuseColorFactor.a;
  } else if (diffuseColorFactor.rgb == diffuseColor) {
    diffuseColor = v_color;
  } else {
    diffuseColor = vec3(1.0, 1.0, 1.0);
  }

  // diffuseColorTexture

  // adapt OpenGL (RenderMan) CubeMap convention
  float envRotation = get_envRotation(materialSID, 0);
  float rot = envRotation;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  vec3 envNormal = normalize(rotEnvMatrix * v_position_inWorld.xyz);

  if (get_inverseEnvironment(materialSID, 0)) {
    envNormal.x *= -1.0;
  }

  vec4 diffuseTexel = texture(u_colorEnvTexture, envNormal);
  vec3 textureColor;
  int EnvHdriFormat = get_envHdriFormat(materialSID, 0);
  if (EnvHdriFormat == 0) { // LDR_SRGB
    textureColor = srgbToLinear(diffuseTexel.rgb);
  } else if (EnvHdriFormat == 3) { // RGBE
    textureColor = diffuseTexel.rgb * pow(2.0, diffuseTexel.a*255.0-128.0);
  } else {
    textureColor = diffuseTexel.rgb;
  }
  diffuseColor *= textureColor;

  rt0 = vec4(diffuseColor, alpha);

  /* shaderity: @{outputSrgb} */


}
