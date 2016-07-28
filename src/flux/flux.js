'use strict';

/**
 * Flux architecture related components
 * @exports flux/flux
 */

var arrayUtils = require('../utils/array_utils');
var assign     = require('object-assign');
var compare    = require('../utils/compare');
var deferred   = require('deferred');
var invariant  = require('invariant');
var warning    = require('warning');

var Stores       = require('./stores');
var Components   = require('./components');
var Coordinators = require('./coordinators');
var Actions      = require('./action');
var Events       = require('./event');
var Bridge       = require('./bridge');

var ActionDispatcher = require('./action_dispatcher');
var EventDispatcher  = require('./event_dispatcher');

var Mixins = require('./mixins');

var next_flux_id = 1;

var Flux = function(coordinators, stores) {
  var self = this;
  var _id  = _generateFluxId();
  var _started = false;

  var _mount_tree        = null;
  var _unmount_callbacks = null;

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

    var promise = instance_returns.length > 0 ? deferred.apply(this, instance_returns) : deferred.call(this, 1);
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
   * Details of a component mount
   * @typedef {Object} MountDefinition
   * @property {HTMLElement} node      - the DOM node that is associated with the mount
   * @property {ReactClass}  component - the React component class to be mounted
   * @property {Object}      props     - the properties to used when mounting
   */

  /**
   * Callback that returns all components that needs to be mounted within the current component.
   * Since only top level React component can be mounted directly to the DOM, any nested component
   * must be passed in as props to the parent React component. This callback provides an opportunities
   * for the coordinators to inject the nested components into the parents any way they want.
   *
   * @callback NestedMountCallback
   * @param {Object} props - the current props to be used to mount the current (parent) component
   * @param {MountDefinition[]} children - a list of children component mount definitions
   * @return {Object} the updated props to be used to mount the current (parent) component. If nothing is
   * returned from the callback, then the original props will be used.
   */

  /**
   * Performs $mount operation (if available) on all coordinators, and mount the React components to the DOM
   * @param {domMountFn} domMount - function to mount a react component to the DOM (with first parameter binded to the current flux)
   */
  this.mountComponents = function(domMount) {
    _mount_tree = new MountTree();

    // Loops through all coordinators and adds all mount to the mount tree
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      // call coordinator $mount
      if (compare.isFunction(c_instance.$mount)) c_instance.$mount(mountNodeFn);
    });

    // Mounts all nodes under the mount tree
    _mount_tree.forEach(function(top_level_node) {
      top_level_node.validate();

      // executes all non-top-level parent mounts' callbacks
      // and updates the mounts' props accordingly
      top_level_node.eachSubParents(function(sub_parent) {
        // make sure the parent and its children are valid
        sub_parent.validate();

        // updates the non-top-level parant mount's props using values returned by
        // running the callback
        sub_parent.setProps(_runMountNodeNestedCallback(sub_parent));
      });

      // mount top level node directly to the DOM using the mountFn
      domMount(top_level_node.node(), top_level_node.component(), _runMountNodeNestedCallback(top_level_node));
    });

    //
    // Helper
    //

    /**
     * Registers the React component for mount to a DOM node.
     * This does not mount the component to the DOM immediately. Instead, this will only add the component
     * to the mount list, and all components in the mount list will be mounted at the end of the mountComponets phase.
     * That means all coordinators' $mount() would be executed before any components will be mounted to the DOM.
     *
     * The example below shows how you can pass any nested components into the parent through the use of props. However,
     * that is just one way of mounting a nested component. The callback allows you to achieve the same result any way you like.
     * For instance, an alternative would be to store the child components in a flux store in the callback, and then have the
     * parent component gets the children from the store.
     *
     * @param {HTMLElement} node      - a DOM Node
     * @param {ReactClass}  component - a React component class
     * @param {Object}      [props]     - props to be passed to the component
     * @param {NestedMountCallback} [nestedCb] - a callback that gives the coordinator a chance to handle components nested with the current component
     *
     * @example
     * // let say the DOM looks like this
     * <div id="parent-comp">
     *   <div class="child-comp" data-child-index="1"></div>
     *   <div class="child-comp" data-child-index="2"></div>
     * </div>
     *
     * // inside a coordinator $mount function
     * this.$mount = function(mountFn) {
     *   // mounts the ParentComponent React class to the 'parent-comp' DOM node.
     *   // Also, passes along the ChildComponents to the callback so that the coordinator
     *   // can inject them into the ParentComponent
     *   mountFn(document.getElementById('parent-comp'), ParentComponent, { name: 'parent' }, function(props, children) {
     *     // first create each of the child React elements
     *     var child_elems = children.map(function(child, index) {
     *       // adds a 'key' to the child properties because React expects a 'key' prop when
     *       // React elements are passed as an array. This is not necessary if there is only one child.
     *       var child_props = $.extend({}, child.props, { key: index });
     *       return React.createElement(child.component, child_props);
     *     });
     *
     *     // now inject the list of child elements into the ParentComponent through the ParentComponent props.
     *     // In this case, the ParentComponent takes in a 'nested' props. The object returned by this callback
     *     // will be used to mount the ParentComponent.
     *     //
     *     // Originally, the ParentComponent's prop is { name: 'parent' }. Here we are extending the props with
     *     // { nested: child_elems }.
     *     return $.extend({}, props, { nested: child_elems });
     *   });
     *
     *   // mounts the ChildComponent React class to the 'child-comp' DOM nodes
     *   // Note that this does not actually mount the component to the DOM because
     *   // these child components are nested within the ParentComponent according to
     *   // the DOM structure (i.e. they cannot be mounted to the DOM as a react root component).
     *   // Instead, the creation/mounting of the ChildComponent will be handled within the ParentComponent's
     *   // NestedMountCallback function above.
     *   $('.child-comp').each(function() {
     *     mountFn(this, ChildComponent, { child_index: $(this).data('child-index') });
     *   });
     * };
     */
    function mountNodeFn(node, component, props, nestedCb) {
      _mount_tree.addMount(node, component, props, nestedCb);
    };

    function _runMountNodeNestedCallback(parent_mount_node) {
      var parent_props = parent_mount_node.props();

      if (parent_mount_node.nestedCb()) {
        var child_list = parent_mount_node.children().map(function(c) {
          return { node: c.node(), component: c.component(), props: c.props() };
        });
        parent_props = parent_mount_node.nestedCb()(parent_props, child_list) || parent_props;
      }

      return parent_props;
    }
  };

  /**
   * Details of a component being unmount
   * @typedef {Object} UnmountDefinition
   * @property {HTMLElement} node      - the DOM node that is associated with the mount
   */

  /**
   * Callback that returns all components that needs to be mounted within the current component.
   * Since only top level React component can be mounted directly to the DOM, any nested component
   * must be passed in as props to the parent React component. This callback provides an opportunities
   * for the coordinators to inject the nested components into the parents any way they want.
   *
   * @callback NestedUnmountCallback
   * @param {UnmountDefinition[]} children - a array of node being unmount
   */


  /**
   * Unmounts all React components mounted during the mountComponents phase
   * @param {domUnmountFn} domUnmount - function to unmount a react component from a DOM
   */
  this.unmountComponents = function(domUnmount) {
    _unmount_callbacks = [];

    // Loops through all coordinators and adds all unmount callback to a list
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      // call coordinator $unmount
      if (compare.isFunction(c_instance.$unmount)) c_instance.$unmount(unmountNodeFn);
    });

    _mount_tree.forEach(function(top_level_node) {
      top_level_node.eachSubParents(function(sub_parent) {
        _runUnmountCallback(sub_parent);
      });

      _runUnmountCallback(top_level_node);
      domUnmount(top_level_node.node());
    });

    //
    // Helper
    //

    /**
     * Registers a callback for when component associated with the node will get unmounted.
     * This does not unmount the component immediately, but instead register a callback to
     * be called when the component is unmounted.
     *
     * All root mount nodes are unmount automatically without the need of calll this unmountNodeFn().
     * Only call this function if there are custom clear up logic for unmounting any of the nested component.
     *
     * @param {HTMLElement} node - the dom node associated with the component
     * @param {NestedUnmountCallback} cb - custom logic to unmount nested components
     */
    function unmountNodeFn(node, cb) {
      warning(cb, 'unmountNodeFn() called without a nested unmount callback function. It is not necessary to call unmountNodeFn() if no custom logic is needed to unmount nested components.');
      _unmount_callbacks.push({ node: node, cb: cb });
    }

    function _runUnmountCallback(parent_mount_node) {
      for (var i = 0; i < _unmount_callbacks.length; i++) {
        if (_unmount_callbacks[i].node === parent_mount_node.node()) {
          if (_unmount_callbacks[i].cb) {
            var child_list = parent_mount_node.children().map(function(c) {
              return { node: c.node() };
            });

            _unmount_callbacks[i].cb(child_list);
          }

          return;
        }
      }
    }
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
// Private class
//

