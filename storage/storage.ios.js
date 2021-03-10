"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var firebase_common_1 = require("../firebase-common");
var storage_common_1 = require("./storage-common");
function getReference(nativeReference, listOptions) {
    return {
        ios: nativeReference,
        bucket: nativeReference.bucket,
        name: nativeReference.name,
        fullPath: nativeReference.fullPath,
        listAll: function () { return listAll({ remoteFullPath: nativeReference.fullPath, bucket: listOptions.bucket }); }
    };
}
function getReferences(nativeReferences, listOptions) {
    var references = [];
    for (var i = 0, l = nativeReferences.count; i < l; i++) {
        var ref = nativeReferences.objectAtIndex(i);
        references.push(getReference(ref, listOptions));
    }
    return references;
}
var ListResult = (function (_super) {
    __extends(ListResult, _super);
    function ListResult(listResult, listOptions) {
        var _this = _super.call(this, getReferences(listResult.items, listOptions), getReferences(listResult.prefixes, listOptions), listResult.pageToken) || this;
        _this.listResult = listResult;
        _this.listOptions = listOptions;
        _this.ios = listResult;
        delete _this.listResult;
        delete _this.listOptions;
        return _this;
    }
    return ListResult;
}(storage_common_1.ListResult));
function getStorageRef(reject, arg) {
    if (typeof (FIRStorage) === "undefined") {
        reject("Uncomment Storage in the plugin's Podfile first");
        return undefined;
    }
    if (!arg.remoteFullPath) {
        reject("remoteFullPath is mandatory");
        return undefined;
    }
    if (arg.bucket) {
        return FIRStorage.storage().referenceForURL(arg.bucket);
    }
    else if (firebase_common_1.firebase.storageBucket) {
        return firebase_common_1.firebase.storageBucket;
    }
    else {
        return FIRStorage.storage().reference();
    }
}
function uploadFile(arg) {
    return new Promise(function (resolve, reject) {
        try {
            var onCompletion = function (metadata, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve({
                        name: metadata.name,
                        contentType: metadata.contentType,
                        created: metadata.timeCreated,
                        updated: metadata.updated,
                        bucket: metadata.bucket,
                        size: metadata.size
                    });
                }
            };
            var storageRef = getStorageRef(reject, arg);
            if (!storageRef) {
                return;
            }
            var fIRStorageReference = storageRef.child(arg.remoteFullPath);
            var fIRStorageUploadTask = null;
            var metadata = null;
            if (arg.metadata) {
                metadata = FIRStorageMetadata.new();
                metadata.cacheControl = arg.metadata.cacheControl;
                metadata.contentDisposition = arg.metadata.contentDisposition;
                metadata.contentEncoding = arg.metadata.contentEncoding;
                metadata.contentLanguage = arg.metadata.contentLanguage;
                metadata.contentType = arg.metadata.contentType;
                if (arg.metadata.customMetadata) {
                    var customMetadata = NSMutableDictionary.new();
                    for (var p in arg.metadata.customMetadata) {
                        customMetadata.setObjectForKey(arg.metadata.customMetadata[p], p);
                    }
                    metadata.customMetadata = customMetadata;
                }
            }
            if (arg.localFile) {
                if (typeof (arg.localFile) !== "object") {
                    reject("localFile argument must be a File object; use file-system module to create one");
                    return;
                }
                fIRStorageUploadTask = fIRStorageReference.putFileMetadataCompletion(NSURL.fileURLWithPath(arg.localFile.path), metadata, onCompletion);
            }
            else if (arg.localFullPath) {
                fIRStorageUploadTask = fIRStorageReference.putFileMetadataCompletion(NSURL.fileURLWithPath(arg.localFullPath), metadata, onCompletion);
            }
            else {
                reject("One of localFile or localFullPath is required");
                return;
            }
            if (fIRStorageUploadTask !== null) {
                fIRStorageUploadTask.observeStatusHandler(2, function (snapshot) {
                    if (!snapshot.error && typeof (arg.onProgress) === "function") {
                        arg.onProgress({
                            fractionCompleted: snapshot.progress.fractionCompleted,
                            percentageCompleted: Math.round(snapshot.progress.fractionCompleted * 100)
                        });
                    }
                });
            }
        }
        catch (ex) {
            console.log("Error in firebase.uploadFile: " + ex);
            reject(ex);
        }
    });
}
exports.uploadFile = uploadFile;
function downloadFile(arg) {
    return new Promise(function (resolve, reject) {
        try {
            var onCompletion = function (url, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve(url.absoluteString);
                }
            };
            var storageRef = getStorageRef(reject, arg);
            if (!storageRef) {
                return;
            }
            var fIRStorageReference = storageRef.child(arg.remoteFullPath);
            var localFilePath = void 0;
            if (arg.localFile) {
                if (typeof (arg.localFile) !== "object") {
                    reject("localFile argument must be a File object; use file-system module to create one");
                    return;
                }
                localFilePath = arg.localFile.path;
            }
            else if (arg.localFullPath) {
                localFilePath = arg.localFullPath;
            }
            else {
                reject("One of localFile or localFullPath is required");
                return;
            }
            var localFileUrl = NSURL.fileURLWithPath(localFilePath);
            fIRStorageReference.writeToFileCompletion(localFileUrl, onCompletion);
        }
        catch (ex) {
            console.log("Error in firebase.downloadFile: " + ex);
            reject(ex);
        }
    });
}
exports.downloadFile = downloadFile;
function getDownloadUrl(arg) {
    return new Promise(function (resolve, reject) {
        try {
            var onCompletion = function (url, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve(url.absoluteString);
                }
            };
            var storageRef = getStorageRef(reject, arg);
            if (!storageRef) {
                return;
            }
            var fIRStorageReference = storageRef.child(arg.remoteFullPath);
            fIRStorageReference.downloadURLWithCompletion(onCompletion);
        }
        catch (ex) {
            console.log("Error in firebase.getDownloadUrl: " + ex);
            reject(ex);
        }
    });
}
exports.getDownloadUrl = getDownloadUrl;
function deleteFile(arg) {
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
            var storageRef = getStorageRef(reject, arg);
            if (!storageRef) {
                return;
            }
            var fIRStorageFileRef = storageRef.child(arg.remoteFullPath);
            fIRStorageFileRef.deleteWithCompletion(onCompletion);
        }
        catch (ex) {
            console.log("Error in firebase.deleteFile: " + ex);
            reject(ex);
        }
    });
}
exports.deleteFile = deleteFile;
function listAll(listOptions) {
    return new Promise(function (resolve, reject) {
        try {
            var storageRef = getStorageRef(reject, listOptions);
            if (!storageRef) {
                return;
            }
            var fIRStorageReference = storageRef.child(listOptions.remoteFullPath);
            fIRStorageReference.listAllWithCompletion(function (result, error) {
                if (error) {
                    reject(error.localizedDescription);
                }
                else {
                    resolve(new ListResult(result, listOptions));
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.listAll: " + ex);
            reject(ex);
        }
    });
}
exports.listAll = listAll;
