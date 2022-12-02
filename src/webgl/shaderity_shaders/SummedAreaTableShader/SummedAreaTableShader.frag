#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec2 v_texcoord_0;
in vec4 gl_FragCoord;

uniform sampler2DRect u_baseColorTexture; // initialValue=(0,white)
uniform float u_count; // initialValue=(0,0,0,0)
#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

void main ()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

float i = get_count(materialSID, 0);

vec4 color = texture2D(u_baseColorTexture, gl_FragCoord.xy);
vec4 color1 = texture2D(u_baseColorTexture, vec2(gl_FragCoord.x + pow(2.0, i), gl_FragCoord.y));
rt0 = color + color1;

#pragma shaderity: require(../common/glFragColor.glsl)

}
