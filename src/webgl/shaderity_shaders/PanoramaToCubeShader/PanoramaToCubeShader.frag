#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec2 v_texcoord_0;

uniform sampler2D u_baseColorTexture; // initialValue=(0,white)
uniform int u_cubeMapFaceId; // initialValue=0

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

vec2 dirToPanoramaUV(vec3 dir)
{
	return vec2(
		0.5f + 0.5f * atan(dir.z, dir.x) / PI,
		1.f - acos(dir.y) / PI);
}

vec3 uvToDirection(int faceId, vec2 uv)
{
	if(faceId == 0)
		return vec3(1.f, uv.y, -uv.x);
	else if(faceId == 1)
		return vec3(-1.f, uv.y, uv.x);
	else if(faceId == 2)
		return vec3(+uv.x, -1.f, +uv.y);
	else if(faceId == 3)
		return vec3(+uv.x, 1.f, -uv.y);
	else if(faceId == 4)
		return vec3(+uv.x, uv.y, 1.f);
	else
    return vec3(-uv.x, +uv.y, -1.f);
}

void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.glsl)

	vec2 uv = v_texcoord_0 * 2.0 - 1.0;
	vec3 direction = normalize(uvToDirection(get_cubeMapFaceId(materialSID, 0), uv));
	vec2 panoramaUv = dirToPanoramaUV(direction);
	rt0 = vec4(texture(u_baseColorTexture, panoramaUv).rgb, 1.0);

#pragma shaderity: require(../common/glFragColor.glsl)
}
