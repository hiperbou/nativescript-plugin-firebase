"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function identifyNaturalLanguage(options) {
    return new Promise(function (resolve, reject) {
        try {
            if (!options.text) {
                reject("'text' property not set to a valid value");
                return;
            }
            var languageIdentifier = com.google.firebase.ml.naturallanguage.FirebaseNaturalLanguage.getInstance().getLanguageIdentification(new com.google.firebase.ml.naturallanguage.languageid.FirebaseLanguageIdentificationOptions.Builder()
                .setConfidenceThreshold(options.confidenceThreshold || 0.5)
                .build());
            languageIdentifier.identifyLanguage(options.text)
                .addOnSuccessListener(new com.google.android.gms.tasks.OnSuccessListener({
                onSuccess: function (languageCode) {
                    if (languageCode && languageCode !== "und") {
                        resolve({ languageCode: languageCode });
                    }
                    else {
                        resolve();
                    }
                }
            }))
                .addOnFailureListener(new com.google.android.gms.tasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            }));
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.identifyNaturalLanguage: " + ex);
            reject(ex);
        }
    });
}
exports.identifyNaturalLanguage = identifyNaturalLanguage;
function indentifyPossibleLanguages(options) {
    return new Promise(function (resolve, reject) {
        try {
            var languageIdentifier = com.google.firebase.ml.naturallanguage.FirebaseNaturalLanguage.getInstance().getLanguageIdentification(new com.google.firebase.ml.naturallanguage.languageid.FirebaseLanguageIdentificationOptions.Builder()
                .setConfidenceThreshold(options.confidenceThreshold || 0.01)
                .build());
            languageIdentifier.identifyPossibleLanguages(options.text)
                .addOnSuccessListener(new com.google.android.gms.tasks.OnSuccessListener({
                onSuccess: function (languages) {
                    var langs = [];
                    if (languages && languages.get(0).getLanguageCode() !== "und") {
                        for (var i = 0; i < languages.size(); i++) {
                            var l = languages.get(i);
                            langs.push({
                                languageCode: l.getLanguageCode(),
                                confidence: l.getConfidence()
                            });
                        }
                    }
                    resolve(langs);
                }
            }))
                .addOnFailureListener(new com.google.android.gms.tasks.OnFailureListener({
                onFailure: function (exception) { return reject(exception.getMessage()); }
            }));
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.indentifyPossibleLanguages: " + ex);
            reject(ex);
        }
    });
}
exports.indentifyPossibleLanguages = indentifyPossibleLanguages;
