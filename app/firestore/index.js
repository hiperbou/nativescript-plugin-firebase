"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var firebase = require("../../firebase");
var firestore;
(function (firestore) {
    var Firestore = (function () {
        function Firestore() {
        }
        Firestore.prototype.collection = function (collectionPath) {
            return firebase.firestore.collection(collectionPath);
        };
        Firestore.prototype.collectionGroup = function (id) {
            return firebase.firestore.collectionGroup(id);
        };
        Firestore.prototype.doc = function (path) {
            return firebase.firestore.docRef(path);
        };
        Firestore.prototype.FieldValue = function () {
            return {
                type: undefined,
                value: undefined,
                serverTimestamp: function () { return "SERVER_TIMESTAMP"; },
                delete: function () { return "DELETE_FIELD"; },
                arrayUnion: function () {
                    var elements = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        elements[_i] = arguments[_i];
                    }
                    return new firebase.firestore.FieldValue("ARRAY_UNION", elements);
                },
                arrayRemove: function () {
                    var elements = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        elements[_i] = arguments[_i];
                    }
                    return new firebase.firestore.FieldValue("ARRAY_REMOVE", elements);
                },
                increment: function (n) { return new firebase.firestore.FieldValue("INCREMENT", n); }
            };
        };
        Firestore.prototype.GeoPoint = function (latitude, longitude) {
            return firebase.firestore.GeoPoint(latitude, longitude);
        };
        Firestore.prototype.runTransaction = function (updateFunction) {
            return firebase.firestore.runTransaction(updateFunction);
        };
        Firestore.prototype.batch = function () {
            return firebase.firestore.batch();
        };
        Firestore.prototype.settings = function (settings) {
            firebase.firestore.settings(settings);
        };
        Firestore.prototype.clearPersistence = function () {
            return firebase.firestore.clearPersistence();
        };
        return Firestore;
    }());
    firestore.Firestore = Firestore;
})(firestore = exports.firestore || (exports.firestore = {}));
