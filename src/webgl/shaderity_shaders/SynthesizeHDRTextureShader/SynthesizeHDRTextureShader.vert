
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

in vec4 a_instanceInfo;
in vec3 a_position;
in vec2 a_texcoord_0;
out vec2 v_texcoord_0;

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main(){
/* shaderity: @{mainPrerequisites} */
#pragma shaderity: require(../common/fullscreen.glsl)
}
