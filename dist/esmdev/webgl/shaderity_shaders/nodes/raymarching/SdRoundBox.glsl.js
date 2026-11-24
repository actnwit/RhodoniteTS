// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/SdRoundBox.glsl
var code = "void sdRoundBox(in vec3 position, in vec3 size, in float radius, out float outDistance) {\n  vec3 q = abs(position) - size;\n  outDistance = length(max(q, 0.0)) - radius;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdRoundBox_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdRoundBox_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvU2RSb3VuZEJveC5nbHNsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJ2b2lkIHNkUm91bmRCb3goaW4gdmVjMyBwb3NpdGlvbiwgaW4gdmVjMyBzaXplLCBpbiBmbG9hdCByYWRpdXMsIG91dCBmbG9hdCBvdXREaXN0YW5jZSkge1xcbiAgdmVjMyBxID0gYWJzKHBvc2l0aW9uKSAtIHNpemU7XFxuICBvdXREaXN0YW5jZSA9IGxlbmd0aChtYXgocSwgMC4wKSkgLSByYWRpdXM7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFrTCxrQkFBYztBQUFXLHVCQUFtQjtBQUF0TywyQkFBQyxNQUF5TCxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==
