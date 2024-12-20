const vm = new WeakMap<
  EventListenerOrEventListenerObject,
  EventListenerOrEventListenerObject
>();

export type OuterEvent = {
  "click-out": GlobalEventHandlersEventMap["click"];
  "dblclick-out": GlobalEventHandlersEventMap["click"];
  "mousemove-out": GlobalEventHandlersEventMap["mousemove"];
  "focusin-out": GlobalEventHandlersEventMap["focusin"];
  "contextmenu-out": GlobalEventHandlersEventMap["contextmenu"];
};

const vm = new WeakMap<
  EventListenerOrEventListenerObject,
  EventListenerOrEventListenerObject
>();

export type OuterEvent = {
  "click-out": GlobalEventHandlersEventMap["click"];
  "dblclick-out": GlobalEventHandlersEventMap["click"];
  "mousemove-out": GlobalEventHandlersEventMap["mousemove"];
  "focusin-out": GlobalEventHandlersEventMap["focusin"];
  "contextmenu-out": GlobalEventHandlersEventMap["contextmenu"];
};

function createOutEventTarget(target: Node, container: Node = document) {
  return {
    addEventListener(
      type: keyof OuterEvent,
      callback: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions | boolean
    ) {
      const typeName = type.replace(/-out$/g, "");
      const fn = (e: Event) => {
        const currentTarget = e.target as Node;
        if (!target.contains(currentTarget)) {
          typeof callback === "function"
            ? callback(e)
            : callback?.handleEvent(e);
        }
      };
      callback && vm.set(callback, fn);
      container.addEventListener(typeName, fn, options);
    },
    removeEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions | boolean
    ) {
      const typeName = type.replace(/-out$/g, "");
      const fn = vm.get(callback);
      if (fn) {
        container.removeEventListener(typeName, fn, options);
      }
    },
  };
}

export function createOutEventTarget(target: Node, container: Node = document) {
  return {
    addEventListener(
      type: keyof OuterEvent,
      callback: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions | boolean
    ) {
      const typeName = type.replace(/-out$/g, "");
      const fn = (e: Event) => {
        const currentTarget = e.target as Node;
        if (!target.contains(currentTarget)) {
          typeof callback === "function"
            ? callback(e)
            : callback?.handleEvent(e);
        }
      };
      callback && vm.set(callback, fn);
      container.addEventListener(typeName, fn, options);
    },
    removeEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions | boolean
    ) {
      const typeName = type.replace(/-out$/g, "");
      const fn = vm.get(callback);
      if (fn) {
        container.removeEventListener(typeName, fn, options);
      }
    },
  };
}