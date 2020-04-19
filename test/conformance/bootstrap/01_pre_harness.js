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

var WebGLRenderingContext = WebGL2RenderingContext;
// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest

var XMLHttpRequest = function() {
    this.type = "POST";
    this.url = "";
    this.headers = {};
    this.onload = void null;
    this.onreadystatechange = void null;
    this.onerror = void null;

    this.responseText = null;
    this.status = 0;
    this.readyState = 0;
}

XMLHttpRequest.prototype.open = function(type, url) {
    this.type = type;
    this.url = url;
}

XMLHttpRequest.prototype.setRequestHeader = function(key, value) {
    this.headers[key] = value;
}

XMLHttpRequest.prototype.send = function(data) {
    print("XMLHttpRequest.send: " + JSON.stringify(this) + ", data:"+JSON.stringify(data));

    this.responseText = readFileSync(this.url);
    this.status = 200;
    this.readyState = 0; // 0: request not initialized 

    this._callFinalEvents();
}

XMLHttpRequest.prototype._callFinalEvents = function() {
    this.readyState = 4; // 4: request finished and response is ready

    this._callEvent('onreadystatechange');

    if (this.status >= 200 && this.status < 400) {
        this._callEvent('onload');
    } else if (this.status >= 400) {
        this._callEvent('onerror');
    }
}

XMLHttpRequest.prototype._callEvent = function(event) {
    if (event in this) {
        var func = this[event];

        if (func !== void null) {
            if (typeof(func) === 'function') {
                func();
            } else {
                throw "Event defined but not callable! event:" + JSON.stringify(event,null,2) + ", this:" + JSON.stringify(this, null, 2);
            }
        }
    }
}

var BrowserDummyImpl = {};

BrowserDummyImpl.Element = (function() {
    var children = [];
    var Element = function(name) {
        this.name = name;
        this.innerHTML = void null;
        this.firstChild = null;
        this.text = '';
	this.style = { display: '' };
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
            if (context == 'webgl2' || context == 'webgl') {
                var gl = new WebGL2RenderingContext();
                if (!gl.canvas) { gl.canvas = { width:500, height:500 }; }
                gl.HACK = {};
                gl.HACK.shaderHeader = '\n'
                    + '#define gl_MaxVertexAttribs 8\n'
                    + '#define gl_MaxVertexTextureImageUnits 0\n'
                    + '#define gl_MaxCombinedTextureImageUnits 8\n'
                    + '#define gl_MaxVertexUniformVectors 8\n'
                    + '#define gl_MaxVaryingVectors 8\n'
                    + '#define gl_MaxTextureImageUnits 8\n'
                    + '#define gl_MaxDrawBuffers 1\n'
                    + '#define gl_MaxFragmentUniformVectors 6\n';
                gl.HACK.shaderSource = gl.shaderSource;
                gl.shaderSource = function(shader, source) {
                    if (!source.match(/#version\s/)) {
                        print("Injecting built-in constants to GLSL sources");
                        source = '#version 100\n' + /*gl.HACK.shaderHeader +*/ source;
                    }
                    gl.HACK.shaderSource(shader, source);
                };
                return gl;
            }

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
        this.XMLHttpRequest = XMLHttpRequest;
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

