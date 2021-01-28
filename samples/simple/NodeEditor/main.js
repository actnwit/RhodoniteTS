(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../../dist/esm/foundation/definitions/ComponentType", "../../../dist/esm/foundation/definitions/CompositionType"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ComponentType_1 = require("../../../dist/esm/foundation/definitions/ComponentType");
    const CompositionType_1 = require("../../../dist/esm/foundation/definitions/CompositionType");
    let p;
    (async () => {
        await Rn.ModuleManager.getInstance().loadModule('webgl');
        Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1);
        Rn.Material.registerMaterial('MyMaterial', []);
        const material = Rn.Material.createMaterial('MyMaterial');
        const constant1 = new Rn.ConstantVariableShaderNode(Rn.CompositionType.Vec4, Rn.ComponentType.Float);
        constant1.setDefaultInputValue('value', new Rn.Vector4(1, 2, 3, 4));
        const constant2 = new Rn.ConstantVariableShaderNode(Rn.CompositionType.Vec4, Rn.ComponentType.Float);
        constant2.setDefaultInputValue('value', new Rn.Vector4(4, 3, 2, 1));
        const addShaderNode = new Rn.AddShaderNode(CompositionType_1.CompositionType.Vec4, ComponentType_1.ComponentType.Float);
        addShaderNode.addInputConnection(constant1, 'outValue', 'lhs');
        addShaderNode.addInputConnection(constant2, 'outValue', 'rhs');
        const outPositionShaderNode = new Rn.OutPositionShaderNode();
        const outColorShaderNode = new Rn.OutColorShaderNode();
        outPositionShaderNode.addInputConnection(addShaderNode, 'outValue', 'inPosition');
        outColorShaderNode.addInputConnection(constant2, 'outValue', 'inColor');
        const vertexRet = Rn.ShaderGraphResolver.createVertexShaderCode([outPositionShaderNode, addShaderNode, constant1, constant2]);
        const pixelRet = Rn.ShaderGraphResolver.createPixelShaderCode([outColorShaderNode, addShaderNode, constant1, constant2]);
        const rnMaterial = Rn.MaterialHelper.recreateCustomMaterial(vertexRet.shader, pixelRet.shader);
        // const returnValues = material.createProgramString();
        // console.log(returnValues.pixelShader)
    })();
});
//# sourceMappingURL=main.js.map