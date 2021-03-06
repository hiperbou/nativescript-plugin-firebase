"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var appModule = require("tns-core-modules/application");
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
            var bundle = new android.os.Bundle();
            if (options.parameters !== undefined) {
                for (var p in options.parameters) {
                    var param = options.parameters[p];
                    var validationParamError = analytics_common_1.validateAnalyticsParam(param);
                    if (validationParamError !== undefined) {
                        reject(validationParamError);
                        return;
                    }
                    if (param.value !== undefined) {
                        bundle.putString(param.key, param.value);
                    }
                }
            }
            com.google.firebase.analytics.FirebaseAnalytics.getInstance(appModule.android.context || appModule.getNativeApplication()).logEvent(options.key, bundle);
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
            if (options.key === undefined) {
                reject("Argument 'key' is missing");
                return;
            }
            var bundle = new android.os.Bundle();
            if (options.parameters !== undefined) {
                bundle = buildBundle(options.parameters);
            }
            com.google.firebase.analytics.FirebaseAnalytics.getInstance(appModule.android.context || appModule.getNativeApplication()).logEvent(options.key, bundle);
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
            com.google.firebase.analytics.FirebaseAnalytics.getInstance(appModule.android.context || appModule.getNativeApplication()).setUserId(arg.userId);
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
            com.google.firebase.analytics.FirebaseAnalytics.getInstance(appModule.android.context || appModule.getNativeApplication()).setUserProperty(options.key, options.value);
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
            com.google.firebase.analytics.FirebaseAnalytics.getInstance(appModule.android.context || appModule.getNativeApplication()).setCurrentScreen(appModule.android.foregroundActivity, options.screenName, null);
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
        com.google.firebase.analytics.FirebaseAnalytics.getInstance(appModule.android.context || appModule.getNativeApplication()).setAnalyticsCollectionEnabled(enabled);
    }
}
exports.setAnalyticsCollectionEnabled = setAnalyticsCollectionEnabled;
function setSessionTimeoutDuration(seconds) {
    if (isAnalyticsAvailable()) {
        com.google.firebase.analytics.FirebaseAnalytics.getInstance(appModule.android.context || appModule.getNativeApplication()).setSessionTimeoutDuration(seconds * 1000);
    }
}
exports.setSessionTimeoutDuration = setSessionTimeoutDuration;
function getArrayList(array) {
    var returnArray = new java.util.ArrayList();
    for (var p in array) {
        var param = array[p];
        if (param.parameters !== undefined) {
            var bundle = buildBundle(param.parameters);
            returnArray.add(bundle);
        }
        else {
            console.log("BE CARREFUL, no parameters into your complex event");
        }
    }
    return returnArray;
}
function buildBundle(params) {
    var bundle = new android.os.Bundle();
    for (var p in params) {
        var param = params[p];
        if (param.value !== undefined) {
            if (param.type === "string") {
                bundle.putString(param.key, param.value);
            }
            else if (param.type === "double") {
                bundle.putDouble(param.key, param.value);
            }
            else if (param.type === "float") {
                bundle.putFloat(param.key, param.value);
            }
            else if (param.type === "int") {
                bundle.putInt(param.key, param.value);
            }
            else if (param.type === "long") {
                bundle.putLong(param.key, param.value);
            }
            else if (param.type === "boolean") {
                bundle.putBoolean(param.key, param.value);
            }
            else if (param.type === "array") {
                bundle.putParcelableArrayList(param.key, getArrayList(param.value));
            }
        }
    }
    return bundle;
}
function isAnalyticsAvailable() {
    if (typeof (com.google.firebase.analytics) === "undefined" || typeof (com.google.firebase.analytics.FirebaseAnalytics) === "undefined") {
        console.log(analytics_common_1.ENABLE_ANALYTICS_HINT);
        return false;
    }
    return true;
}
