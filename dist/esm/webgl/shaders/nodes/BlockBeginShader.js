import{StandardShaderPart as u}from"../StandardShaderPart.js";var r=class extends u{constructor(i,e,t){super();this.__functionName=i;this.__valueInputs=e;this.__valueOutputs=t}getVertexShaderDefinitions(i){let e=`void ${this.__functionName}(
in bool context,
      `;for(let t=0;t<this.__valueInputs.length;t++){let n=this.__valueInputs[t],o=n.compositionType.getGlslStr(n.componentType);e+=`
        in ${o} value${t},`}for(let t=0;t<this.__valueOutputs.length;t++){let n=this.__valueOutputs[t],o=n.compositionType.getGlslStr(n.componentType);e+=`
        out ${o} outValue${t}${t===this.__valueOutputs.length-1?"":","}`}e+=`) {
`;for(let t=0;t<this.__valueOutputs.length;t++)e+=`
      outValue${t} = value${t};
`;return e+="}",e}getPixelShaderDefinitions(i){return this.getVertexShaderDefinitions(i)}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{r as BlockBeginShader};
