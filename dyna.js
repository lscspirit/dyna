(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dyna = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(_dereq_,module,exports){
'use strict';

var callable   = _dereq_('es5-ext/object/valid-callable')
  , d          = _dereq_('d')
  , isCallable = _dereq_('es5-ext/object/is-callable')
  , ee         = _dereq_('event-emitter')
  , isPromise  = _dereq_('./is-promise')

  , create = Object.create, defineProperty = Object.defineProperty
  , deferred, resolve, reject;

module.exports = exports = function (name, unres, onres, res) {
	name = String(name);
	(callable(res) && ((onres == null) || callable(onres)) && callable(unres));
	defineProperty(exports._unresolved, name, d(unres));
	exports._onresolve[name] = onres;
	defineProperty(exports._resolved, name, d(res));
	exports._names.push(name);
};

exports._names = ['done', 'then', 'valueOf'];

exports._unresolved = ee(create(Function.prototype, {
	then: d(function (win, fail) {
		var def;
		if (!this.pending) this.pending = [];
		def = deferred();
		this.pending.push('then', [win, fail, def.resolve, def.reject]);
		return def.promise;
	}),
	done: d(function (win, fail) {
		((win == null) || callable(win));
		((fail == null) || callable(fail));
		if (!this.pending) this.pending = [];
		this.pending.push('done', arguments);
	}),
	resolved: d(false),
	returnsPromise: d(true),
	valueOf: d(function () { return this; })
}));

exports._onresolve = {
	then: function (win, fail, resolve, reject) {
		var value, cb = this.failed ? fail : win;
		if (cb == null) {
			if (this.failed) reject(this.value);
			else resolve(this.value);
			return;
		}
		if (isCallable(cb)) {
			if (isPromise(cb)) {
				if (cb.resolved) {
					if (cb.failed) reject(cb.value);
					else resolve(cb.value);
					return;
				}
				cb.done(resolve, reject);
				return;
			}
			try { value = cb(this.value); } catch (e) {
				reject(e);
				return;
			}
			resolve(value);
			return;
		}
		resolve(cb);
	},
	done: function (win, fail) {
		if (this.failed) {
			if (fail) {
				fail(this.value);
				return;
			}
			throw this.value;
		}
		if (win) win(this.value);
	}
};

exports._resolved = ee(create(Function.prototype, {
	then: d(function (win, fail) {
		var value, cb = this.failed ? fail : win;
		if (cb == null) return this;
		if (isCallable(cb)) {
			if (isPromise(cb)) return cb;
			try { value = cb(this.value); } catch (e) { return reject(e); }
			return resolve(value);
		}
		return resolve(cb);
	}),
	done: d(function (win, fail) {
		((win == null) || callable(win));
		((fail == null) || callable(fail));
		if (this.failed) {
			if (fail) {
				fail(this.value);
				return;
			}
			throw this.value;
		}
		if (win) win(this.value);
	}),
	resolved: d(true),
	returnsPromise: d(true),
	valueOf: d(function () { return this.value; })
}));

deferred = _dereq_('./deferred');
resolve = deferred.resolve;
reject = deferred.reject;
deferred.extend = exports;

},{"./deferred":4,"./is-promise":28,"d":30,"es5-ext/object/is-callable":60,"es5-ext/object/valid-callable":67,"event-emitter":80}],3:[function(_dereq_,module,exports){
// Assimilate eventual foreign promise

'use strict';

var isObject  = _dereq_('es5-ext/object/is-object')
  , isPromise = _dereq_('./is-promise')
  , deferred  = _dereq_('./deferred')
  , nextTick  = _dereq_('next-tick')

  , getPrototypeOf = Object.getPrototypeOf;

module.exports = function self(value) {
	var then, done, def, resolve, reject;
	if (!value) return value;
	try {
		then = value.then;
	} catch (e) {
		return value;
	}
	if (typeof then !== 'function') return value;
	if (isPromise(value)) return value;
	if (!isObject(value)) return value;
	if (!getPrototypeOf(value)) return value;
	try {
		done = value.done;
	} catch (ignore) {}
	def = deferred();
	resolve = function (value) { def.resolve(self(value)); };
	reject = function (value) { def.reject(value); };
	if (typeof done === 'function') {
		try {
			done.call(value, resolve, reject);
		} catch (e) {
			return def.reject(e);
		}
		return def.promise;
	}
	try {
		then.call(value, function (value) { nextTick(function () {
			resolve(value);
		}); }, function (value) { nextTick(function () {
			reject(value);
		}); });
	} catch (e) {
		return def.reject(e);
	}
	return def.promise;
};

},{"./deferred":4,"./is-promise":28,"es5-ext/object/is-object":61,"next-tick":77}],4:[function(_dereq_,module,exports){
// Returns function that returns deferred or promise object.
//
// 1. If invoked without arguments then deferred object is returned
//    Deferred object consist of promise (unresolved) function and resolve
//    function through which we resolve promise
// 2. If invoked with one argument then promise is returned which resolved value
//    is given argument. Argument may be any value (even undefined),
//    if it's promise then same promise is returned
// 3. If invoked with more than one arguments then promise that resolves with
//    array of all resolved arguments is returned.

'use strict';

var isError    = _dereq_('es5-ext/error/is-error')
  , noop       = _dereq_('es5-ext/function/noop')
  , isPromise  = _dereq_('./is-promise')

  , every = Array.prototype.every, push = Array.prototype.push

  , Deferred, createDeferred, count = 0, timeout, extendShim, ext
  , protoSupported = Boolean(isPromise.__proto__)
  , resolve, assimilate;

extendShim = function (promise) {
	ext._names.forEach(function (name) {
		promise[name] = function () {
			return promise.__proto__[name].apply(promise, arguments);
		};
	});
	promise.returnsPromise = true;
	promise.resolved = promise.__proto__.resolved;
};

resolve = function (value, failed) {
	var promise = function (win, fail) { return promise.then(win, fail); };
	promise.value = value;
	promise.failed = failed;
	promise.__proto__ = ext._resolved;
	if (!protoSupported) { extendShim(promise); }
	if (createDeferred._profile) createDeferred._profile(true);
	return promise;
};

Deferred = function () {
	var promise = function (win, fail) { return promise.then(win, fail); };
	if (!count) timeout = setTimeout(noop, 1e9);
	++count;
	if (createDeferred._monitor) promise.monitor = createDeferred._monitor();
	promise.__proto__ = ext._unresolved;
	if (!protoSupported) extendShim(promise);
	(createDeferred._profile && createDeferred._profile());
	this.promise = promise;
	this.resolve = this.resolve.bind(this);
	this.reject = this.reject.bind(this);
};

Deferred.prototype = {
	resolved: false,
	_settle: function (value) {
		var i, name, data;
		this.promise.value = value;
		this.promise.__proto__ = ext._resolved;
		if (!protoSupported) this.promise.resolved = true;
		if (this.promise.dependencies) {
			this.promise.dependencies.forEach(function self(dPromise) {
				dPromise.value = value;
				dPromise.failed = this.failed;
				dPromise.__proto__ = ext._resolved;
				if (!protoSupported) dPromise.resolved = true;
				delete dPromise.pending;
				if (dPromise.dependencies) {
					dPromise.dependencies.forEach(self, this);
					delete dPromise.dependencies;
				}
			}, this.promise);
			delete this.promise.dependencies;
		}
		if ((data = this.promise.pending)) {
			for (i = 0; (name = data[i]); ++i) {
				ext._onresolve[name].apply(this.promise, data[++i]);
			}
			delete this.promise.pending;
		}
		return this.promise;
	},
	resolve: function (value) {
		if (this.resolved) return this.promise;
		this.resolved = true;
		if (!--count) clearTimeout(timeout);
		if (this.promise.monitor) clearTimeout(this.promise.monitor);
		value = assimilate(value);
		if (isPromise(value)) {
			if (!value.resolved) {
				if (!value.dependencies) {
					value.dependencies = [];
				}
				value.dependencies.push(this.promise);
				if (this.promise.pending) {
					if (value.pending) {
						push.apply(value.pending, this.promise.pending);
						this.promise.pending = value.pending;
						if (this.promise.dependencies) {
							this.promise.dependencies.forEach(function self(dPromise) {
								dPromise.pending = value.pending;
								if (dPromise.dependencies) {
									dPromise.dependencies.forEach(self);
								}
							});
						}
					} else {
						value.pending = this.promise.pending;
					}
				} else if (value.pending) {
					this.promise.pending = value.pending;
				} else {
					this.promise.pending = value.pending = [];
				}
				return this.promise;
			}
			this.promise.failed = value.failed;
			value = value.value;
		}
		return this._settle(value);
	},
	reject: function (error) {
		if (this.resolved) return this.promise;
		this.resolved = true;
		if (!--count) clearTimeout(timeout);
		if (this.promise.monitor) clearTimeout(this.promise.monitor);
		this.promise.failed = true;
		return this._settle(error);
	}
};

module.exports = createDeferred = function (value) {
	var l = arguments.length, d, waiting, initialized, result;
	if (!l) return new Deferred();
	if (l > 1) {
		d = new Deferred();
		waiting = 0;
		result = new Array(l);
		every.call(arguments, function (value, index) {
			value = assimilate(value);
			if (!isPromise(value)) {
				result[index] = value;
				return true;
			}
			if (value.resolved) {
				if (value.failed) {
					d.reject(value.value);
					return false;
				}
				result[index] = value.value;
				return true;
			}
			++waiting;
			value.done(function (value) {
				result[index] = value;
				if (!--waiting && initialized) d.resolve(result);
			}, d.reject);
			return true;
		});
		initialized = true;
		if (!waiting) d.resolve(result);
		return d.promise;
	}
	value = assimilate(value);
	if (isPromise(value)) return value;
	return resolve(value, isError(value));
};

createDeferred.Deferred = Deferred;
createDeferred.reject = function (value) { return resolve(value, true); };
createDeferred.resolve = function (value) {
	value = assimilate(value);
	if (isPromise(value)) return value;
	return resolve(value, false);
};
ext = _dereq_('./_ext');
assimilate = _dereq_('./assimilate');

},{"./_ext":2,"./assimilate":3,"./is-promise":28,"es5-ext/error/is-error":38,"es5-ext/function/noop":44}],5:[function(_dereq_,module,exports){
'use strict';

var arrayOf    = _dereq_('es5-ext/array/of')
  , deferred   = _dereq_('../deferred')
  , isPromise  = _dereq_('../is-promise')
  , assimilate = _dereq_('../assimilate')

  , push = Array.prototype.push, slice = Array.prototype.slice;

module.exports = function (args, length) {
	var i, l, arg;
	if ((length != null) && (args.length !== length)) {
		args = slice.call(args, 0, length);
		if (args.length < length) {
			push.apply(args, new Array(length - args.length));
		}
	}
	for (i = 0, l = args.length; i < l; ++i) {
		arg = assimilate(args[i]);
		if (isPromise(arg)) {
			if (!arg.resolved) {
				if (l > 1) return deferred.apply(null, args);
				return arg(arrayOf);
			}
			if (arg.failed) return arg;
			args[i] = arg.value;
		}
	}
	return args;
};

},{"../assimilate":3,"../deferred":4,"../is-promise":28,"es5-ext/array/of":34}],6:[function(_dereq_,module,exports){
// Promise aware Array's map

'use strict';

var assign     = _dereq_('es5-ext/object/assign')
  , value      = _dereq_('es5-ext/object/valid-value')
  , callable   = _dereq_('es5-ext/object/valid-callable')
  , deferred   = _dereq_('../../deferred')
  , isPromise  = _dereq_('../../is-promise')
  , assimilate = _dereq_('../../assimilate')

  , every = Array.prototype.every
  , call = Function.prototype.call

  , DMap;

DMap = function (list, cb, context) {
	this.list = list;
	this.cb = cb;
	this.context = context;
	this.result = new Array(list.length >>> 0);

	assign(this, deferred());
	every.call(list, this.process, this);
	if (!this.waiting) return this.resolve(this.result);
	this.initialized = true;

	return this.promise;
};

DMap.prototype = {
	waiting: 0,
	initialized: false,
	process: function (value, index) {
		++this.waiting;
		value = assimilate(value);
		if (isPromise(value)) {
			if (!value.resolved) {
				value.done(this.processCb.bind(this, index), this.reject);
				return true;
			}
			if (value.failed) {
				this.reject(value.value);
				return false;
			}
			value = value.value;
		}
		return this.processCb(index, value);
	},
	processCb: function (index, value) {
		if (this.promise.resolved) return false;
		if (this.cb) {
			try {
				value = call.call(this.cb, this.context, value, index, this.list);
			} catch (e) {
				this.reject(e);
				return false;
			}
			value = assimilate(value);
			if (isPromise(value)) {
				if (!value.resolved) {
					value.done(this.processValue.bind(this, index), this.reject);
					return true;
				}
				if (value.failed) {
					this.reject(value.value);
					return false;
				}
				value = value.value;
			}
		}
		this.processValue(index, value);
		return true;
	},
	processValue: function (index, value) {
		if (this.promise.resolved) return;
		this.result[index] = value;
		if (!--this.waiting && this.initialized) this.resolve(this.result);
	}
};

module.exports = function (cb/*, thisArg*/) {
	value(this);
	((cb == null) || callable(cb));

	return new DMap(this, cb, arguments[1]);
};

},{"../../assimilate":3,"../../deferred":4,"../../is-promise":28,"es5-ext/object/assign":56,"es5-ext/object/valid-callable":67,"es5-ext/object/valid-value":68}],7:[function(_dereq_,module,exports){
// Promise aware Array's reduce

'use strict';

var assign     = _dereq_('es5-ext/object/assign')
  , value      = _dereq_('es5-ext/object/valid-value')
  , callable   = _dereq_('es5-ext/object/valid-callable')
  , deferred   = _dereq_('../../deferred')
  , isPromise  = _dereq_('../../is-promise')
  , assimilate = _dereq_('../../assimilate')

  , call = Function.prototype.call
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , resolve = deferred.resolve
  , Reduce;

Reduce = function (list, cb, initial, initialized) {
	this.list = list;
	this.cb = cb;
	this.initialized = initialized;
	this.length = list.length >>> 0;

	initial = assimilate(initial);
	if (isPromise(initial)) {
		if (!initial.resolved) {
			assign(this, deferred());
			initial.done(function (initial) {
				this.value = initial;
				this.init();
			}.bind(this), this.reject);
			return this.promise;
		}
		this.value = initial.value;
		if (initial.failed) return initial;
	} else {
		this.value = initial;
	}

	return this.init();
};

Reduce.prototype = {
	current: 0,
	state: false,
	init: function () {
		while (this.current < this.length) {
			if (hasOwnProperty.call(this.list, this.current)) break;
			++this.current;
		}
		if (this.current === this.length) {
			if (!this.initialized) {
				throw new Error("Reduce of empty array with no initial value");
			}
			return this.resolve ? this.resolve(this.value) : resolve(this.value);
		}
		if (!this.promise) assign(this, deferred());
		this.processCb = this.processCb.bind(this);
		this.processValue = this.processValue.bind(this);
		this.continue();
		return this.promise;
	},
	continue: function () {
		var result;
		while (!this.state) {
			result = this.process();
			if (this.state !== 'cb') break;
			result = this.processCb(result);
			if (this.state !== 'value') break;
			this.processValue(result);
		}
	},
	process: function () {
		var value = assimilate(this.list[this.current]);
		if (isPromise(value)) {
			if (!value.resolved) {
				value.done(function (result) {
					result = this.processCb(result);
					if (this.state !== 'value') return;
					this.processValue(result);
					if (!this.state) this.continue();
				}.bind(this), this.reject);
				return;
			}
			if (value.failed) {
				this.reject(value.value);
				return;
			}
			value = value.value;
		}
		this.state = 'cb';
		return value;
	},
	processCb: function (value) {
		if (!this.initialized) {
			this.initialized = true;
			this.state = 'value';
			return value;
		}
		if (this.cb) {
			try {
				value = call.call(this.cb, undefined, this.value, value, this.current,
					this.list);
			} catch (e) {
				this.reject(e);
				return;
			}
			value = assimilate(value);
			if (isPromise(value)) {
				if (!value.resolved) {
					value.done(function (result) {
						this.state = 'value';
						this.processValue(result);
						if (!this.state) this.continue();
					}.bind(this), this.reject);
					return;
				}
				if (value.failed) {
					this.reject(value.value);
					return;
				}
				value = value.value;
			}
		}
		this.state = 'value';
		return value;
	},
	processValue: function (value) {
		this.value = value;
		while (++this.current < this.length) {
			if (hasOwnProperty.call(this.list, this.current)) {
				this.state = false;
				return;
			}
		}
		this.resolve(this.value);
	}
};

module.exports = function (cb/*, initial*/) {
	value(this);
	((cb == null) || callable(cb));

	return new Reduce(this, cb, arguments[1], arguments.length > 1);
};

},{"../../assimilate":3,"../../deferred":4,"../../is-promise":28,"es5-ext/object/assign":56,"es5-ext/object/valid-callable":67,"es5-ext/object/valid-value":68}],8:[function(_dereq_,module,exports){
// Promise aware Array's some

'use strict';

var assign     = _dereq_('es5-ext/object/assign')
  , value      = _dereq_('es5-ext/object/valid-value')
  , callable   = _dereq_('es5-ext/object/valid-callable')
  , deferred   = _dereq_('../../deferred')
  , isPromise  = _dereq_('../../is-promise')
  , assimilate = _dereq_('../../assimilate')

  , call = Function.prototype.call
  , resolve = deferred.resolve
  , Some;

Some = function (list, cb, context) {
	this.list = list;
	this.cb = cb;
	this.context = context;
	this.length = list.length >>> 0;

	while (this.current < this.length) {
		if (this.current in list) {
			assign(this, deferred());
			this.processCb = this.processCb.bind(this);
			this.processValue = this.processValue.bind(this);
			this.process();
			return this.promise;
		}
		++this.current;
	}
	return resolve(false);
};

Some.prototype = {
	current: 0,
	process: function () {
		var value = assimilate(this.list[this.current]);
		if (isPromise(value)) {
			if (!value.resolved) {
				value.done(this.processCb, this.reject);
				return;
			}
			if (value.failed) {
				this.reject(value.value);
				return;
			}
			value = value.value;
		}
		this.processCb(value);
	},
	processCb: function (value) {
		if (this.cb) {
			try {
				value = call.call(this.cb, this.context, value, this.current,
					this.list);
			} catch (e) {
				this.reject(e);
				return;
			}
			value = assimilate(value);
			if (isPromise(value)) {
				if (!value.resolved) {
					value.done(this.processValue, this.reject);
					return;
				}
				if (value.failed) {
					this.reject(value.value);
					return;
				}
				value = value.value;
			}
		}
		this.processValue(value);
	},
	processValue: function (value) {
		if (value) {
			this.resolve(true);
			return;
		}
		while (++this.current < this.length) {
			if (this.current in this.list) {
				this.process();
				return;
			}
		}
		this.resolve(false);
	}
};

module.exports = function (cb/*, thisArg*/) {
	value(this);
	((cb == null) || callable(cb));

	return new Some(this, cb, arguments[1]);
};

},{"../../assimilate":3,"../../deferred":4,"../../is-promise":28,"es5-ext/object/assign":56,"es5-ext/object/valid-callable":67,"es5-ext/object/valid-value":68}],9:[function(_dereq_,module,exports){
// Call asynchronous function

'use strict';

var toArray          = _dereq_('es5-ext/array/to-array')
  , callable         = _dereq_('es5-ext/object/valid-callable')
  , deferred         = _dereq_('../../deferred')
  , isPromise        = _dereq_('../../is-promise')
  , processArguments = _dereq_('../_process-arguments')

  , slice = Array.prototype.slice, apply = Function.prototype.apply

  , applyFn, callAsync;

applyFn = function (fn, args, def) {
	args = toArray(args);
	apply.call(fn,  this, args.concat(function (error, result) {
		if (error == null) {
			def.resolve((arguments.length > 2) ? slice.call(arguments, 1) : result);
		} else {
			def.reject(error);
		}
	}));
};

callAsync = function (fn, length, context, args) {
	var def;
	args = processArguments(args, length);
	if (isPromise(args)) {
		if (args.failed) return args;
		def = deferred();
		args.done(function (args) {
			if (fn.returnsPromise) return apply.call(fn, context, args);
			try {
				applyFn.call(context, fn, args, def);
			} catch (e) { def.reject(e); }
		}, def.reject);
		return def.promise;
	}
	if (fn.returnsPromise) return apply.call(fn, context, args);
	def = deferred();
	try {
		applyFn.call(context, fn, args, def);
	} catch (e) {
		def.reject(e);
		throw e;
	}
	return def.promise;
};

module.exports = exports = function (context/*, …args*/) {
	return callAsync(callable(this), null, context, slice.call(arguments, 1));
};

Object.defineProperty(exports, '_base', { configurable: true,
	enumerable: false, writable: true, value: callAsync });

},{"../../deferred":4,"../../is-promise":28,"../_process-arguments":5,"es5-ext/array/to-array":37,"es5-ext/object/valid-callable":67}],10:[function(_dereq_,module,exports){
// Delay function execution, return promise for delayed function result

'use strict';

var apply    = Function.prototype.apply
  , callable = _dereq_('es5-ext/object/valid-callable')
  , deferred = _dereq_('../../deferred')

  , delayed;

delayed = function (fn, args, resolve, reject) {
	var value;
	try {
		value = apply.call(fn, this, args);
	} catch (e) {
		reject(e);
		return;
	}
	resolve(value);
};

module.exports = function (timeout) {
	var fn, result;
	fn = callable(this);
	result = function () {
		var def = deferred();
		setTimeout(delayed.bind(this, fn, arguments, def.resolve, def.reject),
			timeout);
		return def.promise;
	};
	result.returnsPromise = true;
	return result;
};

},{"../../deferred":4,"es5-ext/object/valid-callable":67}],11:[function(_dereq_,module,exports){
// Limit number of concurrent function executions (to cLimit number).
// Limited calls are queued. Optionaly maximum queue length can also be
// controlled with qLimit value, any calls that would reach over that limit
// would be discarded (its promise would resolve with "Too many calls" error)

'use strict';

var toPosInt   = _dereq_('es5-ext/number/to-pos-integer')
  , callable   = _dereq_('es5-ext/object/valid-callable')
  , eeUnify    = _dereq_('event-emitter/unify')
  , deferred   = _dereq_('../../deferred')
  , isPromise  = _dereq_('../../is-promise')
  , assimilate = _dereq_('../../assimilate')

  , resolve = deferred.resolve, reject = deferred.reject
  , apply = Function.prototype.apply, max = Math.max
  , gateReject;

_dereq_('../promise/finally');

gateReject = function () {
	var e = new Error("Too many calls");
	e.type = 'deferred-gate-rejected';
	return reject(e);
};

module.exports = function (cLimit, qLimit) {
	var fn, count, decrement, unload, queue, run, result;
	fn = callable(this);
	cLimit = max(toPosInt(cLimit), 1);
	qLimit = ((qLimit == null) || isNaN(qLimit)) ? Infinity : toPosInt(qLimit);
	count = 0;
	queue = [];

	run = function (thisArg, args, def) {
		var r;
		try {
			r = apply.call(fn, thisArg, args);
		} catch (e) {
			if (!def) return reject(e);
			def.reject(e);
			unload();
			return;
		}
		r = assimilate(r);
		if (isPromise(r)) {
			if (def) eeUnify(def.promise, r);
			if (!r.resolved) {
				++count;
				if (def) def.resolve(r);
				return r.finally(decrement);
			}
			r = r.value;
		}
		if (!def) return resolve(r);
		def.resolve(r);
		unload();
	};

	decrement = function () {
		--count;
		unload();
	};

	unload = function () {
		var data;
		if ((data = queue.shift())) run.apply(null, data);
	};

	result = function () {
		var def;
		if (count >= cLimit) {
			if (queue.length < qLimit) {
				def = deferred();
				queue.push([this, arguments, def]);
				return def.promise;
			}
			return gateReject();
		}
		return run(this, arguments);
	};
	result.returnsPromise = true;
	return result;
};

},{"../../assimilate":3,"../../deferred":4,"../../is-promise":28,"../promise/finally":18,"es5-ext/number/to-pos-integer":54,"es5-ext/object/valid-callable":67,"event-emitter/unify":99}],12:[function(_dereq_,module,exports){
// Promisify synchronous function

'use strict';

var callable         = _dereq_('es5-ext/object/valid-callable')
  , deferred         = _dereq_('../../deferred')
  , isPromise        = _dereq_('../../is-promise')
  , processArguments = _dereq_('../_process-arguments')

  , apply = Function.prototype.apply

  , applyFn;

applyFn = function (fn, args, resolve, reject) {
	var value;
	try {
		value = apply.call(fn, this, args);
	} catch (e) {
		reject(e);
		return;
	}
	resolve(value);
};

module.exports = function (length) {
	var fn, result;
	fn = callable(this);
	if (fn.returnsPromise) return fn;
	if (length != null) length = length >>> 0;
	result = function () {
		var args, def;
		args = processArguments(arguments, length);

		if (isPromise(args)) {
			if (args.failed) return args;
			def = deferred();
			args.done(function (args) {
				applyFn.call(this, fn, args, def.resolve, def.reject);
			}.bind(this), def.reject);
		} else {
			def = deferred();
			applyFn.call(this, fn, args, def.resolve, def.reject);
		}

		return def.promise;
	};
	result.returnsPromise = true;
	return result;
};

},{"../../deferred":4,"../../is-promise":28,"../_process-arguments":5,"es5-ext/object/valid-callable":67}],13:[function(_dereq_,module,exports){
// Promisify asynchronous function

'use strict';

var callable  = _dereq_('es5-ext/object/valid-callable')
  , callAsync = _dereq_('./call-async')._base;

module.exports = function (length) {
	var fn, result;
	fn = callable(this);
	if (fn.returnsPromise) return fn;
	if (length != null) length = length >>> 0;
	result = function () { return callAsync(fn, length, this, arguments); };
	result.returnsPromise = true;
	return result;
};

},{"./call-async":9,"es5-ext/object/valid-callable":67}],14:[function(_dereq_,module,exports){
// Used by promise extensions that are based on array extensions.

'use strict';

var callable = _dereq_('es5-ext/object/valid-callable')
  , deferred = _dereq_('../../deferred')

  , reject = deferred.reject;

module.exports = function (name, ext) {
	deferred.extend(name, function (cb) {
		var def;
		((cb == null) || callable(cb));
		if (!this.pending) this.pending = [];
		def = deferred();
		this.pending.push(name, [arguments, def.resolve, def.reject]);
		return def.promise;
	}, function (args, resolve, reject) {
		var result;
		if (this.failed) {
			reject(this.value);
			return;
		}
		try {
			result = ext.apply(this.value, args);
		} catch (e) {
			reject(e);
			return;
		}
		resolve(result);
	}, function (cb) {
		((cb == null) || callable(cb));
		if (this.failed) return this;
		try {
			return ext.apply(this.value, arguments);
		} catch (e) {
			return reject(e);
		}
	});
};

},{"../../deferred":4,"es5-ext/object/valid-callable":67}],15:[function(_dereq_,module,exports){
// 'aside' - Promise extension
//
// promise.aside(win, fail)
//
// Works in analogous way as promise function itself (or `then`)
// but instead of adding promise to promise chain it returns context promise and
// lets callback carry on with other processing logic

'use strict';

var callable = _dereq_('es5-ext/object/valid-callable')
  , deferred = _dereq_('../../deferred');

deferred.extend('aside', function (win, fail) {
	((win == null) || callable(win));
	((fail == null) || callable(fail));
	if (win || fail) {
		if (!this.pending) {
			this.pending = [];
		}
		this.pending.push('aside', arguments);
	}
	return this;
}, function (win, fail) {
	var cb = this.failed ? fail : win;
	if (cb) {
		cb(this.value);
	}
}, function (win, fail) {
	var cb;
	((win == null) || callable(win));
	((fail == null) || callable(fail));
	cb = this.failed ? fail : win;
	if (cb) {
		cb(this.value);
	}
	return this;
});

},{"../../deferred":4,"es5-ext/object/valid-callable":67}],16:[function(_dereq_,module,exports){
// 'catch' - Promise extension
//
// promise.catch(cb)
//
// Same as `then` but accepts only onFail callback

'use strict';

var isCallable = _dereq_('es5-ext/object/is-callable')
  , validValue = _dereq_('es5-ext/object/valid-value')
  , deferred   = _dereq_('../../deferred')
  , isPromise  = _dereq_('../../is-promise')

  , resolve = deferred.resolve, reject = deferred.reject;

deferred.extend('catch', function (cb) {
	var def;
	validValue(cb);
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('catch', [cb, def.resolve, def.reject]);
	return def.promise;
}, function (cb, resolve, reject) {
	var value;
	if (!this.failed) {
		resolve(this.value);
		return;
	}
	if (isCallable(cb)) {
		if (isPromise(cb)) {
			if (cb.resolved) {
				if (cb.failed) reject(cb.value);
				else resolve(cb.value);
			} else {
				cb.done(resolve, reject);
			}
			return;
		}
		try { value = cb(this.value); } catch (e) {
			reject(e);
			return;
		}
		resolve(value);
		return;
	}
	resolve(cb);
}, function (cb) {
	var value;
	validValue(cb);
	if (!this.failed) return this;
	if (isCallable(cb)) {
		if (isPromise(cb)) return cb;
		try { value = cb(this.value); } catch (e) {
			return reject(e);
		}
		return resolve(value);
	}
	return resolve(cb);
});

},{"../../deferred":4,"../../is-promise":28,"es5-ext/object/is-callable":60,"es5-ext/object/valid-value":68}],17:[function(_dereq_,module,exports){
// 'cb' - Promise extension
//
// promise.cb(cb)
//
// Handles asynchronous function style callback (which is run in next event loop
// the earliest). Returns self promise. Callback is optional.
//
// Useful when we want to configure typical asynchronous function which logic is
// internally configured with promises.
//
// Extension can be used as follows:
//
// var foo = function (arg1, arg2, cb) {
//     var d = deferred();
//     // ... implementation
//     return d.promise.cb(cb);
// };
//
// `cb` extension returns promise and handles eventual callback (optional)

'use strict';

var callable   = _dereq_('es5-ext/object/valid-callable')
  , nextTick   = _dereq_('next-tick')
  , deferred   = _dereq_('../../deferred');

deferred.extend('cb', function (cb) {
	if (cb == null) return this;
	callable(cb);
	nextTick(function () {
		if (this.resolved) {
			if (this.failed) cb(this.value);
			else cb(null, this.value);
		} else {
			if (!this.pending) this.pending = [];
			this.pending.push('cb', [cb]);
		}
	}.bind(this));
	return this;
}, function (cb) {
	if (this.failed) cb(this.value);
	else cb(null, this.value);
}, function (cb) {
	if (cb == null) return this;
	callable(cb);
	nextTick(function () {
		if (this.failed) cb(this.value);
		else cb(null, this.value);
	}.bind(this));
	return this;
});

},{"../../deferred":4,"es5-ext/object/valid-callable":67,"next-tick":77}],18:[function(_dereq_,module,exports){
// 'finally' - Promise extension
//
// promise.finally(cb)
//
// Called on promise resolution returns same promise, doesn't pass any values to
// provided callback

'use strict';

var callable = _dereq_('es5-ext/object/valid-callable')
  , deferred = _dereq_('../../deferred');

deferred.extend('finally', function (cb) {
	callable(cb);
	if (!this.pending) this.pending = [];
	this.pending.push('finally', arguments);
	return this;
}, function (cb) { cb(); }, function (cb) {
	callable(cb)();
	return this;
});

},{"../../deferred":4,"es5-ext/object/valid-callable":67}],19:[function(_dereq_,module,exports){
// 'get' - Promise extension
//
// promise.get(name)
//
// Resolves with property of resolved object

'use strict';

var value    = _dereq_('es5-ext/object/valid-value')
  , deferred = _dereq_('../../deferred')

  , reduce = Array.prototype.reduce
  , resolve = deferred.resolve, reject = deferred.reject;

deferred.extend('get', function (/*…name*/) {
	var def;
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('get', [arguments, def.resolve, def.reject]);
	return def.promise;

}, function (args, resolve, reject) {
	var result;
	if (this.failed) reject(this.value);
	try {
		result = reduce.call(args, function (obj, key) {
			return value(obj)[String(key)];
		}, this.value);
	} catch (e) {
		reject(e);
		return;
	}
	resolve(result);
}, function (/*…name*/) {
	var result;
	if (this.failed) return this;
	try {
		result = reduce.call(arguments, function (obj, key) {
			return value(obj)[String(key)];
		}, this.value);
	} catch (e) {
		return reject(e);
	}
	return resolve(result);
});

},{"../../deferred":4,"es5-ext/object/valid-value":68}],20:[function(_dereq_,module,exports){
// 'invokeAsync' - Promise extension
//
// promise.invokeAsync(name[, arg0[, arg1[, ...]]])
//
// On resolved object calls asynchronous method that takes callback
// (Node.js style).
// Do not pass callback, it's handled by internal implementation.
// 'name' can be method name or method itself.

'use strict';

var toArray          = _dereq_('es5-ext/array/to-array')
  , isCallable       = _dereq_('es5-ext/object/is-callable')
  , deferred         = _dereq_('../../deferred')
  , isPromise        = _dereq_('../../is-promise')
  , processArguments = _dereq_('../_process-arguments')

  , slice = Array.prototype.slice, apply = Function.prototype.apply
  , reject = deferred.reject

  , applyFn;

applyFn = function (fn, args, resolve, reject) {
	var result;
	if (fn.returnsPromise) {
		try {
			result = apply.call(fn, this, args);
		} catch (e) {
			reject(e);
			return;
		}
		return resolve(result);
	}
	args = toArray(args).concat(function (error, result) {
		if (error == null) {
			resolve((arguments.length > 2) ? slice.call(arguments, 1) : result);
		} else {
			reject(error);
		}
	});
	try {
		apply.call(fn, this, args);
	} catch (e2) {
		reject(e2);
	}
};

deferred.extend('invokeAsync', function (method/*, …args*/) {
	var def;
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('invokeAsync', [arguments, def.resolve, def.reject]);
	return def.promise;
}, function (args, resolve, reject) {
	var fn;
	if (this.failed) {
		reject(this.value);
		return;
	}

	if (this.value == null) {
		reject(new TypeError("Cannot use null or undefined"));
		return;
	}

	fn = args[0];
	if (!isCallable(fn)) {
		fn = String(fn);
		if (!isCallable(this.value[fn])) {
			reject(new TypeError(fn + " is not a function"));
			return;
		}
		fn = this.value[fn];
	}

	args = processArguments(slice.call(args, 1));
	if (isPromise(args)) {
		if (args.failed) {
			reject(args.value);
			return;
		}
		args.done(function (args) {
			applyFn.call(this, fn, args, resolve, reject);
		}.bind(this.value), reject);
	} else {
		applyFn.call(this.value, fn, args, resolve, reject);
	}
}, function (method/*, …args*/) {
	var args, def;
	if (this.failed) return this;

	if (this.value == null) {
		return reject(new TypeError("Cannot use null or undefined"));
	}

	if (!isCallable(method)) {
		method = String(method);
		if (!isCallable(this.value[method])) {
			return reject(new TypeError(method + " is not a function"));
		}
		method = this.value[method];
	}

	args = processArguments(slice.call(arguments, 1));
	if (isPromise(args)) {
		if (args.failed) return args;
		def = deferred();
		args.done(function (args) {
			applyFn.call(this, method, args, def.resolve, def.reject);
		}.bind(this.value), def.reject);
	} else if (!method.returnsPromise) {
		def = deferred();
		applyFn.call(this.value, method, args, def.resolve, def.reject);
	} else {
		return applyFn.call(this.value, method, args, deferred, reject);
	}
	return def.promise;
});

},{"../../deferred":4,"../../is-promise":28,"../_process-arguments":5,"es5-ext/array/to-array":37,"es5-ext/object/is-callable":60}],21:[function(_dereq_,module,exports){
// 'invoke' - Promise extension
//
// promise.invoke(name[, arg0[, arg1[, ...]]])
//
// On resolved object calls method that returns immediately.
// 'name' can be method name or method itself.

'use strict';

var isCallable       = _dereq_('es5-ext/object/is-callable')
  , deferred         = _dereq_('../../deferred')
  , isPromise        = _dereq_('../../is-promise')
  , processArguments = _dereq_('../_process-arguments')

  , slice = Array.prototype.slice, apply = Function.prototype.apply
  , reject = deferred.reject
  , applyFn;

applyFn = function (fn, args, resolve, reject) {
	var value;
	try {
		value = apply.call(fn, this, args);
	} catch (e) {
		return reject(e);
	}
	return resolve(value);
};

deferred.extend('invoke', function (method/*, …args*/) {
	var def;
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('invoke', [arguments, def.resolve, def.reject]);
	return def.promise;
}, function (args, resolve, reject) {
	var fn;
	if (this.failed) {
		reject(this.value);
		return;
	}

	if (this.value == null) {
		reject(new TypeError("Cannot use null or undefined"));
		return;
	}

	fn = args[0];
	if (!isCallable(fn)) {
		fn = String(fn);
		if (!isCallable(this.value[fn])) {
			reject(new TypeError(fn + " is not a function"));
			return;
		}
		fn = this.value[fn];
	}

	args = processArguments(slice.call(args, 1));
	if (isPromise(args)) {
		if (args.failed) {
			reject(args.value);
			return;
		}
		args.done(function (args) {
			applyFn.call(this, fn, args, resolve, reject);
		}.bind(this.value), reject);
	} else {
		applyFn.call(this.value, fn, args, resolve, reject);
	}
}, function (method/*, …args*/) {
	var args, def;
	if (this.failed) return this;

	if (this.value == null) {
		return reject(new TypeError("Cannot use null or undefined"));
	}

	if (!isCallable(method)) {
		method = String(method);
		if (!isCallable(this.value[method])) {
			return reject(new TypeError(method + " is not a function"));
		}
		method = this.value[method];
	}

	args = processArguments(slice.call(arguments, 1));
	if (isPromise(args)) {
		if (args.failed) return args;
		def = deferred();
		args.done(function (args) {
			applyFn.call(this, method, args, def.resolve, def.reject);
		}.bind(this.value), def.reject);
		return def.promise;
	}
	return applyFn.call(this.value, method, args, deferred, reject);
});

},{"../../deferred":4,"../../is-promise":28,"../_process-arguments":5,"es5-ext/object/is-callable":60}],22:[function(_dereq_,module,exports){
// 'map' - Promise extension
//
// promise.map(fn[, thisArg[, concurrentLimit]])
//
// Promise aware map for array-like results

'use strict';

_dereq_('./_array')('map', _dereq_('../array/map'));

},{"../array/map":6,"./_array":14}],23:[function(_dereq_,module,exports){
// 'reduce' - Promise extension
//
// promise.reduce(fn[, initial])
//
// Promise aware reduce for array-like results

'use strict';

_dereq_('./_array')('reduce', _dereq_('../array/reduce'));

},{"../array/reduce":7,"./_array":14}],24:[function(_dereq_,module,exports){
// 'some' - Promise extension
//
// promise.some(fn[, thisArg])
//
// Promise aware some for array-like results

'use strict';

_dereq_('./_array')('some', _dereq_('../array/some'));

},{"../array/some":8,"./_array":14}],25:[function(_dereq_,module,exports){
// 'spread' - Promise extensions
//
// promise.spread(onsuccess, onerror)
//
// Matches eventual list result onto function arguments,
// otherwise works same as 'then' (promise function itself)

'use strict';

var spread     = _dereq_('es5-ext/function/#/spread')
  , callable   = _dereq_('es5-ext/object/valid-callable')
  , isCallable = _dereq_('es5-ext/object/is-callable')
  , isPromise  = _dereq_('../../is-promise')
  , deferred   = _dereq_('../../deferred')

  , resolve = deferred.resolve, reject = deferred.reject;

deferred.extend('spread', function (win, fail) {
	var def;
	((win == null) || callable(win));
	if (!win && (fail == null)) return this;
	if (!this.pending) this.pending = [];
	def = deferred();
	this.pending.push('spread', [win, fail, def.resolve, def.reject]);
	return def.promise;
}, function (win, fail, resolve, reject) {
	var cb, value;
	cb = this.failed ? fail : win;
	if (cb == null) {
		if (this.failed) reject(this.value);
		else resolve(this.value);
	}
	if (isCallable(cb)) {
		if (isPromise(cb)) {
			if (cb.resolved) {
				if (cb.failed) reject(cb.value);
				else resolve(cb.value);
			} else {
				cb.done(resolve, reject);
			}
			return;
		}
		if (!this.failed) cb = spread.call(cb);
		try {
			value = cb(this.value);
		} catch (e) {
			reject(e);
			return;
		}
		resolve(value);
	} else {
		resolve(cb);
	}
}, function (win, fail) {
	var cb, value;
	cb = this.failed ? fail : win;
	if (cb == null) return this;
	if (isCallable(cb)) {
		if (isPromise(cb)) return cb;
		if (!this.failed) cb = spread.call(cb);
		try {
			value = cb(this.value);
		} catch (e) {
			return reject(e);
		}
		return resolve(value);
	}
	return resolve(cb);
});

},{"../../deferred":4,"../../is-promise":28,"es5-ext/function/#/spread":40,"es5-ext/object/is-callable":60,"es5-ext/object/valid-callable":67}],26:[function(_dereq_,module,exports){
// This construct deferred with all needed goodies that are being exported
// when we import 'deferred' by main name.
// All available promise extensions are also initialized.

'use strict';

var call   = Function.prototype.call
  , assign = _dereq_('es5-ext/object/assign');

module.exports = assign(_dereq_('./deferred'), {
	invokeAsync:   _dereq_('./invoke-async'),
	isPromise:     _dereq_('./is-promise'),
	validPromise:  _dereq_('./valid-promise'),
	callAsync:     call.bind(_dereq_('./ext/function/call-async')),
	delay:         call.bind(_dereq_('./ext/function/delay')),
	gate:          call.bind(_dereq_('./ext/function/gate')),
	monitor:       _dereq_('./monitor'),
	promisify:     call.bind(_dereq_('./ext/function/promisify')),
	promisifySync: call.bind(_dereq_('./ext/function/promisify-sync')),
	map:           call.bind(_dereq_('./ext/array/map')),
	reduce:        call.bind(_dereq_('./ext/array/reduce')),
	some:          call.bind(_dereq_('./ext/array/some'))
}, _dereq_('./profiler'));

_dereq_('./ext/promise/aside');
_dereq_('./ext/promise/catch');
_dereq_('./ext/promise/cb');
_dereq_('./ext/promise/finally');
_dereq_('./ext/promise/get');
_dereq_('./ext/promise/invoke');
_dereq_('./ext/promise/invoke-async');
_dereq_('./ext/promise/map');
_dereq_('./ext/promise/spread');
_dereq_('./ext/promise/some');
_dereq_('./ext/promise/reduce');

},{"./deferred":4,"./ext/array/map":6,"./ext/array/reduce":7,"./ext/array/some":8,"./ext/function/call-async":9,"./ext/function/delay":10,"./ext/function/gate":11,"./ext/function/promisify":13,"./ext/function/promisify-sync":12,"./ext/promise/aside":15,"./ext/promise/catch":16,"./ext/promise/cb":17,"./ext/promise/finally":18,"./ext/promise/get":19,"./ext/promise/invoke":21,"./ext/promise/invoke-async":20,"./ext/promise/map":22,"./ext/promise/reduce":23,"./ext/promise/some":24,"./ext/promise/spread":25,"./invoke-async":27,"./is-promise":28,"./monitor":29,"./profiler":78,"./valid-promise":79,"es5-ext/object/assign":56}],27:[function(_dereq_,module,exports){
// Invoke asynchronous function

'use strict';

var isCallable = _dereq_('es5-ext/object/is-callable')
  , callable   = _dereq_('es5-ext/object/valid-callable')
  , value      = _dereq_('es5-ext/object/valid-value')
  , callAsync  = _dereq_('./ext/function/call-async')._base

  , slice = Array.prototype.slice;

module.exports = function (obj, fn/*, …args*/) {
	value(obj);
	if (!isCallable(fn)) fn = callable(obj[fn]);
	return callAsync(fn, null, obj, slice.call(arguments, 2));
};

},{"./ext/function/call-async":9,"es5-ext/object/is-callable":60,"es5-ext/object/valid-callable":67,"es5-ext/object/valid-value":68}],28:[function(_dereq_,module,exports){
// Whether given object is a promise

'use strict';

module.exports = function (o) {
	return (typeof o === 'function') && (typeof o.then === 'function') && (o.end !== o.done);
};

},{}],29:[function(_dereq_,module,exports){
// Run if you want to monitor unresolved promises (in properly working
// application there should be no promises that are never resolved)

'use strict';

var max        = Math.max
  , callable   = _dereq_('es5-ext/object/valid-callable')
  , isCallable = _dereq_('es5-ext/object/is-callable')
  , toPosInt   = _dereq_('es5-ext/number/to-pos-integer')
  , deferred   = _dereq_('./deferred');

exports = module.exports = function (timeout, cb) {
	if (timeout === false) {
		// Cancel monitor
		delete deferred._monitor;
		delete exports.timeout;
		delete exports.callback;
		return;
	}
	exports.timeout = timeout = max(toPosInt(timeout) || 5000, 50);
	if (cb == null) {
		if ((typeof console !== 'undefined') && console &&
				isCallable(console.error)) {
			cb = function (e) {
				console.error(((e.stack && e.stack.toString()) ||
					"Unresolved promise: no stack available"));
			};
		}
	} else {
		callable(cb);
	}
	exports.callback = cb;

	deferred._monitor = function () {
		var e = new Error("Unresolved promise");
		return setTimeout(function () {
			if (cb) cb(e);
		}, timeout);
	};
};

},{"./deferred":4,"es5-ext/number/to-pos-integer":54,"es5-ext/object/is-callable":60,"es5-ext/object/valid-callable":67}],30:[function(_dereq_,module,exports){
'use strict';

var assign        = _dereq_('es5-ext/object/assign')
  , normalizeOpts = _dereq_('es5-ext/object/normalize-options')
  , isCallable    = _dereq_('es5-ext/object/is-callable')
  , contains      = _dereq_('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":56,"es5-ext/object/is-callable":60,"es5-ext/object/normalize-options":66,"es5-ext/string/#/contains":69}],31:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? Array.from
	: _dereq_('./shim');

},{"./is-implemented":32,"./shim":33}],32:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {
	var from = Array.from, arr, result;
	if (typeof from !== 'function') return false;
	arr = ['raz', 'dwa'];
	result = from(arr);
	return Boolean(result && (result !== arr) && (result[1] === 'dwa'));
};

},{}],33:[function(_dereq_,module,exports){
'use strict';

var iteratorSymbol = _dereq_('es6-symbol').iterator
  , isArguments    = _dereq_('../../function/is-arguments')
  , isFunction     = _dereq_('../../function/is-function')
  , toPosInt       = _dereq_('../../number/to-pos-integer')
  , callable       = _dereq_('../../object/valid-callable')
  , validValue     = _dereq_('../../object/valid-value')
  , isString       = _dereq_('../../string/is-string')

  , isArray = Array.isArray, call = Function.prototype.call
  , desc = { configurable: true, enumerable: true, writable: true, value: null }
  , defineProperty = Object.defineProperty;

module.exports = function (arrayLike/*, mapFn, thisArg*/) {
	var mapFn = arguments[1], thisArg = arguments[2], Constructor, i, j, arr, l, code, iterator
	  , result, getIterator, value;

	arrayLike = Object(validValue(arrayLike));

	if (mapFn != null) callable(mapFn);
	if (!this || (this === Array) || !isFunction(this)) {
		// Result: Plain array
		if (!mapFn) {
			if (isArguments(arrayLike)) {
				// Source: Arguments
				l = arrayLike.length;
				if (l !== 1) return Array.apply(null, arrayLike);
				arr = new Array(1);
				arr[0] = arrayLike[0];
				return arr;
			}
			if (isArray(arrayLike)) {
				// Source: Array
				arr = new Array(l = arrayLike.length);
				for (i = 0; i < l; ++i) arr[i] = arrayLike[i];
				return arr;
			}
		}
		arr = [];
	} else {
		// Result: Non plain array
		Constructor = this;
	}

	if (!isArray(arrayLike)) {
		if ((getIterator = arrayLike[iteratorSymbol]) !== undefined) {
			// Source: Iterator
			iterator = callable(getIterator).call(arrayLike);
			if (Constructor) arr = new Constructor();
			result = iterator.next();
			i = 0;
			while (!result.done) {
				value = mapFn ? call.call(mapFn, thisArg, result.value, i) : result.value;
				if (!Constructor) {
					arr[i] = value;
				} else {
					desc.value = value;
					defineProperty(arr, i, desc);
				}
				result = iterator.next();
				++i;
			}
			l = i;
		} else if (isString(arrayLike)) {
			// Source: String
			l = arrayLike.length;
			if (Constructor) arr = new Constructor();
			for (i = 0, j = 0; i < l; ++i) {
				value = arrayLike[i];
				if ((i + 1) < l) {
					code = value.charCodeAt(0);
					if ((code >= 0xD800) && (code <= 0xDBFF)) value += arrayLike[++i];
				}
				value = mapFn ? call.call(mapFn, thisArg, value, j) : value;
				if (!Constructor) {
					arr[j] = value;
				} else {
					desc.value = value;
					defineProperty(arr, j, desc);
				}
				++j;
			}
			l = j;
		}
	}
	if (l === undefined) {
		// Source: array or array-like
		l = toPosInt(arrayLike.length);
		if (Constructor) arr = new Constructor(l);
		for (i = 0; i < l; ++i) {
			value = mapFn ? call.call(mapFn, thisArg, arrayLike[i], i) : arrayLike[i];
			if (!Constructor) {
				arr[i] = value;
			} else {
				desc.value = value;
				defineProperty(arr, i, desc);
			}
		}
	}
	if (Constructor) {
		desc.value = null;
		arr.length = l;
	}
	return arr;
};

},{"../../function/is-arguments":42,"../../function/is-function":43,"../../number/to-pos-integer":54,"../../object/valid-callable":67,"../../object/valid-value":68,"../../string/is-string":76,"es6-symbol":48}],34:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? Array.of
	: _dereq_('./shim');

},{"./is-implemented":35,"./shim":36}],35:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {
	var of = Array.of, result;
	if (typeof of !== 'function') return false;
	result = of('foo', 'bar');
	return Boolean(result && (result[1] === 'bar'));
};

},{}],36:[function(_dereq_,module,exports){
'use strict';

var isFunction = _dereq_('../../function/is-function')

  , slice = Array.prototype.slice, defineProperty = Object.defineProperty
  , desc = { configurable: true, enumerable: true, writable: true, value: null };

module.exports = function (/*…items*/) {
	var result, i, l;
	if (!this || (this === Array) || !isFunction(this)) return slice.call(arguments);
	result = new this(l = arguments.length);
	for (i = 0; i < l; ++i) {
		desc.value = arguments[i];
		defineProperty(result, i, desc);
	}
	desc.value = null;
	result.length = l;
	return result;
};

},{"../../function/is-function":43}],37:[function(_dereq_,module,exports){
'use strict';

var from = _dereq_('./from')

  , isArray = Array.isArray;

module.exports = function (arrayLike) {
	return isArray(arrayLike) ? arrayLike : from(arrayLike);
};

},{"./from":31}],38:[function(_dereq_,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call(new Error());

module.exports = function (x) {
	return (x && ((x instanceof Error) || (toString.call(x)) === id)) || false;
};

},{}],39:[function(_dereq_,module,exports){
'use strict';

var callable     = _dereq_('../../object/valid-callable')
  , aFrom        = _dereq_('../../array/from')
  , defineLength = _dereq_('../_define-length')

  , apply = Function.prototype.apply;

module.exports = function (/*…args*/) {
	var fn = callable(this)
	  , args = aFrom(arguments);

	return defineLength(function () {
		return apply.call(fn, this, args.concat(aFrom(arguments)));
	}, fn.length - args.length);
};

},{"../../array/from":31,"../../object/valid-callable":67,"../_define-length":41}],40:[function(_dereq_,module,exports){
'use strict';

var callable = _dereq_('../../object/valid-callable')

  , apply = Function.prototype.apply;

module.exports = function () {
	var fn = callable(this);
	return function (args) { return apply.call(fn, this, args); };
};

},{"../../object/valid-callable":67}],41:[function(_dereq_,module,exports){
'use strict';

var toPosInt = _dereq_('../number/to-pos-integer')

  , test = function (a, b) {}, desc, defineProperty
  , generate, mixin;

try {
	Object.defineProperty(test, 'length', { configurable: true, writable: false,
		enumerable: false, value: 1 });
} catch (ignore) {}

if (test.length === 1) {
	// ES6
	desc = { configurable: true, writable: false, enumerable: false };
	defineProperty = Object.defineProperty;
	module.exports = function (fn, length) {
		length = toPosInt(length);
		if (fn.length === length) return fn;
		desc.value = length;
		return defineProperty(fn, 'length', desc);
	};
} else {
	mixin = _dereq_('../object/mixin');
	generate = (function () {
		var cache = [];
		return function (l) {
			var args, i = 0;
			if (cache[l]) return cache[l];
			args = [];
			while (l--) args.push('a' + (++i).toString(36));
			return new Function('fn', 'return function (' + args.join(', ') +
				') { return fn.apply(this, arguments); };');
		};
	}());
	module.exports = function (src, length) {
		var target;
		length = toPosInt(length);
		if (src.length === length) return src;
		target = generate(length)(src);
		try { mixin(target, src); } catch (ignore) {}
		return target;
	};
}

},{"../number/to-pos-integer":54,"../object/mixin":65}],42:[function(_dereq_,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call((function () { return arguments; }()));

module.exports = function (x) { return (toString.call(x) === id); };

},{}],43:[function(_dereq_,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call(_dereq_('./noop'));

module.exports = function (f) {
	return (typeof f === "function") && (toString.call(f) === id);
};

},{"./noop":44}],44:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {};

},{}],45:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? Math.sign
	: _dereq_('./shim');

},{"./is-implemented":46,"./shim":47}],46:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {
	var sign = Math.sign;
	if (typeof sign !== 'function') return false;
	return ((sign(10) === 1) && (sign(-20) === -1));
};

},{}],47:[function(_dereq_,module,exports){
'use strict';

module.exports = function (value) {
	value = Number(value);
	if (isNaN(value) || (value === 0)) return value;
	return (value > 0) ? 1 : -1;
};

},{}],48:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')() ? Symbol : _dereq_('./polyfill');

},{"./is-implemented":49,"./polyfill":51}],49:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {
	var symbol;
	if (typeof Symbol !== 'function') return false;
	symbol = Symbol('test symbol');
	try { String(symbol); } catch (e) { return false; }
	if (typeof Symbol.iterator === 'symbol') return true;

	// Return 'true' for polyfills
	if (typeof Symbol.isConcatSpreadable !== 'object') return false;
	if (typeof Symbol.iterator !== 'object') return false;
	if (typeof Symbol.toPrimitive !== 'object') return false;
	if (typeof Symbol.toStringTag !== 'object') return false;
	if (typeof Symbol.unscopables !== 'object') return false;

	return true;
};

},{}],50:[function(_dereq_,module,exports){
'use strict';

module.exports = function (x) {
	return (x && ((typeof x === 'symbol') || (x['@@toStringTag'] === 'Symbol'))) || false;
};

},{}],51:[function(_dereq_,module,exports){
'use strict';

var d              = _dereq_('d')
  , validateSymbol = _dereq_('./validate-symbol')

  , create = Object.create, defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
  , Symbol, HiddenSymbol, globalSymbols = create(null);

var generateName = (function () {
	var created = create(null);
	return function (desc) {
		var postfix = 0, name;
		while (created[desc + (postfix || '')]) ++postfix;
		desc += (postfix || '');
		created[desc] = true;
		name = '@@' + desc;
		defineProperty(objPrototype, name, d.gs(null, function (value) {
			defineProperty(this, name, d(value));
		}));
		return name;
	};
}());

HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError('TypeError: Symbol is not a constructor');
	return Symbol(description);
};
module.exports = Symbol = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError('TypeError: Symbol is not a constructor');
	symbol = create(HiddenSymbol.prototype);
	description = (description === undefined ? '' : String(description));
	return defineProperties(symbol, {
		__description__: d('', description),
		__name__: d('', generateName(description))
	});
};
defineProperties(Symbol, {
	for: d(function (key) {
		if (globalSymbols[key]) return globalSymbols[key];
		return (globalSymbols[key] = Symbol(String(key)));
	}),
	keyFor: d(function (s) {
		var key;
		validateSymbol(s);
		for (key in globalSymbols) if (globalSymbols[key] === s) return key;
	}),
	hasInstance: d('', Symbol('hasInstance')),
	isConcatSpreadable: d('', Symbol('isConcatSpreadable')),
	iterator: d('', Symbol('iterator')),
	match: d('', Symbol('match')),
	replace: d('', Symbol('replace')),
	search: d('', Symbol('search')),
	species: d('', Symbol('species')),
	split: d('', Symbol('split')),
	toPrimitive: d('', Symbol('toPrimitive')),
	toStringTag: d('', Symbol('toStringTag')),
	unscopables: d('', Symbol('unscopables'))
});
defineProperties(HiddenSymbol.prototype, {
	constructor: d(Symbol),
	toString: d('', function () { return this.__name__; })
});

