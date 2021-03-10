"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var analytics_common_1 = require("./analytics-common");
function logEvent(options) {
    return new Promise(function (resolve, reject) {
        if (!isAnalyticsAvailable()) {
            reject(analytics_common_1.ENABLE_ANALYTICS_HINT);
            return;
        }
        try {
            var validationError = analytics_common_1.validateAnalyticsKey(options.key);
            if (validationError !== undefined) {
                reject(validationError);
                return;
            }
            var dic = NSMutableDictionary.new();
            if (options.parameters !== undefined) {
                for (var p in options.parameters) {
                    var param = options.parameters[p];
                    var validationParamError = analytics_common_1.validateAnalyticsParam(param);
                    if (validationParamError !== undefined) {
                        reject(validationParamError);
                        return;
                    }
                    if (param.value !== undefined) {
                        dic.setObjectForKey(param.value, param.key);
                    }
                }
            }
            FIRAnalytics.logEventWithNameParameters(options.key, dic);
            resolve();
        }
        catch (ex) {
            console.log("Error in firebase.analytics.logEvent: " + ex);
            reject(ex);
        }
    });
}
exports.logEvent = logEvent;
function logComplexEvent(options) {
    return new Promise(function (resolve, reject) {
        if (!isAnalyticsAvailable()) {
            reject(analytics_common_1.ENABLE_ANALYTICS_HINT);
            return;
        }
        try {
            var dic = NSMutableDictionary.new();
            if (options.parameters !== undefined) {
                for (var p in options.parameters) {
                    var param = options.parameters[p];
                    if (param.type === "array" && param.value !== undefined) {
                        var listArray = [];
                        for (var val in param.value) {
                            var value = param.value[val];
                            if (value.parameters !== undefined) {
                                var dicTemp = NSMutableDictionary.new();
                                for (var i in value.parameters) {
                                    var item = value.parameters[i];
                                    if (item.type !== "array" && item.value !== undefined && item.key !== undefined) {
                                        dicTemp.setObjectForKey(item.value, item.key);
                                    }
                                }
                                listArray.push(dicTemp);
                            }
                        }
                        dic.setObjectForKey(listArray, param.key);
                    }
                    else if (param.type === "string" || param.type === "double" || param.type === "float" || param.type === "int" || param.type === "long" || param.type === "boolean") {
                        dic.setObjectForKey(param.value, param.key);
                    }
                }
            }
            FIRAnalytics.logEventWithNameParameters(options.key, dic);
            resolve();
        }
        catch (ex) {
            console.log("Error in firebase.analytics.logEvent: " + ex);
            reject(ex);
        }
    });
}
exports.logComplexEvent = logComplexEvent;
function setUserId(arg) {
    return new Promise(function (resolve, reject) {
        if (!isAnalyticsAvailable()) {
            reject(analytics_common_1.ENABLE_ANALYTICS_HINT);
            return;
        }
        try {
            if (arg.userId === undefined) {
                reject("Argument 'userId' is missing");
                return;
            }
            FIRAnalytics.setUserID(arg.userId);
            resolve();
        }
        catch (ex) {
            console.log("Error in firebase.analytics.setUserId: " + ex);
            reject(ex);
        }
    });
}
exports.setUserId = setUserId;
function setUserProperty(options) {
    return new Promise(function (resolve, reject) {
        if (!isAnalyticsAvailable()) {
            reject(analytics_common_1.ENABLE_ANALYTICS_HINT);
            return;
        }
        try {
            if (options.key === undefined) {
                reject("Argument 'key' is missing");
                return;
            }
            if (options.value === undefined) {
                reject("Argument 'value' is missing");
                return;
            }
            FIRAnalytics.setUserPropertyStringForName(options.value, options.key);
            resolve();
        }
        catch (ex) {
            console.log("Error in firebase.analytics.setUserProperty: " + ex);
            reject(ex);
        }
    });
}
exports.setUserProperty = setUserProperty;
function setScreenName(options) {
    return new Promise(function (resolve, reject) {
        if (!isAnalyticsAvailable()) {
            reject(analytics_common_1.ENABLE_ANALYTICS_HINT);
            return;
        }
        try {
            if (options.screenName === undefined) {
                reject("Argument 'screenName' is missing");
                return;
            }
            FIRAnalytics.setScreenNameScreenClass(options.screenName, null);
            resolve();
        }
        catch (ex) {
            console.log("Error in firebase.analytics.setScreenName: " + ex);
            reject(ex);
        }
    });
}
exports.setScreenName = setScreenName;
function setAnalyticsCollectionEnabled(enabled) {
    if (isAnalyticsAvailable()) {
        FIRAnalytics.setAnalyticsCollectionEnabled(enabled);
    }
}
exports.setAnalyticsCollectionEnabled = setAnalyticsCollectionEnabled;
function setSessionTimeoutDuration(seconds) {
    if (isAnalyticsAvailable()) {
        FIRAnalytics.setSessionTimeoutInterval(seconds);
    }
}
exports.setSessionTimeoutDuration = setSessionTimeoutDuration;
function iOSHandleOpenURL(url) {
    if (isAnalyticsAvailable()) {
        FIRAnalytics.handleOpenURL(url);
    }
}
exports.iOSHandleOpenURL = iOSHandleOpenURL;
function isAnalyticsAvailable() {
    if (typeof (FIRAnalytics) === "undefined") {
        console.log(analytics_common_1.ENABLE_ANALYTICS_HINT);
        return false;
    }
    return true;
}
