"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ResponseErrorCodes_1 = require("./ResponseErrorCodes");
var ResponseError = /** @class */ (function (_super) {
    __extends(ResponseError, _super);
    function ResponseError(message, code) {
        if (code === void 0) { code = ResponseErrorCodes_1.ResponseErrorCodes.UnknownError; }
        var _this = _super.call(this, message) || this;
        _this.code = ResponseErrorCodes_1.ResponseErrorCodes.UnknownError;
        _this.description = message;
        return _this;
    }
    ResponseError.from = function (e) {
        if (e instanceof ResponseError)
            return e;
        return new ResponseError(e.message);
    };
    return ResponseError;
}(Error));
exports.ResponseError = ResponseError;
//# sourceMappingURL=ResponseError.js.map