function MountTree() {
  var mounts = [];

  /**
   * Adds a new mount entry to the mount tree
   *
   * @param {HTMLElement} node      - the DOM node associated with this mount
   * @param {ReactClass}  component - the React class of the component
   * @param {Object}      [props]   - props to create the React element with
   * @param {NestedMountCallback} [nestedCb] - a nested mount callback function
   */
  this.addMount = function(node, component, props, nestedCb) {
    invariant(node != null && node != undefined, 'Mount node cannot be null or undefined');

    var target_node = new MountNode(node, component, props, nestedCb);

    for (var i = 0; i < mounts.length; i++) {
      invariant(mounts[i].node() != node, 'Conflicting mount node. Node has already been mounted');

      if (mounts[i].node().contains(node)) {
        // adds the target node to the current mount node
        mounts[i].addDescendant(target_node);
        return;
      } else if (node.contains(mounts[i].node())) {
        // adds the current mount node as a child of the target node
        target_node.addDescendant(mounts[i]);
        // replace the current mount node with the target node
        mounts[i] = target_node;
        return;
      }
    }

    // if the target node is not a child or a parent of other nodes,
    // then simply add it to the mount list
    mounts.push(target_node);
  };

  /**
   * Loops through each of the top level MountNode
   */
  this.forEach = function(cb) {
    mounts.forEach(cb);
  };
}

