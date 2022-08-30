#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec3 v_color;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
in vec2 v_texcoord_0;
in vec3 v_baryCentricCoord;

uniform int u_shadingModel; // initialValue=0
uniform float u_alphaCutoff; // initialValue=0.01
uniform vec4 u_diffuseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_diffuseColorTexture; // initialValue=(0,white)
uniform sampler2D u_normalTexture; // initialValue=(1,blue)
uniform vec4 u_diffuseColorTextureTransform; // initialValue=(1,1,0,0)
uniform float u_diffuseColorTextureRotation; // initialValue=0

#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(../common/utilFunctions.glsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/opticalDefinition.glsl)

void main ()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0);


  // diffuseColor (Considered to be premultiplied alpha)
  vec3 diffuseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;
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

  // diffuseColorTexture (Considered to be premultiplied alpha)
  vec4 diffuseColorTextureTransform = get_diffuseColorTextureTransform(materialSID, 0);
  float diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0);
  vec2 diffuseColorTexUv = uvTransform(diffuseColorTextureTransform.xy, diffuseColorTextureTransform.zw, diffuseColorTextureRotation, v_texcoord_0);
  vec4 textureColor = texture2D(u_diffuseColorTexture, diffuseColorTexUv);
  diffuseColor *= textureColor.rgb;
  alpha *= textureColor.a;

#pragma shaderity: require(../common/alphaMask.glsl)

  rt0 = vec4(diffuseColor* alpha, alpha);

#pragma shaderity: require(../common/setAlphaIfNotInAlphaBlendMode.glsl)

#pragma shaderity: require(../common/glFragColor.glsl)

}

