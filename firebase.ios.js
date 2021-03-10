"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var application = require("tns-core-modules/application/application");
var platform_1 = require("tns-core-modules/platform");
var firebase_common_1 = require("./firebase-common");
var firebaseFunctions = require("./functions/functions");
var firebaseMessaging = require("./messaging/messaging");
var utils_1 = require("./utils");
var nonce_util_ios_1 = require("./utils/nonce-util-ios");
firebase_common_1.firebase._gIDAuthentication = null;
firebase_common_1.firebase._cachedDynamicLink = null;
firebase_common_1.firebase._configured = false;
firebase_common_1.firebase._currentNonce = null;
var useExternalPushProvider = NSBundle.mainBundle.infoDictionary.objectForKey("UseExternalPushProvider") === true;
var initializeArguments;
var DocumentSnapshot = (function (_super) {
    __extends(DocumentSnapshot, _super);
    function DocumentSnapshot(snapshot) {
        var _this = _super.call(this, snapshot.documentID, snapshot.exists, utils_1.firebaseUtils.toJsObject(snapshot.data()), firebase_common_1.firebase.firestore._getDocumentReference(snapshot.reference)) || this;
        _this.snapshot = snapshot;
        _this.metadata = {
            fromCache: _this.snapshot.metadata.fromCache,
            hasPendingWrites: _this.snapshot.metadata.pendingWrites
        };
        _this.ios = snapshot;
        return _this;
    }
    return DocumentSnapshot;
}(firebase_common_1.DocumentSnapshot));
firebase_common_1.firebase.authStateListener = null;
firebase_common_1.firebase.addOnMessageReceivedCallback = firebaseMessaging.addOnMessageReceivedCallback;
firebase_common_1.firebase.addOnPushTokenReceivedCallback = firebaseMessaging.addOnPushTokenReceivedCallback;
firebase_common_1.firebase.registerForPushNotifications = firebaseMessaging.registerForPushNotifications;
firebase_common_1.firebase.unregisterForPushNotifications = firebaseMessaging.unregisterForPushNotifications;
firebase_common_1.firebase.getCurrentPushToken = firebaseMessaging.getCurrentPushToken;
firebase_common_1.firebase.registerForInteractivePush = firebaseMessaging.registerForInteractivePush;
firebase_common_1.firebase.subscribeToTopic = firebaseMessaging.subscribeToTopic;
firebase_common_1.firebase.unsubscribeFromTopic = firebaseMessaging.unsubscribeFromTopic;
firebase_common_1.firebase.areNotificationsEnabled = firebaseMessaging.areNotificationsEnabled;
firebase_common_1.firebase.functions = firebaseFunctions;
NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(UIApplicationDidFinishLaunchingNotification, null, NSOperationQueue.mainQueue, function (appNotification) {
    if (!firebase_common_1.firebase._configured) {
        firebase_common_1.firebase._configured = true;
        if (typeof (FIRApp) !== "undefined") {
            FIRApp.configure();
        }
    }
});
firebase_common_1.firebase.addAppDelegateMethods = function (appDelegate) {
    if (typeof (FIRMessaging) !== "undefined" || useExternalPushProvider || typeof (FBSDKApplicationDelegate) !== "undefined") {
        appDelegate.prototype.applicationDidFinishLaunchingWithOptions = function (application, launchOptions) {
            if (launchOptions) {
                var remoteNotification = launchOptions.objectForKey(UIApplicationLaunchOptionsRemoteNotificationKey);
                if (remoteNotification) {
                    firebaseMessaging.handleRemoteNotification(application, remoteNotification);
                }
            }
            if (typeof (FBSDKApplicationDelegate) !== "undefined") {
                FBSDKApplicationDelegate.sharedInstance.applicationDidFinishLaunchingWithOptions(application, launchOptions);
            }
            return true;
        };
    }
    if (typeof (FBSDKApplicationDelegate) !== "undefined" || typeof (GIDSignIn) !== "undefined" || typeof (FIRDynamicLink) !== "undefined") {
        appDelegate.prototype.applicationOpenURLSourceApplicationAnnotation = function (application, url, sourceApplication, annotation) {
            var result = false;
            if (typeof (FBSDKApplicationDelegate) !== "undefined") {
                result = FBSDKApplicationDelegate.sharedInstance.applicationOpenURLSourceApplicationAnnotation(application, url, sourceApplication, annotation);
            }
            if (typeof (GIDSignIn) !== "undefined") {
                result = result || GIDSignIn.sharedInstance().handleURL(url);
            }
            if (typeof (FIRDynamicLink) !== "undefined") {
                var dynamicLink = FIRDynamicLinks.dynamicLinks().dynamicLinkFromCustomSchemeURL(url);
                if (dynamicLink) {
                    console.log("Dynamic link from " + sourceApplication + ", URL: " + dynamicLink.url.absoluteString);
                    firebase_common_1.firebase._cachedDynamicLink = {
                        url: dynamicLink.url.absoluteString,
                        minimumAppVersion: dynamicLink.minimumAppVersion
                    };
                    result = true;
                }
            }
            return result;
        };
    }
    if (typeof (FBSDKApplicationDelegate) !== "undefined" || typeof (GIDSignIn) !== "undefined" || typeof (FIRDynamicLink) !== "undefined") {
        appDelegate.prototype.applicationOpenURLOptions = function (application, url, options) {
            var result = false;
            if (typeof (FBSDKApplicationDelegate) !== "undefined") {
                result = FBSDKApplicationDelegate.sharedInstance.applicationOpenURLSourceApplicationAnnotation(application, url, options.valueForKey(UIApplicationOpenURLOptionsSourceApplicationKey), options.valueForKey(UIApplicationOpenURLOptionsAnnotationKey));
            }
            if (typeof (GIDSignIn) !== "undefined") {
                result = result || GIDSignIn.sharedInstance().handleURL(url);
            }
            if (typeof (FIRDynamicLink) !== "undefined") {
                var dynamicLinks = FIRDynamicLinks.dynamicLinks();
                var dynamicLink = dynamicLinks.dynamicLinkFromCustomSchemeURL(url);
                if (dynamicLink && dynamicLink.url !== null) {
                    if (firebase_common_1.firebase._dynamicLinkCallback) {
                        firebase_common_1.firebase._dynamicLinkCallback({
                            url: dynamicLink.url.absoluteString,
                            minimumAppVersion: dynamicLink.minimumAppVersion
                        });
                    }
                    else {
                        firebase_common_1.firebase._cachedDynamicLink = {
                            url: dynamicLink.url.absoluteString,
                            minimumAppVersion: dynamicLink.minimumAppVersion
                        };
                    }
                    result = true;
                }
            }
            return result;
        };
    }
    if (typeof (FIRDynamicLink) !== "undefined") {
        appDelegate.prototype.applicationContinueUserActivityRestorationHandler = function (application, userActivity, restorationHandler) {
            var result = false;
            if (userActivity.webpageURL) {
                var fAuth_1 = (typeof (FIRAuth) !== "undefined") ? FIRAuth.auth() : undefined;
                if (fAuth_1 && fAuth_1.isSignInWithEmailLink(userActivity.webpageURL.absoluteString)) {
                    var rememberedEmail_1 = firebase_common_1.firebase.getRememberedEmailForEmailLinkLogin();
                    if (rememberedEmail_1 !== undefined) {
                        if (fAuth_1.currentUser) {
                            var onCompletionLink = function (result, error) {
                                if (error) {
                                    fAuth_1.signInWithEmailLinkCompletion(rememberedEmail_1, userActivity.webpageURL.absoluteString, function (authData, error) {
                                        if (!error) {
                                            firebase_common_1.firebase.notifyAuthStateListeners({
                                                loggedIn: true,
                                                user: toLoginResult(authData.user)
                                            });
                                        }
                                    });
                                }
                                else {
                                    firebase_common_1.firebase.notifyAuthStateListeners({
                                        loggedIn: true,
                                        user: toLoginResult(result.user)
                                    });
                                }
                            };
                            var fIRAuthCredential = FIREmailAuthProvider.credentialWithEmailLink(rememberedEmail_1, userActivity.webpageURL.absoluteString);
                            fAuth_1.currentUser.linkWithCredentialCompletion(fIRAuthCredential, onCompletionLink);
                        }
                        else {
                            fAuth_1.signInWithEmailLinkCompletion(rememberedEmail_1, userActivity.webpageURL.absoluteString, function (authData, error) {
                                if (error) {
                                    console.log(error.localizedDescription);
                                }
                                else {
                                    firebase_common_1.firebase.notifyAuthStateListeners({
                                        loggedIn: true,
                                        user: toLoginResult(authData.user)
                                    });
                                }
                            });
                        }
                    }
                    result = true;
                }
                else {
                    result = FIRDynamicLinks.dynamicLinks().handleUniversalLinkCompletion(userActivity.webpageURL, function (dynamicLink, error) {
                        if (dynamicLink !== null && dynamicLink.url !== null) {
                            if (firebase_common_1.firebase._dynamicLinkCallback) {
                                firebase_common_1.firebase._dynamicLinkCallback({
                                    url: dynamicLink.url.absoluteString,
                                    minimumAppVersion: dynamicLink.minimumAppVersion
                                });
                            }
                            else {
                                firebase_common_1.firebase._cachedDynamicLink = {
                                    url: dynamicLink.url.absoluteString,
                                    minimumAppVersion: dynamicLink.minimumAppVersion
                                };
                            }
                        }
                    });
                }
            }
            return result;
        };
    }
    if (typeof (FIRMessaging) !== "undefined" || useExternalPushProvider) {
        firebaseMessaging.addBackgroundRemoteNotificationHandler(appDelegate);
    }
};
firebase_common_1.firebase.fetchSignInMethodsForEmail = function (email) {
    return new Promise(function (resolve, reject) {
        try {
            if (typeof (email) !== "string") {
                reject("A parameter representing an email address is required.");
                return;
            }
            FIRAuth.auth().fetchSignInMethodsForEmailCompletion(email, function (methodsNSArray, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve(utils_1.firebaseUtils.toJsObject(methodsNSArray));
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.fetchSignInMethodsForEmail: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.addOnDynamicLinkReceivedCallback = function (callback) {
    return new Promise(function (resolve, reject) {
        try {
            if (typeof (FIRDynamicLink) === "undefined") {
                reject("Set 'dynamic_links' to 'true' in firebase.nativescript.json and remove the platforms/ios folder");
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
if (typeof (FIRMessaging) !== "undefined" || useExternalPushProvider) {
    firebaseMessaging.prepAppDelegate();
}
function getAppDelegate() {
    if (application.ios.delegate === undefined) {
        var UIApplicationDelegateImpl = (function (_super) {
            __extends(UIApplicationDelegateImpl, _super);
            function UIApplicationDelegateImpl() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            UIApplicationDelegateImpl = __decorate([
                ObjCClass(UIApplicationDelegate)
            ], UIApplicationDelegateImpl);
            return UIApplicationDelegateImpl;
        }(UIResponder));
        application.ios.delegate = UIApplicationDelegateImpl;
    }
    return application.ios.delegate;
}
firebase_common_1.firebase.addAppDelegateMethods(getAppDelegate());
firebase_common_1.firebase.getCallbackData = function (type, snapshot) {
    return {
        type: type,
        key: snapshot.key,
        value: utils_1.firebaseUtils.toJsObject(snapshot.value)
    };
};
firebase_common_1.firebase.init = function (arg) {
    return new Promise(function (resolve, reject) {
        if (firebase_common_1.firebase.initialized) {
            reject("Firebase already initialized");
            return;
        }
        firebase_common_1.firebase.initialized = true;
        try {
            try {
                if (typeof (FIRServerValue) !== "undefined") {
                    firebase_common_1.firebase.ServerValue = {
                        TIMESTAMP: FIRServerValue.timestamp()
                    };
                }
            }
            catch (ignore) {
            }
            arg = arg || {};
            initializeArguments = arg;
            if (FIROptions && FIROptions.defaultOptions() !== null) {
                FIROptions.defaultOptions().deepLinkURLScheme = NSBundle.mainBundle.bundleIdentifier;
            }
            if (typeof (FIRAnalytics) !== "undefined" && FIRAnalytics.setAnalyticsCollectionEnabled) {
                FIRAnalytics.setAnalyticsCollectionEnabled(arg.analyticsCollectionEnabled !== false);
            }
            if (!firebase_common_1.firebase._configured) {
                firebase_common_1.firebase._configured = true;
                if (typeof (FIRApp) !== "undefined") {
                    FIRApp.configure();
                }
            }
            if (arg.crashlyticsCollectionEnabled && typeof (Crashlytics) !== "undefined") {
                Fabric.with(NSArray.arrayWithObject(Crashlytics.class()));
            }
            if (typeof (FIRDatabase) !== "undefined") {
                if (arg.persist) {
                    FIRDatabase.database().persistenceEnabled = true;
                }
            }
            if (typeof (FIRFirestore) !== "undefined") {
                if (arg.persist === false) {
                    var fIRFirestoreSettings = FIRFirestoreSettings.new();
                    fIRFirestoreSettings.persistenceEnabled = false;
                    FIRFirestore.firestore().settings = fIRFirestoreSettings;
                }
            }
            if (typeof (FIRAuth) !== "undefined") {
                if (arg.iOSEmulatorFlush) {
                    try {
                        FIRAuth.auth().signOut();
                    }
                    catch (signOutErr) {
                        console.log("Sign out of Firebase error: " + signOutErr);
                    }
                }
                if (arg.onAuthStateChanged) {
                    firebase_common_1.firebase.authStateListener = function (auth, user) {
                        arg.onAuthStateChanged({
                            loggedIn: user !== null,
                            user: toLoginResult(user)
                        });
                    };
                    FIRAuth.auth().addAuthStateDidChangeListener(firebase_common_1.firebase.authStateListener);
                }
                if (!firebase_common_1.firebase.authStateListener) {
                    firebase_common_1.firebase.authStateListener = function (auth, user) {
                        firebase_common_1.firebase.notifyAuthStateListeners({
                            loggedIn: user !== null,
                            user: toLoginResult(user)
                        });
                    };
                    FIRAuth.auth().addAuthStateDidChangeListener(firebase_common_1.firebase.authStateListener);
                }
            }
            if (arg.onDynamicLinkCallback !== undefined) {
                firebase_common_1.firebase.addOnDynamicLinkReceivedCallback(arg.onDynamicLinkCallback);
            }
            if (typeof (FBSDKAppEvents) !== "undefined") {
                FBSDKAppEvents.activateApp();
            }
            if (typeof (FIRMessaging) !== "undefined") {
                firebaseMessaging.initFirebaseMessaging(arg);
            }
            if (arg.storageBucket) {
                if (typeof (FIRStorage) === "undefined") {
                    reject("Uncomment Storage in the plugin's Podfile first");
                    return;
                }
                firebase_common_1.firebase.storageBucket = FIRStorage.storage().referenceForURL(arg.storageBucket);
            }
            resolve(typeof (FIRDatabase) !== "undefined" ? FIRDatabase.database().reference() : undefined);
        }
        catch (ex) {
            console.log("Error in firebase.init: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.getRemoteConfig = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            if (typeof (FIRRemoteConfig) === "undefined") {
                reject("Uncomment RemoteConfig in the plugin's Podfile first");
                return;
            }
            if (arg.properties === undefined) {
                reject("Argument 'properties' is missing");
                return;
            }
            var firebaseRemoteConfig_1 = FIRRemoteConfig.remoteConfig();
            firebaseRemoteConfig_1.configSettings = new FIRRemoteConfigSettings({ developerModeEnabled: arg.developerMode || false });
            var dic = NSMutableDictionary.new();
            for (var p in arg.properties) {
                var prop = arg.properties[p];
                if (prop.default !== undefined) {
                    dic.setObjectForKey(prop.default, prop.key);
                }
            }
            firebaseRemoteConfig_1.setDefaults(dic);
            var onCompletion = function (remoteConfigFetchStatus, error) {
                if (remoteConfigFetchStatus === 1 ||
                    remoteConfigFetchStatus === 3) {
                    var activated = firebaseRemoteConfig_1.activateFetched();
                    var result = {
                        lastFetch: firebaseRemoteConfig_1.lastFetchTime,
                        throttled: remoteConfigFetchStatus === 3,
                        properties: {}
                    };
                    for (var p in arg.properties) {
                        var prop = arg.properties[p];
                        var key = prop.key;
                        var value = firebaseRemoteConfig_1.configValueForKey(key).stringValue;
                        result.properties[key] = firebase_common_1.firebase.strongTypeify(value);
                    }
                    resolve(result);
                }
                else {
                    reject(error ? error.localizedDescription : "Unknown error, fetch status: " + remoteConfigFetchStatus);
                }
            };
            var expirationDuration = arg.cacheExpirationSeconds || 43200;
            firebaseRemoteConfig_1.fetchWithExpirationDurationCompletionHandler(expirationDuration, onCompletion);
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
            var fAuth = FIRAuth.auth();
            if (fAuth === null) {
                reject("Run init() first!");
                return;
            }
            var user = fAuth.currentUser;
            if (user) {
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
            var fAuth = FIRAuth.auth();
            if (fAuth === null) {
                reject("Run init() first!");
                return;
            }
            var user = fAuth.currentUser;
            if (user) {
                var onCompletion = function (error) {
                    if (error) {
                        reject(error.localizedDescription);
                    }
                    else {
                        resolve(true);
                    }
                };
                if (actionCodeSettings) {
                    var firActionCodeSettings = FIRActionCodeSettings.new();
                    if (actionCodeSettings.handleCodeInApp !== undefined) {
                        firActionCodeSettings.handleCodeInApp = actionCodeSettings.handleCodeInApp;
                    }
                    if (actionCodeSettings.url) {
                        firActionCodeSettings.URL = NSURL.URLWithString(actionCodeSettings.url);
                    }
                    if (actionCodeSettings.iOS) {
                        if (actionCodeSettings.iOS.bundleId) {
                            firActionCodeSettings.setIOSBundleID(actionCodeSettings.iOS.bundleId);
                        }
                        if (actionCodeSettings.iOS.dynamicLinkDomain) {
                            firActionCodeSettings.dynamicLinkDomain = actionCodeSettings.iOS.dynamicLinkDomain;
                        }
                    }
                    if (actionCodeSettings.android && actionCodeSettings.android.packageName) {
                        firActionCodeSettings.setAndroidPackageNameInstallIfNotAvailableMinimumVersion(actionCodeSettings.android.packageName, actionCodeSettings.android.installApp, actionCodeSettings.android.minimumVersion || null);
                    }
                    user.sendEmailVerificationWithActionCodeSettingsCompletion(firActionCodeSettings, onCompletion);
                }
                else {
                    user.sendEmailVerificationWithCompletion(onCompletion);
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
            FIRAuth.auth().signOut();
            firebase_common_1.firebase.currentAdditionalUserInfo = null;
            if (typeof (GIDSignIn) !== "undefined") {
                GIDSignIn.sharedInstance().disconnect();
            }
            if (typeof (FBSDKLoginManager) !== "undefined") {
                FBSDKLoginManager.alloc().logOut();
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
            var user = FIRAuth.auth().currentUser;
            if (!user) {
                reject("Not logged in");
                return;
            }
            user.unlinkFromProviderCompletion(providerId, function (user, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve(user);
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.logout: " + ex);
            reject(ex);
        }
    });
};
function toLoginResult(user, additionalUserInfo) {
    if (!user) {
        return null;
    }
    if (additionalUserInfo) {
        firebase_common_1.firebase.currentAdditionalUserInfo = additionalUserInfo;
    }
    var providers = [];
    if (user.providerData) {
        for (var i = 0, l = user.providerData.count; i < l; i++) {
            var firUserInfo = user.providerData.objectAtIndex(i);
            var pid = firUserInfo.valueForKey("providerID");
            if (pid === "facebook.com" && typeof (FBSDKAccessToken) !== "undefined") {
                providers.push({ id: pid, token: FBSDKAccessToken.currentAccessToken ? FBSDKAccessToken.currentAccessToken.tokenString : null });
            }
            else if (pid === "google.com" && typeof (GIDSignIn) !== "undefined" && GIDSignIn.sharedInstance() && GIDSignIn.sharedInstance().currentUser) {
                var gidCurrentIdToken = GIDSignIn.sharedInstance().currentUser.authentication.idToken;
                providers.push({ id: pid, token: gidCurrentIdToken });
            }
            else if (pid === "apple.com") {
            }
            else {
                providers.push({ id: pid });
            }
        }
    }
    var loginResult = {
        uid: user.uid,
        anonymous: user.anonymous,
        isAnonymous: user.anonymous,
        providers: providers,
        photoURL: user.photoURL ? user.photoURL.absoluteString : null,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        refreshToken: user.refreshToken,
        metadata: {
            creationTimestamp: user.metadata.creationDate,
            lastSignInTimestamp: user.metadata.lastSignInDate
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
            providerId: firebase_common_1.firebase.currentAdditionalUserInfo.providerID,
            username: firebase_common_1.firebase.currentAdditionalUserInfo.username,
            isNewUser: firebase_common_1.firebase.currentAdditionalUserInfo.newUser,
            profile: utils_1.firebaseUtils.toJsObject(firebase_common_1.firebase.currentAdditionalUserInfo.profile)
        };
    }
    return loginResult;
}
firebase_common_1.firebase.getAuthToken = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            var fAuth = FIRAuth.auth();
            if (fAuth === null) {
                reject("Run init() first!");
                return;
            }
            var user = fAuth.currentUser;
            if (user) {
                user.getIDTokenResultForcingRefreshCompletion(arg.forceRefresh, function (result, error) {
                    if (error) {
                        reject(error.localizedDescription);
                    }
                    else {
                        resolve({
                            token: result.token,
                            claims: utils_1.firebaseUtils.toJsObject(result.claims),
                            signInProvider: result.signInProvider,
                            expirationTime: utils_1.firebaseUtils.toJsObject(result.expirationDate),
                            issuedAtTime: utils_1.firebaseUtils.toJsObject(result.issuedAtDate),
                            authTime: utils_1.firebaseUtils.toJsObject(result.authDate)
                        });
                    }
                });
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
firebase_common_1.firebase.login = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            var onCompletionWithAuthResult_1 = function (authResult, error) {
                if (error) {
                    if (typeof (GIDSignIn) !== "undefined") {
                        GIDSignIn.sharedInstance().disconnect();
                    }
                    reject(error.localizedDescription);
                }
                else {
                    resolve(toLoginResult(authResult && authResult.user, authResult && authResult.additionalUserInfo));
                    firebase_common_1.firebase.notifyAuthStateListeners({
                        loggedIn: true,
                        user: toLoginResult(authResult.user)
                    });
                }
            };
            var fAuth_2 = FIRAuth.auth();
            if (fAuth_2 === null) {
                reject("Run init() first!");
                return;
            }
            firebase_common_1.firebase.moveLoginOptionsToObjects(arg);
            if (arg.type === firebase_common_1.firebase.LoginType.ANONYMOUS) {
                fAuth_2.signInAnonymouslyWithCompletion(onCompletionWithAuthResult_1);
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.PASSWORD) {
                if (!arg.passwordOptions || !arg.passwordOptions.email || !arg.passwordOptions.password) {
                    reject("Auth type PASSWORD requires an 'passwordOptions.email' and 'passwordOptions.password' argument");
                    return;
                }
                var fIRAuthCredential_1 = FIREmailAuthProvider.credentialWithEmailPassword(arg.passwordOptions.email, arg.passwordOptions.password);
                if (fAuth_2.currentUser) {
                    var onCompletionLink = function (authData, error) {
                        if (error) {
                            log("--- linking error: " + error.localizedDescription);
                            fAuth_2.signInWithCredentialCompletion(fIRAuthCredential_1, onCompletionWithAuthResult_1);
                        }
                        else {
                            onCompletionWithAuthResult_1(authData, error);
                        }
                    };
                    fAuth_2.currentUser.linkWithCredentialCompletion(fIRAuthCredential_1, onCompletionLink);
                }
                else {
                    fAuth_2.signInWithEmailPasswordCompletion(arg.passwordOptions.email, arg.passwordOptions.password, onCompletionWithAuthResult_1);
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
                var firActionCodeSettings = FIRActionCodeSettings.new();
                firActionCodeSettings.URL = NSURL.URLWithString(arg.emailLinkOptions.url);
                firActionCodeSettings.handleCodeInApp = true;
                firActionCodeSettings.setIOSBundleID(arg.emailLinkOptions.iOS ? arg.emailLinkOptions.iOS.bundleId : NSBundle.mainBundle.bundleIdentifier);
                firActionCodeSettings.setAndroidPackageNameInstallIfNotAvailableMinimumVersion(arg.emailLinkOptions.android ? arg.emailLinkOptions.android.packageName : NSBundle.mainBundle.bundleIdentifier, arg.emailLinkOptions.android ? arg.emailLinkOptions.android.installApp || false : false, arg.emailLinkOptions.android ? arg.emailLinkOptions.android.minimumVersion || "1" : "1");
                fAuth_2.sendSignInLinkToEmailActionCodeSettingsCompletion(arg.emailLinkOptions.email, firActionCodeSettings, function (error) {
                    if (error) {
                        reject(error.localizedDescription);
                        return;
                    }
                    firebase_common_1.firebase.rememberEmailForEmailLinkLogin(arg.emailLinkOptions.email);
                    resolve();
                });
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.PHONE) {
                if (!arg.phoneOptions || !arg.phoneOptions.phoneNumber) {
                    reject("Auth type PHONE requires a 'phoneOptions.phoneNumber' argument");
                    return;
                }
                FIRPhoneAuthProvider.provider().verifyPhoneNumberUIDelegateCompletion(arg.phoneOptions.phoneNumber, null, function (verificationID, error) {
                    if (error) {
                        reject(error.localizedDescription);
                        return;
                    }
                    firebase_common_1.firebase.requestPhoneAuthVerificationCode(function (userResponse) {
                        if (userResponse === undefined) {
                            reject("Prompt was canceled");
                            return;
                        }
                        var fIRAuthCredential = FIRPhoneAuthProvider.provider().credentialWithVerificationIDVerificationCode(verificationID, userResponse);
                        if (fAuth_2.currentUser) {
                            var onCompletionLink = function (authData, error) {
                                if (error) {
                                    fAuth_2.signInWithCredentialCompletion(fIRAuthCredential, onCompletionWithAuthResult_1);
                                }
                                else {
                                    onCompletionWithAuthResult_1(authData, error);
                                }
                            };
                            fAuth_2.currentUser.linkWithCredentialCompletion(fIRAuthCredential, onCompletionLink);
                        }
                        else {
                            fAuth_2.signInWithCredentialCompletion(fIRAuthCredential, onCompletionWithAuthResult_1);
                        }
                    }, arg.phoneOptions.verificationPrompt);
                });
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.CUSTOM) {
                if (!arg.customOptions || (!arg.customOptions.token && !arg.customOptions.tokenProviderFn)) {
                    reject("Auth type CUSTOM requires a 'customOptions.token' or 'customOptions.tokenProviderFn' argument");
                    return;
                }
                if (arg.customOptions.token) {
                    fAuth_2.signInWithCustomTokenCompletion(arg.customOptions.token, onCompletionWithAuthResult_1);
                }
                else if (arg.customOptions.tokenProviderFn) {
                    arg.customOptions.tokenProviderFn()
                        .then(function (token) {
                        fAuth_2.signInWithCustomTokenCompletion(token, onCompletionWithAuthResult_1);
                    }, function (error) {
                        reject(error);
                    });
                }
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.FACEBOOK) {
                if (typeof (FBSDKLoginManager) === "undefined") {
                    reject("Facebook SDK not installed - see Podfile");
                    return;
                }
                var onFacebookCompletion = function (fbSDKLoginManagerLoginResult, error) {
                    if (error) {
                        console.log("Facebook login error " + error);
                        reject(error.localizedDescription);
                    }
                    else if (fbSDKLoginManagerLoginResult.isCancelled) {
                        reject("login cancelled");
                    }
                    else {
                        var fIRAuthCredential_2 = FIRFacebookAuthProvider.credentialWithAccessToken(FBSDKAccessToken.currentAccessToken.tokenString);
                        if (fAuth_2.currentUser) {
                            var onCompletionLink = function (authData, error) {
                                if (error) {
                                    log("--- linking error: " + error.localizedDescription);
                                    fAuth_2.signInWithCredentialCompletion(fIRAuthCredential_2, onCompletionWithAuthResult_1);
                                }
                                else {
                                    onCompletionWithAuthResult_1(authData);
                                }
                            };
                            fAuth_2.currentUser.linkWithCredentialCompletion(fIRAuthCredential_2, onCompletionLink);
                        }
                        else {
                            fAuth_2.signInWithCredentialCompletion(fIRAuthCredential_2, onCompletionWithAuthResult_1);
                        }
                    }
                };
                var fbSDKLoginManager = FBSDKLoginManager.new();
                var scopes = ["public_profile", "email"];
                if (arg.facebookOptions && arg.facebookOptions.scopes) {
                    scopes = arg.facebookOptions.scopes;
                }
                fbSDKLoginManager.logInWithPermissionsFromViewControllerHandler(scopes, null, onFacebookCompletion);
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.APPLE) {
                if (parseInt(platform_1.device.osVersion) < 13) {
                    reject("Sign in with Apple requires iOS 13 or higher. You're running iOS " + platform_1.device.osVersion);
                    return;
                }
                firebase_common_1.firebase._currentNonce = nonce_util_ios_1.getNonce(32);
                var sha256Nonce = nonce_util_ios_1.Sha256(firebase_common_1.firebase._currentNonce);
                var appleIDProvider = ASAuthorizationAppleIDProvider.new();
                var appleIDRequest = appleIDProvider.createRequest();
                var scopes_1 = [ASAuthorizationScopeFullName, ASAuthorizationScopeEmail];
                if (arg.appleOptions && arg.appleOptions.scopes) {
                    scopes_1 = [];
                    arg.appleOptions.scopes.forEach(function (scope) {
                        if (scope === "name") {
                            scopes_1.push(ASAuthorizationScopeFullName);
                        }
                        else if (scope === "email") {
                            scopes_1.push(ASAuthorizationScopeEmail);
                        }
                        else {
                            console.log("Unknown scope: " + scope);
                        }
                    });
                }
                appleIDRequest.requestedScopes = scopes_1;
                appleIDRequest.nonce = sha256Nonce;
                var authorizationController = ASAuthorizationController.alloc().initWithAuthorizationRequests([appleIDRequest]);
                var delegate = ASAuthorizationControllerDelegateImpl.createWithOwnerAndResolveReject(new WeakRef(_this), resolve, reject);
                CFRetain(delegate);
                authorizationController.delegate = delegate;
                authorizationController.presentationContextProvider = ASAuthorizationControllerPresentationContextProvidingImpl.createWithOwnerAndCallback(new WeakRef(_this));
                authorizationController.performRequests();
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.GOOGLE) {
                if (typeof (GIDSignIn) === "undefined") {
                    reject("Google Sign In not installed - see Podfile");
                    return;
                }
                var sIn = GIDSignIn.sharedInstance();
                sIn.presentingViewController = arg.ios && arg.ios.controller ? arg.ios.controller : application.ios.rootController;
                sIn.clientID = FIRApp.defaultApp().options.clientID;
                if (arg.googleOptions && arg.googleOptions.hostedDomain) {
                    sIn.hostedDomain = arg.googleOptions.hostedDomain;
                }
                if (arg.googleOptions && arg.googleOptions.scopes) {
                    sIn.scopes = arg.googleOptions.scopes;
                }
                var delegate_1 = GIDSignInDelegateImpl.new().initWithCallback(function (user, error) {
                    if (error === null) {
                        firebase_common_1.firebase._gIDAuthentication = user.authentication;
                        var fIRAuthCredential_3 = FIRGoogleAuthProvider.credentialWithIDTokenAccessToken(firebase_common_1.firebase._gIDAuthentication.idToken, firebase_common_1.firebase._gIDAuthentication.accessToken);
                        if (fAuth_2.currentUser) {
                            var onCompletionLink = function (user, error) {
                                if (error) {
                                    fAuth_2.signInWithCredentialCompletion(fIRAuthCredential_3, onCompletionWithAuthResult_1);
                                }
                                else {
                                    onCompletionWithAuthResult_1(user);
                                }
                            };
                            fAuth_2.currentUser.linkWithCredentialCompletion(fIRAuthCredential_3, onCompletionLink);
                        }
                        else {
                            fAuth_2.signInWithCredentialCompletion(fIRAuthCredential_3, onCompletionWithAuthResult_1);
                        }
                    }
                    else {
                        reject(error.localizedDescription);
                    }
                    CFRelease(delegate_1);
                    delegate_1 = undefined;
                });
                CFRetain(delegate_1);
                sIn.delegate = delegate_1;
                sIn.signIn();
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
firebase_common_1.firebase.reauthenticate = function (arg) {
    return new Promise(function (resolve, reject) {
        try {
            var fAuth = FIRAuth.auth();
            if (fAuth === null) {
                reject("Run init() first!");
                return;
            }
            var user = fAuth.currentUser;
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
                authCredential = FIREmailAuthProvider.credentialWithEmailPassword(arg.passwordOptions.email, arg.passwordOptions.password);
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.GOOGLE) {
                if (!firebase_common_1.firebase._gIDAuthentication) {
                    reject("Not currently logged in with Google");
                    return;
                }
                authCredential = FIRGoogleAuthProvider.credentialWithIDTokenAccessToken(firebase_common_1.firebase._gIDAuthentication.idToken, firebase_common_1.firebase._gIDAuthentication.accessToken);
            }
            else if (arg.type === firebase_common_1.firebase.LoginType.FACEBOOK) {
                if (!FBSDKAccessToken.currentAccessToken) {
                    reject("Not currently logged in with Facebook");
                    return;
                }
                authCredential = FIRFacebookAuthProvider.credentialWithAccessToken(FBSDKAccessToken.currentAccessToken.tokenString);
            }
            if (authCredential === null) {
                reject("arg.type should be one of LoginType.PASSWORD | LoginType.GOOGLE | LoginType.FACEBOOK");
                return;
            }
            var onCompletion = function (authResult, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    firebase_common_1.firebase.notifyAuthStateListeners({
                        loggedIn: true,
                        user: toLoginResult(authResult.user)
                    });
                    resolve(toLoginResult(authResult && authResult.user, authResult && authResult.additionalUserInfo));
                }
            };
            user.reauthenticateWithCredentialCompletion(authCredential, onCompletion);
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
            var user = FIRAuth.auth().currentUser;
            if (user === null) {
                reject("no current user");
                return;
            }
            var onCompletion = function (error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve();
                }
            };
            user.reloadWithCompletion(onCompletion);
        }
        catch (ex) {
            console.log("Error in firebase.reloadUser: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.sendPasswordResetEmail = function (email) {
    return new Promise(function (resolve, reject) {
        try {
            var onCompletion = function (error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve();
                }
            };
            FIRAuth.auth().sendPasswordResetWithEmailCompletion(email, onCompletion);
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
            var onCompletion = function (error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve();
                }
            };
            var user = FIRAuth.auth().currentUser;
            if (user === null) {
                reject("no current user");
            }
            else {
                user.updateEmailCompletion(newEmail, onCompletion);
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
            var onCompletion = function (error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve();
                }
            };
            var user = FIRAuth.auth().currentUser;
            if (user === null) {
                reject("no current user");
            }
            else {
                user.updatePasswordCompletion(newPassword, onCompletion);
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
            var onCompletion = function (authResult, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve(toLoginResult(authResult.user, authResult.additionalUserInfo));
                }
            };
            if (!arg.email || !arg.password) {
                reject("Creating a user requires an email and password argument");
            }
            else {
                FIRAuth.auth().createUserWithEmailPasswordCompletion(arg.email, arg.password, onCompletion);
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
            var user = FIRAuth.auth().currentUser;
            if (user === null) {
                reject("no current user");
                return;
            }
            var onCompletion = function (error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve();
                }
            };
            user.deleteWithCompletion(onCompletion);
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
            var onCompletion = function (error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve();
                }
            };
            var fAuth = FIRAuth.auth();
            if (fAuth === null) {
                reject("Run init() first!");
                return;
            }
            if (!arg.displayName && !arg.photoURL) {
                reject("Updating a profile requires a displayName and / or a photoURL argument");
            }
            else {
                var user = fAuth.currentUser;
                if (user) {
                    var changeRequest = user.profileChangeRequest();
                    changeRequest.displayName = arg.displayName;
                    changeRequest.photoURL = NSURL.URLWithString(arg.photoURL);
                    changeRequest.commitChangesWithCompletion(onCompletion);
                }
                else {
                    reject();
                }
            }
        }
        catch (ex) {
            console.log("Error in firebase.updateProfile: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase._addObservers = function (to, updateCallback) {
    var listeners = [];
    listeners.push(to.observeEventTypeWithBlock(0, function (snapshot) {
        updateCallback(firebase_common_1.firebase.getCallbackData('ChildAdded', snapshot));
    }));
    listeners.push(to.observeEventTypeWithBlock(1, function (snapshot) {
        updateCallback(firebase_common_1.firebase.getCallbackData('ChildRemoved', snapshot));
    }));
    listeners.push(to.observeEventTypeWithBlock(2, function (snapshot) {
        updateCallback(firebase_common_1.firebase.getCallbackData('ChildChanged', snapshot));
    }));
    listeners.push(to.observeEventTypeWithBlock(3, function (snapshot) {
        updateCallback(firebase_common_1.firebase.getCallbackData('ChildMoved', snapshot));
    }));
    return listeners;
};
firebase_common_1.firebase.keepInSync = function (path, switchOn) {
    return new Promise(function (resolve, reject) {
        try {
            var where = FIRDatabase.database().reference().child(path);
            where.keepSynced(switchOn);
            resolve();
        }
        catch (ex) {
            console.log("Error in firebase.keepInSync: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.addChildEventListener = function (updateCallback, path) {
    return new Promise(function (resolve, reject) {
        try {
            var where = path === undefined ? FIRDatabase.database().reference() : FIRDatabase.database().reference().child(path);
            resolve({
                path: path,
                listeners: firebase_common_1.firebase._addObservers(where, updateCallback)
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
            var where = path === undefined ? FIRDatabase.database().reference() : FIRDatabase.database().reference().child(path);
            var listener = where.observeEventTypeWithBlockWithCancelBlock(4, function (snapshot) {
                updateCallback(firebase_common_1.firebase.getCallbackData('ValueChanged', snapshot));
            }, function (firebaseError) {
                updateCallback({
                    error: firebaseError.localizedDescription
                });
            });
            resolve({
                path: path,
                listeners: [listener]
            });
        }
        catch (ex) {
            console.log("Error in firebase.addChildEventListener: " + ex);
            reject(ex);
        }
    });
};
firebase_common_1.firebase.getValue = function (path) {
    return new Promise(function (resolve, reject) {
        try {
            var where = path === undefined ? FIRDatabase.database().reference() : FIRDatabase.database().reference().child(path);
            where.observeSingleEventOfTypeWithBlockWithCancelBlock(4, function (snapshot) {
                resolve(firebase_common_1.firebase.getCallbackData('ValueChanged', snapshot));
            }, function (firebaseError) {
                reject(firebaseError.localizedDescription);
            });
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
            var where = path === undefined ? FIRDatabase.database().reference() : FIRDatabase.database().reference().child(path);
            for (var i = 0; i < listeners.length; i++) {
                var listener = listeners[i];
                where.removeObserverWithHandle(listener);
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
            var ref_1 = FIRDatabase.database().reference().child(path).childByAutoId();
            ref_1.setValueWithCompletionBlock(val, function (error, dbRef) {
                error ? reject(error.localizedDescription) : resolve({ key: ref_1.key });
            });
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
            FIRDatabase.database().reference().child(path).setValueWithCompletionBlock(val, function (error, dbRef) {
                error ? reject(error.localizedDescription) : resolve();
            });
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
            if (typeof val === "object") {
                FIRDatabase.database().reference().child(path).updateChildValuesWithCompletionBlock(val, function (error, dbRef) {
                    error ? reject(error.localizedDescription) : resolve();
                });
            }
            else {
                var lastPartOfPath = path.lastIndexOf("/");
                var pathPrefix = path.substring(0, lastPartOfPath);
                var pathSuffix = path.substring(lastPartOfPath + 1);
                var updateObject = '{"' + pathSuffix + '" : "' + val + '"}';
                FIRDatabase.database().reference().child(pathPrefix).updateChildValuesWithCompletionBlock(JSON.parse(updateObject), function (error, dbRef) {
                    error ? reject(error.localizedDescription) : resolve();
                });
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
            var where = path === undefined ? FIRDatabase.database().reference() : FIRDatabase.database().reference().child(path);
            var query = void 0;
            if (options.orderBy.type === firebase_common_1.firebase.QueryOrderByType.KEY) {
                query = where.queryOrderedByKey();
            }
            else if (options.orderBy.type === firebase_common_1.firebase.QueryOrderByType.VALUE) {
                query = where.queryOrderedByValue();
            }
            else if (options.orderBy.type === firebase_common_1.firebase.QueryOrderByType.PRIORITY) {
                query = where.queryOrderedByPriority();
            }
            else if (options.orderBy.type === firebase_common_1.firebase.QueryOrderByType.CHILD) {
                if (options.orderBy.value === undefined || options.orderBy.value === null) {
                    reject("When orderBy.type is 'child' you must set orderBy.value as well.");
                    return;
                }
                query = where.queryOrderedByChild(options.orderBy.value);
            }
            else {
                reject("Invalid orderBy.type, use constants like firebase.QueryOrderByType.VALUE");
                return;
            }
            if (options.range && options.range.type) {
                if (options.range.type === firebase_common_1.firebase.QueryRangeType.START_AT) {
                    query = query.queryStartingAtValue(options.range.value);
                }
                else if (options.range.type === firebase_common_1.firebase.QueryRangeType.END_AT) {
                    query = query.queryEndingAtValue(options.range.value);
                }
                else if (options.range.type === firebase_common_1.firebase.QueryRangeType.EQUAL_TO) {
                    query = query.queryEqualToValue(options.range.value);
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
                        query = query.queryStartingAtValue(range.value);
                    }
                    else if (range.type === firebase_common_1.firebase.QueryRangeType.END_AT) {
                        query = query.queryEndingAtValue(range.value);
                    }
                    else if (range.type === firebase_common_1.firebase.QueryRangeType.EQUAL_TO) {
                        query = query.queryEqualToValue(range.value);
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
                    query = query.queryLimitedToFirst(options.limit.value);
                }
                else if (options.limit.type === firebase_common_1.firebase.QueryLimitType.LAST) {
                    query = query.queryLimitedToLast(options.limit.value);
                }
                else {
                    reject("Invalid limit.type, use constants like firebase.queryOptions.limitType.FIRST");
                    return;
                }
            }
            if (options.singleEvent) {
                query.observeSingleEventOfTypeWithBlock(4, function (snapshot) {
                    var result = {
                        type: "ValueChanged",
                        key: snapshot.key,
                        value: {},
                        children: []
                    };
                    for (var i = 0; i < snapshot.children.allObjects.count; i++) {
                        var snap = snapshot.children.allObjects.objectAtIndex(i);
                        var val = utils_1.firebaseUtils.toJsObject(snap.value);
                        result.value[snap.key] = val;
                        result.children.push(val);
                    }
                    if (updateCallback)
                        updateCallback(result);
                    resolve(result);
                });
            }
            else {
                resolve({
                    path: path,
                    listeners: firebase_common_1.firebase._addObservers(query, updateCallback)
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
            FIRDatabase.database().reference().child(path).setValueWithCompletionBlock(null, function (error, dbRef) {
                error ? reject(error.localizedDescription) : resolve();
            });
        }
        catch (ex) {
            console.log("Error in firebase.remove: " + ex);
            reject(ex);
        }
    });
};
var OnDisconnect = (function () {
    function OnDisconnect(dbRef, path) {
        this.dbRef = dbRef;
        this.path = path;
    }
    OnDisconnect.prototype.cancel = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.dbRef.cancelDisconnectOperationsWithCompletionBlock(function (error, dbRef) {
                    error ? reject(error.localizedDescription) : resolve();
                });
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
                _this.dbRef.onDisconnectRemoveValueWithCompletionBlock(function (error, dbRef) {
                    error ? reject(error.localizedDescription) : resolve();
                });
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
                _this.dbRef.onDisconnectSetValueWithCompletionBlock(value, function (error, dbRef) {
                    error ? reject(error.localizedDescription) : resolve();
                });
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
                _this.dbRef.onDisconnectSetValueAndPriorityWithCompletionBlock(value, priority, function (error, dbRef) {
                    error ? reject(error.localizedDescription) : resolve();
                });
            }
            catch (ex) {
                console.log("Error in firebase.onDisconnect.setWithPriority: " + ex);
                reject(ex);
            }
        });
    };
    OnDisconnect.prototype.update = function (values) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (typeof values === "object") {
                    _this.dbRef.onDisconnectUpdateChildValuesWithCompletionBlock(values, function (error, dbRef) {
                        error ? reject(error.localizedDescription) : resolve();
                    });
                }
                else {
                    var lastPartOfPath = _this.path.lastIndexOf("/");
                    var pathPrefix = _this.path.substring(0, lastPartOfPath);
                    var pathSuffix = _this.path.substring(lastPartOfPath + 1);
                    var updateObject = '{"' + pathSuffix + '" : "' + values + '"}';
                    FIRDatabase.database().reference().child(pathPrefix).updateChildValuesWithCompletionBlock(JSON.parse(updateObject), function (error, dbRef) {
                        error ? reject(error.localizedDescription) : resolve();
                    });
                }
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
    var dbRef = FIRDatabase.database().reference().child(path);
    return new OnDisconnect(dbRef, path);
};
firebase_common_1.firebase.transaction = function (path, transactionUpdate, onComplete) {
    return new Promise(function (resolve, reject) {
        if (!firebase_common_1.firebase.initialized) {
            console.error("Please run firebase.init() before firebase.transaction()");
            throw new Error("FirebaseApp is not initialized. Make sure you run firebase.init() first");
        }
        var dbRef = FIRDatabase.database().reference().child(path);
        dbRef.runTransactionBlockAndCompletionBlock(function (mutableData) {
            var desiredValue = transactionUpdate(utils_1.firebaseUtils.toJsObject(mutableData.value));
            if (desiredValue === undefined) {
                return FIRTransactionResult.successWithValue(mutableData);
            }
            else {
                mutableData.value = desiredValue;
                return FIRTransactionResult.successWithValue(mutableData);
            }
        }, function (error, commited, snapshot) {
            error !== null ? reject(error.localizedDescription) :
                resolve({ committed: commited, snapshot: nativeSnapshotToWebSnapshot(snapshot) });
        });
    });
};
function nativeSnapshotToWebSnapshot(snapshot) {
    function forEach(action) {
        var iterator = snapshot.children;
        var innerSnapshot;
        var datasnapshot;
        while (innerSnapshot = iterator.nextObject()) {
            datasnapshot = nativeSnapshotToWebSnapshot(innerSnapshot);
            if (action(datasnapshot)) {
                return true;
            }
        }
        return false;
    }
    return {
        key: snapshot.key,
        ref: snapshot.ref,
        child: function (path) { return nativeSnapshotToWebSnapshot(snapshot.childSnapshotForPath(path)); },
        exists: function () { return snapshot.exists(); },
        forEach: function (func) { return forEach(func); },
        getPriority: function () { return utils_1.firebaseUtils.toJsObject(snapshot.priority); },
        hasChild: function (path) { return snapshot.hasChild(path); },
        hasChildren: function () { return snapshot.hasChildren(); },
        numChildren: function () { return snapshot.childrenCount; },
        toJSON: function () { return snapshot.valueInExportFormat(); },
        val: function () { return utils_1.firebaseUtils.toJsObject(snapshot.value); }
    };
}
firebase_common_1.firebase.enableLogging = function (logging, persistent) {
    FIRDatabase.setLoggingEnabled(logging);
};
var ensureFirestore = function () {
    if (typeof (FIRFirestore) === "undefined") {
        throw new Error("Make sure 'firestore' is enabled in 'firebase.nativescript.json', then clean the node_modules and platforms folders");
    }
    if (!firebase_common_1.firebase.initialized) {
        throw new Error("Please run firebase.init() before using Firestore");
    }
};
firebase_common_1.firebase.firestore.WriteBatch = function (nativeWriteBatch) {
    var FirestoreWriteBatch = (function () {
        function FirestoreWriteBatch() {
            var _this = this;
            this.set = function (documentRef, data, options) {
                fixSpecialFields(data);
                nativeWriteBatch.setDataForDocumentMerge(data, documentRef.ios, options && options.merge);
                return _this;
            };
            this.update = function (documentRef, data) {
                fixSpecialFields(data);
                nativeWriteBatch.updateDataForDocument(data, documentRef.ios);
                return _this;
            };
            this.delete = function (documentRef) {
                nativeWriteBatch.deleteDocument(documentRef.ios);
                return _this;
            };
        }
        FirestoreWriteBatch.prototype.commit = function () {
            return new Promise(function (resolve, reject) {
                nativeWriteBatch.commitWithCompletion(function (error) {
                    error ? reject(error.localizedDescription) : resolve();
                });
            });
        };
        return FirestoreWriteBatch;
    }());
    return new FirestoreWriteBatch();
};
firebase_common_1.firebase.firestore.batch = function () {
    ensureFirestore();
    return new firebase_common_1.firebase.firestore.WriteBatch(FIRFirestore.firestore().batch());
};
firebase_common_1.firebase.firestore.Transaction = function (nativeTransaction) {
    var FirestoreTransaction = (function () {
        function FirestoreTransaction() {
            var _this = this;
            this.get = function (documentRef) {
                var docSnapshot = nativeTransaction.getDocumentError(documentRef.ios);
                return new DocumentSnapshot(docSnapshot);
            };
            this.set = function (documentRef, data, options) {
                fixSpecialFields(data);
                nativeTransaction.setDataForDocumentMerge(data, documentRef.ios, options && options.merge);
                return _this;
            };
            this.update = function (documentRef, data) {
                fixSpecialFields(data);
                nativeTransaction.updateDataForDocument(data, documentRef.ios);
                return _this;
            };
            this.delete = function (documentRef) {
                nativeTransaction.deleteDocument(documentRef.ios);
                return _this;
            };
        }
        return FirestoreTransaction;
    }());
    return new FirestoreTransaction();
};
firebase_common_1.firebase.firestore.runTransaction = function (updateFunction) {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        FIRFirestore.firestore().runTransactionWithBlockCompletion(function (nativeTransaction, err) {
            var tx = new firebase_common_1.firebase.firestore.Transaction(nativeTransaction);
            return updateFunction(tx);
        }, function (result, error) { return error ? reject(error.localizedDescription) : resolve(); });
    });
};
firebase_common_1.firebase.firestore.settings = function (settings) {
    if (typeof (FIRFirestore) !== "undefined") {
        try {
            var fIRFirestoreSettings = FIRFirestoreSettings.new();
            if (initializeArguments.persist !== undefined)
                fIRFirestoreSettings.persistenceEnabled = initializeArguments.persist;
            if (settings.ssl !== undefined)
                fIRFirestoreSettings.sslEnabled = settings.ssl;
            if (settings.host !== undefined)
                fIRFirestoreSettings.host = settings.host;
            FIRFirestore.firestore().settings = fIRFirestoreSettings;
        }
        catch (err) {
            console.log("Error in firebase.firestore.settings: " + err);
        }
    }
};
firebase_common_1.firebase.firestore.clearPersistence = function () {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        FIRFirestore.firestore().clearPersistenceWithCompletion(function (error) {
            error ? reject(error.localizedDescription) : resolve();
        });
    });
};
firebase_common_1.firebase.firestore.collection = function (collectionPath) {
    ensureFirestore();
    try {
        return firebase_common_1.firebase.firestore._getCollectionReference(FIRFirestore.firestore().collectionWithPath(collectionPath));
    }
    catch (ex) {
        console.log("Error in firebase.firestore.collection: " + ex);
        return null;
    }
};
firebase_common_1.firebase.firestore.collectionGroup = function (id) {
    ensureFirestore();
    try {
        return firebase_common_1.firebase.firestore._getCollectionGroupQuery(FIRFirestore.firestore().collectionGroupWithID(id));
    }
    catch (ex) {
        console.log("Error in firebase.firestore.collectionGroup: " + ex);
        return null;
    }
};
firebase_common_1.firebase.firestore.onDocumentSnapshot = function (docRef, optionsOrCallback, callbackOrOnError, onError) {
    var includeMetadataChanges = false;
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
    if (optionsOrCallback.includeMetadataChanges === true) {
        includeMetadataChanges = true;
    }
    var listener = docRef.addSnapshotListenerWithIncludeMetadataChangesListener(includeMetadataChanges, function (snapshot, error) {
        if (error || !snapshot) {
            error && onErrorCallback && onErrorCallback(new Error(error.localizedDescription));
            return;
        }
        onNextCallback && onNextCallback(new DocumentSnapshot(snapshot));
    });
    if (listener.remove === undefined) {
        return function () {
            onNextCallback = function () {
            };
        };
    }
    else {
        return function () { return listener.remove(); };
    }
};
firebase_common_1.firebase.firestore.onCollectionSnapshot = function (colRef, optionsOrCallback, callbackOrOnError, onError) {
    var includeMetadataChanges = false;
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
    if (optionsOrCallback.includeMetadataChanges === true) {
        includeMetadataChanges = true;
    }
    var listener = colRef.addSnapshotListenerWithIncludeMetadataChangesListener(includeMetadataChanges, function (snapshot, error) {
        if (error || !snapshot) {
            error && onErrorCallback && onErrorCallback(new Error(error.localizedDescription));
            return;
        }
        onNextCallback && onNextCallback(new QuerySnapshot(snapshot));
    });
    if (listener.remove === undefined) {
        return function () {
            onNextCallback = function () {
            };
        };
    }
    else {
        return function () { return listener.remove(); };
    }
};
firebase_common_1.firebase.firestore._getCollectionReference = function (colRef) {
    if (!colRef) {
        return null;
    }
    var collectionPath = colRef.path;
    return {
        id: colRef.collectionID,
        parent: firebase_common_1.firebase.firestore._getDocumentReference(colRef.parent),
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
firebase_common_1.firebase.firestore._getCollectionGroupQuery = function (query) {
    if (!query) {
        return null;
    }
    return {
        where: function (property, opStr, value) { return firebase_common_1.firebase.firestore.where(undefined, property, opStr, value, query); }
    };
};
firebase_common_1.firebase.firestore._getDocumentReference = function (docRef) {
    if (!docRef) {
        return null;
    }
    var collectionPath = docRef.parent.path;
    return {
        discriminator: "docRef",
        id: docRef.documentID,
        parent: firebase_common_1.firebase.firestore._getCollectionReference(docRef.parent),
        path: docRef.path,
        firestore: firebase_common_1.firebase.firestore,
        collection: function (cp) { return firebase_common_1.firebase.firestore.collection(collectionPath + "/" + docRef.documentID + "/" + cp); },
        set: function (data, options) { return firebase_common_1.firebase.firestore.set(collectionPath, docRef.documentID, data, options); },
        get: function (options) { return firebase_common_1.firebase.firestore.getDocument(collectionPath, docRef.documentID, options); },
        update: function (data) { return firebase_common_1.firebase.firestore.update(collectionPath, docRef.documentID, data); },
        delete: function () { return firebase_common_1.firebase.firestore.delete(collectionPath, docRef.documentID); },
        onSnapshot: function (optionsOrCallback, callbackOrOnError, onError) { return firebase_common_1.firebase.firestore.onDocumentSnapshot(docRef, optionsOrCallback, callbackOrOnError, onError); },
        ios: docRef
    };
};
firebase_common_1.firebase.firestore.doc = function (collectionPath, documentPath) {
    ensureFirestore();
    try {
        var fIRCollectionReference = FIRFirestore.firestore().collectionWithPath(collectionPath);
        var fIRDocumentReference = documentPath ? fIRCollectionReference.documentWithPath(documentPath) : fIRCollectionReference.documentWithAutoID();
        return firebase_common_1.firebase.firestore._getDocumentReference(fIRDocumentReference);
    }
    catch (ex) {
        console.log("Error in firebase.firestore.doc: " + ex);
        return null;
    }
};
firebase_common_1.firebase.firestore.docRef = function (documentPath) {
    ensureFirestore();
    return firebase_common_1.firebase.firestore._getDocumentReference(FIRFirestore.firestore().documentWithPath(documentPath));
};
firebase_common_1.firebase.firestore.add = function (collectionPath, document) {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        try {
            fixSpecialFields(document);
            var defaultFirestore = FIRFirestore.firestore();
            var fIRDocumentReference_1 = defaultFirestore
                .collectionWithPath(collectionPath)
                .addDocumentWithDataCompletion(document, function (error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve(firebase_common_1.firebase.firestore._getDocumentReference(fIRDocumentReference_1));
                }
            });
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
            fixSpecialFields(document);
            var docRef = FIRFirestore.firestore()
                .collectionWithPath(collectionPath)
                .documentWithPath(documentPath);
            if (options && options.merge) {
                docRef.setDataMergeCompletion(document, true, function (error) {
                    if (error) {
                        reject(error.localizedDescription);
                    }
                    else {
                        resolve();
                    }
                });
            }
            else {
                docRef.setDataCompletion(document, function (error) {
                    if (error) {
                        reject(error.localizedDescription);
                    }
                    else {
                        resolve();
                    }
                });
            }
        }
        catch (ex) {
            console.log("Error in firebase.firestore.set: " + ex);
            reject(ex);
        }
    });
};
function fixSpecialFields(item) {
    for (var k in item) {
        if (item.hasOwnProperty(k)) {
            item[k] = fixSpecialField(item[k]);
        }
    }
    return item;
}
function fixSpecialField(item) {
    if (item === null) {
        return null;
    }
    else if (item === "SERVER_TIMESTAMP") {
        return FIRFieldValue.fieldValueForServerTimestamp();
    }
    else if (item === "DELETE_FIELD") {
        return FIRFieldValue.fieldValueForDelete();
    }
    else if (item instanceof firebase_common_1.FieldValue) {
        var fieldValue = item;
        if (fieldValue.type === "ARRAY_UNION") {
            return FIRFieldValue.fieldValueForArrayUnion(Array.isArray(fieldValue.value[0]) ? fieldValue.value[0] : fieldValue.value);
        }
        else if (fieldValue.type === "ARRAY_REMOVE") {
            return FIRFieldValue.fieldValueForArrayRemove(Array.isArray(fieldValue.value[0]) ? fieldValue.value[0] : fieldValue.value);
        }
        else if (fieldValue.type === "INCREMENT") {
            var isInt = fieldValue.value % 1 === 0;
            if (isInt) {
                return FIRFieldValue.fieldValueForIntegerIncrement(fieldValue.value);
            }
            else {
                return FIRFieldValue.fieldValueForDoubleIncrement(fieldValue.value);
            }
        }
        else {
            console.log("You found a bug! Please report an issue at https://github.com/EddyVerbruggen/nativescript-plugin-firebase/issues, mention fieldValue.type = '" + fieldValue.type + "'. Thanks!");
        }
    }
    else if (item instanceof firebase_common_1.GeoPoint) {
        var geo = item;
        return new FIRGeoPoint({
            latitude: geo.latitude,
            longitude: geo.longitude
        });
    }
    else if (firebase_common_1.isDocumentReference(item)) {
        return item.ios;
    }
    else if (typeof item === "object" && item.constructor === Object) {
        return fixSpecialFields(item);
    }
    else {
        return item;
    }
}
firebase_common_1.firebase.firestore.update = function (collectionPath, documentPath, document) {
    ensureFirestore();
    return new Promise(function (resolve, reject) {
        try {
            fixSpecialFields(document);
            var docRef = FIRFirestore.firestore()
                .collectionWithPath(collectionPath)
                .documentWithPath(documentPath);
            docRef.updateDataCompletion(document, function (error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve();
                }
            });
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
            var docRef = FIRFirestore.firestore()
                .collectionWithPath(collectionPath)
                .documentWithPath(documentPath);
            docRef.deleteDocumentWithCompletion(function (error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve();
                }
            });
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
            var source = 0;
            if (options && options.source) {
                if (options.source === "cache") {
                    source = 2;
                }
                else if (options.source === "server") {
                    source = 1;
                }
            }
            var defaultFirestore = FIRFirestore.firestore();
            defaultFirestore
                .collectionWithPath(collectionPath)
                .getDocumentsWithSourceCompletion(source, function (snapshot, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve(new QuerySnapshot(snapshot));
                }
            });
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
            var source = 0;
            if (options && options.source) {
                if (options.source === "cache") {
                    source = 2;
                }
                else if (options.source === "server") {
                    source = 1;
                }
            }
            FIRFirestore.firestore()
                .collectionWithPath(collectionPath)
                .documentWithPath(documentPath)
                .getDocumentWithSourceCompletion(source, function (snapshot, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve(new DocumentSnapshot(snapshot));
                }
            });
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
            query.getDocumentsWithCompletion(function (snapshot, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve(new QuerySnapshot(snapshot));
                }
            });
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
        query = query || FIRFirestore.firestore().collectionWithPath(collectionPath);
        value = fixSpecialField(value);
        if (opStr === "<") {
            query = query.queryWhereFieldIsLessThan(fieldPath, value);
        }
        else if (opStr === "<=") {
            query = query.queryWhereFieldIsLessThanOrEqualTo(fieldPath, value);
        }
        else if (opStr === "==") {
            query = query.queryWhereFieldIsEqualTo(fieldPath, value);
        }
        else if (opStr === ">=") {
            query = query.queryWhereFieldIsGreaterThanOrEqualTo(fieldPath, value);
        }
        else if (opStr === ">") {
            query = query.queryWhereFieldIsGreaterThan(fieldPath, value);
        }
        else if (opStr === "array-contains") {
            query = query.queryWhereFieldArrayContains(fieldPath, value);
        }
        else if (opStr === "array-contains-any") {
            query = query.queryWhereFieldArrayContainsAny(fieldPath, value);
        }
        else if (opStr === "in") {
            query = query.queryWhereFieldIn(fieldPath, value);
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
    query = query.queryOrderedByFieldDescending(fieldPath, direction === "desc");
    return firebase_common_1.firebase.firestore._getQuery(collectionPath, query);
};
firebase_common_1.firebase.firestore.limit = function (collectionPath, limit, query) {
    query = query.queryLimitedTo(limit);
    return firebase_common_1.firebase.firestore._getQuery(collectionPath, query);
};
firebase_common_1.firebase.firestore.startAfter = function (collectionPath, snapshotOrFieldValue, fieldValues, query) {
    if (snapshotOrFieldValue && snapshotOrFieldValue.ios) {
        return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.queryStartingAfterDocument(snapshotOrFieldValue.ios));
    }
    else {
        return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.queryStartingAfterValues([snapshotOrFieldValue].concat(fieldValues)));
    }
};
firebase_common_1.firebase.firestore.startAt = function (collectionPath, snapshotOrFieldValue, fieldValues, query) {
    if (snapshotOrFieldValue && snapshotOrFieldValue.ios) {
        return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.queryStartingAtDocument(snapshotOrFieldValue.ios));
    }
    else {
        return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.queryStartingAtValues([snapshotOrFieldValue].concat(fieldValues)));
    }
};
firebase_common_1.firebase.firestore.endAt = function (collectionPath, snapshotOrFieldValue, fieldValues, query) {
    if (snapshotOrFieldValue && snapshotOrFieldValue.ios) {
        return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.queryEndingAtDocument(snapshotOrFieldValue.ios));
    }
    else {
        return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.queryEndingAtValues([snapshotOrFieldValue].concat(fieldValues)));
    }
};
firebase_common_1.firebase.firestore.endBefore = function (collectionPath, snapshotOrFieldValue, fieldValues, query) {
    if (snapshotOrFieldValue && snapshotOrFieldValue.ios) {
        return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.queryEndingBeforeDocument(snapshotOrFieldValue.ios));
    }
    else {
        return firebase_common_1.firebase.firestore._getQuery(collectionPath, query.queryEndingBeforeValues([snapshotOrFieldValue].concat(fieldValues)));
    }
};
var GIDSignInDelegateImpl = (function (_super) {
    __extends(GIDSignInDelegateImpl, _super);
    function GIDSignInDelegateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GIDSignInDelegateImpl.new = function () {
        if (GIDSignInDelegateImpl.ObjCProtocols.length === 0 && typeof (GIDSignInDelegate) !== "undefined") {
            GIDSignInDelegateImpl.ObjCProtocols.push(GIDSignInDelegate);
        }
        return _super.new.call(this);
    };
    GIDSignInDelegateImpl.prototype.initWithCallback = function (callback) {
        this.callback = callback;
        return this;
    };
    GIDSignInDelegateImpl.prototype.signInDidSignInForUserWithError = function (signIn, user, error) {
        this.callback(user, error);
    };
    GIDSignInDelegateImpl.ObjCProtocols = [];
    return GIDSignInDelegateImpl;
}(NSObject));
function convertDocChangeType(type) {
    switch (type) {
        case 0:
            return 'added';
        case 1:
            return 'modified';
        case 2:
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
            fromCache: this.snapshot.metadata.fromCache,
            hasPendingWrites: this.snapshot.metadata.pendingWrites
        };
        this.docSnapshots = this.docs;
    }
    Object.defineProperty(QuerySnapshot.prototype, "docs", {
        get: function () {
            var _this = this;
            var getSnapshots = function () {
                var docSnapshots = [];
                for (var i = 0, l = _this.snapshot.documents.count; i < l; i++) {
                    var document_1 = _this.snapshot.documents.objectAtIndex(i);
                    docSnapshots.push(new DocumentSnapshot(document_1));
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
        if (options) {
            console.info('No options support yet, for docChanges()');
        }
        var docChanges = [];
        var jChanges = this.snapshot.documentChanges;
        for (var i = 0; i < jChanges.count; i++) {
            var chg = jChanges[i];
            var type = convertDocChangeType(chg.type);
            var doc = convertDocument(chg.document);
            docChanges.push({
                doc: doc,
                newIndex: chg.newIndex,
                oldIndex: chg.oldIndex,
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
var ASAuthorizationControllerDelegateImpl = (function (_super) {
    __extends(ASAuthorizationControllerDelegateImpl, _super);
    function ASAuthorizationControllerDelegateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ASAuthorizationControllerDelegateImpl.createWithOwnerAndResolveReject = function (owner, resolve, reject) {
        if (ASAuthorizationControllerDelegateImpl.ObjCProtocols.length === 0 && parseInt(platform_1.device.osVersion) >= 13) {
            ASAuthorizationControllerDelegateImpl.ObjCProtocols.push(ASAuthorizationControllerDelegate);
        }
        var delegate = ASAuthorizationControllerDelegateImpl.new();
        delegate.owner = owner;
        delegate.resolve = resolve;
        delegate.reject = reject;
        return delegate;
    };
    ASAuthorizationControllerDelegateImpl.prototype.authorizationControllerDidCompleteWithAuthorization = function (controller, authorization) {
        var _this = this;
        if (authorization.credential instanceof ASAuthorizationAppleIDCredential) {
            var appleIDCredential = authorization.credential;
            var rawNonce = firebase_common_1.firebase._currentNonce;
            if (!rawNonce) {
                throw new Error("Invalid state: A login callback was received, but no login request was sent.");
            }
            if (!appleIDCredential.identityToken) {
                console.log("Invalid state: A login callback was received, but no login request was sent.");
                return;
            }
            var idToken = NSString.alloc().initWithDataEncoding(appleIDCredential.identityToken, NSUTF8StringEncoding);
            if (!idToken) {
                throw new Error("Unable to serialize id token from data: " + appleIDCredential.identityToken);
            }
            var fIROAuthCredential = FIROAuthProvider.credentialWithProviderIDIDTokenRawNonce("apple.com", idToken, rawNonce);
            FIRAuth.auth().signInWithCredentialCompletion(fIROAuthCredential, function (authResult, error) {
                if (error) {
                    _this.reject(error.localizedDescription);
                }
                else {
                    firebase_common_1.firebase.notifyAuthStateListeners({
                        loggedIn: true,
                        user: toLoginResult(authResult.user)
                    });
                    _this.resolve(toLoginResult(authResult && authResult.user, authResult && authResult.additionalUserInfo));
                    CFRelease(_this);
                }
            });
        }
    };
    ASAuthorizationControllerDelegateImpl.prototype.authorizationControllerDidCompleteWithError = function (controller, error) {
        this.reject(error.localizedDescription);
    };
    ASAuthorizationControllerDelegateImpl.ObjCProtocols = [];
    return ASAuthorizationControllerDelegateImpl;
}(NSObject));
var ASAuthorizationControllerPresentationContextProvidingImpl = (function (_super) {
    __extends(ASAuthorizationControllerPresentationContextProvidingImpl, _super);
    function ASAuthorizationControllerPresentationContextProvidingImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ASAuthorizationControllerPresentationContextProvidingImpl.createWithOwnerAndCallback = function (owner) {
        if (ASAuthorizationControllerPresentationContextProvidingImpl.ObjCProtocols.length === 0 && parseInt(platform_1.device.osVersion) >= 13) {
            ASAuthorizationControllerPresentationContextProvidingImpl.ObjCProtocols.push(ASAuthorizationControllerPresentationContextProviding);
        }
        var delegate = ASAuthorizationControllerPresentationContextProvidingImpl.new();
        delegate.owner = owner;
        return delegate;
    };
    ASAuthorizationControllerPresentationContextProvidingImpl.prototype.presentationAnchorForAuthorizationController = function (controller) {
    };
    ASAuthorizationControllerPresentationContextProvidingImpl.ObjCProtocols = [];
    return ASAuthorizationControllerPresentationContextProvidingImpl;
}(NSObject));
module.exports = firebase_common_1.firebase;
