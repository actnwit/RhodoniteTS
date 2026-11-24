// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/SdBox.glsl
var code = "void sdBox(in vec3 position, in vec3 size, out float outDistance) {\n  vec3 q=abs(position)-size;\n  outDistance = length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdBox_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdBox_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvU2RCb3guZ2xzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwidm9pZCBzZEJveChpbiB2ZWMzIHBvc2l0aW9uLCBpbiB2ZWMzIHNpemUsIG91dCBmbG9hdCBvdXREaXN0YW5jZSkge1xcbiAgdmVjMyBxPWFicyhwb3NpdGlvbiktc2l6ZTtcXG4gIG91dERpc3RhbmNlID0gbGVuZ3RoKG1heChxLDAuKSkrbWluKG1heChxLngsbWF4KHEueSxxLnopKSwwLik7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUEySyxrQkFBYztBQUFXLHVCQUFtQjtBQUEvTixzQkFBQyxNQUFrTCxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==
