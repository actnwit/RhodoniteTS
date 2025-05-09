#ifdef RN_USE_TANGENT
  fn getTBN(normal_inWorld: vec3f, input: VertexOutput, viewVector: vec3f, texcoord: vec2f, isFront: bool) -> mat3x3<f32> {
    let tangent_inWorld = normalize(input.tangent_inWorld);
    let binormal_inWorld = normalize(input.binormal_inWorld);
    let tbnMat_tangent_to_world = mat3x3<f32>(tangent_inWorld, binormal_inWorld, normal_inWorld);

    return tbnMat_tangent_to_world;
  }
#else
    // This is based on http://www.thetenthplanet.de/archives/1180
    fn cotangent_frame(normal_inWorld: vec3f, position: vec3f, uv_: vec2f, isFront: bool) -> mat3x3<f32> {
      var uv: vec2f;
      if (isFront) {
        uv = uv_;
      } else {
        uv = -uv_;
      }

      // get edge vectors of the pixel triangle
      let dp1 = dpdx(position);
      let dp2 = -dpdy(position); // Because the Y direction of the window coordinate system is different from that of WebGL, this one is set to minus to make the result match the WebGL version.
      let duv1 = dpdx(uv);
      let duv2 = -dpdy(uv); // Because the Y direction of the window coordinate system is different from that of WebGL, this one is set to minus to make the result match the WebGL version.

      // solve the linear system
      let dp2perp = cross(dp2, normal_inWorld);
      let dp1perp = cross(normal_inWorld, dp1);
      let tangent = dp2perp * duv1.x + dp1perp * duv2.x;
      var bitangent = dp2perp * duv1.y + dp1perp * duv2.y;
      bitangent *= -1.0;

      // construct a scale-invariant frame
      let invMat = 1.0 / sqrt(max(dot(tangent, tangent), dot(bitangent, bitangent)));
      return mat3x3<f32>(tangent * invMat, bitangent * invMat, normal_inWorld);
    }

    fn getTBN(normal_inWorld: vec3f, input: VertexOutput, viewVector: vec3f, texcoord: vec2f, isFront: bool) -> mat3x3<f32> {
      let tbnMat_tangent_to_world = cotangent_frame(normal_inWorld, -viewVector, texcoord, isFront);

      return tbnMat_tangent_to_world;
    }
#endif
