(function(window) {

  var Lazy = window.Lazy;

  function NodeSequence(node) {
    this.node = node;
  }

  NodeSequence.prototype = new Lazy.Sequence();

  /**
   * Iterates over a DOM node's children and executes a function for each child.
   *
   * @param {function(Node):*} fn The function to call on each child.
   */
  NodeSequence.prototype.each = function(fn) {
    var children = this.node.childNodes,
        length   = children.length,
        i        = -1;

    while (++i < length) {
      if (fn(children[i], i) === false) {
        break;
      }
    }
  };

  NodeSequence.prototype.flatten = function() {
    return new FlattenedNodeSequence(this.node);
  };

  function FlattenedNodeSequence(node) {
    this.node = node;
  }

  FlattenedNodeSequence.prototype = new Lazy.Sequence();

  /**
   * Iterates over all of a DOM node's descendents (its children, and their
   * children, etc.) and executes a function for each descendent.
   *
   * @param {function(Node):*} fn The function to call on each descendent.
   */
  FlattenedNodeSequence.prototype.each = function(fn) {
    var done = false;

    Lazy(this.node).each(function(child) {
      if (fn(child) === false) {
        return false;
      }

      Lazy(child).flatten().each(function(descendent) {
        if (fn(descendent) === false) {
          done = true;
          return false;
        }
      });

      if (done) {
        return false;
      }
    });
  };

  function EventSequence(element, eventName) {
    this.element = element;
    this.eventName = eventName;
  }

  EventSequence.prototype = new Lazy.Sequence();

  /**
   * Handles every event in this sequence.
   *
   * @param {function(Event):*} fn The function to call on each event in the
   *     sequence. Return false from the function to stop handling the events.
   */
  EventSequence.prototype.each = function(fn) {
    var element = this.element,
        eventName = this.eventName;

    var listener = function(e) {
      if (fn(e) === false) {
        element.removeEventListener(eventName, listener);
      }
    };

    this.element.addEventListener(this.eventName, listener);
  };

  /**
   * Creates a {@link Sequence} from the specified DOM events triggered on the
   * given element. This sequence works asynchronously, so synchronous methods
   * such as {@code indexOf}, {@code any}, and {@code toArray} won't work.
   *
   * @param {Element} element The DOM element to capture events from.
   * @param {string} eventName The name of the event type (e.g., 'keypress')
   *     that will make up this sequence.
   * @return {Sequence} The sequence of events.
   */
  Lazy.events = function(element, eventName) {
    return new EventSequence(element, eventName);
  };

  var OriginalLazy = Lazy;

  /*
   * Assuming someone does:
   * <script src="lazy.js"></script>
   * <script src="lazy.dom.js"></script>
   *
   * Then they should be able to write:
   * Lazy(source)
   *
   * Where `source` can be a:
   * - Array
   * - Object
   * - String
   * - Node
   *
   * This function provides the last one, and then falls back to the original
   * 'Lazy' which provides the first three.
   */
  Lazy = function(source) {
    if (source instanceof Node) {
      return new NodeSequence(source);
    } else {
      return OriginalLazy(source);
    }
  };

  /*
   * Attach all of the same properties that Lazy already had.
   *
   * TODO: Think of a better approach here. This is really hacky.
   */
  for (var prop in OriginalLazy) {
    if (OriginalLazy.hasOwnProperty(prop)) {
      Lazy[prop] = OriginalLazy[prop];
    }
  }

  window.Lazy = Lazy;

}(window));
