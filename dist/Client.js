"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var jspack_1 = require("jspack");
var jsonschema_1 = require("jsonschema");
var ReceiveSchema_1 = require("./ReceiveSchema");
var ResponseError_1 = require("./ResponseError");
var ApplicationState;
(function (ApplicationState) {
    ApplicationState[ApplicationState["Connected"] = 0] = "Connected";
    ApplicationState[ApplicationState["ClientSendingJSONSize"] = 1] = "ClientSendingJSONSize";
    ApplicationState[ApplicationState["ClientSendingJSON"] = 2] = "ClientSendingJSON";
    ApplicationState[ApplicationState["Processing"] = 3] = "Processing";
    ApplicationState[ApplicationState["Disconnecting"] = 4] = "Disconnecting";
    ApplicationState[ApplicationState["Disconnected"] = 5] = "Disconnected";
})(ApplicationState = exports.ApplicationState || (exports.ApplicationState = {}));
var Client = /** @class */ (function () {
    function Client(client, configuration) {
        var _this = this;
        this.client = client;
        this.configuration = configuration;
        this.state = {
            ApplicationState: ApplicationState.Connected,
            ApplicationNextState: ApplicationState.ClientSendingJSONSize,
            ExpectedBytes: 4,
            Chunks: []
        };
        this.dataReceiver = function (buffer) { return _this.receiveData(buffer); };
        this.client.on('error', function (e) {
            _this.disconnectError(e);
            _this.configuration.hookError(_this.client, e);
        });
        this.client.on('data', this.dataReceiver);
        this.client.on('close', function () { return _this.changeState(ApplicationState.Disconnected); });
        this.setTimeout();
    }
    Client.prototype.clearTimeout = function () {
        if (this.timeout)
            clearTimeout(this.timeout);
    };
    Client.prototype.setTimeout = function () {
        var _this = this;
        this.clearTimeout();
        if (!this.isConnected())
            return;
        this.timeout = setTimeout(function () {
            _this.disconnectClient();
        }, this.configuration.timeout);
    };
    Client.prototype.changeState = function (state, expectedBytes, expectedNextState) {
        if (expectedBytes === void 0) { expectedBytes = 0; }
        this.state.ApplicationState = state;
        this.state.ExpectedBytes = expectedBytes;
        this.state.ApplicationNextState = expectedNextState || state;
    };
    Client.prototype.writeClient = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if ([ApplicationState.Processing].indexOf(this.state.ApplicationState) !== -1)
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var response = Buffer.from(JSON.stringify(message));
                            var sendSize = Buffer.from(jspack_1.jspack.Pack("<I", [response.length]));
                            _this.client.write(sendSize, function (err) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    _this.client.write(response, function (err) {
                                        if (err)
                                            reject(err);
                                        else
                                            resolve();
                                    });
                                }
                            });
                        })];
                return [2 /*return*/];
            });
        });
    };
    Client.prototype.disconnectClient = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.isConnected())
                    return [2 /*return*/];
                this.changeState(ApplicationState.Disconnecting);
                this.client.off('data', this.dataReceiver);
                return [2 /*return*/, new Promise(function (resolve, reject) { return _this.client.end(function () {
                        _this.changeState(ApplicationState.Disconnected);
                        resolve();
                    }); })];
            });
        });
    };
    Client.prototype.disconnectError = function (error, clientResponse) {
        if (clientResponse === void 0) { clientResponse = false; }
        return __awaiter(this, void 0, void 0, function () {
            var userError;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof error === 'undefined')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.disconnectClient()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        userError = Array.isArray(error) ? error : [error];
                        userError.map(function (e) { return _this.configuration.hookError(_this.client, e); });
                        if (!(clientResponse && userError.length)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.writeClient({
                                errors: userError.map(function (e) { return ResponseError_1.ResponseError.from(e); }),
                                payload: null
                            })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.disconnectClient()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Client.prototype.expectChunk = function (data) {
        var ExpectedBytes = this.state.ExpectedBytes;
        this.state.Chunks.push(data);
        var bufferSize = this.state.Chunks.reduce(function (initialData, chunk) { return initialData + chunk.length; }, 0);
        if (bufferSize < ExpectedBytes) {
            return null;
        }
        this.changeState(this.state.ApplicationNextState, 0);
        var buffer = Buffer.concat(this.state.Chunks, bufferSize);
        this.state.Chunks = [];
        return [buffer.slice(0, ExpectedBytes), buffer.slice(ExpectedBytes)];
    };
    Object.defineProperty(Client.prototype, "services", {
        get: function () {
            var _this = this;
            return __assign({ 'close': {
                    call: function () { return _this.disconnectClient(); },
                    request: {},
                    response: {}
                }, 'index': {
                    call: function () { return ReceiveSchema_1.receiveSchema(_this.configuration.services); },
                    request: {},
                    response: {}
                } }, this.configuration.services);
        },
        enumerable: true,
        configurable: true
    });
    Client.prototype.unsafeClientSendingJSON = function (buffer) {
        return __awaiter(this, void 0, void 0, function () {
            var request, validation, serviceResponse, responseValidation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = JSON.parse(buffer.toString('utf-8'));
                        if (!!request) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.disconnectClient()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        validation = jsonschema_1.validate(request, ReceiveSchema_1.receiveSchema(this.services));
                        if (!validation.valid)
                            return [2 /*return*/, this.disconnectError(validation.errors, true)];
                        return [4 /*yield*/, Promise.resolve(this.services[request.service].call(request.payload))];
                    case 3:
                        serviceResponse = _a.sent();
                        if (this.state.ApplicationState !== ApplicationState.Processing)
                            return [2 /*return*/];
                        responseValidation = jsonschema_1.validate(serviceResponse, this.services[request.service].response);
                        if (!responseValidation.valid) {
                            return [2 /*return*/, this.disconnectError(responseValidation.errors, true)];
                        }
                        return [4 /*yield*/, this.writeClient({ payload: serviceResponse })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Client.prototype.isConnected = function () {
        return [
            ApplicationState.Disconnected,
            ApplicationState.Disconnecting
        ].indexOf(this.state.ApplicationState) == -1;
    };
    Client.prototype.clientSendingJSON = function (buffer) {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.unsafeClientSendingJSON(buffer)];
                    case 1:
                        _a.sent();
                        if (!this.isConnected())
                            return [2 /*return*/];
                        this.changeState(ApplicationState.Connected, 4, ApplicationState.ClientSendingJSONSize);
                        this.client.on('data', this.dataReceiver);
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        try {
                            this.disconnectError(e_1, true);
                        }
                        catch (e) {
                            this.configuration.hookError(this.client, e);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Client.prototype.receiveData = function (data) {
        var chunks = this.expectChunk(data);
        if (!chunks)
            return;
        var buffer = chunks[0], nextBuffer = chunks[1];
        switch (this.state.ApplicationState) {
            case ApplicationState.ClientSendingJSONSize:
                var expectedBytes = jspack_1.jspack.Unpack('<I', buffer, 0).pop() || 0;
                if (expectedBytes > this.configuration.maxPayloadSize)
                    this.disconnectError(new Error('Payload too long'), true);
                this.changeState(ApplicationState.ClientSendingJSON, expectedBytes);
                break;
            case ApplicationState.ClientSendingJSON:
                this.client.off('data', this.dataReceiver);
                this.changeState(ApplicationState.Processing, 0);
                this.clearTimeout();
                this.clientSendingJSON(buffer);
                this.setTimeout();
                break;
        }
        if (nextBuffer.length !== 0)
            this.receiveData(nextBuffer);
    };
    return Client;
}());
exports.Client = Client;
//# sourceMappingURL=Client.js.map