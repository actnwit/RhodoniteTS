// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdBox.wgsl
var code = "fn sdBox(position: vec3f, size: vec3f, outDistance: ptr<function, f32>) {\n  let q=abs(position)-size;\n  *outDistance = length(max(q,vec3f(0.0)))+min(max(q.x,max(q.y,q.z)),0.0);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdBox_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdBox_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkQm94Lndnc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcImZuIHNkQm94KHBvc2l0aW9uOiB2ZWMzZiwgc2l6ZTogdmVjM2YsIG91dERpc3RhbmNlOiBwdHI8ZnVuY3Rpb24sIGYzMj4pIHtcXG4gIGxldCBxPWFicyhwb3NpdGlvbiktc2l6ZTtcXG4gICpvdXREaXN0YW5jZSA9IGxlbmd0aChtYXgocSx2ZWMzZigwLjApKSkrbWluKG1heChxLngsbWF4KHEueSxxLnopKSwwLjApO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBMEwsa0JBQWM7QUFBVyx1QkFBbUI7QUFBOU8sc0JBQUMsTUFBaU0sYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
