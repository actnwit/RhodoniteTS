(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkFinished = void 0;
    function checkFinished({ p, count, }) {
        if (p == null && count > 0) {
            p = document.createElement('p');
            p.setAttribute('id', 'rendered');
            p.innerText = 'Rendered.';
            document.body.appendChild(p);
        }
        return [p, count];
    }
    exports.checkFinished = checkFinished;
});
//# sourceMappingURL=testHelpers.js.map