defineProperties(Symbol.prototype, {
	toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(Symbol.prototype, Symbol.toPrimitive, d('',
	function () { return validateSymbol(this); }));
defineProperty(Symbol.prototype, Symbol.toStringTag, d('c', 'Symbol'));

defineProperty(HiddenSymbol.prototype, Symbol.toPrimitive,
	d('c', Symbol.prototype[Symbol.toPrimitive]));
defineProperty(HiddenSymbol.prototype, Symbol.toStringTag,
	d('c', Symbol.prototype[Symbol.toStringTag]));

},{"./validate-symbol":52,"d":30}],52:[function(_dereq_,module,exports){
'use strict';

var isSymbol = _dereq_('./is-symbol');

module.exports = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

},{"./is-symbol":50}],53:[function(_dereq_,module,exports){
'use strict';

var sign = _dereq_('../math/sign')

  , abs = Math.abs, floor = Math.floor;

module.exports = function (value) {
	if (isNaN(value)) return 0;
	value = Number(value);
	if ((value === 0) || !isFinite(value)) return value;
	return sign(value) * floor(abs(value));
};

},{"../math/sign":45}],54:[function(_dereq_,module,exports){
'use strict';

var toInteger = _dereq_('./to-integer')

  , max = Math.max;

module.exports = function (value) { return max(0, toInteger(value)); };

},{"./to-integer":53}],55:[function(_dereq_,module,exports){
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

'use strict';

var isCallable = _dereq_('./is-callable')
  , callable   = _dereq_('./valid-callable')
  , value      = _dereq_('./valid-value')

  , call = Function.prototype.call, keys = Object.keys
  , propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = function (method, defVal) {
	return function (obj, cb/*, thisArg, compareFn*/) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		obj = Object(value(obj));
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort(isCallable(compareFn) ? compareFn.bind(obj) : undefined);
		}
		return list[method](function (key, index) {
			if (!propertyIsEnumerable.call(obj, key)) return defVal;
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

},{"./is-callable":60,"./valid-callable":67,"./valid-value":68}],56:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? Object.assign
	: _dereq_('./shim');

},{"./is-implemented":57,"./shim":58}],57:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== 'function') return false;
	obj = { foo: 'raz' };
	assign(obj, { bar: 'dwa' }, { trzy: 'trzy' });
	return (obj.foo + obj.bar + obj.trzy) === 'razdwatrzy';
};

},{}],58:[function(_dereq_,module,exports){
'use strict';

var keys  = _dereq_('../keys')
  , value = _dereq_('../valid-value')

  , max = Math.max;

module.exports = function (dest, src/*, …srcn*/) {
	var error, i, l = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try { dest[key] = src[key]; } catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < l; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":62,"../valid-value":68}],59:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./_iterate')('forEach');

},{"./_iterate":55}],60:[function(_dereq_,module,exports){
// Deprecated

'use strict';

module.exports = function (obj) { return typeof obj === 'function'; };

},{}],61:[function(_dereq_,module,exports){
'use strict';

var map = { function: true, object: true };

module.exports = function (x) {
	return ((x != null) && map[typeof x]) || false;
};

},{}],62:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? Object.keys
	: _dereq_('./shim');

},{"./is-implemented":63,"./shim":64}],63:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {
	try {
		Object.keys('primitive');
		return true;
	} catch (e) { return false; }
};

},{}],64:[function(_dereq_,module,exports){
'use strict';

var keys = Object.keys;

module.exports = function (object) {
	return keys(object == null ? object : Object(object));
};

},{}],65:[function(_dereq_,module,exports){
'use strict';

var value = _dereq_('./valid-value')

  , defineProperty = Object.defineProperty
  , getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
  , getOwnPropertyNames = Object.getOwnPropertyNames;

module.exports = function (target, source) {
	var error;
	target = Object(value(target));
	getOwnPropertyNames(Object(value(source))).forEach(function (name) {
		try {
			defineProperty(target, name, getOwnPropertyDescriptor(source, name));
		} catch (e) { error = e; }
	});
	if (error !== undefined) throw error;
	return target;
};

},{"./valid-value":68}],66:[function(_dereq_,module,exports){
'use strict';

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

module.exports = function (options/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (options == null) return;
		process(Object(options), result);
	});
	return result;
};

},{}],67:[function(_dereq_,module,exports){
'use strict';

module.exports = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],68:[function(_dereq_,module,exports){
'use strict';

module.exports = function (value) {
	if (value == null) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{}],69:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? String.prototype.contains
	: _dereq_('./shim');

},{"./is-implemented":70,"./shim":71}],70:[function(_dereq_,module,exports){
'use strict';

var str = 'razdwatrzy';

module.exports = function () {
	if (typeof str.contains !== 'function') return false;
	return ((str.contains('dwa') === true) && (str.contains('foo') === false));
};

},{}],71:[function(_dereq_,module,exports){
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],72:[function(_dereq_,module,exports){
'use strict';

var toInteger = _dereq_('../../number/to-integer')
  , value     = _dereq_('../../object/valid-value')
  , repeat    = _dereq_('./repeat')

  , abs = Math.abs, max = Math.max;

module.exports = function (fill/*, length*/) {
	var self = String(value(this))
	  , sLength = self.length
	  , length = arguments[1];

	length = isNaN(length) ? 1 : toInteger(length);
	fill = repeat.call(String(fill), abs(length));
	if (length >= 0) return fill.slice(0, max(0, length - sLength)) + self;
	return self + (((sLength + length) >= 0) ? '' : fill.slice(length + sLength));
};

},{"../../number/to-integer":53,"../../object/valid-value":68,"./repeat":73}],73:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? String.prototype.repeat
	: _dereq_('./shim');

},{"./is-implemented":74,"./shim":75}],74:[function(_dereq_,module,exports){
'use strict';

var str = 'foo';

module.exports = function () {
	if (typeof str.repeat !== 'function') return false;
	return (str.repeat(2) === 'foofoo');
};

},{}],75:[function(_dereq_,module,exports){
// Thanks: http://www.2ality.com/2014/01/efficient-string-repeat.html

'use strict';

var value     = _dereq_('../../../object/valid-value')
  , toInteger = _dereq_('../../../number/to-integer');

module.exports = function (count) {
	var str = String(value(this)), result;
	count = toInteger(count);
	if (count < 0) throw new RangeError("Count must be >= 0");
	if (!isFinite(count)) throw new RangeError("Count must be < ∞");
	result = '';
	if (!count) return result;
	while (true) {
		if (count & 1) result += str;
		count >>>= 1;
		if (count <= 0) break;
		str += str;
	}
	return result;
};

},{"../../../number/to-integer":53,"../../../object/valid-value":68}],76:[function(_dereq_,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call('');

module.exports = function (x) {
	return (typeof x === 'string') || (x && (typeof x === 'object') &&
		((x instanceof String) || (toString.call(x) === id))) || false;
};

},{}],77:[function(_dereq_,module,exports){
(function (process){
'use strict';

var callable, byObserver;

callable = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

byObserver = function (Observer) {
	var node = document.createTextNode(''), queue, i = 0;
	new Observer(function () {
		var data;
		if (!queue) return;
		data = queue;
		queue = null;
		if (typeof data === 'function') {
			data();
			return;
		}
		data.forEach(function (fn) { fn(); });
	}).observe(node, { characterData: true });
	return function (fn) {
		callable(fn);
		if (queue) {
			if (typeof queue === 'function') queue = [queue, fn];
			else queue.push(fn);
			return;
		}
		queue = fn;
		node.data = (i = ++i % 2);
	};
};

module.exports = (function () {
	// Node.js
	if ((typeof process !== 'undefined') && process &&
			(typeof process.nextTick === 'function')) {
		return process.nextTick;
	}

	// MutationObserver=
	if ((typeof document === 'object') && document) {
		if (typeof MutationObserver === 'function') {
			return byObserver(MutationObserver);
		}
		if (typeof WebKitMutationObserver === 'function') {
			return byObserver(WebKitMutationObserver);
		}
	}

	// W3C Draft
	// http://dvcs.w3.org/hg/webperf/raw-file/tip/specs/setImmediate/Overview.html
	if (typeof setImmediate === 'function') {
		return function (cb) { setImmediate(callable(cb)); };
	}

	// Wide available standard
	if (typeof setTimeout === 'function') {
		return function (cb) { setTimeout(callable(cb), 0); };
	}

	return null;
}());

}).call(this,_dereq_('_process'))
},{"_process":1}],78:[function(_dereq_,module,exports){
'use strict';

var partial  = _dereq_('es5-ext/function/#/partial')
  , forEach  = _dereq_('es5-ext/object/for-each')
  , pad      = _dereq_('es5-ext/string/#/pad')
  , deferred = _dereq_('./deferred')

  , resolved, rStats, unresolved, uStats, profile;

exports.profile = function () {
	resolved = 0;
	rStats = {};
	unresolved = 0;
	uStats = {};
	deferred._profile = profile;
};

profile = function (isResolved) {
	var stack, data;

	if (isResolved) {
		++resolved;
		data = rStats;
	} else {
		++unresolved;
		data = uStats;
	}

	stack = (new Error()).stack;
	if (!stack.split('\n').slice(3).some(function (line) {
			if ((line.search(/[\/\\]deferred[\/\\]/) === -1) &&
					(line.search(/[\/\\]es5-ext[\/\\]/) === -1) &&
					(line.indexOf(' (native)') === -1)) {
				line = line.replace(/\n/g, "\\n").trim();
				if (!data[line]) {
					data[line] = { count: 0 };
				}
				++data[line].count;
				return true;
			}
		})) {
		if (!data.unknown) {
			data.unknown = { count: 0, stack: stack };
		}
		++data.unknown.count;
	}
};

exports.profileEnd = function () {
	var total, lpad, log = '';

	if (!deferred._profile) {
		throw new Error("Deferred profiler was not initialized");
	}
	delete deferred._profile;

	log += "------------------------------------------------------------\n";
	log += "Deferred usage statistics:\n\n";

	total = String(resolved + unresolved);
	lpad = partial.call(pad, " ", total.length);
	log += total + " Total promises initialized\n";
	log += lpad.call(unresolved) + " Initialized as Unresolved\n";
	log += lpad.call(resolved) + " Initialized as Resolved\n";

	if (unresolved) {
		log += "\nUnresolved promises were initialized at:\n";
		forEach(uStats, function (data, name) {
			log += lpad.call(data.count) + " " + name + "\n";
		}, null, function (a, b) {
			return this[b].count - this[a].count;
		});
	}

	if (resolved) {
		log += "\nResolved promises were initialized at:\n";
		forEach(rStats, function (data, name) {
			log += lpad.call(data.count) + " " + name + "\n";
		}, null, function (a, b) {
			return this[b].count - this[a].count;
		});
	}
	log += "------------------------------------------------------------\n";

	return {
		log: log,
		resolved: { count: resolved, stats: rStats },
		unresolved: { count: unresolved, stats: uStats }
	};
};

},{"./deferred":4,"es5-ext/function/#/partial":39,"es5-ext/object/for-each":59,"es5-ext/string/#/pad":72}],79:[function(_dereq_,module,exports){
'use strict';

var isPromise = _dereq_('./is-promise');

module.exports = function (x) {
	if (!isPromise(x)) {
		throw new TypeError(x + " is not a promise object");
	}
	return x;
};

},{"./is-promise":28}],80:[function(_dereq_,module,exports){
'use strict';

var d        = _dereq_('d')
  , callable = _dereq_('es5-ext/object/valid-callable')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit, methods, descriptors, base;

on = function (type, listener) {
	var data;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) {
		data = descriptor.value = create(null);
		defineProperty(this, '__ee__', descriptor);
		descriptor.value = null;
	} else {
		data = this.__ee__;
	}
	if (!data[type]) data[type] = listener;
	else if (typeof data[type] === 'object') data[type].push(listener);
	else data[type] = [data[type], listener];

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once.__eeOnceListener__ = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) return this;
	data = this.__ee__;
	if (!data[type]) return this;
	listeners = data[type];

	if (typeof listeners === 'object') {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) ||
					(candidate.__eeOnceListener__ === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) ||
				(listeners.__eeOnceListener__ === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var i, l, listener, listeners, args;

	if (!hasOwnProperty.call(this, '__ee__')) return;
	listeners = this.__ee__[type];
	if (!listeners) return;

	if (typeof listeners === 'object') {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

},{"d":81,"es5-ext/object/valid-callable":93}],81:[function(_dereq_,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"dup":30,"es5-ext/object/assign":83,"es5-ext/object/is-callable":87,"es5-ext/object/normalize-options":92,"es5-ext/string/#/contains":96}],82:[function(_dereq_,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"./is-callable":87,"./valid-callable":93,"./valid-value":95,"dup":55}],83:[function(_dereq_,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"./is-implemented":84,"./shim":85,"dup":56}],84:[function(_dereq_,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"dup":57}],85:[function(_dereq_,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"../keys":89,"../valid-value":95,"dup":58}],86:[function(_dereq_,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"./_iterate":82,"dup":59}],87:[function(_dereq_,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"dup":60}],88:[function(_dereq_,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"dup":61}],89:[function(_dereq_,module,exports){
arguments[4][62][0].apply(exports,arguments)
},{"./is-implemented":90,"./shim":91,"dup":62}],90:[function(_dereq_,module,exports){
arguments[4][63][0].apply(exports,arguments)
},{"dup":63}],91:[function(_dereq_,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64}],92:[function(_dereq_,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"dup":66}],93:[function(_dereq_,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"dup":67}],94:[function(_dereq_,module,exports){
'use strict';

var isObject = _dereq_('./is-object');

module.exports = function (value) {
	if (!isObject(value)) throw new TypeError(value + " is not an Object");
	return value;
};

},{"./is-object":88}],95:[function(_dereq_,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"dup":68}],96:[function(_dereq_,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"./is-implemented":97,"./shim":98,"dup":69}],97:[function(_dereq_,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"dup":70}],98:[function(_dereq_,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"dup":71}],99:[function(_dereq_,module,exports){
'use strict';

var forEach    = _dereq_('es5-ext/object/for-each')
  , validValue = _dereq_('es5-ext/object/valid-object')

  , push = Array.prototype.apply, defineProperty = Object.defineProperty
  , create = Object.create, hasOwnProperty = Object.prototype.hasOwnProperty
  , d = { configurable: true, enumerable: false, writable: true };

module.exports = function (e1, e2) {
	var data;
	(validValue(e1) && validValue(e2));
	if (!hasOwnProperty.call(e1, '__ee__')) {
		if (!hasOwnProperty.call(e2, '__ee__')) {
			d.value = create(null);
			defineProperty(e1, '__ee__', d);
			defineProperty(e2, '__ee__', d);
			d.value = null;
			return;
		}
		d.value = e2.__ee__;
		defineProperty(e1, '__ee__', d);
		d.value = null;
		return;
	}
	data = d.value = e1.__ee__;
	if (!hasOwnProperty.call(e2, '__ee__')) {
		defineProperty(e2, '__ee__', d);
		d.value = null;
		return;
	}
	if (data === e2.__ee__) return;
	forEach(e2.__ee__, function (listener, name) {
		if (!data[name]) {
			data[name] = listener;
			return;
		}
		if (typeof data[name] === 'object') {
			if (typeof listener === 'object') push.apply(data[name], listener);
			else data[name].push(listener);
		} else if (typeof listener === 'object') {
			listener.unshift(data[name]);
			data[name] = listener;
		} else {
			data[name] = [data[name], listener];
		}
	});
	defineProperty(e2, '__ee__', d);
	d.value = null;
};

},{"es5-ext/object/for-each":86,"es5-ext/object/valid-object":94}],100:[function(_dereq_,module,exports){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = _dereq_('./lib/Dispatcher')

},{"./lib/Dispatcher":101}],101:[function(_dereq_,module,exports){
/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 */

"use strict";

var invariant = _dereq_('./invariant');

var _lastID = 1;
var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *    CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *
 *         case 'city-update':
 *           FlightPriceStore.price =
 *             FlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

  function Dispatcher() {
    this.$Dispatcher_callbacks = {};
    this.$Dispatcher_isPending = {};
    this.$Dispatcher_isHandled = {};
    this.$Dispatcher_isDispatching = false;
    this.$Dispatcher_pendingPayload = null;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   *
   * @param {function} callback
   * @return {string}
   */
  Dispatcher.prototype.register=function(callback) {
    var id = _prefix + _lastID++;
    this.$Dispatcher_callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   *
   * @param {string} id
   */
  Dispatcher.prototype.unregister=function(id) {
    invariant(
      this.$Dispatcher_callbacks[id],
      'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
      id
    );
    delete this.$Dispatcher_callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   *
   * @param {array<string>} ids
   */
  Dispatcher.prototype.waitFor=function(ids) {
    invariant(
      this.$Dispatcher_isDispatching,
      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
    );
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this.$Dispatcher_isPending[id]) {
        invariant(
          this.$Dispatcher_isHandled[id],
          'Dispatcher.waitFor(...): Circular dependency detected while ' +
          'waiting for `%s`.',
          id
        );
        continue;
      }
      invariant(
        this.$Dispatcher_callbacks[id],
        'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
        id
      );
      this.$Dispatcher_invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   *
   * @param {object} payload
   */
  Dispatcher.prototype.dispatch=function(payload) {
    invariant(
      !this.$Dispatcher_isDispatching,
      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
    );
    this.$Dispatcher_startDispatching(payload);
    try {
      for (var id in this.$Dispatcher_callbacks) {
        if (this.$Dispatcher_isPending[id]) {
          continue;
        }
        this.$Dispatcher_invokeCallback(id);
      }
    } finally {
      this.$Dispatcher_stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   *
   * @return {boolean}
   */
  Dispatcher.prototype.isDispatching=function() {
    return this.$Dispatcher_isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @param {string} id
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_invokeCallback=function(id) {
    this.$Dispatcher_isPending[id] = true;
    this.$Dispatcher_callbacks[id](this.$Dispatcher_pendingPayload);
    this.$Dispatcher_isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @param {object} payload
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_startDispatching=function(payload) {
    for (var id in this.$Dispatcher_callbacks) {
      this.$Dispatcher_isPending[id] = false;
      this.$Dispatcher_isHandled[id] = false;
    }
    this.$Dispatcher_pendingPayload = payload;
    this.$Dispatcher_isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_stopDispatching=function() {
    this.$Dispatcher_pendingPayload = null;
    this.$Dispatcher_isDispatching = false;
  };


module.exports = Dispatcher;

},{"./invariant":102}],102:[function(_dereq_,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (false) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}],103:[function(_dereq_,module,exports){
'use strict';

function ToObject(val) {
	if (val == null) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var keys;
	var to = ToObject(target);

	for (var s = 1; s < arguments.length; s++) {
		from = arguments[s];
		keys = Object.keys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			to[keys[i]] = from[keys[i]];
		}
	}

	return to;
};

},{}],104:[function(_dereq_,module,exports){
'use strict';

var assign  = _dereq_('object-assign');
var compare = _dereq_('../utils/compare');

var createEventFactory = _dereq_('../flux/event').createEventFactory;
var registerStore      = _dereq_('../flux/stores').registerStore;

var ACTION_MONITOR_EVENT_NAME = 'action-monitor.status-change';
var ACTION_MONITOR_STORE_NAME = '$ActionMonitorStore';

var EventFactory = createEventFactory({ CHANGE: ACTION_MONITOR_EVENT_NAME }, {
  actionStateChange : function(payload) {
    return this.createEvent(this.EVENTS.CHANGE, payload);
  }
});

/**
 * An object that represents an Action status
 * @param {number} action_id - action id
 * @param {string} state     - action state ('tracking', 'resolved', 'rejected')
 * @param {*}      [data]    - action data
 * @constructor
 */
var ActionStatus = function(action_id, state, data) {
  //
  // Accessors
  //

  /**
   * Action Id
   * @returns {number} action id
   */
  this.actionId = function() {
    return action_id;
  };

  /**
   * Extra data (or error if the action was rejected) associated with this action
   * @returns {*} any data
   */
  this.data = function() {
    return data;
  };

  /**
   * Current state of the action
   * @returns {string} current state (tracking/resolved/rejected)
   */
  this.state = function() {
    return state;
  };

  /**
   * Whether the action is still in progress
   * @returns {boolean} true if action is in progress
   */
  this.inProgress = function() {
    return state == 'tracking';
  };

  /**
   * Whether the action has completed
   * @returns {boolean} true if action has completed
   */
  this.isResolved = function() {
    return state == 'resolved';
  };

  /**
   * Whether the action has failed
   * @returns {boolean} true if action has failed
   */
  this.isRejected = function() {
    return state == 'rejected';
  };
};

/**
 * Flux Store for keeping track of Action statuses
 * @type {{}}
 */
var ActionMonitorStore = {
  $initialize : function() {
    this.statuses = {};
  },

  $processEvent : function(event) {
    switch(event.name()) {
      case ACTION_MONITOR_EVENT_NAME:
        this._processStatusChange(event.payload());
        break;
      default:
        break;
    }
  },

  //
  // Accessors
  //

  /**
   * Get the status of an Action
   * @param {number} action_id - action id
   * @returns {ActionStatus}
   */
  getActionStatus : function(action_id) {
    return this.statuses[action_id];
  },

  //
  // Private
  //

  _processStatusChange : function(payload) {
    var action_id = payload.action_id;
    var status    = null;

    switch (payload.state) {
      case 'track':
        status = new ActionStatus(action_id, 'tracking');
        break;
      case 'resolve':
        status = new ActionStatus(action_id, 'resolved', payload.data);
        break;
      case 'reject':
        status = new ActionStatus(action_id, 'rejected', payload.data);
        break;
    }

    if (status) {
      this.statuses[action_id] = status;
      this.emitChange();
    }
  }
};

/**
 * Action Status change callback
 * @callback ActionMonitorCallback
 * @param {ActionStatus} action_status - current action status
 */


/**
 * React Mixin for listening to Action status change
 * @type {*}
 * @example
 * React.createClass({
 *   mixins: [dyna.DynaFluxMixin(), dyna.addons.ActionMonitorMixin],
 *
 *   // ...
 *
 *   _buzzerClick : function() {
 *     var action = ActionFactory.buzzClick();
 *     this.monitorAction(action, this._actionUpdate);
 *     action.dispatch(this.flux().action_dispatcher);
 *   },
 *
 *   _actionUpdate : function(action_status) {
 *     this.setState({ action_state : action_status.inProgress() ? 'processing' : 'clicked' });
 *   }
 * });
 */
var ActionMonitorMixin = {
  componentWillMount : function() {
    this.__action_listeners = [];
    this.flux().store(ACTION_MONITOR_STORE_NAME).addChangeListener(this.__processActionChange);
  },

  componentWillUnmount : function() {
    this.flux().store(ACTION_MONITOR_STORE_NAME).removeChangeListener(this.__processActionChange);
  },

  /**
   * Listen for change in Action state.
   * The provided callback will be called upon changes of Action states.
   * The listener will automatically be removed after the Action is resolved/rejected.
   * @param {Action}                action   - action to listen for
   * @param {ActionMonitorCallback} callback - listener callback
   */
  monitorAction : function(action, callback) {
    this.__action_listeners.push({ action_id: action.id(), callback: callback });
  },

  __processActionChange : function() {
    var self = this;

    var completed = [];
    var callbacks = [];

    this.__action_listeners.forEach(function(listener, index) {
      var action_id = listener.action_id;
      var status    = self.flux().store(ACTION_MONITOR_STORE_NAME).getActionStatus(action_id);

      if (status && status.state != listener.state) {
        listener.state = status.state;
        if (listener.callback) callbacks.push(listener.callback.bind(self, status));
        if (status.isResolved() || status.isRejected()) completed.unshift(index);
      }
    });

    // removes listeners for completed actions
    completed.forEach(function(index) {
      self.__action_listeners.splice(index, 1);
    });

    // executes the listener callbacks
    callbacks.forEach(function(cb) { cb(); });
  }
};

/**
 * Object for updating the state of Action
 * @param {EventDispatcher} event_dispatcher - event dispatcher instance
 * @constructor
 * @example
 * // In Flux coordinator
 * var ActionMonitor = new dyna.addons.ActionMonitor(this.flux.event_dispatcher);
 *
 * ActionMonitor.start(action);
 * setTimeout(function() {
 *   EventFactory.someEvent().dispatch(self.flux.event_dispatcher);
 *   ActionMonitor.resolve(action);
 * }, 3000);
 */
var ActionMonitor = function(event_dispatcher) {
  /**
   * Start monitoring an Action
   * @param {Action} action - action to monitor
   */
  this.start = function(action) {
    EventFactory.actionStateChange({
      action_id: action.id(),
      state    : 'track'
    }).dispatch(event_dispatcher);
  };

  /**
   * Resolve a monitored Action
   * @param {Action} action - action to resolve
   * @param {*}      data   - any data to be pass along with the state change
   */
  this.resolve = function(action, data) {
    EventFactory.actionStateChange({
      action_id: action.id(),
      state    : 'resolve',
      data     : data
    }).dispatch(event_dispatcher);
  };

  /**
   * Reject a monitored Action
   * @param {Action} action - action to reject
   * @param {*}      error  - any error/data to be pass along with the state change
   */
  this.reject = function(action, error) {
    EventFactory.actionStateChange({
      action_id: action.id(),
      state    : 'reject',
      data     : error
    }).dispatch(event_dispatcher);
  };
};

//
// Exports
//

// register the ActionMonitorStore as a built-in store
registerStore(ACTION_MONITOR_STORE_NAME, ActionMonitorStore);

module.exports = {
  ActionMonitor     : ActionMonitor,
  ActionMonitorMixin: ActionMonitorMixin
};
},{"../flux/event":118,"../flux/stores":122,"../utils/compare":127,"object-assign":103}],105:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_('object-assign');

module.exports = assign(
  {},
  _dereq_('./action_monitor')
);
},{"./action_monitor":104,"object-assign":103}],106:[function(_dereq_,module,exports){
'use strict';

/**
 * Dyna Core
 * @exports core/core
 */

var assign = _dereq_('object-assign');

var Injector        = _dereq_('./injector');
var ProviderManager = _dereq_('./provider_manager');
var ProviderRecipes = _dereq_('./provider_recipes');
var ExternalLib     = _dereq_('./external_lib');
var Lifecycle       = _dereq_('./lifecycle');

var core = {
  $provider: ProviderManager,
  $injector: Injector
};

assign(core, ProviderRecipes);
assign(core, ExternalLib);
assign(core, Lifecycle);

module.exports = core;

},{"./external_lib":107,"./injector":108,"./lifecycle":109,"./provider_manager":110,"./provider_recipes":111,"object-assign":103}],107:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_('object-assign');

/**
 * Set the ReactJS library to be used within this framework. If not specified, it will look
 * for <tt>React</tt> in the global scope
 * @param {Object} React - ReactJS library object
 */
function useReact(React) {
  this.React = React;
}

/**
 * Store the jQuery to dyna.$ property. The dyna framework itself does not use jQuery. This method and
 * the dyna.$ property are provided for convenience so that individual app can more easily use a consistent
 * jQuery instance rather than relying on window.$.
 *
 * @param {Object} jQuery - jQuery object
 */
function setGlobalJQuery(jQuery) {
  this.$ = jQuery;
}

var Libs = {
  React    : window && window.React,
  useReact : useReact,
  setGlobalJQuery: setGlobalJQuery
};

module.exports = Libs;
},{"object-assign":103}],108:[function(_dereq_,module,exports){
'use strict';

/**
 * Dependency Injector
 *
 * @module core/injector
 * @requires module:utils/compare
 * @requires module:utils/array_utils
 * @requires module:core/provider_manager
 */

var compare    = _dereq_('../utils/compare');
var arrayUtils = _dereq_('../utils/array_utils');

var manager    = _dereq_('./provider_manager');

/** Cache of values returned by providers */
var _provider_value_cache = {};

/**
 * Invoke a function with dependencies
 * @param {Object}          thisArg - object to be bind to this when the function is invoked
 * @param {Array|function}  fn      - a function in the <tt>Dependency Injection</tt> format
 * @returns {*} return value of the execution
 * @throws {Error} throw an error if fn is not a function nor a <tt>Dependency Injection</tt> array
 *
 * @example <caption>Invoke without dependency</caption>
 * injector.invoke(this, function() { return true; });     //=> true
 *
 * @example <caption>Invoke with function dependency array</caption>
 * injector.invoke(this, ["dep_1", "dep_2", function(dep_1, dep_2) { return dep_1; }]);    //=> dep_1
 */
function invoke(thisArg, fn) {
  if (compare.isArray(fn)) {
    var last = fn.length - 1;
    if (compare.isFunction(fn[last])) {
      var deps = fn.slice(0, last);
      return fn[last].apply(thisArg, _providerValues(deps));
    } else {
      throw new Error("Last element of the dependency injection array must be a function");
    }
  } else if (compare.isFunction(fn)) {
    return fn.apply(thisArg);
  }

  throw new Error("fn is not a function nor a dependency injection array");
}

/**
 * Invoke a function with dependent providers
 * This is similar to the {@link invoke()} with the exception that the dependent provider instances are
 * loaded instead of the actual values returned by provider instance
 * @param {Object}          thisArg - object to be bind to this when the function is invoked
 * @param {Array|function}  fn      - a function in the <tt>Dependency Injection</tt> format
 * @returns {*} return value of the execution
 * @throws {Error} throw an error if fn is not a function nor a <tt>Dependency Injection</tt> array
 *
 * @example <caption>Invoke without dependency</caption>
 * injector.invokeWithProviders(this, function() { return true; });     //=> true
 *
 * @example <caption>Invoke with function dependency array</caption>
 * injector.invokeWithProviders(this, ["dep_1", "dep_2", function(dep_1_provider, dep_2_provider) { return dep_1_provider; }]);    //=> dep_1_provider
 */
function invokeWithProviders(thisArg, fn) {
  if (compare.isArray(fn)) {
    var last = fn.length - 1;
    if (compare.isFunction(fn[last])) {
      var deps = fn.slice(0, last);
      return fn[last].apply(thisArg, _providers(deps));
    } else {
      throw new Error("Last element of the dependency injection array must be a function");
    }
  } else if (compare.isFunction(fn)) {
    return fn.apply(thisArg);
  }

  throw new Error("fn is not a function nor a dependency injection array");
}

/**
 * Get the value returned by a provider
 * @param {string} provider_name - name of provider
 * @returns {*} provider value
 */
function inject(name) {
  return _loadProviderValue(name);
}

//
// Private Methods
//

/**
 * Get the value returned by a provider
 * @param {string} provider_name - name of provider
 * @returns {*} value returned by the provider
 * @private
 */
function _loadProviderValue(provider_name) {
  // check if the value has been load before
  var cache = _provider_value_cache[provider_name];
  if (cache) return cache;

  var provider = manager.provider(provider_name);
  if (provider.$get) {
    var value = invoke(this, provider.$get);        // get the value from provider's $get method
    _provider_value_cache[provider_name] = value;   // cache the value
    return value;
  } else {
    throw new Error("Provider '" + provider_name + "' does not have a $get method");
  }
}

/**
 * Get the values returned by providers
 * @param {Array|string} providers - provider names
 * @returns {Array} an array of provider values in the same order as specified in the param
 * @private
 */
function _providerValues(providers) {
  var names  = arrayUtils.arrayWrap(providers);
  var result = [];

  for (var i = 0; i < names.length; i++) {
    result.push(_loadProviderValue(names[i]));
  }
  return result;
}

/**
 * Get the provider instances
 * @param {string[]|string} providers - provider names
 * @returns {Array} an array of provider instances (not values) in the same order as specified in the param
 * @private
 */
function _providers(providers) {
  var names  = arrayUtils.arrayWrap(providers);
  var result = [];

  for (var i = 0; i < names.length; i++) {
    result.push(manager.provider(names[i]));
  }
  return result;
}

var Injector = {
  inject: inject,
  invoke: invoke,
  invokeWithProviders: invokeWithProviders
};

// Define the Injector itself as '$injector' provider
manager.define('$injector', function() {
  this.$get = function() {
    return Injector;
  };
});

module.exports = Injector;
},{"../utils/array_utils":126,"../utils/compare":127,"./provider_manager":110}],109:[function(_dereq_,module,exports){
'use strict';

var assign     = _dereq_('object-assign');
var arrayUtils = _dereq_('../utils/array_utils');
var domReady   = _dereq_('../utils/dom_ready');

var injector = _dereq_('./injector');
var ujs      = _dereq_('./ujs');

/**
 * Config phase of the framework lifecycle
 * Configure the various services and coordinators here
 * @param {string|string[]} deps - names of providers to be configured
 * @param {function}        fn   - configuration callback function
 *
 * @example
 * dyna.config(["service_1"], function(service_1_provider) {
 *   service_1_provider.apiUrl = "http://somewhere.com/api";
 * });
 */
function config(deps, fn) {
  var dep_fn = arrayUtils.arrayWrap(deps);
  dep_fn.push(fn);
  injector.invokeWithProviders(this, dep_fn);
}

/**
 * Start the app with a particular Flux.
 * As part of the process, dyna components will be mounted (either through ujs or coordinator's mount spec) to the DOM
 * elements once the DOM is ready
 * @param {Flux}             flux   - Flux instance
 * @param {Document|Element} [root] - component root under which dyna components will be mounted.
 *
 * @example <caption>Start a single Flux</caption>
 * var flux = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 * dyna.start(flux);
 *
 * @example <caption>Start multiple Flux on different set of nodes</caption>
 * var flux_one = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 * var flux_two = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 *
 * dyna.start(flux_one, document.getElementById('#buzzer-one'));
 * dyna.start(flux_two, document.getElementById('#buzzer-two'));
 */
function start(flux, root) {
  var self = this;
  flux.start().done(function() {
    domReady(function() {
      self.mountComponents(flux);
      self.mountDynaComponents(flux, root);
    });
  });
}

/**
 * Stop the app with a particular Flux
 * @param {Flux}             flux   - Flux instance
 * @param {Document|Element} [root] - component root under which dyna components were mounted.
 *
 * @example <caption>Stop a running Flux</caption>
 * var flux = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 * dyna.start(flux);
 * dyna.stop(flux);
 */
function stop(flux, root) {
  this.unmountDynaComponents(root);
  this.unmountComponents(flux);
  flux.stop();
}

//
// Exports
//

var Lifecycle = {
  config: config,
  start : start,
  stop  : stop
};

assign(Lifecycle, ujs);

module.exports = Lifecycle;
},{"../utils/array_utils":126,"../utils/dom_ready":129,"./injector":108,"./ujs":112,"object-assign":103}],110:[function(_dereq_,module,exports){
'use strict';

var compare = _dereq_('../utils/compare');

/** References to all registered providers' definition */
var _provider_fns       = {};
/** Cache of provider instances */
var _provider_instances = {};

/**
 * Provider Manager
 * @constructor
 * @module core/provider_manager
 * @requires module:utils/compare
 */

/**
 * Define a new provider
 *
 * The provider function must have a $get() method that returns a service/value constructor in the
 * <tt>Dependency Injection</tt> format.
 * @see module:core/injector
 *
 * @param {string}   name - name of the provider
 * @param {function} fn   - a provider function
 *
 * @throws {Error} throw an error if name is not valid, name has already been registered with another provider or impl is not a function
 * @example <caption>Define a provider named "module_1" that provides an instance of Service</caption>
 * manager.define("module_1", function() {
 *   this.$get = ["dep_1", function(dep_1) {
 *     // Function implementation
 *     return new Service(dep_1);
 *   }];
 * });
 */
function define(name, fn) {
  if (!compare.isString(name) || name.trim().length < 3) {
    throw new Error("Invalid provider name '" + name + "'. Name must be at least 3 characters long.");
  } else if (_provider_fns[name]) {
    throw new Error("Conflicting provider name. Provider '" + name + "' has already been taken.");
  } else if (!compare.isFunction(fn)) {
    throw new Error("fn must be a function");
  } else {
    _provider_fns[name] = fn;
  }
}

/**
 * Get the provider instance
 * @param {string} provider_name - name of the provider
 * @throws {Error} throw an error if provider is not found
 * @returns {Object} the provider instance
 */
function provider(provider_name) {
  // find provider instance from cache
  var cache = _provider_instances[provider_name];
  if (cache) return cache;

  _provider_instances[provider_name] = _instantiateProvider(provider_name);
  return _provider_instances[provider_name];
}

//
// Private Methods
//

/**
 * Instantiate a provider
 * @param {string} name - name of the provider
 * @throws {Error} throw an error if provider is not found
 * @returns {Object} the provider instance
 * @private
 */
function _instantiateProvider(name) {
  var provider = _provider_fns[name];

  if (provider) {
    return new provider();
  } else {
    throw new Error("Cannot find provider with name '" + name + "'");
  }
}

var ProviderManager = {
  define  : define,
  provider: provider
};

// Define the ProviderManager itself as '$providers' provider
ProviderManager.define('$providers', function() {
  this.$get = function() {
    return ProviderManager;
  };
});

module.exports = ProviderManager;

},{"../utils/compare":127}],111:[function(_dereq_,module,exports){
'use strict';

/**
 * Provider Recipes
 *
 * @module core/provider_recipes
 * @requires module:core/provider_manager
 */

var argsCreate = _dereq_('../utils/create_with_args');
var compare    = _dereq_('../utils/compare');
var manager    = _dereq_('./provider_manager');

/**
 * Define a +Value+ provider
 * @param {string} name - provider name
 * @param {*}      val  - value
 * @example <caption>Define a value provider named "value_1" that provides the string "string_1"</caption>
 * value('value_1', 'string_1');
 */
function value(name, val) {
  manager.define(name, function() {
    this.$get = function() {
      return val;
    };
  });
}

/**
 * Define a +Factory+ provider
 * @param {string} name - provider name
 * @param {*}      fn   - service/value constructor in the <tt>Dependency Injection</tt> format
 * @see module:core/injector
 * @example <caption>Define a factory named "factory_1" that provides an instance of Service</caption>
 * factory("factory_1", ["dep_1", function(dep_1) {
 *   // Function implementation
 *   return new Service(dep_1);
 * }]);
 */
function factory(name, fn) {
  manager.define(name, function() {
    this.$get = function() {
      return fn;
    };
  });
}

/**
 * Define a +Service+ provider
 * @param {string}   name         - provider name
 * @param {function} constructor  - a constructor function in the <tt>Dependency Injection</tt> format
 * @see module:core/injector
 * @example <caption>Define a service provider named "service_1" that provides an instance of Service</caption>
 * service('service_1', ['dep_1', Service]);
 */
function service(name, constructor) {
  var fn = null;

  if (compare.isFunction(constructor)) {
    fn = function() {
      return new constructor();
    };
  } else if (compare.isArray(constructor) && constructor.length > 0) {
    var fn = constructor;
    var c  = fn[fn.length - 1];

    if (!compare.isFunction(c)) throw new Error('Last element of the Dependency Injection array must be a Function');

    fn[fn.length - 1] = function() {
      return argsCreate(c, arguments);
    };
  } else {
    throw new Error('Service constructor must either be a constructor function or a Dependency Injection array');
  }

  manager.define(name, function() {
    this.$get = fn;
  });
}

module.exports = {
  value   : value,
  factory : factory,
  service : service
};
},{"../utils/compare":127,"../utils/create_with_args":128,"./provider_manager":110}],112:[function(_dereq_,module,exports){
'use strict';

var assign     = _dereq_('object-assign');
var compare    = _dereq_('../utils/compare');
var arrayUtils = _dereq_('../utils/array_utils');
var components = _dereq_('../flux/components');

/**
 * Un-mounting React components from nodes
 * @callback UnmountFunction
 * @param {HTMLElement} node - a DOM Node
 */
var unmountFn = function(node) {
  this.React.unmountComponentAtNode(node);
};

/**
 * Mount React components to DOM nodes (this is a version of the Mount function with the Flux instance already binded)
 * @callback MountFunction
 * @param {HTMLElement} node      - a DOM Node
 * @param {ReactClass}  component - a React component class
 * @param {Object}      props     - props to be passed to the component
 */

/**
 * Mount React components to DOM nodes
 * @param {Flux}        flux      - flux instance within which this component is mounted
 * @param {HTMLElement} node      - a DOM Node
 * @param {ReactClass}  component - a React component class
 * @param {Object}      props     - props to be passed to the component
 */
var mountFn = function(flux, node, component, props) {
  var React  = this.React;
  var connectedComponent = this.connectComponentToFlux(flux, component);

  React.render(React.createElement(connectedComponent, props), node);
};

/**
 * Allow each coordinator in the Flux to mount their own specific components
 * @param {Flux} flux - instance of Flux
 */
function mountComponents(flux) {
  flux.mountComponents(mountFn.bind(this, flux));
}

/**
 * Allow each coordinator in the Flux to unmount their own specific components
 * @param {Flux} flux - instance of Flux
 */
function unmountComponents(flux) {
  flux.unmountComponents(unmountFn.bind(this));
}

/**
 * Mounts corresponding components to DOM nodes that has "data-dyna-component" attribute set
 * The value of this attribute indicates which registered component to mount
 *
 * @param {Flux}        flux   - instance of Flux
 * @param {HTMLElement} [root] - DOM Node under (and including self) which dyna components will be mounted.
 */
function mountDynaComponents(flux, root) {
  var self  = this;
  var _root = compare.isUndefined(root) ? document : root;
  var elems = _queryAllAndSelfWithAttribute('data-dyna-component', _root);

  elems.forEach(function(node) {
    var component_name = node.getAttribute('data-dyna-component');
    var component = components.getComponent(component_name);

    var props = node.hasAttribute('data-props') ? JSON.parse(node.getAttribute['data-props']) : {};

    mountFn.call(self, flux, node, component, props);
  });
}

/**
 * Unmount all previously mounted components
 *
 * @param {HTMLElement} [root] - DOM Node under (and including self) which dyna components will be mounted.
 */
function unmountDynaComponents(root) {
  var self  = this;
  var _root = compare.isUndefined(root) ? document : root;
  var elems = _queryAllAndSelfWithAttribute('data-dyna-component', _root);

  elems.forEach(function(node) {
    unmountFn.call(self, node);
  });
}

//
// Private Methods
//

function _queryAllAndSelfWithAttribute(attribute, root) {
  var matched = root.querySelectorAll('[' + attribute + ']');
  var arry    = [];
  for (var i = 0; i < matched.length; i++) { arry.push(matched[i]); }

  // check self
  if (compare.isFunction(root.hasAttribute) && root.hasAttribute(attribute)) arry.unshift(root);
  return arry;
}

module.exports = {
  mountComponents       : mountComponents,
  unmountComponents     : unmountComponents,
  mountDynaComponents   : mountDynaComponents,
  unmountDynaComponents : unmountDynaComponents
};
},{"../flux/components":116,"../utils/array_utils":126,"../utils/compare":127,"object-assign":103}],113:[function(_dereq_,module,exports){
'use strict';

var assign  = _dereq_('object-assign');
var compare = _dereq_('../utils/compare');

var action_ids = 1;

/**
 * Action object to be sent through the ActionDispatcher
 * @param {string} name    - name of the event
 * @param {*}      payload - any data to be sent along with this Event
 * @constructor
 */
var Action = function(name, payload) {
  var _id      = action_ids++;
  var _name    = name;
  var _payload = payload;

  this.id = function() {
    return _id;
  };

  /**
   * Return the name of the Action
   * @returns {string} event name
   */
  this.name = function() {
    return _name;
  };

  /**
   * Return the payload of the Action
   * @returns {*} payload data
   */
  this.payload = function() {
    return _payload;
  };

  /**
   * Dispatch this Action through a ActionDispatcher
   * @param {ActionDispatcher} action_dispatcher - dispatcher through which the Action is dispatched
   * @throws {Error} if action_dispatcher is undefined or invalid
   */
  this.dispatch = function(action_dispatcher) {
    if (compare.isUndefined(action_dispatcher)) throw new Error('action_dispatcher is undefined. Please provide a valid ActionDispatcher instance.');
    if (!compare.isFunction(action_dispatcher.emit)) throw new Error('Invalid ActionDispatcher. ActionDispatcher must have a emit() method.');
    action_dispatcher.emit(this.name(), this);
  };
};

/**
 * Create a factory object that can build Action according to the <tt>action_specs</tt>
 * @param {Object.<string, string>}   action_names - action name constants
 * @param {Object.<string, function>} action_specs - action specifications
 * @returns {ActionFactory} the factory object
 *
 * @example
 * var names   = {
 *   CLICKED: 'buzzer-clicked',
 *   SNOOZED: 'buzzer-snoozed'
 * };
 * var action_factory = dyna.createActionFactory(names, {
 *   buzzClick: function() {
 *     return this.createAction(this.ACTIONS.CLICKED, 'clicked');
 *   },
 *   buzzSnooze: function() {
 *     return this.createAction(this.ACTIONS.SNOOZED, 'snoozed');
 *   }
 * });
 *
 * // action_factory.ACTIONS.CLICKED;    => 'buzzer-clicked'
 *
 * // Component
 * var Buzzer = React.createClass({
 *   // ...
 *
 *   _buzzClick : function() {
 *     var click = action_factory.buzzClick();
 *     click.dispatch(this.props.flux.action_dispatcher);
 *   }
 * });
 */
function createActionFactory(action_names, action_specs) {
  /**
   * Factory class for creating Actions
   * @constructor
   */
  var ActionFactory = function() {
    this.ACTIONS = assign({}, action_names);

    /**
     * Create a new Action object
     * @param {string} name    - name of the event
     * @param {*}      payload - any data to be sent along with this Action
     * @returns {Action} - the event object @see {@link Action}
     */
    this.createAction = function(name, payload) {
      return new Action(name, payload);
    };
  };

  ActionFactory.prototype = Object.create(action_specs);
  ActionFactory.prototype.constructor = ActionFactory;

  return new ActionFactory();
}

//
// Exports
//

module.exports = { createActionFactory: createActionFactory };
},{"../utils/compare":127,"object-assign":103}],114:[function(_dereq_,module,exports){
'use strict';

/**
 * Action Dispatcher
 * @module ActionDispatcher
 */

var EventEmitter = _dereq_('event-emitter');

/**
 * Action Dispatcher
 * @alias module:ActionDispatcher
 */
var ActionDispatcher = function() {
  var emitter = EventEmitter();

  /**
   * Add a event listener
   * @param {string}    action_name - action name
   * @param {function}  listener    - listener function
   * @example
   * addListener('user_click', function(payload) {
 *   payload.position
 * });
   */
  this.addListener = function(action_name, listener) {
    emitter.on(action_name, listener);
  };

  /**
   * Remove a event listener
   * @param {string}    action_name - action name
   * @param {function}  listener    - listener function
   * @example
   * var listener;
   * addListener('user_click', listener = function(payload) {
 *   payload.position
 * });
   * removeListener('user_click', listener);
   */
  this.removeListener = function(action_name, listener) {
    emitter.off(action_name, listener);
  };

  /**
   * Emit a event
   * @param {string} action_name - action name
   * @param {{}}     payload     - payload data
   * @example
   * emit('user_click', { position: { x: 100, y: 50 } });
   */
  this.emit = function(action_name, payload) {
    emitter.emit(action_name, payload);
  };
};

module.exports = ActionDispatcher;
},{"event-emitter":80}],115:[function(_dereq_,module,exports){
'use strict';

var compare = _dereq_('../utils/compare');

/**
 * Create a Bridge for use in another coordinator
 * The resulting bridge object must be assigned to the coordinator's $bridge property
 *
 * @param {Object} coordinator - coordinator for which the bridge is created. The coordinator's constructor must
 *                               have a $BridgeInterface property that defines what methods are in the bridge
 * @param {Object} impl        - implementation of methods in the bridge. All method implementations will be automatically
 *                               bind to the coordinator instance when called
 * @returns {Object} the bridge instance for use in other coordinator
 * @throws {Error} if $BridgeInterface is not defined or the implementation is invalid
 *
 * @example
 * var BuzzerWithBridge = function() {
 *   // ...
 *
 *   // This allow this buzzer to be clicked through the Bridge
 *   this.$bridge = dyna.createBridge(this, {
 *     click : function(status) {
 *       _setStatus.call(this, status);
 *     }
 *   });
 *
 *   function _setStatus(status) {
 *     // ...
 *   }
 * };
 *
 * BuzzerWithBridge.$BridgeInterface = ['click'];
 */
function createBridge(coordinator, impl) {
  var bridge = { $_constructor: coordinator.constructor };
  var bridge_interface = coordinator.constructor.$BridgeInterface;
  if (!compare.isArray(bridge_interface)) throw new Error('Coordinator constructor must have a $BridgeInterface string array.');

  bridge_interface.forEach(function(method) {
    if (method == '$_constructor') throw new Error('"$_constructor" is a reserved property. Please use another name for your method.');
    if (!compare.isFunction(impl[method])) throw new Error('Missing implementation for "' + method + '". Bridge implementation must include all methods specified in $BridgeInterface.');

    bridge[method] = impl[method].bind(coordinator);
  });

  return bridge;
}

/**
 * Use a bridge of another coordinator
 * @param {function} coordinator_constructor - Constructor of the coordinator with the bridge
 * @param {Object}   bridge                  - bridge instance. Can be acquired using flux.getBridge()
 * @returns {Object} the bridged interface
 * @throws {Error} if the bridge or the interface is invalid
 *
 * @example
 * var BuzzerUsesBridge = function() {
 *   // (optional) this creates a noop interface
 *   var bridged_buzzer = dyna.useBridge(BuzzerWithBridge);
 *
 *   this.setBridge = function(bridge) {
 *     bridged_buzzer = dyna.useBridge(BuzzerWithBridge, bridge);
 *   };
 *
 *   // ...
 *
 *   function _buzzerClicked(status) {
 *     bridge_buzzer.click('clicked through bridging');
 *   }
 * };
 *
 * // To link the bridge
 * flux_two.config(function(BuzzerUsesBridge) {
 *   BuzzerUsesBridge.setBridge(flux_one.getBridge('BuzzerWithBridge'));
 * });
 */
function useBridge(coordinator_constructor, bridge) {
  if (!compare.isFunction(coordinator_constructor)) throw new Error('Invalid coordinator constructor.');
  if (!compare.isArray(coordinator_constructor.$BridgeInterface)) throw new Error('Coordinator constructor must have a $BridgeInterface string array.');

  var result = {};
  var bridge_interface = coordinator_constructor.$BridgeInterface;
  if (compare.isUndefined(bridge)) {
    var noop = function() { };
    bridge_interface.forEach(function(method) {
      result[method] = noop;
    });
  } else {
    if (compare.isUndefined(bridge.$_constructor)) throw new Error('Invalid bridge. Bridge must have a $_constructor property. Please use createBridge() to create this bridge.');
    else if (bridge.$_constructor !== coordinator_constructor) throw new Error('The coordinator and bridge does not match. The bridge object provided is not a bridge of this coordinator.');

    bridge_interface.forEach(function(method) {
      if (!compare.isFunction(bridge[method])) throw new Error('Missing implementation for "' + method + '". Bridge implementation must include all methods specified in $BridgeInterface.');
      result[method] = bridge[method];
    });
  }

  return result;
}

//
// Exports
//

module.exports = {
  createBridge: createBridge,
  useBridge   : useBridge
};
},{"../utils/compare":127}],116:[function(_dereq_,module,exports){
'use strict';

var compare = _dereq_('../utils/compare');
var assign  = _dereq_('object-assign');

var _components = {};

/**
 * Component definition context callback
 * @callback componentDefCallback
 * @param {{}}      $components - with registerComponent() and getComponent() methods
 * @param {{}}      $stores     - with getStore(), requireStores() and releaseStores() methods
 * @param {*}       $Action     - Action constructor
 * @param {Object}  React       - React JS library
 * @param {Object}  $           - jQuery Library
 */

/**
 * Register a React Component
 * @param {string}     name            - name of the component
 * @param {ReactClass} react_component - react component class
 *
 * @example
 * var React = dyna.React;
 * var SomeComponent = React.createClass({
 *   //...
 * });
 *
 * dyna.registerComponent('SomeComponent', SomeComponent);
 */
function registerComponent(name, react_component) {
  if(_components[name]) {
    throw new Error('Conflicting component name: "' + name+ '". Please use another name.');
  } else if(!compare.isString(name)) {
    throw new Error('Component name must be a string');
  }

  _components[name] = react_component;
}

/**
 * Get the registered React Component
 * @param {string} name - name of the component
 * @returns {ReactClass} the matching react component class
 */
function getComponent(name) {
  var cache = _components[name];

  if (cache) return cache;
  else throw new Error('There is no registered Component with the name "' + name + "'");
}

/**
 * Create a new React Class that is connected to the provided Flux.
 * Child component of this new React Class will all have access to this Flux
 * through the 'flux' context OR by using the dyna.DyanFluxConsumerMixin()
 *
 * @param {Flux}       flux      - flux instance
 * @param {ReactClass} component - React component to be connected
 * @returns {ReactClass} Flux connected class
 *
 * @example
 * var Connected = dyna.connectComponentToFlux(SomeComponent, flux);
 */
function connectComponentToFlux(flux, component) {
  var React      = this.React;

  return React.createClass({
    mixins : [this.DynaFluxProviderMixin()],

    getDefaultProps : function() {
      return {
        flux: flux.componentContext()
      };
    },

    render : function() {
      // filter out the 'flux' prop that was injected by this mixin
      var filtered_props = assign({}, this.props);
      delete filtered_props.flux;

      return React.createElement(component, filtered_props);
    }
  });
}

//
// Exports
//

module.exports = {
  registerComponent   : registerComponent,
  getComponent        : getComponent,
  connectComponentToFlux: connectComponentToFlux
};


},{"../utils/compare":127,"object-assign":103}],117:[function(_dereq_,module,exports){
'use strict';

var argsCreate = _dereq_('../utils/create_with_args');
var arrayUtils = _dereq_('../utils/array_utils');
var compare    = _dereq_('../utils/compare');

var injector = _dereq_('../core/injector');

var _coordinator_defs = {};

/**
 * Register a coordinator
 *
 * Coordinator can have the following methods:
 *   $start - (Required) method that starts the coordinator. This will be called when parent Flux is started.
 *                       This can optionally return a {Promise} object. If so, Flux will wait for this promise to be
 *                       resolved before the Flux will move onto the next phase of the starting process. Other coordinators
 *                       will continue to be started while the promise is waiting to be resolved.
 *   $stop  - (Optional) method that stops the coordinator. This will be called when the parent Flux is stopped.
 *   $mount - (Optional) method that will mount coordinator specific components
 *   $unmount - (Optional) method that will unmount coordinator specific components
 *
 * @param {string}   name - name of the coordinator
 * @param {function} def  - a constructor function in the <tt>Dependency Injection</tt> format
 * @throws {Error} if coordinator with the same name has already been defined
 *
 * @example
 * var Alarm = function(speaker) {
 *   var interval_secs = 0;
 *   var interval = null;
 *
 *   // starting up
 *   this.$start = function() {
 *     interval = setInterval(function() { speaker.buzz(); }, interval_secs * 1000);
 *   };
 *
 *   // stopping
 *   this.$stop  = function() {
 *     clearInterval(interval);
 *   };
 *
 *   // configuration
 *   this.setInterval = function(seconds) {
 *     interval_secs = seconds;
 *   };
 * };
 *
 * dyna.registerCoordinator('Alarm', ['speaker', Alarm]);
 *
 * @example To configure a coordinator
 * dyna.start(["Alarm"], function(Alarm) {
 *   Alarm.setInterval(60);
 * });
 */
function registerCoordinator(name, def) {
  if (!compare.isUndefined(_coordinator_defs[name])) {
    throw new Error('Conflicting coordinator name: "' + name+ '". Please use another name.');
  }

  _coordinator_defs[name] = def;
}

/**
 * Instantiate (without starting) a coordinator
 * @param {string} name - name of coordinator
 * @param {Flux}   flux - Flux instance in which to create the Store
 * @returns {Object} coordinator instance
 * @throws {Error} if coordinator is not registered or has already been initiated before
 * @private
 */
function instantiateCoordinator(name, flux) {
  var def = _coordinator_defs[name];
  if (compare.isUndefined(def)) {
    throw new Error('Coordinator "' + name + '" is not found. Please use registerCoordinator() to define one first.');
  } else {
    var fn = arrayUtils.arrayWrap(def);
    var c = fn[fn.length - 1];
    var deps = fn.slice(0, -1);

    deps.push(function(){
      return argsCreate(c, arguments);
    });

    var instance = injector.invoke(this, deps);
    return _injectFlux(instance, flux);
  }
}

/**
 * Check whether a Coordinator is registered
 * @param {string} name - name of the Coordinator
 * @returns {boolean} true if Coordinator with the provided name is registered; other false.
 */
function hasCoordinator(name) {
  return !compare.isUndefined(_coordinator_defs[name]);
}

//
// Private Methods
//


/**
 * Inject the Flux instance to the <tt>flux</tt> property of the Coordinator
 * @param {Object} instance - Coordinator instance
 * @param {Flux}   flux     - Flux instance
 * @returns {Object} the coordinator instance
 * @private
 */
var _injectFlux = function(instance, flux) {
  if (instance.hasOwnProperty('flux')) throw new Error('"flux" is a reserved property in coordinator. Please use another name for your property.');

  var event_dispatcher  = flux.eventDispatcher();
  var action_dispatcher = flux.actionDispatcher();

  instance.flux = {
    store: flux.store,
    event_dispatcher : event_dispatcher,
    action_dispatcher: action_dispatcher
  };

  return instance;
};

//
// Exports
//

module.exports = {
  hasCoordinator        : hasCoordinator,
  registerCoordinator   : registerCoordinator,
  instantiateCoordinator: instantiateCoordinator
};
},{"../core/injector":108,"../utils/array_utils":126,"../utils/compare":127,"../utils/create_with_args":128}],118:[function(_dereq_,module,exports){
'use strict';

var assign  = _dereq_('object-assign');
var compare = _dereq_('../utils/compare');

/**
 * Event object to be sent through the EventDispatcher
 * @param {string} name    - name of the event
 * @param {*}      payload - any data to be sent along with this Event
 * @constructor
 */
var Event = function(name, payload) {
  var _name    = name || '*';
  var _payload = payload;

  /**
   * Return the name of the Event
   * @returns {string} event name
   */
  this.name = function() {
    return _name;
  };

  /**
   * Return the payload of the Event
   * @returns {*} payload data
   */
  this.payload = function() {
    return _payload;
  };

  /**
   * Dispatch this Event through a EventDispatcher
   * @param {EventDispatcher} event_dispatcher - dispatcher through which the Event is dispatched
   * @throws {Error} if event_dispatcher is undefined or invalid
   */
  this.dispatch = function(event_dispatcher) {
    if (compare.isUndefined(event_dispatcher)) throw new Error('event_dispatcher is undefined. Please provide a valid EventDispatcher instance.');
    if (!compare.isFunction(event_dispatcher.dispatch)) throw new Error('Invalid EventDispatcher. EventDispatcher must have a dispatch() method.');
    event_dispatcher.dispatch(this);
  };
};

/**
 * Create a factory object that can build Event according to the <tt>event_specs</tt>
 * @param {Object.<string, string>}   event_names - event name constants
 * @param {Object.<string, function>} event_specs - event specifications
 * @returns {EventFactory} the factory object
 *
 * @example
 * var names  = {
 *   STATUS_CHANGE: 'buzzer.status-change',
 *   SNOOZED      : 'buzzer.snoozed'
 * };
 * var event_factory = dyna.createEventFactory(names, {
 *   statusChange : function(status) {
 *     return this.createEvent(this.EVENTS.STATUS_CHANGE, status);
 *   },
 *   snoozed : function() {
 *     return this.createEvent(this.EVENTS.SNOOZED);
 *   }
 * });
 *
 * // event_factory.EVENTS.STATUS_CHANGE;   => 'buzzer.status-change'
 *
 * // Coordinator
 * var Buzzer = function() {
 *   // ...
 *
 *   function _buzzStatusChange(status) {
 *     event_factory.statusChange(status).dispatch(this.flux.event_dispatcher);
 *   }
 * }
 */
function createEventFactory(event_names, event_specs) {
  /**
   * Factory class for creating Events.
   * @constructor
   */
  var EventFactory = function() {
    this.EVENTS = assign({}, event_names);

    /**
     * Create a new Event object
     * @param {string} name    - name of the event
     * @param {*}      payload - any data to be sent along with this Event
     * @returns {Event} - the event object @see {@link Event}
     */
    this.createEvent = function(name, payload) {
      return new Event(name, payload);
    };
  };

  EventFactory.prototype = Object.create(event_specs);
  EventFactory.prototype.constructor = EventFactory;

  return new EventFactory();
}

//
// Exports
//

module.exports = { createEventFactory: createEventFactory };
},{"../utils/compare":127,"object-assign":103}],119:[function(_dereq_,module,exports){
'use strict';

/**
 * Event Dispatcher
 * @module EventDispatcher
 */

var Flux = _dereq_('flux');

module.exports = Flux.Dispatcher;
},{"flux":100}],120:[function(_dereq_,module,exports){
'use strict';

/**
 * Flux architecture related components
 * @exports flux/flux
 */

var arrayUtils = _dereq_('../utils/array_utils');
var assign     = _dereq_('object-assign');
var compare    = _dereq_('../utils/compare');
var deferred   = _dereq_('deferred');

var Stores       = _dereq_('./stores');
var Components   = _dereq_('./components');
var Coordinators = _dereq_('./coordinators');
var Actions      = _dereq_('./action');
var Events       = _dereq_('./event');
var Bridge       = _dereq_('./bridge');

var ActionDispatcher = _dereq_('./action_dispatcher');
var EventDispatcher  = _dereq_('./event_dispatcher');

var Mixins = _dereq_('./mixins');

var next_flux_id = 1;

var Flux = function(coordinators, stores) {
  var self = this;
  var _id  = _generateFluxId();
  var _started = false;

  var action_dispatcher = new ActionDispatcher();
  var event_dispatcher  = new EventDispatcher();

  // inject the flux instance id to the dispatchers
  _injectFluxId(action_dispatcher, _id);
  _injectFluxId(event_dispatcher, _id);

  var required_coordinators = [], required_stores = [];
  var coordinator_instances = {}, store_instances = {};
  var coordinator_action_listeners = {};

  //
  // Accessors
  //

  this._id = function() {
    return _id;
  };

  //
  // Public Methods
  //

  /**
   * Start this Flux
   *
   * This will initialize (by calling $initialize()) all the specified Stores and start (by calling $start()) all the Coordinators.
   * All coordinators will be started in the order as specified in the Flux coordinator list. You may also perform asynchronous
   * operation within the $start() method and have it return a promise. Flux will finish the start process ONLY when all promise(s)
   * returned from $start() are resolved. However, only the execution order of the synchronous operations within $start() are guaranteed.
   * All asynchronous operations may be executed in any order.
   */
  this.start = function() {
    if (_started == true) throw new Error('This flux is running already.');

    // instantiate stores
    required_stores.forEach(function(s) {
      var s_instance = store_instances[s];
      // initialize store
      if (compare.isFunction(s_instance.$initialize)) s_instance.$initialize();
    });

    // start coordinators
    var instance_returns = [];
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      instance_returns.push(c_instance.$start());

      // automatically listen for actions from action_dispatcher IF
      // handlers are provided by $listen()
      if (compare.isFunction(c_instance.$listen)) {
        var listeners = c_instance.$listen();
        listeners.forEach(function(l) {
          // check listener
          if (!compare.isString(l.action)) {
            throw new Error(c + ' $listen(): Action listener event name must be a String');
          } else if (!compare.isFunction(l.handler)) {
            throw new Error(c + ' $listen(): Action listener handler must be a Function');
          }

          c_instance.flux.action_dispatcher.addListener(l.action, l.handler);
        });
      }
    });

    var promise = deferred.apply(this, instance_returns);
    promise.done(function() {
      _started = true;
    });
    return promise;
  };

  /**
   * Stop this Flux
   * This will stop (by calling $stop()) all the Coordinators
   */
  this.stop = function() {
    if (_started != true) throw new Error('This flux is not running.');

    // stop coordinators
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      var listeners  = coordinator_action_listeners[c];

      // remove all listener that were added automatically during the flux's start process
      if (compare.isArray(listeners)) {
        listeners.forEach(function(l) {
          c_instance.flux.action_dispatcher.removeListener(l.action, l.handler);
        });
      }

      // call $stop()
      if (compare.isFunction(c_instance.$stop)) c_instance.$stop();
    });

    _started = false;
  };

  /**
   * Perform $mount operation (if available) on all coordinators
   * @param {MountFunction} mountFn - a mount function
   */
  this.mountComponents = function(mountFn) {
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      // get coordinator's mount spec
      if (compare.isFunction(c_instance.$mount)) c_instance.$mount(mountFn);
    });
  };

  /**
   * Perform $unmount operation (if available) on all coordinators
   * @param {UnmountFunction} unmountFn - a unmount function
   */
  this.unmountComponents = function(unmountFn) {
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      // get coordinator's mount spec
      if (compare.isFunction(c_instance.$unmount)) c_instance.$unmount(unmountFn);
    });
  };

  /**
   * Flux configuration callback
   * @callback FluxConfigCallback
   * @param {...*} coordinators - coordinator instances in the same order as the coordinator names specified in Flux constructor
   */

  /**
   * Configure Flux's coordinators
   * @param {FluxConfigCallback} config_cb
   */
  this.config = function(config_cb) {
    var instances = [];

    required_coordinators.forEach(function(c) {
      instances.push(coordinator_instances[c]);
    });

    config_cb.apply(this, instances);
  };

  this.getBridge = function(name) {
    var c_instance = coordinator_instances[name];

    if (compare.isUndefined(c_instance)) throw new Error('Coordinator "' + name + '" is not running within this Flux.');
    if (compare.isUndefined(c_instance.$bridge)) throw new Error('Coordinator "' + name + '" does not have a bridge. Please implement the $bridge property in your coordinator.');
    return c_instance.$bridge;
  };

  /**
   * Flux context for use within Dyna's component
   * @typedef {Object} FluxComponentContext
   * @property {number}   id                - Flux instance ID
   * @property {function} store             - store retrieval function
   * @property {Object}   action_dispatcher - Action Dispatcher for this Flux instance
   */

  /**
   * Get the Flux context for use in React components
   * This returns the minimum Flux instance properties that are needed by React component within the Dyna framework
   * @returns {FluxComponentContext} Flux context
   */
  this.componentContext = function() {
    return { id: this._id(), store: this.store, action_dispatcher: this.actionDispatcher() };
  };

  //
  // Accessors
  //

  this.eventDispatcher = function() {
    return event_dispatcher;
  };

  this.actionDispatcher = function() {
    return action_dispatcher;
  };

  this.store = function(name) {
    var instance = store_instances[name];
    if (compare.isUndefined(instance)) throw new Error('Store "' + name + '" is not running within this Flux.');
    return instance;
  };


  //
  // Create Coordinator and Store instances
  //

  // check whether coordinators are valid
  arrayUtils.arrayWrap(coordinators).forEach(function(c) {
    if (!Coordinators.hasCoordinator(c)) throw new Error('Coordinator "' + c + '" not found. Please make sure it has been registered.');
    required_coordinators.push(c);

    var c_instance = Coordinators.instantiateCoordinator(c, self);
    if (!compare.isFunction(c_instance.$start)) {
      throw new Error('Coordinator "' + c +  '" must have a $start() method.');
    }
    // inject the Flux instance id to the coordinator instance so that we know which flux the instance is running within
    _injectFluxId(c_instance, _id);
    coordinator_instances[c] = c_instance;
  });

  // check whether stores are valid
  arrayUtils.arrayWrap(stores).forEach(function(s) {
    if (!Stores.hasStore(s)) throw new Error('Store "' + s + '" not found. Please make sure it has been registered.');
    required_stores.push(s);

    var s_instance = Stores.instantiateStore(s, self);
    // inject the Flux instance id to the store instance so that we know which flux the instance is running within
    _injectFluxId(s_instance, _id);
    store_instances[s] = s_instance;
  });
};

