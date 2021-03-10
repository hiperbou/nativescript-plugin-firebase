"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var firebase = require("../../firebase");
var functions;
(function (functions) {
    var Functions = (function () {
        function Functions() {
        }
        Functions.prototype.httpsCallable = function (functionName, region) {
            return firebase.functions.httpsCallable(functionName, region);
        };
        return Functions;
    }());
    functions.Functions = Functions;
})(functions = exports.functions || (exports.functions = {}));
