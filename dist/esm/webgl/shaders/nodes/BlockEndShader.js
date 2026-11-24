import{StandardShaderPart as u}from"../StandardShaderPart.js";var r=class extends u{constructor(n,e,t){super();this.__functionName=n;this.__valueInputs=e;this.__valueOutputs=t}getVertexShaderDefinitions(n){let e=`void ${this.__functionName}(`;for(let t=0;t<this.__valueInputs.length;t++){let i=this.__valueInputs[t],o=i.compositionType.getGlslStr(i.componentType);e+=`
        in ${o} value${t},`}for(let t=0;t<this.__valueOutputs.length;t++){let i=this.__valueOutputs[t],o=i.compositionType.getGlslStr(i.componentType);e+=`
        out ${o} outValue${t}${t===this.__valueOutputs.length-1?"":","}`}e+=`) {
`;for(let t=0;t<this.__valueOutputs.length;t++)e+=`
      outValue${t} = value${t};
`;return e+="}",e}getPixelShaderDefinitions(n){return this.getVertexShaderDefinitions(n)}get attributeNames(){return[]}get attributeSemantics(){return[]}get attributeCompositions(){return[]}};export{r as BlockEndShader};
