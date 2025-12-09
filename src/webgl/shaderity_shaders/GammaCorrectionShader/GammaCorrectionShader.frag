

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */

uniform sampler2D u_baseColorTexture; // initialValue=(0,white)
uniform bool u_enableLinearToSrgb; // initialValue=true

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */




void main ()
{

/* shaderity: @{mainPrerequisites} */

vec4 baseColor = texture(u_baseColorTexture, v_texcoord_0);

if (get_enableLinearToSrgb(materialSID, 0u)) {
  baseColor.rgb = linearToSrgb(baseColor.rgb);
}

rt0 = baseColor;



}
