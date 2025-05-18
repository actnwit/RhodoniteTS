#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

in vec2 v_texcoord_0;

uniform sampler2D u_baseColorTexture; // initialValue=(0,white)
uniform bool u_enableLinearToSrgb; // initialValue=true

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/correspondenceBetweenLinearAndSrgb.glsl)


void main ()
{

/* shaderity: @{mainPrerequisites} */

vec4 baseColor = texture(u_baseColorTexture, v_texcoord_0);

if (get_enableLinearToSrgb(materialSID, 0)) {
  baseColor.rgb = linearToSrgb(baseColor.rgb);
}

rt0 = baseColor;

#pragma shaderity: require(../common/glFragColor.glsl)

}
