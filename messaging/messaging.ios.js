"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nativescript_shared_notification_delegate_1 = require("nativescript-shared-notification-delegate");
var applicationSettings = require("tns-core-modules/application-settings");
var application = require("tns-core-modules/application/application");
var platform_1 = require("tns-core-modules/platform/platform");
var firebase_common_1 = require("../firebase-common");
var utils_1 = require("../utils");
var _notificationActionTakenCallback;
var _pendingNotifications = [];
var _pendingActionTakenNotifications = [];
var _pushToken;
var _receivedPushTokenCallback;
var _receivedNotificationCallback;
var _registerForRemoteNotificationsRanThisSession = false;
var _userNotificationCenterDelegateObserver;
var _firebaseRemoteMessageDelegate;
var _showNotifications = true;
var _showNotificationsWhenInForeground = false;
var _autoClearBadge = true;
var _resolveWhenDidRegisterForNotifications;
var _rejectWhenDidFailToRegisterForNotifications;
var NOTIFICATIONS_REGISTRATION_KEY = "Firebase-RegisterForRemoteNotifications";
function initFirebaseMessaging(options) {
    if (!options) {
        return;
    }
    _showNotifications = options.showNotifications === undefined ? _showNotifications : !!options.showNotifications;
    _showNotificationsWhenInForeground = options.showNotificationsWhenInForeground === undefined ? _showNotificationsWhenInForeground : !!options.showNotificationsWhenInForeground;
    _autoClearBadge = options.autoClearBadge === undefined ? _autoClearBadge : !!options.autoClearBadge;
    if (options.onMessageReceivedCallback !== undefined) {
        addOnMessageReceivedCallback(options.onMessageReceivedCallback);
    }
    if (options.onPushTokenReceivedCallback !== undefined) {
        addOnPushTokenReceivedCallback(options.onPushTokenReceivedCallback);
    }
}
exports.initFirebaseMessaging = initFirebaseMessaging;
function addOnMessageReceivedCallback(callback) {
    return new Promise(function (resolve, reject) {
        try {
            applicationSettings.setBoolean(NOTIFICATIONS_REGISTRATION_KEY, true);
            _receivedNotificationCallback = callback;
            _registerForRemoteNotifications(resolve, reject);
            _processPendingNotifications();
            resolve();
        }
        catch (ex) {
            console.log("Error in messaging.addOnMessageReceivedCallback: " + ex);
            reject(ex);
        }
    });
}
exports.addOnMessageReceivedCallback = addOnMessageReceivedCallback;
function getCurrentPushToken() {
    return new Promise(function (resolve, reject) {
        try {
            if (typeof (FIRMessaging) !== "undefined") {
                resolve(FIRMessaging.messaging().FCMToken);
            }
            else {
                resolve(_pushToken);
            }
        }
        catch (ex) {
            console.log("Error in messaging.getCurrentPushToken: " + ex);
            reject(ex);
        }
    });
}
exports.getCurrentPushToken = getCurrentPushToken;
function registerForPushNotifications(options) {
    return new Promise(function (resolve, reject) {
        try {
            initFirebaseMessaging(options);
            _registerForRemoteNotificationsRanThisSession = false;
            _registerForRemoteNotifications(resolve, reject);
        }
        catch (ex) {
            console.log("Error in messaging.registerForPushNotifications: " + ex);
            reject(ex);
        }
    });
}
exports.registerForPushNotifications = registerForPushNotifications;
function unregisterForPushNotifications() {
    return new Promise(function (resolve, reject) {
        try {
            UIApplication.sharedApplication.unregisterForRemoteNotifications();
            resolve();
        }
        catch (ex) {
            console.log("Error in messaging.unregisterForPushNotifications: " + ex);
            reject(ex);
        }
    });
}
exports.unregisterForPushNotifications = unregisterForPushNotifications;
function handleRemoteNotification(app, userInfo) {
    var userInfoJSON = utils_1.firebaseUtils.toJsObject(userInfo);
    var aps = userInfo.objectForKey("aps");
    if (aps !== null) {
        var alrt = aps.objectForKey("alert");
        if (alrt !== null && alrt.objectForKey) {
            userInfoJSON.title = alrt.objectForKey("title");
            userInfoJSON.body = alrt.objectForKey("body");
        }
    }
    userInfoJSON.foreground = app.applicationState === 0;
    updateUserInfo(userInfoJSON);
    _pendingNotifications.push(userInfoJSON);
    if (_receivedNotificationCallback) {
        _processPendingNotifications();
    }
}
exports.handleRemoteNotification = handleRemoteNotification;
function addOnPushTokenReceivedCallback(callback) {
    return new Promise(function (resolve, reject) {
        try {
            _receivedPushTokenCallback = callback;
            if (_pushToken) {
                callback(_pushToken);
            }
            applicationSettings.setBoolean(NOTIFICATIONS_REGISTRATION_KEY, true);
            _registerForRemoteNotifications();
            _processPendingNotifications();
            resolve();
        }
        catch (ex) {
            console.log("Error in messaging.addOnPushTokenReceivedCallback: " + ex);
            reject(ex);
        }
    });
}
exports.addOnPushTokenReceivedCallback = addOnPushTokenReceivedCallback;
function addBackgroundRemoteNotificationHandler(appDelegate) {
    appDelegate.prototype.applicationDidRegisterForRemoteNotificationsWithDeviceToken = function (application, deviceToken) {
        if (areNotificationsEnabled()) {
            _resolveWhenDidRegisterForNotifications && _resolveWhenDidRegisterForNotifications();
        }
        else {
            _rejectWhenDidFailToRegisterForNotifications && _rejectWhenDidFailToRegisterForNotifications();
        }
        if (typeof (FIRMessaging) !== "undefined") {
            FIRMessaging.messaging().APNSToken = deviceToken;
        }
        else {
            var token = deviceToken.debugDescription.replace(/[< >]/g, "");
            _pushToken = token;
            if (_receivedPushTokenCallback) {
                _receivedPushTokenCallback(token);
            }
        }
    };
    appDelegate.prototype.applicationDidFailToRegisterForRemoteNotificationsWithError = function (application, error) {
        if (error.localizedDescription.indexOf("not supported in the simulator") > -1) {
            _resolveWhenDidRegisterForNotifications && _resolveWhenDidRegisterForNotifications();
        }
        else {
            _rejectWhenDidFailToRegisterForNotifications && _rejectWhenDidFailToRegisterForNotifications(error.localizedDescription);
        }
    };
    appDelegate.prototype.applicationDidReceiveRemoteNotificationFetchCompletionHandler = function (app, notification, completionHandler) {
        if (typeof (FIRAuth) !== "undefined") {
            if (firebase_common_1.firebase._configured && FIRAuth.auth().canHandleNotification(notification)) {
                completionHandler(1);
                return;
            }
        }
        completionHandler(0);
        handleRemoteNotification(app, notification);
    };
}
exports.addBackgroundRemoteNotificationHandler = addBackgroundRemoteNotificationHandler;
function registerForInteractivePush(model) {
    var nativeActions = [];
    model.iosSettings.interactiveSettings.actions.forEach((function (action) {
        var notificationActionOptions = action.options ? action.options.valueOf() : UNNotificationActionOptionNone;
        var actionType = action.type || "button";
        var nativeAction;
        if (actionType === "input") {
            nativeAction = UNTextInputNotificationAction.actionWithIdentifierTitleOptionsTextInputButtonTitleTextInputPlaceholder(action.identifier, action.title, notificationActionOptions, action.submitLabel || "Submit", action.placeholder);
        }
        else if (actionType === "button") {
            nativeAction = UNNotificationAction.actionWithIdentifierTitleOptions(action.identifier, action.title, notificationActionOptions);
        }
        else {
            console.log("Unsupported action type: " + action.type);
        }
        nativeActions.push(nativeAction);
    }));
    var actions = NSArray.arrayWithArray(nativeActions);
    var nativeCategories = [];
    model.iosSettings.interactiveSettings.categories.forEach(function (category) {
        var nativeCategory = UNNotificationCategory.categoryWithIdentifierActionsIntentIdentifiersOptions(category.identifier, actions, null, null);
        nativeCategories.push(nativeCategory);
    });
    var nsSetCategories = new NSSet(nativeCategories);
    UNUserNotificationCenter.currentNotificationCenter().setNotificationCategories(nsSetCategories);
    if (model.onNotificationActionTakenCallback) {
        _addOnNotificationActionTakenCallback(model.onNotificationActionTakenCallback);
    }
}
exports.registerForInteractivePush = registerForInteractivePush;
function prepAppDelegate() {
    _addObserver("com.firebase.iid.notif.refresh-token", function (notification) { return exports.onTokenRefreshNotification(notification.object); });
    _addObserver(UIApplicationDidFinishLaunchingNotification, function (appNotification) {
        if (applicationSettings.getBoolean(NOTIFICATIONS_REGISTRATION_KEY, false)) {
            _registerForRemoteNotifications();
        }
    });
    _addObserver(UIApplicationDidBecomeActiveNotification, function (appNotification) {
        _processPendingNotifications();
        if (typeof (FIRMessaging) !== "undefined") {
            FIRMessaging.messaging().shouldEstablishDirectChannel = true;
        }
    });
}
exports.prepAppDelegate = prepAppDelegate;
function subscribeToTopic(topicName) {
    return new Promise(function (resolve, reject) {
        try {
            if (typeof (FIRMessaging) === "undefined") {
                reject("Enable FIRMessaging in Podfile first");
                return;
            }
            FIRMessaging.messaging().subscribeToTopicCompletion(topicName, function (error) {
                error ? reject(error.localizedDescription) : resolve();
            });
        }
        catch (ex) {
            console.log("Error in messaging.subscribeToTopic: " + ex);
            reject(ex);
        }
    });
}
exports.subscribeToTopic = subscribeToTopic;
function unsubscribeFromTopic(topicName) {
    return new Promise(function (resolve, reject) {
        try {
            if (typeof (FIRMessaging) === "undefined") {
                reject("Enable FIRMessaging in Podfile first");
                return;
            }
            FIRMessaging.messaging().unsubscribeFromTopicCompletion(topicName, function (error) {
                error ? reject(error.localizedDescription) : resolve();
            });
        }
        catch (ex) {
            console.log("Error in messaging.unsubscribeFromTopic: " + ex);
            reject(ex);
        }
    });
}
exports.unsubscribeFromTopic = unsubscribeFromTopic;
exports.onTokenRefreshNotification = function (token) {
    _pushToken = token;
    if (_receivedPushTokenCallback) {
        _receivedPushTokenCallback(token);
    }
};
var IosInteractivePushSettings = (function () {
    function IosInteractivePushSettings() {
    }
    return IosInteractivePushSettings;
}());
exports.IosInteractivePushSettings = IosInteractivePushSettings;
var IosInteractiveNotificationActionOptions;
(function (IosInteractiveNotificationActionOptions) {
    IosInteractiveNotificationActionOptions[IosInteractiveNotificationActionOptions["authenticationRequired"] = 1] = "authenticationRequired";
    IosInteractiveNotificationActionOptions[IosInteractiveNotificationActionOptions["destructive"] = 2] = "destructive";
    IosInteractiveNotificationActionOptions[IosInteractiveNotificationActionOptions["foreground"] = 4] = "foreground";
})(IosInteractiveNotificationActionOptions = exports.IosInteractiveNotificationActionOptions || (exports.IosInteractiveNotificationActionOptions = {}));
var IosPushSettings = (function () {
    function IosPushSettings() {
    }
    return IosPushSettings;
}());
exports.IosPushSettings = IosPushSettings;
var PushNotificationModel = (function () {
    function PushNotificationModel() {
    }
    return PushNotificationModel;
}());
exports.PushNotificationModel = PushNotificationModel;
var NotificationActionResponse = (function () {
    function NotificationActionResponse() {
    }
    return NotificationActionResponse;
}());
exports.NotificationActionResponse = NotificationActionResponse;
function areNotificationsEnabled() {
    return UIApplication.sharedApplication.currentUserNotificationSettings.types > 0;
}
exports.areNotificationsEnabled = areNotificationsEnabled;
var updateUserInfo = function (userInfoJSON) {
    if (userInfoJSON.aps && userInfoJSON.aps.alert) {
        userInfoJSON.title = userInfoJSON.aps.alert.title;
        userInfoJSON.body = userInfoJSON.aps.alert.body;
    }
    if (!userInfoJSON.hasOwnProperty("data")) {
        userInfoJSON.data = {};
    }
    Object.keys(userInfoJSON).forEach(function (key) {
        if (key !== "data")
            userInfoJSON.data[key] = userInfoJSON[key];
    });
    userInfoJSON.aps = undefined;
};
function _registerForRemoteNotifications(resolve, reject) {
    var app = UIApplication.sharedApplication;
    if (!app) {
        application.on("launch", function () { return _registerForRemoteNotifications(resolve, reject); });
        return;
    }
    if (_registerForRemoteNotificationsRanThisSession) {
        resolve && resolve();
        return;
    }
    _registerForRemoteNotificationsRanThisSession = true;
    _resolveWhenDidRegisterForNotifications = resolve;
    _rejectWhenDidFailToRegisterForNotifications = reject;
    if (parseInt(platform_1.device.osVersion) >= 10) {
        var authorizationOptions = 4 | 2 | 1;
        UNUserNotificationCenter.currentNotificationCenter().requestAuthorizationWithOptionsCompletionHandler(authorizationOptions, function (granted, error) {
            if (!error) {
                if (app === null) {
                    app = UIApplication.sharedApplication;
                }
                if (app !== null) {
                    utils_1.firebaseUtils.invokeOnRunLoop(function () { return app.registerForRemoteNotifications(); });
                }
            }
            else {
                console.log("Error requesting push notification auth: " + error);
                reject && reject(error.localizedDescription);
            }
        });
        if (_showNotifications) {
            _userNotificationCenterDelegateObserver = new FirebaseNotificationDelegateObserverImpl(function (unnotification, actionIdentifier, inputText) {
                var userInfo = unnotification.request.content.userInfo;
                var userInfoJSON = utils_1.firebaseUtils.toJsObject(userInfo);
                updateUserInfo(userInfoJSON);
                if (actionIdentifier) {
                    _pendingActionTakenNotifications.push({
                        actionIdentifier: actionIdentifier,
                        userInfoJSON: userInfoJSON,
                        inputText: inputText
                    });
                    if (_notificationActionTakenCallback) {
                        _processPendingActionTakenNotifications();
                    }
                    userInfoJSON.notificationTapped = actionIdentifier === UNNotificationDefaultActionIdentifier;
                }
                else {
                    userInfoJSON.notificationTapped = false;
                }
                userInfoJSON.foreground = UIApplication.sharedApplication.applicationState === 0;
                _pendingNotifications.push(userInfoJSON);
                if (_receivedNotificationCallback) {
                    _processPendingNotifications();
                }
            });
            nativescript_shared_notification_delegate_1.SharedNotificationDelegate.addObserver(_userNotificationCenterDelegateObserver);
        }
        if (typeof (FIRMessaging) !== "undefined") {
            _firebaseRemoteMessageDelegate = FIRMessagingDelegateImpl.new().initWithCallback(function (appDataDictionary) {
                var userInfoJSON = utils_1.firebaseUtils.toJsObject(appDataDictionary);
                updateUserInfo(userInfoJSON);
                _pendingNotifications.push(userInfoJSON);
                var asJs = utils_1.firebaseUtils.toJsObject(appDataDictionary.objectForKey("notification"));
                if (asJs) {
                    userInfoJSON.title = asJs.title;
                    userInfoJSON.body = asJs.body;
                }
                var app = UIApplication.sharedApplication;
                if (app.applicationState === 0) {
                    userInfoJSON.foreground = true;
                    if (_receivedNotificationCallback) {
                        _processPendingNotifications();
                    }
                }
                else {
                    userInfoJSON.foreground = false;
                }
            });
            FIRMessaging.messaging().delegate = _firebaseRemoteMessageDelegate;
        }
    }
    else {
        var notificationTypes = 4 | 1 | 2 | 1;
        var notificationSettings = UIUserNotificationSettings.settingsForTypesCategories(notificationTypes, null);
        utils_1.firebaseUtils.invokeOnRunLoop(function () {
            app.registerForRemoteNotifications();
        });
        app.registerUserNotificationSettings(notificationSettings);
    }
}
function _addOnNotificationActionTakenCallback(callback) {
    return new Promise(function (resolve, reject) {
        try {
            _notificationActionTakenCallback = callback;
            _processPendingActionTakenNotifications();
            resolve();
        }
        catch (ex) {
            console.log("Error in messaging._addOnNotificationActionTakenCallback: " + ex);
            reject(ex);
        }
    });
}
function _processPendingNotifications() {
    var app = UIApplication.sharedApplication;
    if (!app) {
        application.on("launch", function () { return _processPendingNotifications(); });
        return;
    }
    if (_receivedNotificationCallback) {
        for (var p in _pendingNotifications) {
            _receivedNotificationCallback(_pendingNotifications[p]);
        }
        _pendingNotifications = [];
        if (app.applicationState === 0 && _autoClearBadge) {
            app.applicationIconBadgeNumber = 0;
        }
    }
}
function _processPendingActionTakenNotifications() {
    var app = UIApplication.sharedApplication;
    if (!app) {
        application.on("launch", function () { return _processPendingNotifications(); });
        return;
    }
    if (_notificationActionTakenCallback) {
        for (var p in _pendingActionTakenNotifications) {
            _notificationActionTakenCallback(_pendingActionTakenNotifications[p].actionIdentifier, _pendingActionTakenNotifications[p].userInfoJSON, _pendingActionTakenNotifications[p].inputText);
        }
        _pendingActionTakenNotifications = [];
        if (app.applicationState === 0 && _autoClearBadge) {
            app.applicationIconBadgeNumber = 0;
        }
    }
}
function _addObserver(eventName, callback) {
    return NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(eventName, null, NSOperationQueue.mainQueue, callback);
}
var FirebaseNotificationDelegateObserverImpl = (function () {
    function FirebaseNotificationDelegateObserverImpl(callback) {
        this.observerUniqueKey = "firebase-messaging";
        this.callback = callback;
    }
    FirebaseNotificationDelegateObserverImpl.prototype.userNotificationCenterWillPresentNotificationWithCompletionHandler = function (center, notification, completionHandler, next) {
        var userInfo = notification.request.content.userInfo;
        var userInfoJSON = utils_1.firebaseUtils.toJsObject(userInfo);
        if (!(notification.request.trigger instanceof UNPushNotificationTrigger)) {
            next();
            return;
        }
        if (_showNotificationsWhenInForeground ||
            userInfoJSON["gcm.notification.showWhenInForeground"] === "true" ||
            userInfoJSON["showWhenInForeground"] === true ||
            (userInfoJSON.aps && userInfoJSON.aps.showWhenInForeground === true)) {
            completionHandler(4 | 2 | 1);
        }
        else {
            completionHandler(0);
        }
        this.callback(notification);
    };
    FirebaseNotificationDelegateObserverImpl.prototype.userNotificationCenterDidReceiveNotificationResponseWithCompletionHandler = function (center, response, completionHandler, next) {
        if (!(response.notification.request.trigger instanceof UNPushNotificationTrigger)) {
            next();
            return;
        }
        if (response && response.actionIdentifier === UNNotificationDismissActionIdentifier) {
            completionHandler();
            return;
        }
        this.callback(response.notification, response.actionIdentifier, response.userText);
        completionHandler();
    };
    return FirebaseNotificationDelegateObserverImpl;
}());
var FIRMessagingDelegateImpl = (function (_super) {
    __extends(FIRMessagingDelegateImpl, _super);
    function FIRMessagingDelegateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FIRMessagingDelegateImpl.new = function () {
        if (FIRMessagingDelegateImpl.ObjCProtocols.length === 0 && typeof (FIRMessagingDelegate) !== "undefined") {
            FIRMessagingDelegateImpl.ObjCProtocols.push(FIRMessagingDelegate);
        }
        return _super.new.call(this);
    };
    FIRMessagingDelegateImpl.prototype.initWithCallback = function (callback) {
        this.callback = callback;
        return this;
    };
    FIRMessagingDelegateImpl.prototype.messagingDidReceiveMessage = function (messaging, remoteMessage) {
        this.callback(remoteMessage.appData);
    };
    FIRMessagingDelegateImpl.prototype.messagingDidReceiveRegistrationToken = function (messaging, fcmToken) {
        exports.onTokenRefreshNotification(fcmToken);
    };
    FIRMessagingDelegateImpl.ObjCProtocols = [];
    return FIRMessagingDelegateImpl;
}(NSObject));
