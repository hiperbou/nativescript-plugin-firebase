"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var firebase = require("../../firebase");
var firebase_1 = require("../../firebase");
var auth;
(function (auth) {
    var Auth = (function () {
        function Auth() {
        }
        Auth.prototype.loginHelper = function (options) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                firebase.login(options)
                    .then(function (user) {
                    _this.currentUser = user;
                    _this.authStateChangedHandler && _this.authStateChangedHandler(user);
                    resolve({
                        additionalUserInfo: user.additionalUserInfo,
                        credential: null,
                        operationType: "SignIn",
                        user: user,
                    });
                }).catch(function (err) {
                    var code = 'auth/exception';
                    var message = err.toString();
                    if (message.includes('com.google.firebase.auth.FirebaseAuthInvalidCredentialsException')) {
                        code = 'auth/wrong-password';
                    }
                    else if (message.includes('com.google.firebase.auth.FirebaseAuthInvalidUserException')) {
                        code = 'auth/user-not-found';
                    }
                    _this.authStateOnErrorHandler && _this.authStateOnErrorHandler(err.toString());
                    reject({
                        code: code,
                        message: message
                    });
                });
            });
        };
        Auth.prototype.onAuthStateChanged = function (handler, error, completed) {
            var _this = this;
            this.authStateChangedHandler = handler;
            if (error)
                this.authStateOnErrorHandler = error;
            console.log(">> added onAuthStateChanged handler");
            handler(this.currentUser);
            return function () {
                _this.authStateChangedHandler = undefined;
                _this.authStateOnErrorHandler = undefined;
            };
        };
        Auth.prototype.signOut = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                firebase.logout()
                    .then(function () {
                    _this.currentUser = undefined;
                    _this.authStateChangedHandler && _this.authStateChangedHandler();
                    resolve();
                })
                    .catch(function (err) {
                    _this.authStateOnErrorHandler && _this.authStateOnErrorHandler(err);
                    reject({
                        message: err
                    });
                });
            });
        };
        Auth.prototype.unlink = function (providerId) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                firebase.unlink(providerId)
                    .then(function (user) {
                    _this.currentUser = user;
                    resolve(user);
                })
                    .catch(function (err) {
                    reject({
                        message: err
                    });
                });
            });
        };
        Auth.prototype.signInWithEmailAndPassword = function (email, password) {
            var emailOption = {
                type: firebase_1.LoginType.PASSWORD,
                passwordOptions: {
                    email: email,
                    password: password
                }
            };
            return this.loginHelper(emailOption);
        };
        Auth.prototype.signInWithCustomToken = function (token) {
            var customTokenOption = {
                type: firebase_1.LoginType.CUSTOM,
                customOptions: {
                    token: token
                }
            };
            return this.loginHelper(customTokenOption);
        };
        Auth.prototype.signInAnonymously = function () {
            var anonymousOption = {
                type: firebase_1.LoginType.ANONYMOUS
            };
            return this.loginHelper(anonymousOption);
        };
        Auth.prototype.sendSignInLinkToEmail = function (email, actionCodeSettings) {
            var sendSignInLinklOption = {
                type: firebase_1.LoginType.EMAIL_LINK,
                emailLinkOptions: {
                    email: email,
                    url: actionCodeSettings.url,
                }
            };
            return this.loginHelper(sendSignInLinklOption);
        };
        Auth.prototype.signInWithEmailLink = function (email, emailLink) {
            var signInWithEmailOption = {
                type: firebase.LoginType.EMAIL_LINK,
                emailLinkOptions: {
                    email: email,
                    url: emailLink
                }
            };
            return this.loginHelper(signInWithEmailOption);
        };
        Auth.prototype.createUserWithEmailAndPassword = function (email, password) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                firebase.createUser({
                    email: email,
                    password: password
                }).then(function (user) {
                    _this.currentUser = user;
                    resolve(user);
                }).catch(function (err) { return reject(err); });
            });
        };
        Auth.prototype.updateEmail = function (newEmail) {
            return new Promise(function (resolve, reject) {
                firebase.updateEmail(newEmail)
                    .then(function () { return resolve(); })
                    .catch(function (err) { return reject(err); });
            });
        };
        Auth.prototype.updatePassword = function (newPassword) {
            return new Promise(function (resolve, reject) {
                firebase.updatePassword(newPassword)
                    .then(function () { return resolve(); })
                    .catch(function (err) { return reject(err); });
            });
        };
        Auth.prototype.sendPasswordResetEmail = function (email) {
            return new Promise(function (resolve, reject) {
                firebase.sendPasswordResetEmail(email)
                    .then(function () { return resolve(); })
                    .catch(function (err) { return reject(err); });
            });
        };
        Auth.prototype.fetchSignInMethodsForEmail = function (email) {
            return firebase.fetchSignInMethodsForEmail(email);
        };
        return Auth;
    }());
    auth.Auth = Auth;
})(auth = exports.auth || (exports.auth = {}));
