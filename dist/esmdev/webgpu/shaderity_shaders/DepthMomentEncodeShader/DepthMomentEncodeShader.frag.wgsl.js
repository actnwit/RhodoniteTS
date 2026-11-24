// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.frag.wgsl
var code = "/* shaderity: @{definitions} */\n/* shaderity: @{vertexOutput} */\n/* shaderity: @{prerequisites} */\n\n/* shaderity: @{getters} */\n\n@fragment\nfn main(\n  input: VertexOutput\n) -> @location(0) vec4<f32> {\n/* shaderity: @{mainPrerequisites} */\n\n  let depth = input.position.z;\n  let dx = dpdx(depth);\n  let dy = dpdy(depth);\n\n  var rt0: vec4<f32>;\n  rt0.x = depth; // M1\n  rt0.y = sqF32(depth) + 0.25 * (sqF32(dx) + sqF32(dy)); // M2\n  rt0.z = 0.0;\n  rt0.w = 1.0;\n\n  return rt0;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var DepthMomentEncodeShader_frag_default = { code, shaderStage, isFragmentShader };
export {
  code,
  DepthMomentEncodeShader_frag_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL0RlcHRoTW9tZW50RW5jb2RlU2hhZGVyL0RlcHRoTW9tZW50RW5jb2RlU2hhZGVyLmZyYWcud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiLyogc2hhZGVyaXR5OiBAe2RlZmluaXRpb25zfSAqL1xcbi8qIHNoYWRlcml0eTogQHt2ZXJ0ZXhPdXRwdXR9ICovXFxuLyogc2hhZGVyaXR5OiBAe3ByZXJlcXVpc2l0ZXN9ICovXFxuXFxuLyogc2hhZGVyaXR5OiBAe2dldHRlcnN9ICovXFxuXFxuQGZyYWdtZW50XFxuZm4gbWFpbihcXG4gIGlucHV0OiBWZXJ0ZXhPdXRwdXRcXG4pIC0+IEBsb2NhdGlvbigwKSB2ZWM0PGYzMj4ge1xcbi8qIHNoYWRlcml0eTogQHttYWluUHJlcmVxdWlzaXRlc30gKi9cXG5cXG4gIGxldCBkZXB0aCA9IGlucHV0LnBvc2l0aW9uLno7XFxuICBsZXQgZHggPSBkcGR4KGRlcHRoKTtcXG4gIGxldCBkeSA9IGRwZHkoZGVwdGgpO1xcblxcbiAgdmFyIHJ0MDogdmVjNDxmMzI+O1xcbiAgcnQwLnggPSBkZXB0aDsgLy8gTTFcXG4gIHJ0MC55ID0gc3FGMzIoZGVwdGgpICsgMC4yNSAqIChzcUYzMihkeCkgKyBzcUYzMihkeSkpOyAvLyBNMlxcbiAgcnQwLnogPSAwLjA7XFxuICBydDAudyA9IDEuMDtcXG5cXG4gIHJldHVybiBydDA7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFzZixrQkFBYztBQUFXLHVCQUFtQjtBQUExaUIsNkNBQUMsTUFBNmYsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
