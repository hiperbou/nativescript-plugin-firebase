"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../utils");
function startTrace(name) {
    return new FirebaseTrace(FIRPerformance.startTraceWithName(name));
}
exports.startTrace = startTrace;
function startHttpMetric(url, method) {
    var httpMetric = FIRHTTPMetric.alloc().initWithURLHTTPMethod(NSURL.URLWithString(url), getHttpMethodFromString(method));
    httpMetric.start();
    return new FirebaseHttpMetric(httpMetric);
}
exports.startHttpMetric = startHttpMetric;
var FirebaseTrace = (function () {
    function FirebaseTrace(nativeTrace) {
        this.nativeTrace = nativeTrace;
    }
    FirebaseTrace.prototype.setValue = function (attribute, value) {
        this.nativeTrace.setValueForAttribute(value, attribute);
    };
    FirebaseTrace.prototype.getValue = function (attribute) {
        return this.nativeTrace.valueForAttribute(attribute);
    };
    FirebaseTrace.prototype.getAttributes = function () {
        return utils_1.firebaseUtils.toJsObject(this.nativeTrace.attributes);
    };
    FirebaseTrace.prototype.removeAttribute = function (attribute) {
        this.nativeTrace.removeAttribute(attribute);
    };
    FirebaseTrace.prototype.incrementMetric = function (metric, by) {
        this.nativeTrace.incrementMetricByInt(metric, by);
    };
    FirebaseTrace.prototype.stop = function () {
        this.nativeTrace.stop();
    };
    return FirebaseTrace;
}());
exports.FirebaseTrace = FirebaseTrace;
var FirebaseHttpMetric = (function () {
    function FirebaseHttpMetric(nativeHttpMetric) {
        this.nativeHttpMetric = nativeHttpMetric;
    }
    FirebaseHttpMetric.prototype.setRequestPayloadSize = function (size) {
        this.nativeHttpMetric.requestPayloadSize = size;
    };
    FirebaseHttpMetric.prototype.setHttpResponseCode = function (responseCode) {
        this.nativeHttpMetric.responseCode = responseCode;
    };
    FirebaseHttpMetric.prototype.stop = function () {
        this.nativeHttpMetric.stop();
    };
    return FirebaseHttpMetric;
}());
exports.FirebaseHttpMetric = FirebaseHttpMetric;
function getHttpMethodFromString(method) {
    switch (method) {
        case 'GET':
            return 0;
        case 'PUT':
            return 1;
        case 'POST':
            return 2;
        case 'DELETE':
            return 3;
        case 'HEAD':
            return 4;
        case 'PATCH':
            return 5;
        case 'OPTIONS':
            return 6;
        default:
            return null;
    }
}
