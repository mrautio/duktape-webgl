// polyfills

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

if (!setTimeout) {
    function setTimeout(func, timeout) {
        func();
    }
}

// Bare minimum dummy implementation for the WebGL compliance test harness

var BrowserDummyImpl = {};

BrowserDummyImpl.Element = (function() {
    var children = [];
    var Element = function(name) {
        this.name = name;
        this.innerHTML = void null;
        this.firstChild = null;
        this.text = '';
    };

    Element.prototype = {
        createElement: function(type) {
            var e = new BrowserDummyImpl.Element(type);
            return e;
        },
        createTextNode: function(text) {
            return null;
        },
        appendChild: function(element) {
            if (!this.firstChild) {
                this.firstChild = element;
            }

            children.push(element);
        },
        replaceChild: function(newChild, oldChild) {
            oldChild = newChild;
        },
        addEventListener: function(event, callback) {
        },
        getContext: function(context, attributes) {
            if (context == 'webgl2' || context == 'webgl') { return new WebGL2RenderingContext(); }

            return null;
        }
    };

    return Element;
})();


BrowserDummyImpl.Document = (function() {
    var elements = {};
    var Document = function() {
        this.title = "test case";
    };

    Document.prototype = {
        createElement: function(type) {
            var e = new BrowserDummyImpl.Element(type);
            return e;
        },
        addEventListener: function(event, callback) {
        },
        getElementById: function(id) {
            return elements[id] || new BrowserDummyImpl.Element("DUMMY");
        },
        setElementById: function(id, element) {
            elements[id] = element;  
        },
    };

    return Document;
})();

BrowserDummyImpl.Window = (function() {
    var result = {
        pass: 0,
        fail: 0,
        total: 0
    }
    var Window = function() {
        this.title = "test case";
        this.location = {href:''};
        this.parent = {};
        this.console = { log: function(msg) {
                if (msg) {
                    if (msg.startsWith("PASS ")) {
                        result.total++;
                        result.pass++;
                    } else if (msg.startsWith("FAIL ")) {
                        result.total++;
                        result.fail++;
                    }
                }
                print(msg);
            }
        };
    };

    Window.prototype = {
        addEventListener: function(event, callback) {
        },
        checkResults: function() {
            if (result.fail > 0) {
                throw JSON.stringify(result);
            } else {
                print("Results:"+JSON.stringify(result));
            }
        }
    };

    return Window;
})();

var document = new BrowserDummyImpl.Document();
var window = new BrowserDummyImpl.Window();