//
// Private Methods
//

/**
 * Generate a id for Flux instance
 * @private
 */
function _generateFluxId() {
  return next_flux_id++;
}

/**
 * Inject the Flux instance id as the <tt>_flux_id</tt> property to an Object
 * @param {Object} obj - any object
 * @param {number} id  - Flux instance id
 * @private
 */
function _injectFluxId(obj, id) {
  if (obj.hasOwnProperty('_flux_id')) throw new Error('Cannot inject Flux Id. Object already has a _flux_id property.');
  obj._flux_id = id;
}

//
// Exports
//

var DynaFlux = {
  flux : function(coordinators, stores) {
    return new Flux(coordinators, stores);
  },
  registerStore         : Stores.registerStore,
  registerComponent     : Components.registerComponent,
  connectComponentToFlux: Components.connectComponentToFlux,
  registerCoordinator   : Coordinators.registerCoordinator
};

assign(DynaFlux, Actions, Events, Bridge, Mixins);

module.exports = DynaFlux;

},{"../utils/array_utils":126,"../utils/compare":127,"./action":113,"./action_dispatcher":114,"./bridge":115,"./components":116,"./coordinators":117,"./event":118,"./event_dispatcher":119,"./mixins":121,"./stores":122,"deferred":26,"object-assign":103}],121:[function(_dereq_,module,exports){
'use strict';

var compare = _dereq_('../utils/compare');

/**
 * Function for creating a DynaFluxProviderMixin that will pass the Flux instance to child components
 * through childContext. With the DynaFluxProviderMixin, the Flux instance will be available through the flux()
 * method within the component.
 * @returns {Object} mixin
 *
 * @see {@link https://github.com/BinaryMuse/fluxxor/blob/master/lib/flux_mixin.js}
 */
var DynaFluxProviderMixin = function() {
  var React = this.React;

  return {
    componentWillMount : function() {
      if (!this.props.flux && (!this.context || !this.context.flux)) {
        throw new Error('Could not find flux in component\'s props or context');
      }
    },

    childContextTypes : {
      flux: React.PropTypes.object.isRequired
    },

    getChildContext : function() {
      return {
        flux: this.flux()
      };
    },

    flux : function() {
      return this.props.flux || (this.context && this.context.flux);
    }
  };
};
DynaFluxProviderMixin.componentWillMount = function() {
  throw new Error('DynaFluxProviderMixin must be created through dyna.DynaFluxProviderMixin(), instead of being used directly.');
};

/**
 * Function for creating a DynaFluxMixin that will consume the Flux instance provided by
 * the component's owner through owner's context. With the DynaFluxMixin, the Flux instance
 * will be available through the flux() method within the component.
 * @returns {Object} mixin
 */
var DynaFluxMixin = function() {
  var React = this.React;

  return {
    componentWillMount : function() {
      if (!this.context || !this.context.flux) {
        throw new Error('Could not find flux in component\'s context');
      }
    },

    contextTypes : {
      flux: React.PropTypes.object.isRequired
    },

    flux : function() {
      return this.context && this.context.flux;
    }
  };
};
DynaFluxMixin.componentWillMount = function() {
  throw new Error('DynaFluxMixin must be created through dyna.DynaFluxMixin(), instead of being used directly.');
};

/**
 * Store change listener specification
 * @typedef {Object} StoreChangeListenerSpec
 * @property {string}   store    - Flux store name
 * @property {function} listener - listener function
 */

/**
 * Get a list of stores this component will need to listen to
 * @callback getStoreListeners
 * @return {StoreChangeListenerSpec[]} an array of store change listener specification
 */

/**
 * A React Mixin that will make the component automatically listen and un-listen to Flux's store changes.
 * The component must implement a getStoreListeners() {@link getStoreListeners} method that returns
 * a list of store names and listener functions {@link StoreChangeListenerSpec}
 * @type {Object}
 */
var StoreChangeListenersMixin = {
  componentDidMount : function() {
    var self = this;
    if (!compare.isFunction(this.flux)) {
      throw new Error('Flux is not available in this component. Please use dyna.DynaFluxMixin() mixin to make the parent Flux instance available here.');
    } else if (!compare.isFunction(this.getStoreListeners)) {
      throw new Error('Component must have a getStoreListeners() method that returns a list of store to listen to and their corresponding handler.');
    }

    // add listeners
    var listeners = this.getStoreListeners();
    listeners.forEach(function(l) {
      if (!compare.isString(l.store)) {
        throw new Error('Store name in store listener definition must be a String');
      } else if (!compare.isFunction(l.listener)) {
        throw new Error('Store listener must be a Function');
      }

      self.flux().store(l.store).addChangeListener(l.listener);
    });

    // keeps a reference to the listeners for use in componentDidUnmount
    this._listeners = listeners;
  },

  componentWillUnmount : function() {
    var self = this;

    // remove listeners
    (this._listeners || []).forEach(function(l) {
      self.flux().store(l.store).removeChangeListener(l.listener);
    });
  }
};

module.exports = {
  DynaFluxMixin        : DynaFluxMixin,
  DynaFluxProviderMixin: DynaFluxProviderMixin,
  StoreChangeListenersMixin: StoreChangeListenersMixin
};
},{"../utils/compare":127}],122:[function(_dereq_,module,exports){
'use strict';

var compare      = _dereq_('../utils/compare');
var assign       = _dereq_('object-assign');
var EventEmitter = _dereq_('event-emitter');

/** Keep track of all registered Store specs */
var _store_specs = {};

var Store = function(flux) {
  var emitter = EventEmitter();

  var _processEvent = function() {
    return this.$processEvent.apply(this, arguments);
  };

  var event_dispatcher       = flux.eventDispatcher();
  var event_dispatcher_token = event_dispatcher.register(_processEvent.bind(this));

  /**
   * Return the Flux instance in which this Store is contained
   * @returns {{}} store() method of the Flux instance
   */
  this.flux = function() {
    return { store: flux.store };
  };

  /**
   * Emit a change event signalling a data change within the Store
   */
  this.emitChange = function() {
    if (event_dispatcher.isDispatching()) {
      // Emit change OUTSIDE of the event dispatch cycle if the EventDispatcher is dispatching
      setTimeout(function() { emitter.emit('CHANGE'); }, 0);
    } else {
      emitter.emit('CHANGE');
    }
  };

  /**
   * Add a change listener to handle the Store's data change event
   * @param {function} listener - change handler function
   */
  this.addChangeListener = function(listener) {
    emitter.on('CHANGE', listener);
  };

  /**
   * Remove a change listener
   * @param {function} listener - change handler function that was previously added
   */
  this.removeChangeListener = function(listener) {
    emitter.off('CHANGE', listener);
  };

  /**
   * Wait for other Stores to finished processing an event before processing begin in this Store
   * @param tokens
   */
  this.waitFor = function(tokens) {
    event_dispatcher.waitFor(tokens);
  };

  /**
   * Return the event dispatcher token of this Store
   * @returns {*} event dispatcher token
   */
  this.eventDispatcherToken = function() {
    return event_dispatcher_token;
  };
};

/**
 * Register a Store
 *
 * Register the specification (implementation) for a Store.
 *
 * A Store will not be instantiated at this point. The Store instance will be created when the Flux flow starts.
 * Once created, the Store instance will be extended with four event methods: emitChange(), addChangeListener(),
 * removeChangeListener() and waitFor(), plus flux() and eventDispatcherToken().
 *
 * The Store spec must include a $processEvent() method. It may also include a $initialize() method for initializing the Store.
 *
 * @param {string} name - name of the Store
 * @param {Object} spec - store specification
 * @throws {Error} if name or spec is not valid
 *
 * @example
 * // Register a new Store named "todoStore"
 * dyna.registerStore("TodoStore", {
 *   $initialize : function() {
 *     this.todo_list = [];
 *   },
 *
 *   $processEvent : function(event) {
 *     if (event.eventName() == 'todo_add') {
 *       this.addItem(event.payload());
 *     }
 *   },
 *
 *   addItem : function(item) {
 *     this.todo_list.push(item);
 *     this.emitChange();
 *   },
 *
 *   todoList : function() {
 *     return this.todo_list;
 *   }
 * });
 *
 */
function registerStore(name, spec) {
  if (_store_specs[name]) {
    throw new Error('Conflicting store name: "' + name+ '". Please use another name.');
  } else if (!compare.isString(name)) {
    throw new Error('Store name must be a string.');
  } else if (!compare.isObject(spec)) {
    throw new Error('Store spec must be an Object.');
  } else if (!compare.isFunction(spec.$processEvent)) {
    throw new Error('Store spec must included a $processEvent method.');
  }

  _store_specs[name] = spec;
}

/**
 * Instantiate a store under with a Flux
 * @param {string} name - name of the Store
 * @param {Flux}   flux - Flux instance in which to create the Store
 * @returns {Object} the Store instance
 */
function instantiateStore(name, flux) {
  var spec = _store_specs[name];

  if (compare.isUndefined(spec)) throw new Error('Store spec with name "' + '" not found. Please register it with registerStore() first.');
  else if (!compare.isObject(spec)) throw new Error('Store spec must be an Object.');

  var StoreInstance = function() {
    Store.call(this, flux);
  };

  StoreInstance.prototype = Object.create(spec);
  StoreInstance.prototype.constructor = StoreInstance;

  return new StoreInstance();
}

/**
 * Check whether a Store is registered
 * @param {string} name - name of the Store
 * @returns {boolean} true if Store with the provided name is registered; other false.
 */
function hasStore(name) {
  return !compare.isUndefined(_store_specs[name]);
}

//
// Exports
//

module.exports = {
  registerStore   : registerStore,
  hasStore        : hasStore,
  instantiateStore: instantiateStore
};
},{"../utils/compare":127,"event-emitter":80,"object-assign":103}],123:[function(_dereq_,module,exports){
'use strict';

var assign   = _dereq_('object-assign');
var DynaCore = _dereq_('./core/core');
var DynaFlux = _dereq_('./flux/flux');
var Utils    = _dereq_('./utils/utils');
var Addons   = _dereq_('./addons/addons');

_dereq_('./providers/providers');

var dyna = {
  version: '0.1.0',
  utils  : Utils,
  addons : Addons
};

assign(dyna, DynaCore);
assign(dyna, DynaFlux);

module.exports = dyna;

},{"./addons/addons":105,"./core/core":106,"./flux/flux":120,"./providers/providers":125,"./utils/utils":130,"object-assign":103}],124:[function(_dereq_,module,exports){
'use strict';

var compare = _dereq_('../utils/compare');
var providerManager = _dereq_('../core/provider_manager');

var Context = function() {
  var _context = {};

  /**
   * Set a value to the context object.
   * This method is only available in the provider, but not the service itself. Hence, context
   * value can only be set during the dyna's config phase.
   * @param {string} key   - the key of the context
   * @param {*}      value - the value
   * @throws throw an error if key is not a string
   * @returns {*} the value that just got set
   */
  this.setContext = function(key, value) {
    if (!compare.isString(key)) throw new Error("Context key must be a string");

    _context[key] = value;
    return value;
  };

  this.$get = function() {
    return {
      /**
       * Get the context value by key
       * @param {string} key - the key of the context
       * @returns {*} the value set for this context
       */
      getContext : function(key) {
        return _context[key];
      },

      /**
       * Get all the context values available
       * @returns {{*}} all the available context values
       */
      getAllContext : function() {
        return _context;
      }
    };
  };
};

//
// Exports
//

providerManager.define('$context', Context);

module.exports = Context;
},{"../core/provider_manager":110,"../utils/compare":127}],125:[function(_dereq_,module,exports){
'use strict';

_dereq_('./context');
},{"./context":124}],126:[function(_dereq_,module,exports){
'use strict';


/**
 * Utility Functions for Array
 * @exports utils/array_utils
 */

var compare = _dereq_('./compare');

module.exports = {
  /**
   * Wrap any object into an array
   * @param {*} obj - object to be wrapped
   * @returns {Array} a new copy of the resulting array
   * @example
   * utils.arrayWrap(undefined);   //=> []
   * utils.arrayWrap([1, 2, 3]);   //=> [1, 2, 3]
   * utils.arrayWrap(1);           //=> [1]
   */
  arrayWrap : function(obj) {
    if (compare.isUndefined(obj) || obj === null) return [];
    else if (compare.isArray(obj)) return obj.slice(0);
    else return [obj];
  }
};
},{"./compare":127}],127:[function(_dereq_,module,exports){
'use strict';

/**
 * Comparison Utilities
 * @module utils/compare
 */

module.exports = {
  isArray : function(object) {
    return object && object.constructor === Array;
  },

  isObject : function(object) {
    return object && object.constructor === Object;
  },

  isFunction : function(object) {
    return typeof object == "function";
  },

  isString : function(object) {
    return typeof object == "string";
  },

  isNumber : function(object) {
    return typeof object == "number";
  },

  isBoolean : function(object) {
    return typeof object == "boolean";
  },

  isUndefined : function(object) {
    return typeof object == "undefined";
  },

  isElement : function(object) {
    return (
      typeof HTMLElement === "object" ? object instanceof HTMLElement : //DOM2
      object && typeof object === "object" && object !== null && object.nodeType === 1 && typeof object.nodeName==="string"
    );
  },

  /**
   * Shallowly compare two objects and see if they are equal
   * @see {@link http://buildwithreact.com/article/optimizing-with-shouldcomponentupdate}
   * @param {*} objA
   * @param {*} objB
   * @returns {boolean} return true if the two objects and their members are equal
   */
  shallowEqual : function shallowEqual(objA, objB) {
    // true if the two inputs are of the same javascript object
    if (objA === objB) return true;

    var key;
    // Test for A's keys different from B.
    for (key in objA) {
      if (objA.hasOwnProperty(key) && ( !objB.hasOwnProperty(key) || objA[key] !== objB[key] )) {
        return false;
      }
    }

    // Test for B's keys missing from A.
    for (key in objB) {
      if ( objB.hasOwnProperty(key) && !objA.hasOwnProperty(key) ) {
        return false;
      }
    }

    return true;
  }
};
},{}],128:[function(_dereq_,module,exports){
module.exports = function(constructor, args) {
  'use strict';

  function F() {
    return constructor.apply(this, args);
  }
  F.prototype = constructor.prototype;
  return new F();
};
},{}],129:[function(_dereq_,module,exports){
'use strict';

var deferred = _dereq_('deferred');
var compare  = _dereq_('./compare');

var domReadyPromise = undefined;

/**
 * A simple implementation of DOM Ready method similar to jQuery's ready()
 *
 * @param {function} callback - dom ready callback
 */
function domReady(callback) {
  if (compare.isUndefined(domReadyPromise)) domReadyPromise = waitForDomReady();
  domReadyPromise.done(callback);
}

function waitForDomReady() {
  var domReadyDefer = deferred();

  // if the dom is already at 'complete' ready state
  if (document.readyState === 'complete') {
    domReadyDefer.resolve();  // immediately resolve the promise
  } else {
    if (document.addEventListener) {
      // Mozilla, Opera, Webkit

      var handler = function() {
        document.removeEventListener('DOMContentLoaded', handler, false);
        domReadyDefer.resolve();
      };
      document.addEventListener('DOMContentLoaded', handler, false);
    } else if (document.attachEvent) {
      // If IE event model is used
      var ie_handler = function() {
        if (document.readyState === 'complete') {
          document.detachEvent('onreadystatechange', ie_handler);
          domReadyDefer.resolve();
        }
      };
      document.attachEvent('onreadystatechange', ie_handler)
    }

    // A fallback to window.onload that will always work
    var onload_handler = function() {
      window.removeEventListener('load', onload_handler);
      domReadyDefer.resolve();
    };
    window.addEventListener('load', onload_handler);
  }

  return domReadyDefer.promise;
}

//
// Exports
//

module.exports = domReady;
},{"./compare":127,"deferred":26}],130:[function(_dereq_,module,exports){
'use strict';

var assign     = _dereq_('object-assign');
var deferred   = _dereq_('deferred');

var ArrayUtils = _dereq_('./array_utils');
var Compare    = _dereq_('./compare');

module.exports = assign({ deferred: deferred }, ArrayUtils, Compare);
},{"./array_utils":126,"./compare":127,"deferred":26,"object-assign":103}]},{},[123])(123)
});