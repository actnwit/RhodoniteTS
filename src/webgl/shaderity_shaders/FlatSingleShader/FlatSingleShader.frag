

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */

uniform int u_shadingModel; // initialValue=0
uniform float u_alphaCutoff; // initialValue=0.01
uniform vec4 u_diffuseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_diffuseColorTexture; // initialValue=(0,white)
uniform sampler2D u_normalTexture; // initialValue=(1,blue)
uniform vec4 u_diffuseColorTextureTransform; // initialValue=(1,1,0,0)
uniform float u_diffuseColorTextureRotation; // initialValue=0

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */

void main ()
{

/* shaderity: @{mainPrerequisites} */

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0u);


  // diffuseColor (Considered to be premultiplied alpha)
  vec4 diffuseColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (v_color != diffuseColor && diffuseColorFactor != diffuseColor) {
    diffuseColor = v_color * diffuseColorFactor;
  } else if (v_color == diffuseColor) {
    diffuseColor = diffuseColorFactor;
  } else if (diffuseColorFactor == diffuseColor) {
    diffuseColor = v_color;
  } else {
    diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
  }

  // diffuseColorTexture (Considered to be premultiplied alpha)
  vec4 diffuseColorTextureTransform = get_diffuseColorTextureTransform(materialSID, 0u);
  float diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0u);
  vec2 diffuseColorTexUv = uvTransform(diffuseColorTextureTransform.xy, diffuseColorTextureTransform.zw, diffuseColorTextureRotation, v_texcoord_0);
  vec4 textureColor = texture(u_diffuseColorTexture, diffuseColorTexUv);
  diffuseColor.rgb *= textureColor.rgb;
  diffuseColor.a *= textureColor.a;

  float alpha = diffuseColor.a;
  /* shaderity: @{alphaProcess} */
  diffuseColor.a = alpha;

  rt0 = vec4(diffuseColor * diffuseColor.a, diffuseColor.a);



}

