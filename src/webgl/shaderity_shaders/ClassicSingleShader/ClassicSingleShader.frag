

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexIn} */

/* shaderity: @{prerequisites} */

uniform int u_shadingModel; // initialValue=0
uniform float u_alphaCutoff; // initialValue=0.01
uniform float u_shininess; // initialValue=5
uniform vec4 u_diffuseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_diffuseColorTexture; // initialValue=(0,white)
uniform sampler2D u_normalTexture; // initialValue=(1,blue)
uniform vec4 u_diffuseColorTextureTransform; // initialValue=(1,1,0,0)
uniform float u_diffuseColorTextureRotation; // initialValue=0

/* shaderity: @{renderTargetBegin} */
// #pragma shaderity: require(../common/deliot2019SeamlessTexture.glsl)
// uniform sampler2D u_tInvTexture; // initialValue=(1,white)
// uniform vec3 u_colorSpaceOrigin;
// uniform vec3 u_colorSpaceVector1;
// uniform vec3 u_colorSpaceVector2;
// uniform vec3 u_colorSpaceVector3;
// uniform vec4 u_scaleTranslate;

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */

/* shaderity: @{shadowDefinition} */

#pragma shaderity: require(../nodes/ClassicShader.glsl)

void main ()
{

/* shaderity: @{mainPrerequisites} */

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0u);

  // diffuseColorTexture (Considered to be premultiplied alpha)
  vec4 diffuseColorTextureTransform = get_diffuseColorTextureTransform(materialSID, 0u);
  float diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0u);
  vec2 diffuseColorTexUv = uvTransform(diffuseColorTextureTransform.xy, diffuseColorTextureTransform.zw, diffuseColorTextureRotation, v_texcoord_0);
  vec4 textureColor = texture(u_diffuseColorTexture, diffuseColorTexUv);

  uint shadingModel = uint(get_shadingModel(materialSID, 0u));
  float shininess = get_shininess(materialSID, 0u);
  vec4 shadingColor = vec4(0.0, 0.0, 0.0, 1.0);
  classicShader(v_color, diffuseColorFactor, textureColor, shadingModel, shininess, v_position_inWorld, normal_inWorld, shadingColor);

  // Alpha Test
  float alpha = shadingColor.a;
  /* shaderity: @{alphaProcess} */
  shadingColor.a = alpha;

  // Pre-multiplied alpha
  rt0 = vec4(shadingColor.rgb * shadingColor.a, shadingColor.a);
}
