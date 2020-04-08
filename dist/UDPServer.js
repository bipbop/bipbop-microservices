"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ReceiveSchema_1 = require("./ReceiveSchema");
var jsonschema_1 = require("jsonschema");
var ResponseError_1 = require("./ResponseError");
var jspack_1 = require("jspack");
function udpServer(services, udpSocket, hookError) {
    var _this = this;
    var schema = ReceiveSchema_1.receiveSchema(services);
    udpSocket.on('message', function (msg, clientInformation) { return __awaiter(_this, void 0, void 0, function () {
        var payload, respond, respondError, content, contentValidation, response, responseValidation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = msg.slice(4);
                    respond = function (response) {
                        var responseString = Buffer.from(JSON.stringify(response));
                        var responseBuffer = Buffer.concat([
                            Buffer.from(jspack_1.jspack.Pack("<I", [responseString.length])) /* crc32 request */,
                            responseString /* response */
                        ]);
                        udpSocket.send(responseBuffer, clientInformation.port, clientInformation.address, function (error, bytes) {
                            if (!hookError)
                                return;
                            if (error)
                                hookError(clientInformation, error);
                            if (bytes !== responseBuffer.length) {
                                hookError(clientInformation, new Error("wrong byte size, expected " + responseBuffer.length + ", writed " + bytes));
                            }
                        });
                    };
                    respondError = function (e) {
                        var useError = Array.isArray(e) ? e.map(function (e) { return ResponseError_1.ResponseError.from(e); }) : [ResponseError_1.ResponseError.from(e)];
                        if (hookError)
                            useError.forEach(function (e) { return hookError(clientInformation, e); });
                        respond({ errors: useError, payload: null });
                    };
                    content = JSON.parse(payload.toString('utf-8'));
                    contentValidation = jsonschema_1.validate(content, schema);
                    if (!contentValidation.valid) {
                        respondError(contentValidation.errors);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, Promise.resolve(services[content.service].call(content.payload))];
                case 1:
                    response = _a.sent();
                    responseValidation = jsonschema_1.validate(response, services[content.service].response);
                    if (!responseValidation.valid) {
                        respondError(responseValidation.errors);
                        return [2 /*return*/];
                    }
                    respond({ payload: response });
                    return [2 /*return*/];
            }
        });
    }); });
}
exports.udpServer = udpServer;
//# sourceMappingURL=UDPServer.js.map