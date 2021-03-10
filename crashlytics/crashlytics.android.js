"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crashlytics_common_1 = require("./crashlytics-common");
var appModule = require("tns-core-modules/application");
function sendCrashLog(exception) {
    if (isCrashlyticsAvailable()) {
        com.crashlytics.android.Crashlytics.logException(exception);
    }
}
exports.sendCrashLog = sendCrashLog;
function log(msg, tag, priority) {
    if (isCrashlyticsAvailable()) {
        if (tag && priority) {
            com.crashlytics.android.Crashlytics.log(priority, tag, msg);
        }
        else {
            com.crashlytics.android.Crashlytics.log(msg);
        }
    }
}
exports.log = log;
function setString(key, value) {
    if (isCrashlyticsAvailable()) {
        com.crashlytics.android.Crashlytics.setString(key, value);
    }
}
exports.setString = setString;
function setBool(key, value) {
    if (isCrashlyticsAvailable()) {
        com.crashlytics.android.Crashlytics.setBool(key, value);
    }
}
exports.setBool = setBool;
function setFloat(key, value) {
    if (isCrashlyticsAvailable()) {
        com.crashlytics.android.Crashlytics.setFloat(key, value);
    }
}
exports.setFloat = setFloat;
function setInt(key, value) {
    if (isCrashlyticsAvailable()) {
        com.crashlytics.android.Crashlytics.setInt(key, value);
    }
}
exports.setInt = setInt;
function setDouble(key, value) {
    if (isCrashlyticsAvailable()) {
        com.crashlytics.android.Crashlytics.setDouble(key, value);
    }
}
exports.setDouble = setDouble;
function setUserId(id) {
    if (isCrashlyticsAvailable()) {
        com.crashlytics.android.Crashlytics.setUserIdentifier(id);
    }
}
exports.setUserId = setUserId;
function crash() {
    if (isCrashlyticsAvailable()) {
        com.crashlytics.android.Crashlytics.getInstance().crash();
    }
}
exports.crash = crash;
function setCrashlyticsCollectionEnabled(enabled) {
    if (isCrashlyticsAvailable()) {
        io.fabric.sdk.android.Fabric.with(appModule.getNativeApplication(), [new com.crashlytics.android.Crashlytics()]);
    }
}
exports.setCrashlyticsCollectionEnabled = setCrashlyticsCollectionEnabled;
function isCrashlyticsAvailable() {
    if (typeof (com.crashlytics) === "undefined" || typeof (com.crashlytics.android.Crashlytics) === "undefined") {
        console.log(crashlytics_common_1.ENABLE_CRASHLYTICS_HINT);
        return false;
    }
    return true;
}
