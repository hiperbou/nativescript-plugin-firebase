"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var appModule = require("tns-core-modules/application");
var lazy_1 = require("tns-core-modules/utils/lazy");
var utils_1 = require("tns-core-modules/utils/utils");
var firebase_common_1 = require("./firebase-common");
var firebaseFunctions = require("./functions/functions");
var firebaseMessaging = require("./messaging/messaging");
var gmsTasks = com.google.android.gms.tasks;
var DocumentSnapshot = (function (_super) {
    __extends(DocumentSnapshot, _super);
    function DocumentSnapshot(snapshot) {
        var _this = _super.call(this, snapshot ? snapshot.getId() : null, snapshot.exists(), firebase_common_1.firebase.toJsObject(snapshot.getData()), firebase_common_1.firebase.firestore._getDocumentReference(snapshot.getReference())) || this;
        _this.snapshot = snapshot;
        _this.metadata = {
            fromCache: _this.snapshot.getMetadata().isFromCache(),
            hasPendingWrites: _this.snapshot.getMetadata().hasPendingWrites()
        };
        _this.android = snapshot;
        return _this;
    }
    return DocumentSnapshot;
}(firebase_common_1.DocumentSnapshot));
firebase_common_1.firebase._launchNotification = null;
firebase_common_1.firebase._cachedDynamicLink = null;
firebase_common_1.firebase._googleSignInIdToken = null;
firebase_common_1.firebase._facebookAccessToken = null;
firebase_common_1.firebase._appleSignInIdToken = null;
var fbCallbackManager = null;
var initializeArguments;
var GOOGLE_SIGNIN_INTENT_ID = 123;
var authEnabled = lazy_1.default(function () { return typeof (com.google.firebase.auth) !== "undefined" && typeof (com.google.firebase.auth.FirebaseAuth) !== "undefined"; });
var messagingEnabled = lazy_1.default(function () { return typeof (com.google.firebase.messaging) !== "undefined"; });
var dynamicLinksEnabled = lazy_1.default(function () { return typeof (com.google.firebase.dynamiclinks) !== "undefined"; });
(function () {
    appModule.on(appModule.launchEvent, function (args) {
        if (messagingEnabled()) {
            firebaseMessaging.onAppModuleLaunchEvent(args);
        }
        if (dynamicLinksEnabled()) {
            var emailLink = "" + args.android.getData();
            if (authEnabled() && com.google.firebase.auth.FirebaseAuth.getInstance().isSignInWithEmailLink(emailLink)) {
                var rememberedEmail = firebase_common_1.firebase.getRememberedEmailForEmailLinkLogin();
                if (rememberedEmail !== undefined) {
                    var emailLinkOnCompleteListener = new gmsTasks.OnCompleteListener({
                        onComplete: function (task) {
                            if (task.isSuccessful()) {
                                var authResult = task.getResult();
                                firebase_common_1.firebase.notifyAuthStateListeners({
                                    loggedIn: true,
                                    user: toLoginResult(authResult.getUser(), authResult.getAdditionalUserInfo())
                                });
                            }
                        }
                    });
                    var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
                    if (user) {
                        var authCredential = com.google.firebase.auth.EmailAuthProvider.getCredentialWithLink(rememberedEmail, emailLink);
                        user.linkWithCredential(authCredential).addOnCompleteListener(emailLinkOnCompleteListener);
                    }
                    else {
                        com.google.firebase.auth.FirebaseAuth.getInstance().signInWithEmailLink(rememberedEmail, emailLink).addOnCompleteListener(emailLinkOnCompleteListener);
                    }
                }
            }
            else {
                var getDynamicLinksCallback = new gmsTasks.OnSuccessListener({
                    onSuccess: function (pendingDynamicLinkData) {
                        if (pendingDynamicLinkData != null) {
                            var deepLink_1 = pendingDynamicLinkData.getLink().toString();
                            var minimumAppVersion_1 = pendingDynamicLinkData.getMinimumAppVersion();
                            if (firebase_common_1.firebase._dynamicLinkCallback === null) {
                                firebase_common_1.firebase._cachedDynamicLink = {
                                    url: deepLink_1,
                                    minimumAppVersion: minimumAppVersion_1
                                };
                            }
                            else {
                                setTimeout(function () {
                                    firebase_common_1.firebase._dynamicLinkCallback({
                                        url: deepLink_1,
                                        minimumAppVersion: minimumAppVersion_1
                                    });
                                });
                            }
                        }
                    }
                });
                var firebaseDynamicLinks = com.google.firebase.dynamiclinks.FirebaseDynamicLinks.getInstance();
                firebaseDynamicLinks.getDynamicLink(args.android).addOnSuccessListener(getDynamicLinksCallback);
            }
        }
    });
    appModule.on(appModule.resumeEvent, function (args) {
        if (messagingEnabled()) {
            firebaseMessaging.onAppModuleResumeEvent(args);
        }
    });
})();
firebase_common_1.firebase.toHashMap = function (obj) {
    var node = new java.util.HashMap();
    for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (obj[property] === null) {
                node.put(property, null);
            }
            else {
                if (obj[property] === "SERVER_TIMESTAMP") {
                    node.put(property, com.google.firebase.firestore.FieldValue.serverTimestamp());
                }
                else if (obj[property] === "DELETE_FIELD") {
                    node.put(property, com.google.firebase.firestore.FieldValue.delete());
                }
                else if (obj[property] instanceof firebase_common_1.FieldValue) {
                    var fieldValue = obj[property];
                    if (fieldValue.type === "ARRAY_UNION") {
                        var values = Array.isArray(fieldValue.value[0]) ? fieldValue.value[0] : fieldValue.value;
                        values = values.map(function (v) { return typeof (v) === "object" ? firebase_common_1.firebase.toHashMap(v) : v; });
                        node.put(property, com.google.firebase.firestore.FieldValue.arrayUnion(values));
                    }
                    else if (fieldValue.type === "ARRAY_REMOVE") {
                        var values = Array.isArray(fieldValue.value[0]) ? fieldValue.value[0] : fieldValue.value;
                        values = values.map(function (v) { return typeof (v) === "object" ? firebase_common_1.firebase.toHashMap(v) : v; });
                        node.put(property, com.google.firebase.firestore.FieldValue.arrayRemove(values));
                    }
                    else if (fieldValue.type === "INCREMENT") {
                        node.put(property, com.google.firebase.firestore.FieldValue.increment(fieldValue.value));
                    }
                    else {
                        console.log("You found a bug! Please report an issue at https://github.com/EddyVerbruggen/nativescript-plugin-firebase/issues, mention fieldValue.type = '" + fieldValue.type + "'. Thanks!");
                    }
                }
                else if (obj[property] instanceof Date) {
                    node.put(property, new java.util.Date(obj[property].getTime()));
                }
                else if (obj[property] instanceof firebase_common_1.GeoPoint) {
                    var geo = obj[property];
                    node.put(property, new com.google.firebase.firestore.GeoPoint(geo.latitude, geo.longitude));
                }
                else if (firebase_common_1.isDocumentReference(obj[property])) {
                    node.put(property, obj[property].android);
                }
                else if (Array.isArray(obj[property])) {
                    node.put(property, firebase_common_1.firebase.toJavaArray(obj[property]));
                }
                else {
                    switch (typeof obj[property]) {
                        case 'object':
                            node.put(property, firebase_common_1.firebase.toHashMap(obj[property], node));
                            break;
                        case 'boolean':
                            node.put(property, java.lang.Boolean.valueOf(String(obj[property])));
                            break;
                        case 'number':
                            if (Number(obj[property]) === obj[property] && obj[property] % 1 === 0)
                                node.put(property, java.lang.Long.valueOf(String(obj[property])));
                            else
                                node.put(property, java.lang.Double.valueOf(String(obj[property])));
                            break;
                        case 'string':
                            node.put(property, String(obj[property]));
                            break;
                    }
                }
            }
        }
    }
    return node;
};
firebase_common_1.firebase.toJavaArray = function (val) {
    var javaArray = new java.util.ArrayList();
    for (var i = 0; i < val.length; i++) {
        javaArray.add(firebase_common_1.firebase.toValue(val[i]));
    }
    return javaArray;
};
firebase_common_1.firebase.toValue = function (val) {
    var returnVal = null;
    if (val !== null) {
        if (val instanceof Date) {
            returnVal = new java.util.Date(val.getTime());
        }
        else if (Array.isArray(val)) {
            returnVal = firebase_common_1.firebase.toJavaArray(val);
        }
        else if (val instanceof firebase_common_1.GeoPoint) {
            returnVal = new com.google.firebase.firestore.GeoPoint(val.latitude, val.longitude);
        }
        else if (firebase_common_1.isDocumentReference(val)) {
            returnVal = val.android;
        }
        else {
            switch (typeof val) {
                case 'object':
                    returnVal = firebase_common_1.firebase.toHashMap(val);
                    break;
                case 'boolean':
                    returnVal = java.lang.Boolean.valueOf(String(val));
                    break;
                case 'number':
                    if (Number(val) === val && val % 1 === 0)
                        returnVal = java.lang.Long.valueOf(String(val));
                    else
                        returnVal = java.lang.Double.valueOf(String(val));
                    break;
                case 'string':
                    returnVal = String(val);
                    break;
            }
        }
    }
    return returnVal;
};
firebase_common_1.firebase.toJsObject = function (javaObj) {
    if (javaObj === null || typeof javaObj !== "object") {
        return javaObj;
    }
    var node;
    switch (javaObj.getClass().getName()) {
        case 'java.lang.Boolean':
            var str = String(javaObj);
            return Boolean(!!(str === "True" || str === "true"));
        case 'java.lang.String':
            return String(javaObj);
        case 'java.lang.Integer':
        case 'java.lang.Long':
        case 'java.lang.Double':
            return Number(String(javaObj));
        case 'java.util.Date':
            return new Date(javaObj.getTime());
        case 'com.google.firebase.Timestamp':
            return new Date(javaObj.toDate().getTime());
        case 'com.google.firebase.firestore.GeoPoint':
            return {
                "latitude": javaObj.getLatitude(),
                "longitude": javaObj.getLongitude()
            };
        case 'com.google.firebase.firestore.DocumentReference':
            var path = javaObj.getPath();
            var lastSlashIndex = path.lastIndexOf("/");
            return firebase_common_1.firebase.firestore._getDocumentReference(javaObj, path.substring(0, lastSlashIndex), path.substring(lastSlashIndex + 1));
        case 'java.util.ArrayList':
            node = [];
            for (var i = 0; i < javaObj.size(); i++) {
                node[i] = firebase_common_1.firebase.toJsObject(javaObj.get(i));
            }
            break;
        case 'android.util.ArrayMap':
        case 'android.support.v4.util.ArrayMap':
        case 'androidx.collection.ArrayMap':
            node = {};
            for (var i = 0; i < javaObj.size(); i++) {
                node[javaObj.keyAt(i)] = firebase_common_1.firebase.toJsObject(javaObj.valueAt(i));
            }
            break;
        default:
            try {
                node = {};
                var iterator = javaObj.entrySet().iterator();
                while (iterator.hasNext()) {
                    var item = iterator.next();
                    node[item.getKey()] = firebase_common_1.firebase.toJsObject(item.getValue());
                }
            }
            catch (e) {
                if (JSON.stringify(e).includes("Attempt to use cleared object reference")) {
                    console.log("Error while transforming Java to Js: " + e);
                }
                else {
                    console.log("PLEASE REPORT THIS AT https://github.com/EddyVerbruggen/nativescript-plugin-firebase/issues: Tried to serialize an unsupported type: " + javaObj.getClass().getName() + ", error: " + e);
                }
            }
    }
    return node;
};
firebase_common_1.firebase.getCallbackData = function (type, snapshot) {
    return {
        type: type,
        key: snapshot.getKey(),
        value: firebase_common_1.firebase.toJsObject(snapshot.getValue())
    };
};
firebase_common_1.firebase.authStateListener = null;
firebase_common_1.firebase.init = function (arg) {
    return new Promise(function (resolve, reject) {
        if (firebase_common_1.firebase.initialized) {
            reject("Firebase already initialized");
            return;
        }
        firebase_common_1.firebase.initialized = true;
        var runInit = function () {
            arg = arg || {};
            initializeArguments = arg;
            if (typeof (com.google.firebase.analytics) !== "undefined" && typeof (com.google.firebase.analytics.FirebaseAnalytics) !== "undefined") {
                com.google.firebase.analytics.FirebaseAnalytics.getInstance(appModule.android.context || appModule.getNativeApplication()).setAnalyticsCollectionEnabled(arg.analyticsCollectionEnabled !== false);
            }
            if (arg.crashlyticsCollectionEnabled && typeof (com.crashlytics) !== "undefined" && typeof (com.crashlytics.android.Crashlytics) !== "undefined") {
                io.fabric.sdk.android.Fabric.with(appModule.android.context || appModule.getNativeApplication(), [new com.crashlytics.android.Crashlytics()]);
            }
            if (typeof (com.google.firebase.database) !== "undefined" && typeof (com.google.firebase.database.ServerValue) !== "undefined") {
                firebase_common_1.firebase.ServerValue = {
                    TIMESTAMP: firebase_common_1.firebase.toJsObject(com.google.firebase.database.ServerValue.TIMESTAMP)
                };
                var fDatabase = com.google.firebase.database.FirebaseDatabase;
                if (arg.persist) {
                    try {
                        fDatabase.getInstance().setPersistenceEnabled(true);
                    }
                    catch (ignore) {
                    }
                }
                firebase_common_1.firebase.instance = fDatabase.getInstance().getReference();
            }
            if (arg.persist === false && typeof (com.google.firebase.firestore) !== "undefined") {
                try {
                    com.google.firebase.firestore.FirebaseFirestore.getInstance().setFirestoreSettings(new com.google.firebase.firestore.FirebaseFirestoreSettings.Builder()
                        .setPersistenceEnabled(false)
                        .build());
                }
                catch (ignore) {
                }
            }
            if (authEnabled()) {
                var firebaseAuth = com.google.firebase.auth.FirebaseAuth.getInstance();
                if (arg.onAuthStateChanged) {
                    firebase_common_1.firebase.addAuthStateListener(arg.onAuthStateChanged);
                }
                if (!firebase_common_1.firebase.authStateListener) {
                    firebase_common_1.firebase.authStateListener = new com.google.firebase.auth.FirebaseAuth.AuthStateListener({
                        onAuthStateChanged: function (fbAuth) {
                            var user = fbAuth.getCurrentUser();
                            firebase_common_1.firebase.notifyAuthStateListeners({
                                loggedIn: user !== null,
                                user: toLoginResult(user)
                            });
                        }
                    });
                    firebaseAuth.addAuthStateListener(firebase_common_1.firebase.authStateListener);
                }
            }
            if (messagingEnabled()) {
                firebaseMessaging.initFirebaseMessaging(arg);
            }
            if (arg.onDynamicLinkCallback !== undefined) {
                firebase_common_1.firebase.addOnDynamicLinkReceivedCallback(arg.onDynamicLinkCallback);
            }
            if (arg.storageBucket) {
                if (typeof (com.google.firebase.storage) === "undefined") {
                    reject("Uncomment firebase-storage in the plugin's include.gradle first");
                    return;
                }
                firebase_common_1.firebase.storageBucket = com.google.firebase.storage.FirebaseStorage.getInstance().getReferenceFromUrl(arg.storageBucket);
            }
            resolve(firebase_common_1.firebase.instance);
        };
        try {
            if (appModule.android.startActivity) {
                runInit();
            }
            else {
                appModule.on(appModule.launchEvent, runInit);
            }
        }
        catch (ex) {
            console.log("Error in firebase.init: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.fetchSignInMethodsForEmail = function (email) {
    return new Promise(function (resolve, reject) {
        try {
            if (typeof (email) !== "string") {
                reject("A parameter representing an email address is required.");
                return;
            }
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (!task.isSuccessful()) {
                        reject((task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                    }
                    else {
                        var signInMethods = task.getResult().getSignInMethods();
                        resolve(firebase_common_1.firebase.toJsObject(signInMethods));
                    }
                }
            });
            com.google.firebase.auth.FirebaseAuth.getInstance().fetchSignInMethodsForEmail(email).addOnCompleteListener(onCompleteListener);
        }
        catch (ex) {
            console.log("Error in firebase.fetchSignInMethodsForEmail: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.getCurrentPushToken = firebaseMessaging.getCurrentPushToken;
firebase_common_1.firebase.addOnMessageReceivedCallback = firebaseMessaging.addOnMessageReceivedCallback;
firebase_common_1.firebase.addOnPushTokenReceivedCallback = firebaseMessaging.addOnPushTokenReceivedCallback;
firebase_common_1.firebase.registerForPushNotifications = firebaseMessaging.registerForPushNotifications;
firebase_common_1.firebase.unregisterForPushNotifications = firebaseMessaging.unregisterForPushNotifications;
firebase_common_1.firebase.subscribeToTopic = firebaseMessaging.subscribeToTopic;
firebase_common_1.firebase.unsubscribeFromTopic = firebaseMessaging.unsubscribeFromTopic;
firebase_common_1.firebase.areNotificationsEnabled = firebaseMessaging.areNotificationsEnabled;
firebase_common_1.firebase.functions = firebaseFunctions;
firebase_common_1.firebase.addOnDynamicLinkReceivedCallback = function (callback) {
    return new Promise(function (resolve, reject) {
        try {
            if (typeof (com.google.firebase.dynamiclinks) === "undefined") {
                reject("Uncomment dynamic links in the plugin's include.gradle first");
                return;
            }
            firebase_common_1.firebase._dynamicLinkCallback = callback;
            if (firebase_common_1.firebase._cachedDynamicLink !== null) {
                callback(firebase_common_1.firebase._cachedDynamicLink);
                firebase_common_1.firebase._cachedDynamicLink = null;
            }
            resolve();
        }
        catch (ex) {
            console.log("Error in firebase.addOnDynamicLinkReceivedCallback: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.getRemoteConfigDefaults = function (properties) {
    var defaults = {};
    for (var p in properties) {
        var prop = properties[p];
        if (prop.default !== undefined) {
            defaults[prop.key] = prop.default;
        }
    }
    return defaults;
};
firebase_common_1.firebase._isGooglePlayServicesAvailable = function () {
    var ctx = appModule.android.foregroundActivity || appModule.android.startActivity || appModule.getNativeApplication();
    var googleApiAvailability = com.google.android.gms.common.GoogleApiAvailability.getInstance();
    var playServiceStatusSuccess = 0;
    var playServicesStatus = googleApiAvailability.isGooglePlayServicesAvailable(ctx);
    var available = playServicesStatus === playServiceStatusSuccess;
    if (!available && googleApiAvailability.isUserResolvableError(playServicesStatus)) {
        googleApiAvailability.showErrorDialogFragment(ctx, playServicesStatus, 1, new android.content.DialogInterface.OnCancelListener({
            onCancel: function (dialogInterface) {
                console.log("Canceled");
            }
        }));
    }
    return available;
};
firebase_common_1.firebase.getRemoteConfig = function (arg) {
    return new Promise(function (resolve, reject) {
        if (typeof (com.google.firebase.remoteconfig) === "undefined") {
            reject("Uncomment firebase-config in the plugin's include.gradle first");
            return;
        }
        if (arg.properties === undefined) {
            reject("Argument 'properties' is missing");
            return;
        }
        var runGetRemoteConfig = function () {
            if (!firebase_common_1.firebase._isGooglePlayServicesAvailable()) {
                reject("Google Play services is required for this feature, but not available on this device");
                return;
            }
            var firebaseRemoteConfig = com.google.firebase.remoteconfig.FirebaseRemoteConfig.getInstance();
            var remoteConfigSettingsBuilder = new com.google.firebase.remoteconfig.FirebaseRemoteConfigSettings.Builder();
            if (arg.developerMode === true) {
                remoteConfigSettingsBuilder.setFetchTimeoutInSeconds(0);
            }
            var onSetConfigSettingsCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (!task.isSuccessful()) {
                        reject((task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                    }
                    else {
                        var defaults = firebase_common_1.firebase.getRemoteConfigDefaults(arg.properties);
                        firebaseRemoteConfig.setDefaultsAsync(firebase_common_1.firebase.toHashMap(defaults))
                            .addOnCompleteListener(new gmsTasks.OnCompleteListener({
                            onComplete: function (task) {
                                if (!task.isSuccessful()) {
                                    reject((task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                                }
                                else {
                                    var returnMethod_1 = function (throttled) {
                                        var addOnCompleteActivateListener = new gmsTasks.OnCompleteListener({
                                            onComplete: function (task) {
                                                if (!task.isSuccessful()) {
                                                    reject((task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                                                }
                                                else {
                                                    var lastFetchTime = firebaseRemoteConfig.getInfo().getFetchTimeMillis();
                                                    var lastFetch = new Date(lastFetchTime);
                                                    var result = {
                                                        lastFetch: lastFetch,
                                                        throttled: throttled,
                                                        properties: {}
                                                    };
                                                    for (var p in arg.properties) {
                                                        var prop = arg.properties[p];
                                                        var key = prop.key;
                                                        var value = firebaseRemoteConfig.getString(key);
                                                        result.properties[key] = firebase_common_1.firebase.strongTypeify(value);
                                                    }
                                                    resolve(result);
                                                }
                                            }
                                        });
                                        firebaseRemoteConfig.activate().addOnCompleteListener(addOnCompleteActivateListener);
                                    };
                                    var onSuccessListener = new gmsTasks.OnSuccessListener({
                                        onSuccess: function () { return returnMethod_1(false); }
                                    });
                                    var onFailureListener = new gmsTasks.OnFailureListener({
                                        onFailure: function (exception) {
                                            if (exception.getMessage() === "com.google.firebase.remoteconfig.FirebaseRemoteConfigFetchThrottledException") {
                                                returnMethod_1(true);
                                            }
                                            else {
                                                reject("Retrieving remote config data failed. " + exception);
                                            }
                                        }
                                    });
                                    var expirationDuration = arg.cacheExpirationSeconds || 43200;
                                    firebaseRemoteConfig.fetch(expirationDuration)
                                        .addOnSuccessListener(onSuccessListener)
                                        .addOnFailureListener(onFailureListener);
                                }
                            }
                        }));
                    }
                }
            });
            firebaseRemoteConfig.setConfigSettingsAsync(remoteConfigSettingsBuilder.build())
                .addOnCompleteListener(onSetConfigSettingsCompleteListener);
        };
        try {
            if (appModule.android.foregroundActivity) {
                runGetRemoteConfig();
            }
            else {
                var callback_1 = function () {
                    runGetRemoteConfig();
                    appModule.off(appModule.resumeEvent, callback_1);
                };
                appModule.on(appModule.resumeEvent, callback_1);
            }
        }
        catch (ex) {
            console.log("Error in firebase.getRemoteConfig: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.getCurrentUser = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            var firebaseAuth = com.google.firebase.auth.FirebaseAuth.getInstance();
            var user = firebaseAuth.getCurrentUser();
            if (user !== null) {
                resolve(toLoginResult(user));
            }
            else {
                reject();
            }
        }
        catch (ex) {
            console.log("Error in firebase.getCurrentUser: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.sendEmailVerification = function (actionCodeSettings) {
    return new Promise(function (resolve, reject) {
        try {
            var firebaseAuth = com.google.firebase.auth.FirebaseAuth.getInstance();
            var user = firebaseAuth.getCurrentUser();
            if (user !== null) {
                var addOnCompleteListener = new gmsTasks.OnCompleteListener({
                    onComplete: function (task) {
                        if (!task.isSuccessful()) {
                            reject((task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                        }
                        else {
                            resolve();
                        }
                    }
                });
                if (actionCodeSettings) {
                    var settingsBuilder = new com.google.firebase.auth.ActionCodeSettings.newBuilder();
                    if (actionCodeSettings.handleCodeInApp !== undefined) {
                        settingsBuilder.setHandleCodeInApp(actionCodeSettings.handleCodeInApp);
                    }
                    if (actionCodeSettings.url) {
                        settingsBuilder.setUrl(actionCodeSettings.url);
                    }
                    if (actionCodeSettings.iOS && actionCodeSettings.iOS.bundleId) {
                        settingsBuilder.setIOSBundleId(actionCodeSettings.iOS.bundleId);
                    }
                    if (actionCodeSettings.android && actionCodeSettings.android.packageName) {
                        settingsBuilder.setAndroidPackageName(actionCodeSettings.android.packageName, actionCodeSettings.android.installApp, actionCodeSettings.android.minimumVersion || null);
                    }
                    user.sendEmailVerification(settingsBuilder.build()).addOnCompleteListener(addOnCompleteListener);
                }
                else {
                    user.sendEmailVerification().addOnCompleteListener(addOnCompleteListener);
                }
            }
            else {
                reject("Log in first");
            }
        }
        catch (ex) {
            console.log("Error in firebase.sendEmailVerification: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.logout = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            com.google.firebase.auth.FirebaseAuth.getInstance().signOut();
            firebase_common_1.firebase.currentAdditionalUserInfo = null;
            if (firebase_common_1.firebase._mGoogleApiClient && firebase_common_1.firebase._mGoogleApiClient.isConnected()) {
                com.google.android.gms.auth.api.Auth.GoogleSignInApi.revokeAccess(firebase_common_1.firebase._mGoogleApiClient);
            }
            if (typeof (com.facebook) !== "undefined" && typeof (com.facebook.login) !== "undefined") {
                com.facebook.login.LoginManager.getInstance().logOut();
            }
            resolve();
        }
        catch (ex) {
            console.log("Error in firebase.logout: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.unlink = function (providerId) {
    return new Promise(function (resolve, reject) {
        try {
            var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
            if (!user) {
                reject("Not logged in");
                return;
            }
            user.unlink(providerId)
                .addOnCompleteListener(new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (task.isSuccessful()) {
                        resolve();
                    }
                    else {
                        reject((task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                    }
                }
            }));
        }
        catch (ex) {
            console.log("Error in firebase.unlink: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.getAuthToken = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            var firebaseAuth = com.google.firebase.auth.FirebaseAuth.getInstance();
            var user = firebaseAuth.getCurrentUser();
            if (user !== null) {
                var onSuccessListener = new gmsTasks.OnSuccessListener({
                    onSuccess: function (tokenResult) {
                        resolve({
                            token: tokenResult.getToken(),
                            claims: firebase_common_1.firebase.toJsObject(tokenResult.getClaims()),
                            signInProvider: tokenResult.getSignInProvider(),
                            expirationTime: tokenResult.getExpirationTimestamp(),
                            issuedAtTime: tokenResult.getIssuedAtTimestamp(),
                            authTime: tokenResult.getAuthTimestamp()
                        });
                    }
                });
                var onFailureListener = new gmsTasks.OnFailureListener({
                    onFailure: function (exception) {
                        reject(exception);
                    }
                });
                user.getIdToken(arg.forceRefresh)
                    .addOnSuccessListener(onSuccessListener)
                    .addOnFailureListener(onFailureListener);
            }
            else {
                reject("Log in first");
            }
        }
        catch (ex) {
            console.log("Error in firebase.getAuthToken: " + ex);
            reject(ex);
        }
    });
};
function toLoginResult(user, additionalUserInfo) {
    if (user === null) {
        return null;
    }
    if (additionalUserInfo) {
        firebase_common_1.firebase.currentAdditionalUserInfo = additionalUserInfo;
    }
    var providers = [];
    var providerData = user.getProviderData();
    for (var i = 0; i < providerData.size(); i++) {
        var pid = providerData.get(i).getProviderId();
        if (pid === 'facebook.com') {
            providers.push({ id: pid, token: firebase_common_1.firebase._facebookAccessToken });
        }
        else if (pid === 'google.com') {
            providers.push({ id: pid, token: firebase_common_1.firebase._googleSignInIdToken });
        }
        else if (pid === 'apple.com') {
            providers.push({ id: pid, token: firebase_common_1.firebase._appleSignInIdToken });
        }
        else {
            providers.push({ id: pid });
        }
    }
    var loginResult = {
        uid: user.getUid(),
        displayName: user.getDisplayName(),
        email: user.getEmail(),
        emailVerified: user.isEmailVerified(),
        providers: providers,
        anonymous: user.isAnonymous(),
        isAnonymous: user.isAnonymous(),
        phoneNumber: user.getPhoneNumber(),
        photoURL: user.getPhotoUrl() ? user.getPhotoUrl().toString() : null,
        metadata: {
            creationTimestamp: user.getMetadata() ? new Date(user.getMetadata().getCreationTimestamp()) : null,
            lastSignInTimestamp: user.getMetadata() ? new Date(user.getMetadata().getLastSignInTimestamp()) : null
        },
        getIdToken: function (forceRefresh) { return new Promise(function (resolve, reject) {
            firebase_common_1.firebase.getAuthToken({ forceRefresh: forceRefresh })
                .then(function (result) { return resolve(result.token); })
                .catch(reject);
        }); },
        getIdTokenResult: function (forceRefresh) { return new Promise(function (resolve, reject) {
            firebase_common_1.firebase.getAuthToken({ forceRefresh: forceRefresh })
                .then(function (result) { return resolve(result); })
                .catch(reject);
        }); },
        sendEmailVerification: function (actionCodeSettings) { return firebase_common_1.firebase.sendEmailVerification(actionCodeSettings); }
    };
    if (firebase_common_1.firebase.currentAdditionalUserInfo) {
        loginResult.additionalUserInfo = {
            providerId: firebase_common_1.firebase.currentAdditionalUserInfo.getProviderId(),
            username: firebase_common_1.firebase.currentAdditionalUserInfo.getUsername(),
            isNewUser: firebase_common_1.firebase.currentAdditionalUserInfo.isNewUser(),
            profile: firebase_common_1.firebase.toJsObject(firebase_common_1.firebase.currentAdditionalUserInfo.getProfile())
        };
    }
    return loginResult;
}
firebase_common_1.firebase.login = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            _this.resolve = resolve;
            _this.reject = reject;
            if (!firebase_common_1.firebase._isGooglePlayServicesAvailable()) {
                reject("Google Play services is required for this feature, but not available on this device");
                return;
            }
            firebase_common_1.firebase.moveLoginOptionsToObjects(arg);
            var firebaseAuth_1 = com.google.firebase.auth.FirebaseAuth.getInstance();
            var onCompleteListener_1 = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (!task.isSuccessful()) {
                        console.log("Logging in the user failed. " + (task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                        if (firebase_common_1.firebase._mGoogleApiClient) {
                            com.google.android.gms.auth.api.Auth.GoogleSignInApi.revokeAccess(firebase_common_1.firebase._mGoogleApiClient);
                        }
                        _this.reject("Logging in the user failed. " + (task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                    }
                    else {
                        var user = task.getResult().getUser();
                        var additionalUserInfo = task.getResult().getAdditionalUserInfo();
                        _this.resolve(toLoginResult(user, additionalUserInfo));
                    }
                }
            });
            if (arg.type === firebase_common_1.firebase.LoginType.ANONYMOUS) {
                firebaseAuth_1.signInAnonymously().addOnCompleteListener(onCompleteListener_1);
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.PASSWORD) {
                if (!arg.passwordOptions || !arg.passwordOptions.email || !arg.passwordOptions.password) {
                    reject("Auth type PASSWORD requires an 'passwordOptions.email' and 'passwordOptions.password' argument");
                    return;
                }
                var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
                if (user) {
                    if (firebase_common_1.firebase._alreadyLinkedToAuthProvider(user, "password")) {
                        firebaseAuth_1.signInWithEmailAndPassword(arg.passwordOptions.email, arg.passwordOptions.password).addOnCompleteListener(onCompleteListener_1);
                    }
                    else {
                        var authCredential = com.google.firebase.auth.EmailAuthProvider.getCredential(arg.passwordOptions.email, arg.passwordOptions.password);
                        user.linkWithCredential(authCredential).addOnCompleteListener(onCompleteListener_1);
                    }
                }
                else {
                    firebaseAuth_1.signInWithEmailAndPassword(arg.passwordOptions.email, arg.passwordOptions.password).addOnCompleteListener(onCompleteListener_1);
                }
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.EMAIL_LINK) {
                if (!arg.emailLinkOptions || !arg.emailLinkOptions.email) {
                    reject("Auth type EMAIL_LINK requires an 'emailLinkOptions.email' argument");
                    return;
                }
                if (!arg.emailLinkOptions.url) {
                    reject("Auth type EMAIL_LINK requires an 'emailLinkOptions.url' argument");
                    return;
                }
                var actionCodeSettings = com.google.firebase.auth.ActionCodeSettings.newBuilder()
                    .setUrl(arg.emailLinkOptions.url)
                    .setHandleCodeInApp(true)
                    .setIOSBundleId(arg.emailLinkOptions.iOS ? arg.emailLinkOptions.iOS.bundleId : appModule.android.context.getPackageName())
                    .setAndroidPackageName(arg.emailLinkOptions.android ? arg.emailLinkOptions.android.packageName : appModule.android.context.getPackageName(), arg.emailLinkOptions.android ? arg.emailLinkOptions.android.installApp || false : false, arg.emailLinkOptions.android ? arg.emailLinkOptions.android.minimumVersion || "1" : "1")
                    .build();
                var onEmailLinkCompleteListener = new gmsTasks.OnCompleteListener({
                    onComplete: function (task) {
                        if (!task.isSuccessful()) {
                            reject((task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                        }
                        else {
                            firebase_common_1.firebase.rememberEmailForEmailLinkLogin(arg.emailLinkOptions.email);
                            resolve();
                        }
                    }
                });
                firebaseAuth_1.sendSignInLinkToEmail(arg.emailLinkOptions.email, actionCodeSettings).addOnCompleteListener(onEmailLinkCompleteListener);
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.PHONE) {
                if (!arg.phoneOptions || !arg.phoneOptions.phoneNumber) {
                    reject("Auth type PHONE requires a 'phoneOptions.phoneNumber' argument");
                    return;
                }
                var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
                if (user && firebase_common_1.firebase._alreadyLinkedToAuthProvider(user, "phone")) {
                    resolve(toLoginResult(user));
                    return;
                }
                var OnVerificationStateChangedCallbacks = com.google.firebase.auth.PhoneAuthProvider.OnVerificationStateChangedCallbacks.extend({
                    onVerificationCompleted: function (phoneAuthCredential) {
                        firebase_common_1.firebase._verifyPhoneNumberInProgress = false;
                        var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
                        if (!user || firebase_common_1.firebase._alreadyLinkedToAuthProvider(user, "phone")) {
                            firebaseAuth_1.signInWithCredential(phoneAuthCredential).addOnCompleteListener(onCompleteListener_1);
                        }
                        else {
                            user.linkWithCredential(phoneAuthCredential).addOnCompleteListener(onCompleteListener_1);
                        }
                    },
                    onVerificationFailed: function (firebaseException) {
                        firebase_common_1.firebase._verifyPhoneNumberInProgress = false;
                        var errorMessage = firebaseException.getMessage();
                        if (errorMessage.includes("INVALID_APP_CREDENTIAL")) {
                            _this.reject("Please upload the SHA1 fingerprint of your debug and release keystores to the Firebase console, see https://github.com/EddyVerbruggen/nativescript-plugin-firebase/blob/master/docs/AUTHENTICATION.md#phone-verification");
                        }
                        else {
                            _this.reject(errorMessage);
                        }
                    },
                    onCodeSent: function (verificationId, forceResendingToken) {
                        setTimeout(function () {
                            if (firebase_common_1.firebase._verifyPhoneNumberInProgress) {
                                firebase_common_1.firebase._verifyPhoneNumberInProgress = false;
                                firebase_common_1.firebase.requestPhoneAuthVerificationCode(function (userResponse) {
                                    if (userResponse === undefined && _this.reject) {
                                        _this.reject("Prompt was canceled");
                                        return;
                                    }
                                    var authCredential = com.google.firebase.auth.PhoneAuthProvider.getCredential(verificationId, userResponse);
                                    var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
                                    if (!user || firebase_common_1.firebase._alreadyLinkedToAuthProvider(user, "phone")) {
                                        firebaseAuth_1.signInWithCredential(authCredential).addOnCompleteListener(onCompleteListener_1);
                                    }
                                    else {
                                        user.linkWithCredential(authCredential).addOnCompleteListener(onCompleteListener_1);
                                    }
                                }, arg.phoneOptions.verificationPrompt);
                            }
                        }, 3000);
                    }
                });
                firebase_common_1.firebase._verifyPhoneNumberInProgress = true;
                var timeout = arg.phoneOptions.android ? arg.phoneOptions.android.timeout : 60;
                com.google.firebase.auth.PhoneAuthProvider.getInstance().verifyPhoneNumber(arg.phoneOptions.phoneNumber, timeout, java.util.concurrent.TimeUnit.SECONDS, appModule.android.foregroundActivity, new OnVerificationStateChangedCallbacks());
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.CUSTOM) {
                if (!arg.customOptions || (!arg.customOptions.token && !arg.customOptions.tokenProviderFn)) {
                    reject("Auth type CUSTOM requires a 'customOptions.token' or 'customOptions.tokenProviderFn' argument");
                    return;
                }
                if (arg.customOptions.token) {
                    firebaseAuth_1.signInWithCustomToken(arg.customOptions.token).addOnCompleteListener(onCompleteListener_1);
                }
                else if (arg.customOptions.tokenProviderFn) {
                    arg.customOptions.tokenProviderFn()
                        .then(function (token) {
                        firebaseAuth_1.signInWithCustomToken(token).addOnCompleteListener(onCompleteListener_1);
                    }, function (error) {
                        reject(error);
                    });
                }
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.FACEBOOK) {
                if (typeof (com.facebook) === "undefined" || typeof (com.facebook.FacebookSdk) === "undefined") {
                    reject("Facebook SDK not installed - see gradle config");
                    return;
                }
                if (!fbCallbackManager) {
                    com.facebook.FacebookSdk.sdkInitialize(appModule.getNativeApplication());
                    fbCallbackManager = com.facebook.CallbackManager.Factory.create();
                }
                var callback_2 = function (eventData) {
                    appModule.android.off(appModule.AndroidApplication.activityResultEvent, callback_2);
                    fbCallbackManager.onActivityResult(eventData.requestCode, eventData.resultCode, eventData.intent);
                };
                appModule.android.on(appModule.AndroidApplication.activityResultEvent, callback_2);
                var fbLoginManager = com.facebook.login.LoginManager.getInstance();
                fbLoginManager.registerCallback(fbCallbackManager, new com.facebook.FacebookCallback({
                    onSuccess: function (loginResult) {
                        firebase_common_1.firebase._facebookAccessToken = loginResult.getAccessToken().getToken();
                        var authCredential = com.google.firebase.auth.FacebookAuthProvider.getCredential(firebase_common_1.firebase._facebookAccessToken);
                        var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
                        if (user) {
                            if (firebase_common_1.firebase._alreadyLinkedToAuthProvider(user, "facebook.com")) {
                                firebaseAuth_1.signInWithCredential(authCredential).addOnCompleteListener(onCompleteListener_1);
                            }
                            else {
                                user.linkWithCredential(authCredential).addOnCompleteListener(onCompleteListener_1);
                            }
                        }
                        else {
                            firebaseAuth_1.signInWithCredential(authCredential).addOnCompleteListener(onCompleteListener_1);
                        }
                    },
                    onCancel: function () { return reject("Facebook Login canceled"); },
                    onError: function (ex) { return reject("Error while trying to login with Fb " + ex); }
                }));
                var scopes = ["public_profile", "email"];
                if (arg.facebookOptions && arg.facebookOptions.scopes) {
                    scopes = arg.facebookOptions.scopes;
                }
                var permissions = utils_1.ad.collections.stringArrayToStringSet(scopes);
                var activity = appModule.android.foregroundActivity;
                fbLoginManager.logInWithReadPermissions(activity, permissions);
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.APPLE) {
                var onSuccessListener = new gmsTasks.OnSuccessListener({
                    onSuccess: function (authResult) {
                        firebase_common_1.firebase._appleSignInIdToken = authResult.getCredential().getIdToken();
                        var loginResult = toLoginResult(authResult.getUser(), authResult.getAdditionalUserInfo());
                        firebase_common_1.firebase.notifyAuthStateListeners({
                            loggedIn: true,
                            user: loginResult
                        });
                        resolve(loginResult);
                    }
                });
                var onFailureListener = new gmsTasks.OnFailureListener({
                    onFailure: function (exception) {
                        reject(exception.getMessage());
                    }
                });
                var pendingAuthResult = firebaseAuth_1.getPendingAuthResult();
                if (pendingAuthResult) {
                    pendingAuthResult
                        .addOnSuccessListener(onSuccessListener)
                        .addOnFailureListener(onFailureListener);
                }
                else {
                    var oAuthProviderBuilder = com.google.firebase.auth.OAuthProvider.newBuilder("apple.com");
                    var scopes = ["name", "email"];
                    if (arg.appleOptions && arg.appleOptions.scopes) {
                        scopes = arg.appleOptions.scopes;
                    }
                    oAuthProviderBuilder.setScopes(firebase_common_1.firebase.toJavaArray(scopes));
                    if (arg.appleOptions && arg.appleOptions.locale) {
                        oAuthProviderBuilder.addCustomParameter("locale", arg.appleOptions.locale);
                    }
                    var provider = oAuthProviderBuilder.build();
                    firebaseAuth_1.startActivityForSignInWithProvider(appModule.android.foregroundActivity || appModule.android.startActivity, provider)
                        .addOnSuccessListener(onSuccessListener)
                        .addOnFailureListener(onFailureListener);
                }
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.GOOGLE) {
                if (typeof (com.google.android.gms.auth.api.Auth) === "undefined") {
                    reject("Google Sign In not installed - see gradle config");
                    return;
                }
                var clientStringId = utils_1.ad.resources.getStringId("default_web_client_id");
                var clientId = utils_1.ad.getApplicationContext().getResources().getString(clientStringId);
                var googleSignInOptionsBuilder = new com.google.android.gms.auth.api.signin.GoogleSignInOptions.Builder(com.google.android.gms.auth.api.signin.GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(clientId)
                    .requestEmail();
                if (arg.googleOptions && arg.googleOptions.hostedDomain) {
                    googleSignInOptionsBuilder.setHostedDomain(arg.googleOptions.hostedDomain);
                }
                if (arg.googleOptions && arg.googleOptions.scopes) {
                    var scopesArray_1 = [];
                    if (arg.googleOptions.scopes.length > 1) {
                        arg.googleOptions.scopes.forEach(function (s) { return scopesArray_1.push(new com.google.android.gms.common.api.Scope(s)); });
                    }
                    googleSignInOptionsBuilder.requestScopes(new com.google.android.gms.common.api.Scope(arg.googleOptions.scopes[0]), scopesArray_1);
                }
                var googleSignInOptions = googleSignInOptionsBuilder.build();
                var onConnectionFailedListener = new com.google.android.gms.common.api.GoogleApiClient.OnConnectionFailedListener({
                    onConnectionFailed: function (connectionResult) {
                        reject(connectionResult.getErrorMessage());
                    }
                });
                firebase_common_1.firebase._mGoogleApiClient = new com.google.android.gms.common.api.GoogleApiClient.Builder(appModule.getNativeApplication())
                    .addOnConnectionFailedListener(onConnectionFailedListener)
                    .addApi(com.google.android.gms.auth.api.Auth.GOOGLE_SIGN_IN_API, googleSignInOptions)
                    .build();
                var signInIntent = com.google.android.gms.auth.api.Auth.GoogleSignInApi.getSignInIntent(firebase_common_1.firebase._mGoogleApiClient);
                (appModule.android.foregroundActivity || appModule.android.startActivity).startActivityForResult(signInIntent, GOOGLE_SIGNIN_INTENT_ID);
                var callback_3 = function (eventData) {
                    if (eventData.requestCode === GOOGLE_SIGNIN_INTENT_ID) {
                        appModule.android.off(appModule.AndroidApplication.activityResultEvent, callback_3);
                        var googleSignInResult = com.google.android.gms.auth.api.Auth.GoogleSignInApi.getSignInResultFromIntent(eventData.intent);
                        if (googleSignInResult === null) {
                            reject("No googleSignInResult, eventData.intent seems to be invalid");
                            return;
                        }
                        var success = googleSignInResult.isSuccess();
                        if (success) {
                            var googleSignInAccount = googleSignInResult.getSignInAccount();
                            firebase_common_1.firebase._googleSignInIdToken = googleSignInAccount.getIdToken();
                            var accessToken = null;
                            var authCredential = com.google.firebase.auth.GoogleAuthProvider.getCredential(firebase_common_1.firebase._googleSignInIdToken, accessToken);
                            firebase_common_1.firebase._mGoogleApiClient.connect();
                            var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
                            if (user) {
                                if (firebase_common_1.firebase._alreadyLinkedToAuthProvider(user, "google.com")) {
                                    firebaseAuth_1.signInWithCredential(authCredential).addOnCompleteListener(onCompleteListener_1);
                                }
                                else {
                                    user.linkWithCredential(authCredential).addOnCompleteListener(onCompleteListener_1);
                                }
                            }
                            else {
                                firebaseAuth_1.signInWithCredential(authCredential).addOnCompleteListener(onCompleteListener_1);
                            }
                        }
                        else {
                            console.log("Make sure you've uploaded your SHA1 fingerprint(s) to the Firebase console. Status: " + googleSignInResult.getStatus());
                            reject("Has the SHA1 fingerprint been uploaded? Sign-in status: " + googleSignInResult.getStatus());
                        }
                    }
                };
                appModule.android.on(appModule.AndroidApplication.activityResultEvent, callback_3);
            }
            else {
                reject("Unsupported auth type: " + arg.type);
            }
        }
        catch (ex) {
            console.log("Error in firebase.login: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase._alreadyLinkedToAuthProvider = function (user, providerId) {
    var providerData = user.getProviderData();
    for (var i = 0; i < providerData.size(); i++) {
        var profile = providerData.get(i);
        if (profile.getProviderId() === providerId) {
            return true;
        }
    }
    return false;
};
firebase_common_1.firebase.reauthenticate = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
            if (user === null) {
                reject("no current user");
                return;
            }
            firebase_common_1.firebase.moveLoginOptionsToObjects(arg);
            var authCredential = null;
            if (arg.type === firebase_common_1.firebase.LoginType.PASSWORD) {
                if (!arg.passwordOptions || !arg.passwordOptions.email || !arg.passwordOptions.password) {
                    reject("Auth type PASSWORD requires an 'passwordOptions.email' and 'passwordOptions.password' argument");
                    return;
                }
                authCredential = com.google.firebase.auth.EmailAuthProvider.getCredential(arg.passwordOptions.email, arg.passwordOptions.password);
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.GOOGLE) {
                if (!firebase_common_1.firebase._googleSignInIdToken) {
                    reject("Not currently logged in with Google");
                    return;
                }
                authCredential = com.google.firebase.auth.GoogleAuthProvider.getCredential(firebase_common_1.firebase._googleSignInIdToken, null);
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.FACEBOOK) {
                if (!firebase_common_1.firebase._facebookAccessToken) {
                    reject("Not currently logged in with Facebook");
                    return;
                }
                authCredential = com.google.firebase.auth.FacebookAuthProvider.getCredential(firebase_common_1.firebase._facebookAccessToken);
            }
            if (authCredential === null) {
                reject("arg.type should be one of LoginType.PASSWORD | LoginType.GOOGLE | LoginType.FACEBOOK");
                return;
            }
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (task.isSuccessful()) {
                        var user_1 = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
                        var loginResult = toLoginResult(user_1);
                        firebase_common_1.firebase.notifyAuthStateListeners({
                            loggedIn: true,
                            user: loginResult
                        });
                        resolve(loginResult);
                    }
                    else {
                        reject((task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                    }
                }
            });
            user.reauthenticate(authCredential).addOnCompleteListener(onCompleteListener);
        }
        catch (ex) {
            console.log("Error in firebase.reauthenticate: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.reloadUser = function () {
    return new Promise(function (resolve, reject) {
        try {
            var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
            if (user === null) {
                reject("no current user");
                return;
            }
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (task.isSuccessful()) {
                        resolve();
                    }
                    else {
                        reject("Reload failed " + task.getException());
                    }
                }
            });
            user.reload().addOnCompleteListener(onCompleteListener);
        }
        catch (ex) {
            reject(ex);
        }
    });
};
firebase_common_1.firebase.sendPasswordResetEmail = function (email) {
    return new Promise(function (resolve, reject) {
        try {
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (task.isSuccessful()) {
                        resolve();
                    }
                    else {
                        reject("Sending password reset email failed");
                    }
                }
            });
            var firebaseAuth = com.google.firebase.auth.FirebaseAuth.getInstance();
            firebaseAuth.sendPasswordResetEmail(email).addOnCompleteListener(onCompleteListener);
        }
        catch (ex) {
            console.log("Error in firebase.sendPasswordResetEmail: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.updateEmail = function (newEmail) {
    return new Promise(function (resolve, reject) {
        try {
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (task.isSuccessful()) {
                        resolve();
                    }
                    else {
                        reject("Updating email failed. " + (task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                    }
                }
            });
            var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
            if (user === null) {
                reject("no current user");
            }
            else {
                user.updateEmail(newEmail).addOnCompleteListener(onCompleteListener);
            }
        }
        catch (ex) {
            console.log("Error in firebase.updateEmail: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.updatePassword = function (newPassword) {
    return new Promise(function (resolve, reject) {
        try {
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (task.isSuccessful()) {
                        resolve();
                    }
                    else {
                        reject("Updating password failed. " + (task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                    }
                }
            });
            var user = com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
            if (user === null) {
                reject("no current user");
            }
            else {
                user.updatePassword(newPassword).addOnCompleteListener(onCompleteListener);
            }
        }
        catch (ex) {
            console.log("Error in firebase.updatePassword: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.createUser = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            if (!arg.email || !arg.password) {
                reject("Creating a user requires an email and password argument");
            }
            else {
                var firebaseAuth = com.google.firebase.auth.FirebaseAuth.getInstance();
                var onCompleteListener = new gmsTasks.OnCompleteListener({
                    onComplete: function (task) {
                        if (!task.isSuccessful()) {
                            reject("Creating a user failed. " + (task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                        }
                        else {
                            var user = task.getResult().getUser();
                            var additionalUserInfo = task.getResult().getAdditionalUserInfo();
                            resolve(toLoginResult(user, additionalUserInfo));
                        }
                    }
                });
                firebaseAuth.createUserWithEmailAndPassword(arg.email, arg.password).addOnCompleteListener(onCompleteListener);
            }
        }
        catch (ex) {
            console.log("Error in firebase.createUser: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.deleteUser = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            var firebaseAuth = com.google.firebase.auth.FirebaseAuth.getInstance();
            var user = firebaseAuth.getCurrentUser();
            if (user === null) {
                reject("no current user");
                return;
            }
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (!task.isSuccessful()) {
                        reject("Deleting a user failed. " + (task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                    }
                    else {
                        resolve();
                    }
                }
            });
            user.delete().addOnCompleteListener(onCompleteListener);
        }
        catch (ex) {
            console.log("Error in firebase.deleteUser: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.updateProfile = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            if (!arg.displayName && !arg.photoURL) {
                reject("Updating a profile requires a displayName and / or a photoURL argument");
            }
            else {
                var firebaseAuth = com.google.firebase.auth.FirebaseAuth.getInstance();
                var user = firebaseAuth.getCurrentUser();
                if (user === null) {
                    reject("No current user");
                    return;
                }
                var onCompleteListener = new gmsTasks.OnCompleteListener({
                    onComplete: function (task) {
                        if (task.isSuccessful()) {
                            resolve();
                        }
                        else {
                            reject("Updating a profile failed. " + (task.getException() && task.getException().getReason ? task.getException().getReason() : task.getException()));
                        }
                    }
                });
                var profileUpdateBuilder = new com.google.firebase.auth.UserProfileChangeRequest.Builder();
                if (arg.displayName)
                    profileUpdateBuilder.setDisplayName(arg.displayName);
                if (arg.photoURL)
                    profileUpdateBuilder.setPhotoUri(android.net.Uri.parse(arg.photoURL));
                var profileUpdate = profileUpdateBuilder.build();
                user.updateProfile(profileUpdate).addOnCompleteListener(onCompleteListener);
            }
        }
        catch (ex) {
            console.log("Error in firebase.updateProfile: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.keepInSync = function (path, switchOn) {
    return new Promise(function (resolve, reject) {
        try {
            if (firebase_common_1.firebase.instance === null) {
                reject("Run init() first!");
                return;
            }
            var where = firebase_common_1.firebase.instance.child(path);
            where.keepSynced(switchOn);
            resolve();
        }
        catch (ex) {
            console.log("Error in firebase.keepInSync: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase._addObservers = function (to, updateCallback) {
    var listener = new com.google.firebase.database.ChildEventListener({
        onCancelled: function (databaseError) {
            updateCallback({
                error: databaseError.getMessage()
            });
        },
        onChildAdded: function (snapshot, previousChildKey) {
            updateCallback(firebase_common_1.firebase.getCallbackData('ChildAdded', snapshot));
        },
        onChildRemoved: function (snapshot) {
            updateCallback(firebase_common_1.firebase.getCallbackData('ChildRemoved', snapshot));
        },
        onChildChanged: function (snapshot, previousChildKey) {
            updateCallback(firebase_common_1.firebase.getCallbackData('ChildChanged', snapshot));
        },
        onChildMoved: function (snapshot, previousChildKey) {
            updateCallback(firebase_common_1.firebase.getCallbackData('ChildMoved', snapshot));
        }
    });
    to.addChildEventListener(listener);
    return listener;
};
firebase_common_1.firebase.addChildEventListener = function (updateCallback, path) {
    return new Promise(function (resolve, reject) {
        try {
            if (firebase_common_1.firebase.instance === null) {
                reject("Run init() first!");
                return;
            }
            resolve({
                path: path,
                listeners: [firebase_common_1.firebase._addObservers(firebase_common_1.firebase.instance.child(path), updateCallback)]
            });
        }
        catch (ex) {
            console.log("Error in firebase.addChildEventListener: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.addValueEventListener = function (updateCallback, path) {
    return new Promise(function (resolve, reject) {
        try {
            if (firebase_common_1.firebase.instance === null) {
                reject("Run init() first!");
                return;
            }
            var listener = new com.google.firebase.database.ValueEventListener({
                onDataChange: function (snapshot) {
                    updateCallback(firebase_common_1.firebase.getCallbackData('ValueChanged', snapshot));
                },
                onCancelled: function (databaseError) {
                    updateCallback({
                        error: databaseError.getMessage()
                    });
                }
            });
            firebase_common_1.firebase.instance.child(path).addValueEventListener(listener);
            resolve({
                path: path,
                listeners: [listener]
            });
        }
        catch (ex) {
            console.log("Error in firebase.addValueEventListener: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.getValue = function (path) {
    return new Promise(function (resolve, reject) {
        try {
            if (firebase_common_1.firebase.instance === null) {
                reject("Run init() first!");
                return;
            }
            var listener = new com.google.firebase.database.ValueEventListener({
                onDataChange: function (snapshot) {
                    resolve(firebase_common_1.firebase.getCallbackData('ValueChanged', snapshot));
                },
                onCancelled: function (databaseError) {
                    reject(databaseError.getMessage());
                }
            });
            firebase_common_1.firebase.instance.child(path).addListenerForSingleValueEvent(listener);
        }
        catch (ex) {
            console.log("Error in firebase.getValue: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.removeEventListeners = function (listeners, path) {
    return new Promise(function (resolve, reject) {
        try {
            if (firebase_common_1.firebase.instance === null) {
                reject("Run init() first!");
                return;
            }
            var ref = firebase_common_1.firebase.instance.child(path);
            for (var i = 0; i < listeners.length; i++) {
                var listener = listeners[i];
                ref.removeEventListener(listener);
            }
            resolve();
        }
        catch (ex) {
            console.log("Error in firebase.removeEventListeners: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.push = function (path, val) {
    return new Promise(function (resolve, reject) {
        try {
            if (firebase_common_1.firebase.instance === null) {
                reject("Run init() first!");
                return;
            }
            var pushInstance_1 = firebase_common_1.firebase.instance.child(path).push();
            pushInstance_1.setValue(firebase_common_1.firebase.toValue(val))
                .addOnSuccessListener(new gmsTasks.OnSuccessListener({
                onSuccess: function () { return resolve({ key: pushInstance_1.getKey() }); }
            }))
                .addOnFailureListener(new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            }));
        }
        catch (ex) {
            console.log("Error in firebase.push: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.setValue = function (path, val) {
    return new Promise(function (resolve, reject) {
        try {
            if (firebase_common_1.firebase.instance === null) {
                reject("Run init() first!");
                return;
            }
            firebase_common_1.firebase.instance.child(path).setValue(firebase_common_1.firebase.toValue(val))
                .addOnSuccessListener(new gmsTasks.OnSuccessListener({
                onSuccess: function () { return resolve(); }
            }))
                .addOnFailureListener(new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            }));
        }
        catch (ex) {
            console.log("Error in firebase.setValue: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.update = function (path, val) {
    return new Promise(function (resolve, reject) {
        try {
            if (firebase_common_1.firebase.instance === null) {
                reject("Run init() first!");
                return;
            }
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function () { return resolve(); }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            if (typeof val === "object") {
                firebase_common_1.firebase.instance.child(path).updateChildren(firebase_common_1.firebase.toHashMap(val))
                    .addOnSuccessListener(onSuccessListener)
                    .addOnFailureListener(onFailureListener);
            }
            else {
                var lastPartOfPath = path.lastIndexOf("/");
                var pathPrefix = path.substring(0, lastPartOfPath);
                var pathSuffix = path.substring(lastPartOfPath + 1);
                var updateObject = '{"' + pathSuffix + '" : "' + val + '"}';
                firebase_common_1.firebase.instance.child(pathPrefix).updateChildren(firebase_common_1.firebase.toHashMap(JSON.parse(updateObject)))
                    .addOnSuccessListener(onSuccessListener)
                    .addOnFailureListener(onFailureListener);
            }
        }
        catch (ex) {
            console.log("Error in firebase.update: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.query = function (updateCallback, path, options) {
    return new Promise(function (resolve, reject) {
        try {
            if (firebase_common_1.firebase.instance === null) {
                reject("Run init() first!");
                return;
            }
            var query = void 0;
            if (options.orderBy.type === firebase_common_1.firebase.QueryOrderByType.KEY) {
                query = firebase_common_1.firebase.instance.child(path).orderByKey();
            }
            else if (options.orderBy.type === firebase_common_1.firebase.QueryOrderByType.VALUE) {
                query = firebase_common_1.firebase.instance.child(path).orderByValue();
            }
            else if (options.orderBy.type === firebase_common_1.firebase.QueryOrderByType.PRIORITY) {
                query = firebase_common_1.firebase.instance.child(path).orderByPriority();
            }
            else if (options.orderBy.type === firebase_common_1.firebase.QueryOrderByType.CHILD) {
                if (options.orderBy.value === undefined || options.orderBy.value === null) {
                    reject("When orderBy.type is 'child' you must set orderBy.value as well.");
                    return;
                }
                query = firebase_common_1.firebase.instance.child(path).orderByChild(options.orderBy.value);
            }
            else {
                reject("Invalid orderBy.type, use constants like firebase.QueryOrderByType.VALUE");
                return;
            }
            if (options.range && options.range.type) {
                if (options.range.type === firebase_common_1.firebase.QueryRangeType.START_AT) {
                    query = query.startAt(options.range.value);
                }
                else if (options.range.type === firebase_common_1.firebase.QueryRangeType.END_AT) {
                    query = query.endAt(options.range.value);
                }
                else if (options.range.type === firebase_common_1.firebase.QueryRangeType.EQUAL_TO) {
                    query = query.equalTo(options.range.value);
                }
                else {
                    reject("Invalid range.type, use constants like firebase.QueryRangeType.START_AT");
                    return;
                }
            }
            if (options.ranges) {
                for (var i = 0; i < options.ranges.length; i++) {
                    var range = options.ranges[i];
                    if (range.value === undefined || range.value === null) {
                        reject("Please set ranges[" + i + "].value");
                        return;
                    }
                    if (range.type === firebase_common_1.firebase.QueryRangeType.START_AT) {
                        query = query.startAt(range.value);
                    }
                    else if (range.type === firebase_common_1.firebase.QueryRangeType.END_AT) {
                        query = query.endAt(range.value);
                    }
                    else if (range.type === firebase_common_1.firebase.QueryRangeType.EQUAL_TO) {
                        query = query.equalTo(range.value);
                    }
                    else {
                        reject("Invalid ranges[" + i + "].type, use constants like firebase.QueryRangeType.START_AT");
                        return;
                    }
                }
            }
            if (options.limit && options.limit.type) {
                if (options.limit.value === undefined || options.limit.value === null) {
                    reject("Please set limit.value");
                    return;
                }
                if (options.limit.type === firebase_common_1.firebase.QueryLimitType.FIRST) {
                    query = query.limitToFirst(options.limit.value);
                }
                else if (options.limit.type === firebase_common_1.firebase.QueryLimitType.LAST) {
                    query = query.limitToLast(options.limit.value);
                }
                else {
                    reject("Invalid limit.type, use constants like firebase.QueryLimitType.FIRST");
                    return;
                }
            }
            if (options.singleEvent) {
                var listener = new com.google.firebase.database.ValueEventListener({
                    onDataChange: function (snapshot) {
                        var result = {
                            type: "ValueChanged",
                            key: snapshot.getKey(),
                            value: {},
                            children: []
                        };
                        for (var iterator = snapshot.getChildren().iterator(); iterator.hasNext();) {
                            var snap = iterator.next();
                            var val = firebase_common_1.firebase.toJsObject(snap.getValue());
                            result.value[snap.getKey()] = val;
                            result.children.push(val);
                        }
                        if (updateCallback)
                            updateCallback(result);
                        resolve(result);
                    },
                    onCancelled: function (databaseError) {
                        if (updateCallback)
                            updateCallback({
                                error: databaseError.getMessage()
                            });
                        resolve({
                            error: databaseError.getMessage()
                        });
                    }
                });
                query.addListenerForSingleValueEvent(listener);
            }
            else {
                resolve({
                    path: path,
                    listeners: [firebase_common_1.firebase._addObservers(query, updateCallback)]
                });
            }
        }
        catch (ex) {
            console.log("Error in firebase.query: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.remove = function (path) {
    return new Promise(function (resolve, reject) {
        try {
            if (firebase_common_1.firebase.instance === null) {
                reject("Run init() first!");
                return;
            }
            firebase_common_1.firebase.instance.child(path).setValue(null)
                .addOnSuccessListener(new gmsTasks.OnSuccessListener({
                onSuccess: function () { return resolve(); }
            }))
                .addOnFailureListener(new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            }));
        }
        catch (ex) {
            console.log("Error in firebase.remove: " + ex);
            reject(ex);
        }
    });
};
var OnDisconnect = (function () {
    function OnDisconnect(disconnectInstance) {
        this.disconnectInstance = disconnectInstance;
    }
    OnDisconnect.prototype.cancel = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.disconnectInstance.cancel()
                    .addOnSuccessListener(new gmsTasks.OnSuccessListener({
                    onSuccess: function () { return resolve(); }
                }))
                    .addOnFailureListener(new gmsTasks.OnFailureListener({
                    onFailure: function (exception) { return reject(exception.getMessage()); }
                }));
            }
            catch (ex) {
                console.log("Error in firebase.onDisconnect.cancel: " + ex);
                reject(ex);
            }
        });
    };
    OnDisconnect.prototype.remove = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.disconnectInstance.removeValue()
                    .addOnSuccessListener(new gmsTasks.OnSuccessListener({
                    onSuccess: function () { return resolve(); }
                }))
                    .addOnFailureListener(new gmsTasks.OnFailureListener({
                    onFailure: function (exception) { return reject(exception.getMessage()); }
                }));
            }
            catch (ex) {
                console.log("Error in firebase.onDisconnect.remove: " + ex);
                reject(ex);
            }
        });
    };
    OnDisconnect.prototype.set = function (value) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.disconnectInstance.setValue(firebase_common_1.firebase.toValue(value))
                    .addOnSuccessListener(new gmsTasks.OnSuccessListener({
                    onSuccess: function () { return resolve(); }
                }))
                    .addOnFailureListener(new gmsTasks.OnFailureListener({
                    onFailure: function (exception) { return reject(exception.getMessage()); }
                }));
            }
            catch (ex) {
                console.log("Error in firebase.onDisconnect.set: " + ex);
                reject(ex);
            }
        });
    };
    OnDisconnect.prototype.setWithPriority = function (value, priority) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.disconnectInstance.setValue(firebase_common_1.firebase.toValue(value), priority)
                    .addOnSuccessListener(new gmsTasks.OnSuccessListener({
                    onSuccess: function () { return resolve(); }
                }))
                    .addOnFailureListener(new gmsTasks.OnFailureListener({
                    onFailure: function (exception) { return reject(exception.getMessage()); }
                }));
            }
            catch (ex) {
                console.log("Error in firebase.onDisconnect.setWithPriority: " + ex);
                reject(ex);
            }
        });
    };
    OnDisconnect.prototype.update = function (values, onComplete) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.disconnectInstance.updateChildren(firebase_common_1.firebase.toHashMap(values))
                    .addOnSuccessListener(new gmsTasks.OnSuccessListener({
                    onSuccess: function () { return resolve(); }
                }))
                    .addOnFailureListener(new gmsTasks.OnFailureListener({
                    onFailure: function (exception) { return reject(exception.getMessage()); }
                }));
            }
            catch (ex) {
                console.log("Error in firebase.onDisconnect.update: " + ex);
                reject(ex);
            }
        });
    };
    return OnDisconnect;
}());
firebase_common_1.firebase.onDisconnect = function (path) {
    if (!firebase_common_1.firebase.initialized) {
        console.error("Please run firebase.init() before firebase.onDisconnect()");
        throw new Error("FirebaseApp is not initialized. Make sure you run firebase.init() first");
    }
    var disconnectInstance = firebase_common_1.firebase.instance.child(path).onDisconnect();
    return new OnDisconnect(disconnectInstance);
};
firebase_common_1.firebase.transaction = function (path, transactionUpdate, onComplete) {
    return new Promise(function (resolve, reject) {
        if (!firebase_common_1.firebase.initialized) {
            console.error("Please run firebase.init() before firebase.transaction()");
            throw new Error("FirebaseApp is not initialized. Make sure you run firebase.init() first");
        }
        var dbRef = firebase_common_1.firebase.instance.child(path);
        var handler = new com.google.firebase.database.Transaction.Handler({
            doTransaction: function (mutableData) {
                var desiredValue = transactionUpdate(firebase_common_1.firebase.toJsObject(mutableData.getValue()));
                if (desiredValue === undefined) {
                    return com.google.firebase.database.Transaction.success(mutableData);
                }
                mutableData.setValue(firebase_common_1.firebase.toValue(desiredValue));
                return com.google.firebase.database.Transaction.success(mutableData);
            },
            onComplete: function (databaseError, commited, snapshot) {
                databaseError !== null ? reject(databaseError.getMessage()) :
                    resolve({ committed: commited, snapshot: nativeSnapshotToWebSnapshot(snapshot) });
            }
        });
        dbRef.runTransaction(handler);
    });
};
function nativeSnapshotToWebSnapshot(snapshot) {
    function forEach(action) {
        var innerSnapshot;
        for (var iterator = snapshot.getChildren().iterator(); iterator.hasNext();) {
            innerSnapshot = nativeSnapshotToWebSnapshot(iterator.next());
            if (action(innerSnapshot)) {
                return true;
            }
        }
        return false;
    }
    return {
        key: snapshot.getKey(),
        ref: snapshot.getRef(),
        child: function (path) { return nativeSnapshotToWebSnapshot(snapshot.child(path)); },
        exists: function () { return snapshot.exists(); },
        forEach: function (func) { return forEach(func); },
        getPriority: function () { return firebase_common_1.firebase.toJsObject(snapshot.getPriority()); },
        hasChild: function (path) { return snapshot.hasChild(path); },
        hasChildren: function () { return snapshot.hasChildren(); },
        numChildren: function () { return snapshot.getChildrenCount(); },
        toJSON: function () { return firebase_common_1.firebase.toJsObject(snapshot.toString()); },
        val: function () { return firebase_common_1.firebase.toJsObject(snapshot.getValue()); }
    };
}
firebase_common_1.firebase.enableLogging = function (logging, persistent) {
    if (logging) {
        com.google.firebase.database.FirebaseDatabase.getInstance().setLogLevel(com.google.firebase.database.Logger.Level.DEBUG);
    }
    else {
        com.google.firebase.database.FirebaseDatabase.getInstance().setLogLevel(com.google.firebase.database.Logger.Level.NONE);
    }
};
var ensureFirestore = function () {
    if (typeof (com.google.firebase.firestore) === "undefined") {
        throw new Error("Make sure 'firestore' is enabled in 'firebase.nativescript.json', then clean the node_modules and platforms folders");
    }
};
var FirestoreWriteBatch = (function () {
    function FirestoreWriteBatch() {
        var _this = this;
        this.set = function (documentRef, data, options) {
            if (options && options.merge) {
                _this.nativeWriteBatch.set(documentRef.android, firebase_common_1.firebase.toValue(data), com.google.firebase.firestore.SetOptions.merge());
            }
            else {
                _this.nativeWriteBatch.set(documentRef.android, firebase_common_1.firebase.toValue(data));
            }
            return _this;
        };
        this.update = function (documentRef, data) {
            _this.nativeWriteBatch.update(documentRef.android, firebase_common_1.firebase.toValue(data));
            return _this;
        };
        this.delete = function (documentRef) {
            _this.nativeWriteBatch.delete(documentRef.android);
            return _this;
        };
    }
    FirestoreWriteBatch.prototype.commit = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (!task.isSuccessful()) {
                        var ex = task.getException();
                        reject(ex && ex.getReason ? ex.getReason() : ex);
                    }
                    else {
                        resolve();
                    }
                }
            });
            _this.nativeWriteBatch.commit().addOnCompleteListener(onCompleteListener);
        });
    };
    return FirestoreWriteBatch;
}());
firebase_common_1.firebase.firestore.batch = function () {
    var batch = new FirestoreWriteBatch();
    batch.nativeWriteBatch = com.google.firebase.firestore.FirebaseFirestore.getInstance().batch();
    return batch;
};
firebase_common_1.firebase.firestore.runTransaction = function (updateFunction) {
    return new Promise(function (resolve, reject) {
        reject("Not supported on Android. If you need a x-platform implementation, use 'batch' instead.");
    });
};
firebase_common_1.firebase.firestore.settings = function (settings) {
    if (typeof (com.google.firebase.firestore) !== "undefined") {
        try {
            var builder = new com.google.firebase.firestore.FirebaseFirestoreSettings.Builder();
            (settings.cacheSizeBytes !== undefined) && builder.setCacheSizeBytes(long(settings.cacheSizeBytes));
            (settings.ssl !== undefined) && builder.setSslEnabled(settings.ssl);
            (settings.host !== undefined) && builder.setHost(settings.host);
            (initializeArguments.persist !== undefined) && builder.setPersistenceEnabled(initializeArguments.persist);
            com.google.firebase.firestore.FirebaseFirestore.getInstance().setFirestoreSettings(builder.build());
        }
        catch (err) {
            console.log("Error in firebase.firestore.settings: " + err);
        }
    }
};
firebase_common_1.firebase.firestore.clearPersistence = function () {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
        var onSuccessListener = new gmsTasks.OnSuccessListener({
            onSuccess: function () { return resolve(); }
        });
        var onFailureListener = new gmsTasks.OnFailureListener({
            onFailure: function (exception) { return reject(exception.getMessage()); }
        });
        db.clearPersistence()
            .addOnSuccessListener(onSuccessListener)
            .addOnFailureListener(onFailureListener);
    });
};
firebase_common_1.firebase.firestore.collection = function (collectionPath) {
    ensureFirestore();
    try {
        if (!firebase_common_1.firebase.initialized) {
            console.log("Please run firebase.init() before firebase.firestore.collection()");
            return null;
        }
        var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
        return firebase_common_1.firebase.firestore._getCollectionReference(db.collection(collectionPath));
    }
    catch (ex) {
        console.log("Error in firebase.firestore.collection: " + ex);
        return null;
    }
};
firebase_common_1.firebase.firestore.collectionGroup = function (id) {
    ensureFirestore();
    try {
        var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
        return firebase_common_1.firebase.firestore._getCollectionGroupQuery(db.collectionGroup(id));
    }
    catch (ex) {
        console.log("Error in firebase.firestore.collectionGroup: " + ex);
        return null;
    }
};
firebase_common_1.firebase.firestore.onDocumentSnapshot = function (docRef, optionsOrCallback, callbackOrOnError, onError) {
    var options = com.google.firebase.firestore.MetadataChanges.EXCLUDE;
    var onNextCallback;
    var onErrorCallback;
    if ((typeof optionsOrCallback) === "function") {
        onNextCallback = optionsOrCallback;
        onErrorCallback = callbackOrOnError;
    }
    else {
        onNextCallback = callbackOrOnError;
        onErrorCallback = onError;
    }
    if (optionsOrCallback.includeMetadataChanges) {
        options = com.google.firebase.firestore.MetadataChanges.INCLUDE;
    }
    var listener = docRef.addSnapshotListener(options, new com.google.firebase.firestore.EventListener({
        onEvent: (function (snapshot, exception) {
            if (exception !== null) {
                var error = "onDocumentSnapshot error code: " + exception.getCode();
                onErrorCallback && onErrorCallback(new Error(error));
                return;
            }
            onNextCallback && onNextCallback(new DocumentSnapshot(snapshot));
        })
    }));
    return function () { return listener.remove(); };
};
firebase_common_1.firebase.firestore.onCollectionSnapshot = function (colRef, optionsOrCallback, callbackOrOnError, onError) {
    var options = com.google.firebase.firestore.MetadataChanges.EXCLUDE;
    var onNextCallback;
    var onErrorCallback;
    if ((typeof optionsOrCallback) === "function") {
        onNextCallback = optionsOrCallback;
        onErrorCallback = callbackOrOnError;
    }
    else {
        onNextCallback = callbackOrOnError;
        onErrorCallback = onError;
    }
    if (optionsOrCallback.includeMetadataChanges) {
        options = com.google.firebase.firestore.MetadataChanges.INCLUDE;
    }
    var listener = colRef.addSnapshotListener(options, new com.google.firebase.firestore.EventListener({
        onEvent: (function (snapshot, exception) {
            if (exception !== null) {
                var error = "onCollectionSnapshot error code: " + exception.getCode();
                onErrorCallback && onErrorCallback(new Error(error));
                return;
            }
            onNextCallback && onNextCallback(new QuerySnapshot(snapshot));
        })
    }));
    return function () { return listener.remove(); };
};
firebase_common_1.firebase.firestore._getDocumentReference = function (docRef) {
    if (!docRef) {
        return null;
    }
    var collectionPath = docRef.getParent().getPath();
    return {
        discriminator: "docRef",
        id: docRef.getId(),
        parent: firebase_common_1.firebase.firestore._getCollectionReference(docRef.getParent()),
        path: docRef.getPath(),
        firestore: firebase_common_1.firebase.firestore,
        collection: function (cp) { return firebase_common_1.firebase.firestore.collection(collectionPath + "/" + docRef.getId() + "/" + cp); },
        set: function (data, options) { return firebase_common_1.firebase.firestore.set(collectionPath, docRef.getId(), data, options); },
        get: function (options) { return firebase_common_1.firebase.firestore.getDocument(collectionPath, docRef.getId(), options); },
        update: function (data) { return firebase_common_1.firebase.firestore.update(collectionPath, docRef.getId(), data); },
        delete: function () { return firebase_common_1.firebase.firestore.delete(collectionPath, docRef.getId()); },
        onSnapshot: function (optionsOrCallback, callbackOrOnError, onError) { return firebase_common_1.firebase.firestore.onDocumentSnapshot(docRef, optionsOrCallback, callbackOrOnError, onError); },
        android: docRef
    };
};
firebase_common_1.firebase.firestore._getCollectionGroupQuery = function (query) {
    if (!query) {
        return null;
    }
    return {
        where: function (property, opStr, value) { return firebase_common_1.firebase.firestore.where(undefined, property, opStr, value, query); }
    };
};
firebase_common_1.firebase.firestore._getCollectionReference = function (colRef) {
    if (!colRef) {
        return null;
    }
    var collectionPath = colRef.getPath();
    return {
        id: colRef.getId(),
        parent: firebase_common_1.firebase.firestore._getDocumentReference(colRef.getParent()),
        firestore: firebase_common_1.firebase.firestore,
        doc: function (documentPath) { return firebase_common_1.firebase.firestore.doc(collectionPath, documentPath); },
        add: function (document) { return firebase_common_1.firebase.firestore.add(collectionPath, document); },
        get: function (options) { return firebase_common_1.firebase.firestore.get(collectionPath, options); },
        where: function (fieldPath, opStr, value) { return firebase_common_1.firebase.firestore.where(collectionPath, fieldPath, opStr, value); },
        orderBy: function (fieldPath, directionStr) { return firebase_common_1.firebase.firestore.orderBy(collectionPath, fieldPath, directionStr, colRef); },
        limit: function (limit) { return firebase_common_1.firebase.firestore.limit(collectionPath, limit, colRef); },
        onSnapshot: function (optionsOrCallback, callbackOrOnError, onError) { return firebase_common_1.firebase.firestore.onCollectionSnapshot(colRef, optionsOrCallback, callbackOrOnError, onError); },
        startAfter: function (snapshotOrFieldValue) {
            var fieldValues = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                fieldValues[_i - 1] = arguments[_i];
            }
            return firebase_common_1.firebase.firestore.startAfter(collectionPath, snapshotOrFieldValue, fieldValues, colRef);
        },
        startAt: function (snapshotOrFieldValue) {
            var fieldValues = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                fieldValues[_i - 1] = arguments[_i];
            }
            return firebase_common_1.firebase.firestore.startAt(collectionPath, snapshotOrFieldValue, fieldValues, colRef);
        },
        endAt: function (snapshotOrFieldValue) {
            var fieldValues = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                fieldValues[_i - 1] = arguments[_i];
            }
            return firebase_common_1.firebase.firestore.endAt(collectionPath, snapshotOrFieldValue, fieldValues, colRef);
        },
        endBefore: function (snapshotOrFieldValue) {
            var fieldValues = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                fieldValues[_i - 1] = arguments[_i];
            }
            return firebase_common_1.firebase.firestore.endBefore(collectionPath, snapshotOrFieldValue, fieldValues, colRef);
        }
    };
};
firebase_common_1.firebase.firestore.doc = function (collectionPath, documentPath) {
    ensureFirestore();
    try {
        if (!firebase_common_1.firebase.initialized) {
            console.log("Please run firebase.init() before firebase.firestore.doc()");
            return null;
        }
        var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
        var colRef = db.collection(collectionPath);
        var docRef = documentPath ? colRef.document(documentPath) : colRef.document();
        return firebase_common_1.firebase.firestore._getDocumentReference(docRef);
    }
    catch (ex) {
        console.log("Error in firebase.firestore.doc: " + ex);
        return null;
    }
};
firebase_common_1.firebase.firestore.docRef = function (documentPath) {
    ensureFirestore();
    var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
    return firebase_common_1.firebase.firestore._getDocumentReference(db.document(documentPath));
};
firebase_common_1.firebase.firestore.add = function (collectionPath, document) {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        try {
            var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function (docRef) {
                    resolve(firebase_common_1.firebase.firestore._getDocumentReference(docRef));
                }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            db.collection(collectionPath)
                .add(firebase_common_1.firebase.toValue(document))
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
        }
        catch (ex) {
            console.log("Error in firebase.firestore.add: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.firestore.set = function (collectionPath, documentPath, document, options) {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        try {
            var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function () { return resolve(); }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            var docRef = db.collection(collectionPath).document(documentPath);
            if (options && options.merge) {
                docRef
                    .set(firebase_common_1.firebase.toValue(document), com.google.firebase.firestore.SetOptions.merge())
                    .addOnSuccessListener(onSuccessListener)
                    .addOnFailureListener(onFailureListener);
            }
            else {
                docRef
                    .set(firebase_common_1.firebase.toValue(document))
                    .addOnSuccessListener(onSuccessListener)
                    .addOnFailureListener(onFailureListener);
            }
        }
        catch (ex) {
            console.log("Error in firebase.firestore.set: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.firestore.update = function (collectionPath, documentPath, document) {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        try {
            var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function () { return resolve(); }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            var docRef = db.collection(collectionPath).document(documentPath);
            docRef
                .update(firebase_common_1.firebase.toValue(document))
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
        }
        catch (ex) {
            console.log("Error in firebase.firestore.update: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.firestore.delete = function (collectionPath, documentPath) {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        try {
            var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function () { return resolve(); }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            });
            var docRef = db.collection(collectionPath).document(documentPath);
            docRef
                .delete()
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
        }
        catch (ex) {
            console.log("Error in firebase.firestore.delete: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.firestore.getCollection = function (collectionPath, options) {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        try {
            var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (!task.isSuccessful()) {
                        var ex = task.getException();
                        reject(ex && ex.getReason ? ex.getReason() : ex);
                    }
                    else {
                        var result = task.getResult();
                        resolve(new QuerySnapshot(result));
                    }
                }
            });
            var source = com.google.firebase.firestore.Source.DEFAULT;
            if (options && options.source) {
                if (options.source === "cache") {
                    source = com.google.firebase.firestore.Source.CACHE;
                }
                else if (options.source === "server") {
                    source = com.google.firebase.firestore.Source.SERVER;
                }
            }
            db.collection(collectionPath)
                .get(source)
                .addOnCompleteListener(onCompleteListener);
        }
        catch (ex) {
            console.log("Error in firebase.firestore.getCollection: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.firestore.get = function (collectionPath, options) {
    return firebase_common_1.firebase.firestore.getCollection(collectionPath, options);
};
firebase_common_1.firebase.firestore.getDocument = function (collectionPath, documentPath, options) {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        try {
            var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (!task.isSuccessful()) {
                        var ex = task.getException();
                        reject(ex && ex.getReason ? ex.getReason() : ex);
                    }
                    else {
                        var result = task.getResult();
                        resolve(new DocumentSnapshot(result));
                    }
                }
            });
            var source = com.google.firebase.firestore.Source.DEFAULT;
            if (options && options.source) {
                if (options.source === "cache") {
                    source = com.google.firebase.firestore.Source.CACHE;
                }
                else if (options.source === "server") {
                    source = com.google.firebase.firestore.Source.SERVER;
                }
            }
            db.collection(collectionPath)
                .document(documentPath)
                .get(source)
                .addOnCompleteListener(onCompleteListener);
        }
        catch (ex) {
            console.log("Error in firebase.firestore.getDocument: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.firestore._getQuery = function (collectionPath, query) {
    return {
        get: function () { return new Promise(function (resolve, reject) {
            var onCompleteListener = new gmsTasks.OnCompleteListener({
                onComplete: function (task) {
                    if (!task.isSuccessful()) {
                        var ex = task.getException();
                        reject(ex && ex.getReason ? ex.getReason() : ex);
                    }
                    else {
                        var result = task.getResult();
                        resolve(new QuerySnapshot(result));
                    }
                }
            });
            query.get().addOnCompleteListener(onCompleteListener);
        }); },
        where: function (fp, os, v) { return firebase_common_1.firebase.firestore.where(collectionPath, fp, os, v, query); },
        orderBy: function (fp, directionStr) { return firebase_common_1.firebase.firestore.orderBy(collectionPath, fp, directionStr, query); },
        limit: function (limit) { return firebase_common_1.firebase.firestore.limit(collectionPath, limit, query); },
        onSnapshot: function (optionsOrCallback, callbackOrOnError, onError) { return firebase_common_1.firebase.firestore.onCollectionSnapshot(query, optionsOrCallback, callbackOrOnError, onError); },
        startAfter: function (snapshotOrFieldValue) {
            var fieldValues = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                fieldValues[_i - 1] = arguments[_i];
            }
            return firebase_common_1.firebase.firestore.startAfter(collectionPath, snapshotOrFieldValue, fieldValues, query);
        },
        startAt: function (snapshotOrFieldValue) {
            var fieldValues = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                fieldValues[_i - 1] = arguments[_i];
            }
            return firebase_common_1.firebase.firestore.startAt(collectionPath, snapshotOrFieldValue, fieldValues, query);
        },
        endAt: function (snapshotOrFieldValue) {
            var fieldValues = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                fieldValues[_i - 1] = arguments[_i];
            }
            return firebase_common_1.firebase.firestore.endAt(collectionPath, snapshotOrFieldValue, fieldValues, query);
        },
        endBefore: function (snapshotOrFieldValue) {
            var fieldValues = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                fieldValues[_i - 1] = arguments[_i];
            }
            return firebase_common_1.firebase.firestore.endBefore(collectionPath, snapshotOrFieldValue, fieldValues, query);
        },
        firestore: firebase_common_1.firebase.firestore
    };
};
firebase_common_1.firebase.firestore.where = function (collectionPath, fieldPath, opStr, value, query) {
    ensureFirestore();
    try {
        var db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
        query = query || db.collection(collectionPath);
        if (opStr === "<") {
            query = query.whereLessThan(fieldPath, firebase_common_1.firebase.toValue(value));
        }
        else if (opStr === "<=") {
            query = query.whereLessThanOrEqualTo(fieldPath, firebase_common_1.firebase.toValue(value));
        }
        else if (opStr === "==") {
            query = query.whereEqualTo(fieldPath, firebase_common_1.firebase.toValue(value));
        }
        else if (opStr === ">=") {
            query = query.whereGreaterThanOrEqualTo(fieldPath, firebase_common_1.firebase.toValue(value));
        }
        else if (opStr === ">") {
            query = query.whereGreaterThan(fieldPath, firebase_common_1.firebase.toValue(value));
        }
        else if (opStr === "in") {
            query = query.whereIn(fieldPath, firebase_common_1.firebase.toValue(value));
        }
        else if (opStr === "array-contains") {
            query = query.whereArrayContains(fieldPath, firebase_common_1.firebase.toValue(value));
        }
        else if (opStr === "array-contains-any") {
            query = query.whereArrayContainsAny(fieldPath, firebase_common_1.firebase.toValue(value));
        }
        else {
            console.log("Illegal argument for opStr: " + opStr);
            return null;
        }
        return firebase_common_1.firebase.firestore._getQuery(collectionPath, query);
    }
    catch (ex) {
        console.log("Error in firebase.firestore.where: " + ex);
        return null;
    }
};
firebase_common_1.firebase.firestore.orderBy = function (collectionPath, fieldPath, direction, query) {
    query = query.orderBy(fieldPath, direction === "desc" ? com.google.firebase.firestore.Query.Direction.DESCENDING : com.google.firebase.firestore.Query.Direction.ASCENDING);
    return firebase_common_1.firebase.firestore._getQuery(collectionPath, query);
};
firebase_common_1.firebase.firestore.limit = function (collectionPath, limit, query) {
    query = query.limit(limit);
    return firebase_common_1.firebase.firestore._getQuery(collectionPath, query);
};
firebase_common_1.firebase.firestore.startAfter = function (collectionPath, snapshotOrFieldValue, fieldValues, query) {
    return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.startAfter(firebase_common_1.firebase.firestore._getSnapshotOrFieldValues(snapshotOrFieldValue, fieldValues)));
};
firebase_common_1.firebase.firestore.startAt = function (collectionPath, snapshotOrFieldValue, fieldValues, query) {
    return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.startAt(firebase_common_1.firebase.firestore._getSnapshotOrFieldValues(snapshotOrFieldValue, fieldValues)));
};
firebase_common_1.firebase.firestore.endAt = function (collectionPath, snapshotOrFieldValue, fieldValues, query) {
    return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.endAt(firebase_common_1.firebase.firestore._getSnapshotOrFieldValues(snapshotOrFieldValue, fieldValues)));
};
firebase_common_1.firebase.firestore.endBefore = function (collectionPath, snapshotOrFieldValue, fieldValues, query) {
    return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.endBefore(firebase_common_1.firebase.firestore._getSnapshotOrFieldValues(snapshotOrFieldValue, fieldValues)));
};
firebase_common_1.firebase.firestore._getSnapshotOrFieldValues = function (snapshotOrFieldValue, fieldValues) {
    if (snapshotOrFieldValue && snapshotOrFieldValue.android) {
        return snapshotOrFieldValue.android;
    }
    else {
        var AllFieldValues = [snapshotOrFieldValue].concat(fieldValues);
        var javaArray_1 = Array.create('java.lang.Object', AllFieldValues.length);
        AllFieldValues.forEach(function (value, index) {
            javaArray_1[index] = firebase_common_1.firebase.toValue(value);
        });
        return javaArray_1;
    }
};
function convertDocChangeType(type) {
    switch (type) {
        case com.google.firebase.firestore.DocumentChange.Type.ADDED:
            return 'added';
        case com.google.firebase.firestore.DocumentChange.Type.MODIFIED:
            return 'modified';
        case com.google.firebase.firestore.DocumentChange.Type.REMOVED:
            return 'removed';
        default:
            throw new Error('Unknown DocumentChangeType');
    }
}
function convertDocument(qDoc) {
    return new DocumentSnapshot(qDoc);
}
var QuerySnapshot = (function () {
    function QuerySnapshot(snapshot) {
        this.snapshot = snapshot;
        this.metadata = {
            fromCache: this.snapshot.getMetadata().isFromCache(),
            hasPendingWrites: this.snapshot.getMetadata().hasPendingWrites()
        };
        this.docSnapshots = this.docs;
    }
    Object.defineProperty(QuerySnapshot.prototype, "docs", {
        get: function () {
            var _this = this;
            var getSnapshots = function () {
                var docSnapshots = [];
                for (var i = 0; i < _this.snapshot.size(); i++) {
                    var documentSnapshot = _this.snapshot.getDocuments().get(i);
                    docSnapshots.push(new DocumentSnapshot(documentSnapshot));
                }
                _this._docSnapshots = docSnapshots;
                return docSnapshots;
            };
            return this._docSnapshots || getSnapshots();
        },
        enumerable: true,
        configurable: true
    });
    QuerySnapshot.prototype.docChanges = function (options) {
        var docChanges = [];
        var jChanges = this.snapshot.getDocumentChanges();
        for (var i = 0; i < jChanges.size(); i++) {
            var chg = jChanges.get(i);
            var type = convertDocChangeType(chg.getType());
            var doc = convertDocument(chg.getDocument());
            docChanges.push({
                doc: doc,
                newIndex: chg.getNewIndex(),
                oldIndex: chg.getOldIndex(),
                type: type,
            });
        }
        return docChanges;
    };
    QuerySnapshot.prototype.forEach = function (callback, thisArg) {
        this.docSnapshots.map(function (snapshot) { return callback(snapshot); });
    };
    return QuerySnapshot;
}());
exports.QuerySnapshot = QuerySnapshot;
module.exports = firebase_common_1.firebase;
