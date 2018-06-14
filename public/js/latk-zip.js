"use strict";

JSZipUtils.getBinaryContent(animationPath, function(err, data) {
    if (err) {
        throw err; // or handle err
    }

    var zip = new JSZip();
    zip.loadAsync(data).then(function () {
        var fileNameOrig = animationPath.split('\\').pop().split('/').pop();
        var fileName = fileNameOrig.split('.')[0] + ".json";
        zip.file(fileName).async("string").then(function(response) {
            jsonToGp(JSON.parse(response).grease_pencil[0]);
        });
    });
});