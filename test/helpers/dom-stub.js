'use strict';

/**
 * DOM minimal, zéro dépendance, juste assez pour tester renderBoard() et le
 * câblage clic gauche/droit sans navigateur ni jsdom.
 */

class FakeClassList {
  constructor() {
    this.set = new Set();
  }
  add(cls) {
    this.set.add(cls);
  }
  remove(cls) {
    this.set.delete(cls);
  }
  contains(cls) {
    return this.set.has(cls);
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.classList = new FakeClassList();
    this.dataset = {};
    this.attributes = {};
    this.children = [];
    this.parentElement = null;
    this.textContent = '';
    this.disabled = false;
    this._listeners = {};
    this.style = {
      setProperty: (name, value) => {
        this.style[name] = value;
      },
    };
  }

  set className(value) {
    this.classList = new FakeClassList();
    for (const cls of String(value).split(' ').filter(Boolean)) {
      this.classList.add(cls);
    }
  }

  get className() {
    return [...this.classList.set].join(' ');
  }

  set innerHTML(_value) {
    this.children = [];
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  addEventListener(type, handler) {
    (this._listeners[type] || (this._listeners[type] = [])).push(handler);
  }

  /** Simule le déclenchement d'un événement DOM et retourne l'event mock. */
  trigger(type, extra = {}) {
    const evt = { type, defaultPrevented: false, ...extra };
    evt.preventDefault = () => {
      evt.defaultPrevented = true;
    };
    for (const handler of this._listeners[type] || []) {
      handler(evt);
    }
    return evt;
  }

  querySelector(selector) {
    const match = selector.match(
      /^\.cell\[data-row="(\d+)"\]\[data-col="(\d+)"\]$/
    );
    if (!match) {
      throw new Error(`Sélecteur non supporté par le stub DOM : ${selector}`);
    }
    const [, row, col] = match;
    return this.children.find(
      (child) => child.dataset.row === row && child.dataset.col === col
    ) || null;
  }
}

function createFakeDocument() {
  const elementsById = {};
  return {
    createElement(tag) {
      return new FakeElement(tag);
    },
    getElementById(id) {
      return elementsById[id] || null;
    },
    _registerById(id, element) {
      elementsById[id] = element;
    },
    addEventListener() {
      // DOMContentLoaded n'est jamais déclenché dans les tests.
    },
  };
}

module.exports = { FakeElement, createFakeDocument };
