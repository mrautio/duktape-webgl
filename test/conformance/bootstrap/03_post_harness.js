window.checkResults();

if (successfullyParsed !== void null && !successfullyParsed) {
    throw "Test case not successfully parsed: " + successfullyParsed;
}

