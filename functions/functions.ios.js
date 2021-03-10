"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../utils");
var functions;
function getFunctions(region) {
    if (!functions) {
        functions = region ? FIRFunctions.functionsForRegion(region) : FIRFunctions.functions();
    }
    return functions;
}
function httpsCallable(functionName, region) {
    var functions = getFunctions(region);
    return function (data) { return new Promise(function (resolve, reject) {
        var callable = functions.HTTPSCallableWithName(functionName);
        var handleCompletion = function (result, err) {
            if (err) {
                reject(err.localizedDescription);
                return;
            }
            if (result) {
                resolve(utils_1.firebaseUtils.toJsObject(result.data));
            }
        };
        if (data) {
            callable.callWithObjectCompletion(data, handleCompletion);
        }
        else {
            callable.callWithCompletion(handleCompletion);
        }
    }); };
}
exports.httpsCallable = httpsCallable;
function useFunctionsEmulator(origin) {
    var functions = getFunctions();
    functions.useFunctionsEmulatorOrigin(origin);
}
exports.useFunctionsEmulator = useFunctionsEmulator;
