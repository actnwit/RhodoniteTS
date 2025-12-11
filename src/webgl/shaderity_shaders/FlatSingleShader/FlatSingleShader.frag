

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */

uniform int u_shadingModel; // initialValue=0
uniform float u_alphaCutoff; // initialValue=0.01
uniform vec4 u_diffuseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_diffuseColorTexture; // initialValue=(0,white)
uniform sampler2D u_normalTexture; // initialValue=(1,blue)
uniform vec2 u_diffuseColorTextureTransformScale; // initialValue=(1,1)
uniform vec2 u_diffuseColorTextureTransformOffset; // initialValue=(0,0)
uniform float u_diffuseColorTextureRotation; // initialValue=0

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */

#pragma shaderity: require(../nodes/FlatShader.glsl)

void main ()
{

/* shaderity: @{mainPrerequisites} */

  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0u);

  // diffuseColorTexture (Considered to be premultiplied alpha)
  vec2 diffuseColorTextureTransformScale = get_diffuseColorTextureTransformScale(materialSID, 0u);
  vec2 diffuseColorTextureTransformOffset = get_diffuseColorTextureTransformOffset(materialSID, 0u);
  float diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0u);
  vec2 diffuseColorTexUv = uvTransform(diffuseColorTextureTransformScale, diffuseColorTextureTransformOffset, diffuseColorTextureRotation, v_texcoord_0);
  vec4 textureColor = texture(u_diffuseColorTexture, diffuseColorTexUv);

  vec4 diffuseColor = vec4(0.0, 0.0, 0.0, 1.0);
#ifdef RN_USE_TEXCOORD_0
  flatShader(v_color, diffuseColorFactor, textureColor, diffuseColor);
#else
  diffuseColor = v_color * diffuseColorFactor;
#endif

  float alpha = diffuseColor.a;
  /* shaderity: @{alphaProcess} */
  diffuseColor.a = alpha;

  rt0 = vec4(diffuseColor.rgb * diffuseColor.a, diffuseColor.a);
}
