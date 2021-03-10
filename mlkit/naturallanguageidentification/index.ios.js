"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function identifyNaturalLanguage(options) {
    return new Promise(function (resolve, reject) {
        try {
            if (!options.text) {
                reject("'text' property not set to a valid value");
                return;
            }
            var naturalLanguage = FIRNaturalLanguage.naturalLanguage();
            var languageId = naturalLanguage.languageIdentificationWithOptions(FIRLanguageIdentificationOptions.alloc().initWithConfidenceThreshold(options.confidenceThreshold || 0.5));
            languageId.identifyLanguageForTextCompletion(options.text, function (languageCode, error) {
                if (error !== null) {
                    console.log("Failed with error: " + error.localizedDescription);
                    reject(error.localizedDescription);
                }
                else if (languageCode !== null && languageCode !== "und") {
                    console.log("Identified language: " + languageCode);
                    resolve({ languageCode: languageCode });
                }
                else {
                    console.log("No language was identified");
                    resolve();
                }
            });
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
            var naturalLanguage = FIRNaturalLanguage.naturalLanguage();
            var languageId = naturalLanguage.languageIdentificationWithOptions(FIRLanguageIdentificationOptions.alloc().initWithConfidenceThreshold(options.confidenceThreshold || 0.01));
            languageId.identifyPossibleLanguagesForTextCompletion(options.text, function (languages, error) {
                if (error !== null) {
                    console.log("Failed with error: " + error.localizedDescription);
                    reject(error.localizedDescription);
                }
                else if (languages.count === 1 && languages.objectAtIndex(0).languageCode === "und") {
                    console.log("No language was identified");
                    resolve([]);
                }
                else {
                    var langs = [];
                    for (var i = 0; i < languages.count; i++) {
                        var l = languages.objectAtIndex(i);
                        langs.push({
                            languageCode: l.languageCode,
                            confidence: l.confidence
                        });
                    }
                    resolve(langs);
                }
            });
        }
        catch (ex) {
            console.log("Error in firebase.mlkit.indentifyPossibleLanguages: " + ex);
            reject(ex);
        }
    });
}
exports.indentifyPossibleLanguages = indentifyPossibleLanguages;