function MountNode(node, component, props, nestedCb) {
  var _node = node;
  var _comp = component;
  var _props    = props;
  var _nestedCb = nestedCb;

  var _child_mounts = [];

  this.node = function() { return _node; };
  this.component = function() { return _comp; };
  this.props     = function() { return _props; };
  this.nestedCb  = function()  { return _nestedCb; };

  /**
   * Adds a descendant MountNode to the current MountNode.
   *
   * @param {MountNode} mount_node - node to be added
   */
  this.addDescendant = function(mount_node) {
    for (var i = 0; i < _child_mounts.length; i++) {
      invariant(_child_mounts[i].node() != mount_node.node(), 'Conflicting mount node. Node has already been mounted');

      if (_child_mounts[i].node().contains(mount_node.node())) {
        // adds the target node to the current mount node
        _child_mounts[i].addDescendant(mount_node);
        return;
      } else if (mount_node.node().contains(_child_mounts[i].node())) {
        // adds the current mount node as a child of the target node
        mount_node.addDescendant(_child_mounts[i]);
        // replace the current mount node with the target node
        _child_mounts[i] = mount_node;
        return;
      }
    }

    // if the target node is not a child or a parent of other nodes,
    // then simply add it to the mount list
    _child_mounts.push(mount_node);
  };

  /**
   * Returns whether this node has any direct child
   */
  this.hasChild = function() {
    return _child_mounts.length > 0;
  };

  /**
   * Returns all the direct child MountNode
   */
  this.children = function() {
    return _child_mounts;
  };

  /**
   * Sets the mount properties
   */
  this.setProps = function(new_props) {
    _props = new_props;
  };

  /**
   * Traverses down the current node and loops through all descendant MountNodes
   * that are also parent node themselves (i.e. has child).
   */
  this.eachSubParents = function(cb) {
    // traverses all children and executes the callback
    // if this node has at least one child
    _child_mounts.forEach(function(m) {
      m.eachSubParents(cb);
      if(m.hasChild()) cb(m);
    });
  };

  this.validate = function() {
    var self = this;

    _child_mounts.forEach(function(m) {
      invariant(
        m.node().parentNode === self.node(),
        "'" + m.component().displayName + "' is indirectly nested under '" + self.component().displayName + "'. Please make sure your nested mount is a direct child of another mounted component in the DOM."
      );
    });
  };
}

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
