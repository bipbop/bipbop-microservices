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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var net_1 = __importDefault(require("net"));
var Client_1 = require("./Client");
var clients = [];
function createServer(configuration) {
    var server = net_1.default.createServer(function (client) {
        clients.push(new Client_1.Client(client, __assign({ server: server }, configuration)));
    });
    return server;
}
exports.createServer = createServer;
//# sourceMappingURL=index.js.map