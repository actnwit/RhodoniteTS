import{r as s}from"./index.BVOCwoKb.js";var g={exports:{}},u={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var h;function R(){if(h)return u;h=1;var o=Symbol.for("react.transitional.element"),t=Symbol.for("react.fragment");function d(p,e,r){var i=null;if(r!==void 0&&(i=""+r),e.key!==void 0&&(i=""+e.key),"key"in e){r={};for(var c in e)c!=="key"&&(r[c]=e[c])}else r=e;return e=r.ref,{$$typeof:o,type:p,key:i,ref:e!==void 0?e:null,props:r}}return u.Fragment=t,u.jsx=d,u.jsxs=d,u}var b;function j(){return b||(b=1,g.exports=R()),g.exports}var l=j();const v={ja:"日本語",en:"English"},x="ja",y={ja:{"hero.description":"RhodoniteTSは、WebGL2/WebGPUをベースにした高性能な3Dグラフィックスライブラリです。モダンなTypeScriptで書かれ、直感的なAPIを提供します。","hero.docs":"ドキュメントを読む","hero.github":"GitHubで見る","hero.discord":"Discordに参加","features.performance.title":"高性能","features.performance.description":"WebGL2/WebGPUを活用した最適化された3Dレンダリング","features.typescript.title":"TypeScript","features.typescript.description":"型安全で開発しやすいAPI設計","features.modern.title":"モダン","features.modern.description":"最新のWeb技術を活用した実装","nav.home":"ホーム","nav.docs":"ドキュメント","nav.tutorials":"チュートリアル","nav.api":"APIリファレンス","nav.github":"GitHub"},en:{"hero.description":"RhodoniteTS is a high-performance 3D graphics library based on WebGL2/WebGPU. Written in modern TypeScript, it provides an intuitive API.","hero.docs":"Read Documentation","hero.github":"View on GitHub","hero.discord":"Join Discord","features.performance.title":"High Performance","features.performance.description":"Optimized 3D rendering leveraging WebGL2/WebGPU","features.typescript.title":"TypeScript","features.typescript.description":"Type-safe and developer-friendly API design","features.modern.title":"Modern","features.modern.description":"Implementation utilizing the latest web technologies","nav.home":"Home","nav.docs":"Documents","nav.tutorials":"Tutorials","nav.api":"API Reference","nav.github":"GitHub"}};function E(o){const[,t]=o.pathname.split("/");return console.log("URL pathname:",o.pathname),console.log("Extracted lang:",t),console.log("Available langs:",Object.keys(y)),t&&t in y?(console.log("Using lang:",t),t):(console.log("Using default lang:",x),x)}const P=()=>{const[o,t]=s.useState(!1),[d,p]=s.useState(""),[e,r]=s.useState(""),[i,c]=s.useState(""),f=s.useRef(null),m=s.useRef(null);return s.useEffect(()=>{const n=E(new URL(window.location.href)),a=window.location.pathname.split("/").slice(2).join("/");p(n),r(a),c(v[n])},[]),s.useEffect(()=>{const n=a=>{f.current&&m.current&&!f.current.contains(a.target)&&!m.current.contains(a.target)&&t(!1)};return document.addEventListener("click",n),()=>{document.removeEventListener("click",n)}},[]),l.jsxs("div",{className:"relative p-4 flex justify-end",children:[l.jsxs("button",{ref:f,className:"flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-base cursor-pointer shadow-sm hover:shadow-md",onClick:()=>t(!o),children:[i,l.jsx("span",{className:"text-sm transition-transform duration-200 ease-snappy",style:{transform:o?"rotate(180deg)":"rotate(0deg)"},children:"▼"})]}),l.jsx("div",{ref:m,className:`
          absolute top-full right-4 mt-1 
          bg-white/95 backdrop-blur-sm
          border border-gray-200/80 rounded-md p-2 
          flex flex-col gap-1 min-w-[120px] 
          shadow-lg shadow-gray-200/50
          z-50
          transition-all duration-200 ease-snappy
          ${o?"opacity-100 translate-y-0":"opacity-0 -translate-y-2 pointer-events-none"}
        `,children:Object.entries(v).map(([n,a])=>l.jsx("a",{href:`/${n}/${e}`,className:`
              px-3 py-2 rounded-md 
              text-gray-600 hover:text-gray-900 
              hover:bg-gray-50/80
              transition-colors duration-200 ease-snappy
              block
              ${d===n?"text-indigo-600 font-medium bg-indigo-50/50 hover:bg-indigo-50":""}
            `,children:a},n))})]})};export{P as LanguageSwitcher};
