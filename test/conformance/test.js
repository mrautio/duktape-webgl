'use strict';

const htmlParser = require('node-html-parser');
const fs = require('fs');
const util = require('util');
const { execSync } = require('child_process');

let startDir = process.cwd();

let bootstrapScripts = {
    polyfillPromise: startDir + "/node_modules/es6-promise/dist/es6-promise.auto.js",
    preHarness:  startDir + "/bootstrap/01_pre_harness.js",
    preTest:     startDir + "/bootstrap/02_pre_test.js",
    postHarness: startDir + "/bootstrap/03_post_harness.js",
};


function executeTestCaseFile(testCaseFile) {
    let start = Date.now();

    let scriptFiles = [];

    let file = fs.readFileSync(testCaseFile, 'utf8');

    let root = htmlParser.parse(file, {'script':true});

    let scripts = root.querySelectorAll('script');

    scriptFiles.push(bootstrapScripts.preHarness);
    scriptFiles.push(bootstrapScripts.polyfillPromise);

    let outputFile = testCaseFile+'.js';
    let data = '';

    let preTestAppended = false;

    for (const element of scripts) {
        if (element.tagName !== 'script') {
            continue;
        }

        let shader = false;
        if ((element.id||"").match(/shader/ig)) {
            shader = true;
        }

        let tag = element.rawAttrs.match(/src\s*=\s*["'](.*)["']/);
        if (tag) {
            let path = process.cwd() + "/" + tag[1];
            if (!fs.existsSync(path)) {
                throw "Script not found! script:" + path + ", path:" + process.cwd();
            }

            data += `\n// file: ${path} \n`;
            scriptFiles.push(path);

            // GLEW / Stretch / Docker setup doesn't like precision mediump float in non GL ES
            let srcData = fs.readFileSync(path,'utf8').replace(/(precision mediump float;)/g, '');
            fs.writeFileSync(path, srcData);
        }

        for (const childNode of element.childNodes) {
            if (childNode.rawText) {
                if (!preTestAppended) {
                    scriptFiles.push(bootstrapScripts.preTest);
                    scriptFiles.push(outputFile);
                    preTestAppended = true;
                }

                if (shader) {
                    var variableName = 'shader_' + element.id.replace(/[^\w\d_]/g, "")
                    data += `\n// file: ${testCaseFile}, shader: ${element.id}\n`;
                    data += `var ${variableName} = document.createElement("script");\n`;
                    data += `${variableName}.text = "` + childNode.rawText.replace(/([\r\n])/g, '\\n').replace(/(")/,'\\$1') + `";\n`;
                    data += `document.setElementById('${element.id}', ${variableName});\n`;
                } else {
                    data += `\n// file: ${testCaseFile}\n`;
                    data += childNode.rawText;
                }
            }        
        }
    }

    fs.writeFileSync(outputFile, data);
    scriptFiles.push(bootstrapScripts.postHarness);

    try {
        for (let scriptFile of scriptFiles) {
            let scriptData = fs.readFileSync(scriptFile,'utf8');
            // Quick search for the common ES6 indicating notations
            if (scriptData.match(/=>/g)) {
                // Make script Duktape (ES5 with some ES6 features) compatible
                // However we don't want to do unnecessary Babel transpiling
                // As it has a heavy overhead
                console.log("Not supported ES6 found, transpiling needed for " + scriptFile)
                scriptData = "" + execSync("npx babel --config-file /tmp/.babelrc " + scriptFile);
            }

            scriptData = scriptData.replace(/("use strict";|precision mediump float;)/g, '');
            fs.writeFileSync(scriptFile, scriptData);
        }
    } catch(err) {
        console.log("Preprocessing error occurred: " + err.message);
        throw err;
    }


    try {
        let call = 'bootstrap.exe ' + scriptFiles.join(' ');
        console.log("Exec " + call);
        let stdout = execSync(call);
        console.log("STDOUT: " + stdout);
        let caseData = {
            elapsed: Date.now() - start,
            file: outputFile,
            bytes: data.length,
            passed: true
        };
        console.log(JSON.stringify(caseData));
    } catch(error) {
        console.log("Call failed");
        let stdout = ""+error.stdout;
        console.log("STDOUT: " + stdout);
        let stderr = ""+error.stderr;
        console.log("STDERR: " + stderr);
        let tag = stderr.match(/\[(.+)\].+\(line (\d+)\)/);
        if (tag) {
            let errorFile = tag[1];
            let errorLine = tag[2] - 1;

            let errorFileData = fs.readFileSync(errorFile, 'utf8').split(/\n\r?/);
            let startLine = errorLine - 5;
            if (startLine < 0) { startLine = 0; }
            let endLine = errorLine + 5;
            if (endLine >= errorFileData.length) { endLine = errorFileData.length - 1; }
            console.log("Error file: " + errorFile);
            for(let line = startLine; line < endLine; line++) {
                console.log(`${line + 1}: ${errorFileData[line]}`);
            }
        }
        throw error;
    }
}


let skipTests = {
    /*'gl-bindAttribLocation-aliasing.html': {
        reason: 'Same bind attribute location aliasing error not mandatory according to GL ES / WebGL specs.'
    },*/
};

let assertedTests = [
    // attribs
    'gl-bindAttribLocation-repeated.html','gl-matrix-attributes.html',
    // extensions
    'angle-instanced-arrays-out-of-bounds.html','get-extension.html','oes-vertex-array-object-bufferData.html','webgl-debug-shaders.html','webgl-draw-buffers-framebuffer-unsupported.html',
    // misc
    'is-object.html',
    // reading
    'read-pixels-pack-alignment.html',
    // rendering
    "line-loop-tri-fan.html",
    // uniforms
    "gl-uniform-bool.html",
    // buffers
    "index-validation-crash-with-buffer-sub-data.html",
    // context
    "context-release-upon-reload.html","context-release-with-workers.html",
    // programs
    "gl-get-active-attribute.html","gl-getshadersource.html","invalid-UTF-16.html","program-infolog.html",
    // state
    "gl-initial-state.html",
    // typedarrays
    "array-buffer-crash.html","array-buffer-view-crash.html","data-view-crash.html","data-view-test.html",
    // ???
    "glsl-function-nodes.html","glsl-vertex-branch.html","re-compile-re-link.html","tex-image-canvas-corruption.html","texture-cube-as-fbo-attachment.html","texture-upload-cube-maps.html","texture-draw-with-2d-and-cube.html","sampler-struct-function-arg.html","gl-teximage.html","origin-clean-conformance.html",
];
//misc  ogles     reading        rendering  textures     uniforms buffers  context  glsl        manual  more  programs  renderbuffers  state      typedarrays  limits  canvas  
//fix: ogles needs a recursion, textures, glsl, manual

let notAssertedPassedTests = [];

let testLog = {};
let testSetSuccess = true;
let testResults = {
    pass: 0,
    fail: 0,
};

function runTestList(testList) {
    console.log("Running test list: " + testList);
    let currentPath = process.cwd();

    let testListFile = testList.substr(testList.lastIndexOf("/")+1);
    if (testListFile != testList) {
        let testListFilePath = testList.substr(0,testList.length-testListFile.length);
        if (!fs.existsSync(testListFilePath)) { throw "Directory does not exist: " + testListFilePath; }
        process.chdir(testListFilePath);
    }

    if (!fs.existsSync(testListFile)) { throw "Test list file does not exist '"+testListFile+"', path:" + process.cwd(); }

    // process test case list
    let testListTests = ("" + fs.readFileSync(testListFile)).split(/[\r\n]+/);
    for (let test of testListTests) {
        // skip empty lines and comments
        if (!test.trim() || test.match(/^\s*(\/\/|#)/)) { continue; }

        // .txt files are test case file lists. recursion may occur
        let caseFile = test.match(/([-\.\/\w\d]+\.txt)/i);
        if (caseFile) {
            runTestList(caseFile[0]);
            continue;
        }

        let testData = test.match(/([-\.\/\w\d]+\.html)/i);
        if (testData) {
            let testCaseFile = testData[1];
            console.log("Running test case: " + testCaseFile);
            if (!fs.existsSync(testCaseFile)) { throw "File does not exist '"+testCaseFile+"', path:" + process.cwd(); }

            if (testCaseFile in skipTests) {
                console.log(`Skipping test '${testCaseFile}': '${skipTests[testCaseFile].reason}'`);
                testLog[testCaseFile] = {pass:true, skipReason:skipTests[testCaseFile].reason}
                continue;
            }
            try {
                executeTestCaseFile(testCaseFile);
                testLog[testCaseFile] = {pass:true}
                testResults.pass++;
                if (!assertedTests.includes(testCaseFile)) {
                    notAssertedPassedTests.push(testCaseFile);
                }
            } catch(e) {
                testResults.fail++;
                let result = {pass:false,errorMessage:e.message};
                result.status = e.status;
                if ((""+e.stderr).match(/Segmentation fault/)) {
                    result.segfault = true;
                }
                if (assertedTests.includes(testCaseFile)) {
                    testSetSuccess = false;
                } else {
                    result.asserted = false;
                }
                testLog[testCaseFile] = result;
            }
        } else {
            throw "Could not parse line:'"+test+"'";
        }
    }

    process.chdir(currentPath);
}

let start = Date.now();
runTestList('WebGL/conformance-suites/2.0.0/conformance/00_test_list.txt');

process.chdir(startDir);

console.log(JSON.stringify(testLog, null, 2));

testResults.count = testResults.fail + testResults.pass;
testResults.successPercent = testResults.pass / testResults.count;
testResults.elapsed = Date.now() - start;
console.log(JSON.stringify(testResults, null, 2));

if (notAssertedPassedTests.length > 0) {
    throw "Cases marked as not asserted but passed.. " + JSON.stringify(notAssertedPassedTests);
}

if (testResults.pass <= 0 || testResults.fail <= 0 || testResults.count <= 700) {
    throw "Something wrong with the test cases. Too few results";
}

process.exit(testSetSuccess ? 0 : 1);

