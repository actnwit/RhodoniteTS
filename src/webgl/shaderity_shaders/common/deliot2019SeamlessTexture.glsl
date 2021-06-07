
vec2 hash(ivec2 p) {
    return fract(sin(vec2(p) * mat2(127.1, 311.7, 269.5, 183.3))*43758.5453123);
}

// Decorrelated color space vectors and origin
vec3 returnToOriginalColorSpace(
  vec3 color,
  vec3 colorSpaceOrigin,
  vec3 colorSpaceVector1,
  vec3 colorSpaceVector2,
  vec3 colorSpaceVector3)
{
  vec3 result =
    colorSpaceOrigin +
    colorSpaceVector1 * color.r +
    colorSpaceVector2 * color.g +
    colorSpaceVector3 * color.b;
  return result;
}

void triangleGrid(
  vec2 uv,
  out float w1, out float w2, out float w3,
  out ivec2 vertex1, out ivec2 vertex2, out ivec2 vertex3)
{
  // Scaling of the input
  uv *= 3.464; // 2 * sqrt(3)

  // Skew input space into simplex triangle grid
  const mat2 gridToSkewedGrid = mat2(1.0, 0.0, -0.57735027, 1.15470054);
  vec2 skewedCoord = gridToSkewedGrid * uv;

  // Compute local triangle vertex IDs and local barycentric coordinates
  ivec2 baseId = ivec2(floor(skewedCoord));
  vec3 temp = vec3(fract(skewedCoord), 0);
  temp.z = 1.0 - temp.x - temp.y;
  if (temp.z > 0.0)
  {
    w1 = temp.z;
    w2 = temp.y;
    w3 = temp.x;
    vertex1 = baseId;
    vertex2 = baseId + ivec2(0, 1);
    vertex3 = baseId + ivec2(1, 0);
  }
  else
  {
    w1 = -temp.z;
    w2 = 1.0 - temp.y;
    w3 = 1.0 - temp.x;
    vertex1 = baseId + ivec2(1, 1);
    vertex2 = baseId + ivec2(1, 0);
    vertex3 = baseId + ivec2(0, 1);
  }
}

// https://stackoverflow.com/questions/24388346/how-to-access-automatic-mipmap-level-in-glsl-fragment-shader-texture
float mipmapLevel(in vec2 uv_as_texel)
{
  vec2  dx_vtc        = dFdx(uv_as_texel);
  vec2  dy_vtc        = dFdy(uv_as_texel);
  float delta_max_sqr = max(dot(dx_vtc, dx_vtc), dot(dy_vtc, dy_vtc));
  float mml = 0.5 * log2(delta_max_sqr);
  return max( 0.0, mml );
}

// By-Example procedural noise at uv
vec3 byExampleProceduralNoise(highp sampler2D Tinput, highp sampler2D Tinv, vec2 uv,
  vec3 colorSpaceOrigin,
  vec3 colorSpaceVector1,
  vec3 colorSpaceVector2,
  vec3 colorSpaceVector3)
{
	// Get triangle info
	float w1, w2, w3;
	ivec2 vertex1, vertex2, vertex3;
	triangleGrid(uv, w1, w2, w3, vertex1, vertex2, vertex3);

	// Assign random offset to each triangle vertex
	vec2 uv1 = uv + hash(vertex1);
	vec2 uv2 = uv + hash(vertex2);
	vec2 uv3 = uv + hash(vertex3);

	// Precompute UV derivatives
	vec2 duvdx = dFdx(uv);
	vec2 duvdy = dFdy(uv);

	// Fetch Gaussian input
  // 'textureGrad' is webGL2 only
	vec3 G1 = textureGrad(Tinput, uv1, duvdx, duvdy).rgb;
	vec3 G2 = textureGrad(Tinput, uv2, duvdx, duvdy).rgb;
	vec3 G3 = textureGrad(Tinput, uv3, duvdx, duvdy).rgb;

	// Variance-preserving blending
	vec3 G = w1*G1 + w2*G2 + w3*G3;
	G = G - vec3(0.5);
	G = G * inversesqrt(w1*w1 + w2*w2 + w3*w3);
	G = G + vec3(0.5);

	// Compute LOD level to fetch the prefiltered look-up table invT
	float LOD = mipmapLevel(uv * vec2(textureSize(Tinput, 0))) / float(textureSize(Tinv, 0).y);

	// Fetch prefiltered LUT (T^{-1})
	vec3 color;
	color.r	= texture(Tinv, vec2(G.r, LOD)).r;
	color.g	= texture(Tinv, vec2(G.g, LOD)).g;
	color.b	= texture(Tinv, vec2(G.b, LOD)).b;

	// Original color space
	vec3 outColor = returnToOriginalColorSpace(color,
      colorSpaceOrigin,
      colorSpaceVector1,
      colorSpaceVector2,
      colorSpaceVector3
    );

	return outColor;
}


vec4 texture2DSeamless(highp sampler2D Tinput, highp sampler2D Tinv, vec2 uv,
  vec3 colorSpaceOrigin,
  vec3 colorSpaceVector1,
  vec3 colorSpaceVector2,
  vec3 colorSpaceVector3,
  vec4 scaleTranslate) {
  vec4 color = vec4(byExampleProceduralNoise(Tinput, Tinv,
      uv * scaleTranslate.xy + scaleTranslate.zw,
      colorSpaceOrigin,
      colorSpaceVector1,
      colorSpaceVector2,
      colorSpaceVector3
    ),
    1);
  return color;
}
