/*[global-shim-start]*/
(function(exports, global, doEval) {
	// jshint ignore:line
	var origDefine = global.define;

	var get = function(name) {
		var parts = name.split("."),
			cur = global,
			i;
		for (i = 0; i < parts.length; i++) {
			if (!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val) {
		var parts = name.split("."),
			cur = global,
			i,
			part,
			next;
		for (i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if (!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod) {
		if (!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, default: true };
		for (var p in mod) {
			if (!esProps[p]) return false;
		}
		return true;
	};

	var hasCjsDependencies = function(deps) {
		return (
			deps[0] === "require" && deps[1] === "exports" && deps[2] === "module"
		);
	};

	var modules =
		(global.define && global.define.modules) ||
		(global._define && global._define.modules) ||
		{};
	var ourDefine = (global.define = function(moduleName, deps, callback) {
		var module;
		if (typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for (i = 0; i < deps.length; i++) {
			args.push(
				exports[deps[i]]
					? get(exports[deps[i]])
					: modules[deps[i]] || get(deps[i])
			);
		}
		// CJS has no dependencies but 3 callback arguments
		if (hasCjsDependencies(deps) || (!deps.length && callback.length)) {
			module = { exports: {} };
			args[0] = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args[1] = module.exports;
			args[2] = module;
		} else if (!args[0] && deps[0] === "exports") {
			// Babel uses the exports and module object.
			module = { exports: {} };
			args[0] = module.exports;
			if (deps[1] === "module") {
				args[1] = module;
			}
		} else if (!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if (globalExport && !get(globalExport)) {
			if (useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	});
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function() {
		// shim for @@global-helpers
		var noop = function() {};
		return {
			get: function() {
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load) {
				doEval(__load.source, global);
			}
		};
	});
})(
	{},
	typeof self == "object" && self.Object == Object ? self : window,
	function(__$source__, __$global__) {
		// jshint ignore:line
		eval("(function() { " + __$source__ + " \n }).call(__$global__);");
	}
);

/*dom-patch@2.1.6#src/node_prop*/
define('dom-patch/src/node_prop', function (require, exports, module) {
    module.exports = {
        ROUTE: 0,
        TEXT: 1,
        COMMENT: 2,
        NODE_NAME: 3,
        ATTRIBUTES: 4,
        CHILD_NODES: 5,
        VALUE: 6,
        CHECKED: 7,
        SELECTED: 8,
        EVENTS: 9,
        CLASS: 10,
        FRAGMENT: 11
    };
});
/*dom-patch@2.1.6#src/setattribute*/
define('dom-patch/src/setattribute', function (require, exports, module) {
    module.exports = setAttribute;
    var invalidAttributes = {
        '[': true,
        '#': true,
        '(': true
    };
    function setAttribute(element, name, value) {
        var firstChar = name[0];
        if (invalidAttributes[firstChar]) {
            return setByCloning(element, name, value);
        }
        return element.setAttribute(name, value);
    }
    var dummyEl = function () {
        var el = document.createElement('div');
        dummyEl = function () {
            return el;
        };
        return el;
    };
    function setByCloning(element, name, value) {
        var el = dummyEl();
        el.innerHTML = '<span ' + name + '="' + value + '"></span>';
        var attr = el.firstChild.attributes[0];
        el.firstChild.removeAttributeNode(attr);
        element.setAttributeNode(attr);
    }
});
/*dom-patch@2.1.6#src/node_serialization*/
define('dom-patch/src/node_serialization', [
    'require',
    'exports',
    'module',
    'dom-patch/src/node_prop',
    'dom-patch/src/setattribute'
], function (require, exports, module) {
    var NodeProp = require('dom-patch/src/node_prop');
    var setAttribute = require('dom-patch/src/setattribute');
    var has = Object.prototype.hasOwnProperty;
    exports.serialize = nodeToObject;
    exports.deserialize = objectToNode;
    function nodeToObject(node) {
        var objNode = Object.create(null), i;
        if (node.nodeType === 3) {
            objNode[NodeProp.TEXT] = node.nodeValue;
        } else if (node.nodeType === 8) {
            objNode[NodeProp.COMMENT] = node.data;
        } else {
            objNode[NodeProp.NODE_NAME] = node.nodeName;
            if (node.attributes && node.attributes.length > 0) {
                objNode[NodeProp.ATTRIBUTES] = [];
                for (i = 0; i < node.attributes.length; i++) {
                    objNode[NodeProp.ATTRIBUTES].push([
                        node.attributes[i].name,
                        node.attributes[i].value
                    ]);
                }
            }
            var cnlen = childNodesLength(node);
            if (node.childNodes && cnlen > 0) {
                objNode[NodeProp.CHILD_NODES] = [];
                for (i = 0; i < cnlen; i++) {
                    objNode[NodeProp.CHILD_NODES].push(nodeToObject(node.childNodes.item(i)));
                }
            }
            if (node.value) {
                objNode[NodeProp.VALUE] = node.value;
            }
            if (node.checked) {
                objNode[NodeProp.CHECKED] = node.checked;
            }
            if (node.selected) {
                objNode[NodeProp.SELECTED] = node.selected;
            }
            if (node.className) {
                objNode[NodeProp.CLASS] = node.className;
            }
            if (node.__events) {
                objNode[NodeProp.EVENTS] = [];
                var events = Object.keys(node.__events);
                for (i = 0; i < events.length; i++) {
                    objNode[NodeProp.EVENTS].push(events[i]);
                }
            }
        }
        return objNode;
    }
    function objectToNode(objNode, insideSvg, diffOptions) {
        if (!objNode) {
            return objNode;
        }
        var node, i;
        if (has.call(objNode, NodeProp.TEXT)) {
            node = document.createTextNode(objNode[NodeProp.TEXT]);
        } else if (has.call(objNode, NodeProp.COMMENT)) {
            node = document.createComment(objNode[NodeProp.COMMENT]);
        } else {
            if (objNode[NodeProp.NODE_NAME] === 'svg' || insideSvg) {
                node = document.createElementNS('http://www.w3.org/2000/svg', objNode[NodeProp.NODE_NAME]);
                insideSvg = true;
            } else {
                var nodeName = objNode[NodeProp.NODE_NAME];
                node = nodeName === '#document-fragment' ? document.createDocumentFragment() : document.createElement(nodeName);
            }
            if (objNode[NodeProp.ATTRIBUTES]) {
                for (i = 0; i < objNode[NodeProp.ATTRIBUTES].length; i++) {
                    setAttribute(node, objNode[NodeProp.ATTRIBUTES][i][0], objNode[NodeProp.ATTRIBUTES][i][1]);
                }
            }
            if (objNode[NodeProp.CHILD_NODES]) {
                for (i = 0; i < objNode[NodeProp.CHILD_NODES].length; i++) {
                    node.appendChild(objectToNode(objNode[NodeProp.CHILD_NODES][i], insideSvg, diffOptions));
                }
            }
            if (objNode[NodeProp.VALUE]) {
                node.value = objNode[NodeProp.VALUE];
            }
            if (objNode[NodeProp.CHECKED]) {
                node.checked = objNode[NodeProp.CHECKED];
            }
            if (objNode[NodeProp.SELECTED]) {
                node.selected = objNode[NodeProp.SELECTED];
            }
            if (objNode[NodeProp.CLASS]) {
                node.className = objNode[NodeProp.CLASS];
            }
            if (objNode[NodeProp.EVENTS]) {
                node.__events = {};
                objNode[NodeProp.EVENTS].forEach(function (evName) {
                    node.__events[evName] = true;
                    if (diffOptions && diffOptions.eventHandler) {
                        node.addEventListener(evName, diffOptions.eventHandler);
                    }
                });
            }
        }
        return node;
    }
    function childNodesLength(node) {
        if ('length' in node.childNodes) {
            return node.childNodes.length;
        }
        var len = 0, cur = node.childNodes.node.firstChild;
        while (cur) {
            len++;
            cur = cur.nextSibling;
        }
        return len;
    }
});
/*node-route@1.2.1#src/dom-id*/
define('node-route', function (require, exports, module) {
    var slice = [].slice;
    var nodeCache = exports.nodeCache = {};
    var nodeTree = exports.nodeTree = [];
    var SEPARATOR = '.';
    var rootNode = exports.rootNode = function (root) {
        if (!root) {
            return document.documentElement;
        }
        return root.documentElement || root;
    };
    var createRouteInfo = function (id, branch, value, collapsed) {
        var routeInfo = Object.create(null);
        routeInfo.id = id;
        routeInfo.branch = branch;
        routeInfo.collapsed = collapsed;
        if (value !== undefined) {
            routeInfo.value = value;
        }
        return routeInfo;
    };
    var cache = function (node, routeInfo) {
        node.__routeInfo = routeInfo;
        nodeCache[routeInfo.id] = node;
    };
    var getID = exports.getID = function (node, options) {
        var id;
        var info = getCachedInfo(node);
        if (info) {
            id = info.id;
            var invalid = info.collapsed !== (options && options.collapseTextNodes);
            if (invalid) {
                id = undefined;
            }
        }
        if (!id) {
            var routeInfo = getRoute(node, options);
            id = routeInfo.id;
        }
        return id;
    };
    exports.getRoute = getRoute;
    var getCachedInfo = exports.getCachedInfo = function (node) {
        return node.__routeInfo;
    };
    var getCachedID = exports.getCachedID = function (node) {
        var info = getCachedInfo(node);
        return info && info.id;
    };
    var getIndex = exports.getIndex = function (id) {
        return +id.substr(id.lastIndexOf('.') + 1);
    };
    function getBranch(index, element, parentBranch) {
        parentBranch = parentBranch || nodeTree;
        var branch = parentBranch[index];
        if (!branch) {
            branch = parentBranch[index] = [];
            branch.element = element;
        } else if (branch.element !== element) {
            branch.element = element;
        }
        return branch;
    }
    exports.indexOfParent = function indexOfParent(parent, node, options) {
        var index = -1;
        var collapseTextNodes = options && options.collapseTextNodes;
        var child = parent.firstChild, last, skip;
        while (child) {
            skip = collapseTextNodes && child.nodeType === 3 && last === 3;
            if (!skip)
                index++;
            if (child === node) {
                break;
            }
            last = child.nodeType;
            child = child.nextSibling;
        }
        return index;
    };
    function getRoute(node, options) {
        var id = '', nodeType;
        var collapseTextNodes = options && options.collapseTextNodes;
        var parent = node.parentNode;
        var index = -1;
        if (!parent) {
            return { id: '0' };
        }
        var child = parent.firstChild;
        var prevNodeType, siblingTag, value;
        while (child) {
            if (collapseTextNodes && child.nodeType === 3) {
                siblingTag = child.nextSibling && child.nextSibling.nodeName;
                if (prevNodeType === 3) {
                    value += child.nodeValue;
                } else if (siblingTag !== 'HEAD') {
                    value = child.nodeValue;
                    index++;
                }
            } else {
                value = undefined;
                index++;
            }
            if (child === node) {
                break;
            }
            prevNodeType = child.nodeType;
            child = child.nextSibling;
        }
        var parentInfo;
        if (parent.nodeType === 9) {
            parentInfo = { id: '' };
        } else {
            parentInfo = getCachedInfo(parent);
            if (!parentInfo || collapseTextNodes) {
                parentInfo = getRoute(parent, options);
            }
        }
        var parentId = parentInfo.id;
        id = (parentId ? parentId + SEPARATOR : '') + index;
        var routeInfo = createRouteInfo(id, getBranch(index, node, parentInfo.branch), collapseTextNodes ? value : undefined, collapseTextNodes);
        cache(node, routeInfo);
        return routeInfo;
    }
    var findNode = exports.findNode = function (id, root) {
        var node = rootNode(root);
        var ids = id.split('.');
        var idIndex = 1;
        while (node) {
            var currentIndex = ids[idIndex];
            if (currentIndex == null) {
                break;
            }
            var nodeIndex = 0;
            var child = node.firstChild;
            while (child) {
                if (nodeIndex == currentIndex) {
                    node = child;
                    break;
                }
                nodeIndex++;
                child = child.nextSibling;
            }
            idIndex++;
            node = child;
        }
        return node;
    };
    exports.getNode = function (id, root) {
        var node;
        node = nodeCache[id];
        if (node && !root) {
            return node;
        }
        node = findNode(id, root);
        if (!root && node != null) {
            cache(node, { id: id });
        }
        return node;
    };
    exports.purgeID = function (id) {
        var node = nodeCache[id];
        if (node) {
            delete node.__routeInfo;
            delete nodeCache[id];
        }
    };
    exports.purgeNode = function (node) {
        var routeInfo = getCachedInfo(node);
        if (!routeInfo)
            return;
        var parentRouteInfo = getCachedInfo(node.parentNode);
        if (parentRouteInfo && parentRouteInfo.branch) {
            var parentBranch = parentRouteInfo.branch;
            var index = getIndex(routeInfo.id);
            parentBranch.splice(index, 1);
            routeInfo.branch.length = 0;
            nodeCache = exports.nodeCache = {};
        } else {
            exports.purgeID(routeInfo.id);
        }
    };
    exports.purgeSiblings = function (node) {
        var routeInfo = getCachedInfo(node);
        if (!routeInfo) {
            exports.getID(node);
            routeInfo = getCachedInfo(node);
        }
        var parentRouteInfo = getCachedInfo(node.parentNode);
        if (parentRouteInfo && parentRouteInfo.branch) {
            var parentBranch = parentRouteInfo.branch;
            var index = getIndex(routeInfo.id);
            var staleBranch = false;
            parentBranch.forEach(function (branch, i) {
                if (i > index || i === index && branch.element !== node) {
                    staleBranch = true;
                    return false;
                }
            });
            if (staleBranch) {
                parentBranch.length = 0;
                parentBranch[index] = routeInfo.branch;
            }
        }
    };
    exports.purgeCache = function () {
        nodeCache = exports.nodeCache = {};
        nodeTree = exports.nodeTree = [];
    };
});
/*dom-patch@2.1.6#src/apply/apply*/
define('dom-patch/src/apply/apply', [
    'require',
    'exports',
    'module',
    'dom-patch/src/node_serialization',
    'node-route',
    'dom-patch/src/setattribute'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        var deserialize = require('dom-patch/src/node_serialization').deserialize;
        var nodeRoute = require('node-route');
        var setAttribute = require('dom-patch/src/setattribute');
        module.exports = applyPatches;
        var handlers = {
            event: function (patch, document, patchOptions) {
                var node = nodeRoute.getNode(patch.route);
                node[patch.action](patch.event, patchOptions.eventHandler);
            },
            history: function (patch) {
                history[patch.action].apply(history, patch.args);
            },
            text: function (patch) {
                var node = nodeRoute.getNode(patch.route);
                node.nodeValue = patch.value;
            },
            attribute: function (patch) {
                var el = nodeRoute.getNode(patch.route);
                setAttribute(el, patch.attr, patch.value);
            },
            prop: function (patch) {
                var el = nodeRoute.getNode(patch.route);
                if (!el) {
                    return;
                }
                el[patch.prop] = patch.value;
            },
            style: function (patch) {
                var node = nodeRoute.getNode(patch.route);
                node.style.cssText = patch.value;
            },
            globalEvent: function (patch, document, patchOptions) {
                var fn = patch.action === 'add' ? 'addEventListener' : 'removeEventListener';
                window[fn](patch.name, patchOptions.globalEventHandler);
            },
            insert: function (patch, document, patchOptions) {
                var node = deserialize(patch.node, false, patchOptions);
                var parent = nodeRoute.getNode(patch.route, document);
                if (patch.ref != null) {
                    var ref = nodeRoute.findNode('0.' + patch.ref, parent);
                    parent.insertBefore(node, ref);
                    nodeRoute.purgeSiblings(node);
                } else {
                    parent.appendChild(node);
                }
            },
            replace: function (patch, document, patchOptions) {
                var node = deserialize(patch.node, false, patchOptions);
                var parent = nodeRoute.getNode(patch.route, document);
                var ref = nodeRoute.findNode('0.' + patch.ref, parent);
                parent.replaceChild(node, ref);
            },
            remove: function (patch, document) {
                var parent = nodeRoute.getNode(patch.route);
                var node = nodeRoute.getNode(patch.child, document);
                if (!node) {
                    return;
                }
                nodeRoute.purgeSiblings(node);
                nodeRoute.purgeNode(node);
                parent.removeChild(node);
            }
        };
        function applyPatches(document, patches, patchOptions) {
            patchOptions = patchOptions || {};
            patches.forEach(function (patch) {
                var handler = handlers[patch.type];
                if (handler) {
                    handler(patch, document, patchOptions);
                } else {
                    console.error('Patch type', patch.type, 'not supported');
                }
            });
        }
    }(function () {
        return this;
    }(), require, exports, module));
});
/*dom-patch@2.1.6#apply*/
define('dom-patch/apply', [
    'require',
    'exports',
    'module',
    'dom-patch/src/apply/apply'
], function (require, exports, module) {
    module.exports = require('dom-patch/src/apply/apply');
});
/*done-ssr-incremental-rendering-client@2.0.1#reattach*/
define('done-ssr-incremental-rendering-client/reattach', function (require, exports, module) {
    module.exports = createAttacher;
    function createAttacher() {
        var attacher = Object.create(null);
        attacher.attached = false;
        attacher.doneSsrAttach = doneSsrAttach;
        function depth(root) {
            var i = 0;
            var walker = document.createTreeWalker(root, 4294967295, {
                acceptNode: function (node) {
                    var nt = node.nodeType;
                    return nt === 1 || nt === 3;
                }
            });
            while (walker.nextNode()) {
                i++;
            }
            return i;
        }
        function isAttached() {
            return document.documentElement.hasAttribute('data-attached');
        }
        function doneSsrAttach(fragment, callback) {
            if (!callback) {
                callback = Function.prototype;
            }
            var mo = new MutationObserver(checkCompleteness);
            function checkCompleteness() {
                var docDepth = depth(document.documentElement);
                var fragDepth = depth(fragment);
                var attached = isAttached();
                if (!attached) {
                    attached = docDepth <= fragDepth;
                }
                if (attached) {
                    mo.disconnect();
                    if (!isAttached()) {
                        document.documentElement.setAttribute('data-attached', '');
                        callback();
                    }
                }
            }
            mo.observe(fragment, {
                childList: true,
                subtree: true
            });
        }
        return attacher;
    }
});
/*done-ssr-incremental-rendering-client@2.0.1#done-ssr-incremental-rendering-client*/
define('done-ssr-incremental-rendering-client', [
    'require',
    'exports',
    'module',
    'dom-patch/apply',
    'done-ssr-incremental-rendering-client/reattach'
], function (require, exports, module) {
    var apply = require('dom-patch/apply');
    var createAttacher = require('done-ssr-incremental-rendering-client/reattach');
    var streamurl = document.currentScript.dataset.streamurl;
    var att = createAttacher();
    function isAttached() {
        return document.documentElement.hasAttribute('data-attached');
    }
    function render(instruction) {
        apply(document, instruction);
    }
    function removeSelf() {
        var p = window.parent;
        if (p.closeSsrIframe) {
            p.closeSsrIframe();
        }
    }
    var start = function () {
        att.doneSsrAttach(window.parent.document.documentElement, removeSelf);
        start = Function.prototype;
    };
    fetch(streamurl, { credentials: 'same-origin' }).then(function (response) {
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        function read() {
            return reader.read().then(function (result) {
                var resultValue = result.value || new Uint8Array();
                var chunk = decoder.decode(resultValue);
                if (isAttached()) {
                    return;
                }
                chunk.split('\n').filter(function (str) {
                    return str.length;
                }).map(function (itemStr) {
                    return JSON.parse(itemStr);
                }).forEach(function (instruction) {
                    render(instruction);
                });
                start();
                if (!result.done) {
                    return read();
                }
            });
        }
        return read().catch(function (err) {
            console.error(err);
        });
    });
});
/*[global-shim-end]*/
(function(global) { // jshint ignore:line
	global._define = global.define;
	global.define = global.define.orig;
}
)(typeof self == "object" && self.Object == Object ? self : window);