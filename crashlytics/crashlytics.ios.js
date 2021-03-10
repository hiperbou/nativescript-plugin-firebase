"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crashlytics_common_1 = require("./crashlytics-common");
function sendCrashLog(exception) {
    if (isCrashlyticsAvailable()) {
        Crashlytics.sharedInstance().recordError(exception);
    }
}
exports.sendCrashLog = sendCrashLog;
function log(msg, tag, priority) {
    if (isCrashlyticsAvailable()) {
        if (tag) {
            TNSCrashlyticsLoggerWrapper.log(tag + " - " + msg);
        }
        else {
            TNSCrashlyticsLoggerWrapper.log(msg);
        }
    }
}
exports.log = log;
function setString(key, value) {
    if (isCrashlyticsAvailable()) {
        Crashlytics.sharedInstance().setObjectValueForKey(value, key);
    }
}
exports.setString = setString;
function setBool(key, value) {
    if (isCrashlyticsAvailable()) {
        Crashlytics.sharedInstance().setBoolValueForKey(value, key);
    }
}
exports.setBool = setBool;
function setFloat(key, value) {
    if (isCrashlyticsAvailable()) {
        Crashlytics.sharedInstance().setFloatValueForKey(value, key);
    }
}
exports.setFloat = setFloat;
function setInt(key, value) {
    if (isCrashlyticsAvailable()) {
        Crashlytics.sharedInstance().setIntValueForKey(value, key);
    }
}
exports.setInt = setInt;
function setDouble(key, value) {
    if (isCrashlyticsAvailable()) {
        Crashlytics.sharedInstance().setFloatValueForKey(value, key);
    }
}
exports.setDouble = setDouble;
function setUserId(id) {
    if (isCrashlyticsAvailable()) {
        Crashlytics.sharedInstance().setUserIdentifier(id);
    }
}
exports.setUserId = setUserId;
function crash() {
    if (isCrashlyticsAvailable()) {
        Crashlytics.sharedInstance().crash();
    }
    Fabric.with(NSArray.arrayWithObject(Crashlytics.class()));
}
exports.crash = crash;
function setCrashlyticsCollectionEnabled(enabled) {
    if (isCrashlyticsAvailable()) {
        Fabric.with(NSArray.arrayWithObject(Crashlytics.class()));
    }
}
exports.setCrashlyticsCollectionEnabled = setCrashlyticsCollectionEnabled;
function isCrashlyticsAvailable() {
    if (typeof (Crashlytics) === "undefined") {
        console.log(crashlytics_common_1.ENABLE_CRASHLYTICS_HINT);
        return false;
    }
    return true;
}
