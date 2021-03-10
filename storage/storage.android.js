"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var file_system_1 = require("tns-core-modules/file-system");
var firebase_common_1 = require("../firebase-common");
var storage_common_1 = require("./storage-common");
var gmsTasks = com.google.android.gms ? com.google.android.gms.tasks : undefined;
function getReference(nativeReference, listOptions) {
    return {
        android: nativeReference,
        bucket: nativeReference.getBucket(),
        name: nativeReference.getName(),
        fullPath: nativeReference.getPath(),
        listAll: function () { return listAll({ remoteFullPath: nativeReference.getPath(), bucket: listOptions.bucket }); }
    };
}
function getReferences(nativeReferences, listOptions) {
    var references = [];
    for (var i = 0; i < nativeReferences.size(); i++) {
        var ref = nativeReferences.get(i);
        references.push(getReference(ref, listOptions));
    }
    return references;
}
var ListResult = (function (_super) {
    __extends(ListResult, _super);
    function ListResult(listResult, listOptions) {
        var _this = _super.call(this, getReferences(listResult.getItems(), listOptions), getReferences(listResult.getPrefixes(), listOptions), listResult.getPageToken()) || this;
        _this.listResult = listResult;
        _this.listOptions = listOptions;
        _this.android = listResult;
        delete _this.listResult;
        delete _this.listOptions;
        return _this;
    }
    return ListResult;
}(storage_common_1.ListResult));
function getStorageRef(reject, arg) {
    if (typeof (com.google.firebase.storage) === "undefined") {
        reject("Uncomment firebase-storage in the plugin's include.gradle first");
        return;
    }
    if (!arg.remoteFullPath) {
        reject("remoteFullPath is mandatory");
        return;
    }
    if (arg.bucket) {
        return com.google.firebase.storage.FirebaseStorage.getInstance(arg.bucket).getReference();
    }
    else if (firebase_common_1.firebase.storageBucket) {
        return firebase_common_1.firebase.storageBucket;
    }
    else {
        return com.google.firebase.storage.FirebaseStorage.getInstance().getReference();
    }
}
function uploadFile(arg) {
    return new Promise(function (resolve, reject) {
        try {
            var storageRef = getStorageRef(reject, arg);
            if (!storageRef) {
                return;
            }
            var storageReference = storageRef.child(arg.remoteFullPath);
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function (uploadTaskSnapshot) {
                    var metadata = uploadTaskSnapshot.getMetadata();
                    resolve({
                        name: metadata.getName(),
                        contentType: metadata.getContentType(),
                        created: new Date(metadata.getCreationTimeMillis()),
                        updated: new Date(metadata.getUpdatedTimeMillis()),
                        bucket: metadata.getBucket(),
                        size: metadata.getSizeBytes(),
                    });
                }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) {
                    reject("Upload failed. " + exception);
                }
            });
            var onProgressListener = new com.google.firebase.storage.OnProgressListener({
                onProgress: function (snapshot) {
                    if (typeof (arg.onProgress) === "function") {
                        var fractionCompleted = snapshot.getBytesTransferred() / snapshot.getTotalByteCount();
                        arg.onProgress({
                            fractionCompleted: fractionCompleted,
                            percentageCompleted: Math.round(fractionCompleted * 100)
                        });
                    }
                }
            });
            var metadata = null;
            if (arg.metadata) {
                var metadataBuilder = new com.google.firebase.storage.StorageMetadata.Builder();
                if (arg.metadata.cacheControl) {
                    metadataBuilder.setCacheControl(arg.metadata.cacheControl);
                }
                if (arg.metadata.contentDisposition) {
                    metadataBuilder.setContentDisposition(arg.metadata.contentDisposition);
                }
                if (arg.metadata.contentEncoding) {
                    metadataBuilder.setContentEncoding(arg.metadata.contentEncoding);
                }
                if (arg.metadata.contentLanguage) {
                    metadataBuilder.setContentLanguage(arg.metadata.contentLanguage);
                }
                if (arg.metadata.contentType) {
                    metadataBuilder.setContentType(arg.metadata.contentType);
                }
                if (arg.metadata.customMetadata) {
                    for (var p in arg.metadata.customMetadata) {
                        metadataBuilder.setCustomMetadata(p, arg.metadata.customMetadata[p]);
                    }
                }
                metadata = metadataBuilder.build();
            }
            if (arg.localFile) {
                if (typeof (arg.localFile) !== "object") {
                    reject("localFile argument must be a File object; use file-system module to create one");
                    return;
                }
                var localFileUrl = android.net.Uri.fromFile(new java.io.File(arg.localFile.path));
                storageReference.putFile(localFileUrl, metadata)
                    .addOnFailureListener(onFailureListener)
                    .addOnSuccessListener(onSuccessListener)
                    .addOnProgressListener(onProgressListener);
            }
            else if (arg.localFullPath) {
                if (!file_system_1.File.exists(arg.localFullPath)) {
                    reject("File does not exist: " + arg.localFullPath);
                    return;
                }
                var localFileUrl = android.net.Uri.fromFile(new java.io.File(arg.localFullPath));
                storageReference.putFile(localFileUrl, metadata)
                    .addOnFailureListener(onFailureListener)
                    .addOnSuccessListener(onSuccessListener)
                    .addOnProgressListener(onProgressListener);
            }
            else {
                reject("One of localFile or localFullPath is required");
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
            var storageRef = getStorageRef(reject, arg);
            if (!storageRef) {
                return;
            }
            var storageReference = storageRef.child(arg.remoteFullPath);
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function (downloadTaskSnapshot) { return resolve(); }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) { return reject("Download failed. " + exception); }
            });
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
            var file = new java.io.File(localFilePath);
            storageReference.getFile(file)
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
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
            var storageRef = getStorageRef(reject, arg);
            if (!storageRef) {
                return;
            }
            var storageReference = storageRef.child(arg.remoteFullPath);
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function (uri) {
                    resolve(uri.toString());
                }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) {
                    reject(exception.getMessage());
                }
            });
            storageReference.getDownloadUrl()
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
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
            var storageRef = getStorageRef(reject, arg);
            if (!storageRef) {
                return;
            }
            var storageReference = storageRef.child(arg.remoteFullPath);
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function () {
                    resolve();
                }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) {
                    reject(exception.getMessage());
                }
            });
            storageReference.delete()
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
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
            var onSuccessListener = new gmsTasks.OnSuccessListener({
                onSuccess: function (result) { return resolve(new ListResult(result, listOptions)); }
            });
            var onFailureListener = new gmsTasks.OnFailureListener({
                onFailure: function (exception) {
                    reject(exception.getCause() ? exception.getCause().getMessage() : exception.getMessage());
                }
            });
            var storageReference = storageRef.child(listOptions.remoteFullPath);
            storageReference.listAll()
                .addOnSuccessListener(onSuccessListener)
                .addOnFailureListener(onFailureListener);
        }
        catch (ex) {
            console.log("Error in firebase.listAll: " + ex);
            reject(ex);
        }
    });
}
exports.listAll = listAll;
