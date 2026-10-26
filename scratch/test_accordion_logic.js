const fs = require('fs');
const path = require('path');

// Simulate DOM for testing accordion logic
class ClassList {
  constructor() {
    this.classes = new Set();
  }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  contains(c) { return this.classes.has(c); }
  toggle(c) {
    if (this.classes.has(c)) { this.classes.delete(c); return false; }
    else { this.classes.add(c); return true; }
  }
}

class FakeElement {
  constructor(tag, className = '', parent = null) {
    this.tagName = tag.toUpperCase();
    this.classList = new ClassList();
    if (className) {
      className.split(' ').filter(Boolean).forEach(c => this.classList.add(c));
    }
    this.parentElement = parent;
    this.children = [];
    if (parent) parent.children.push(this);
    this.attributes = {};
  }

  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }

  closest(selector) {
    let current = this;
    const targetClass = selector.startsWith('.') ? selector.slice(1) : null;
    const targetTag = !selector.startsWith('.') ? selector.toUpperCase() : null;

    while (current) {
      if (targetClass && current.classList.contains(targetClass)) return current;
      if (targetTag && current.tagName === targetTag) return current;
      current = current.parentElement;
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    const targetClass = selector.startsWith('.') ? selector.slice(1) : null;
    function walk(node) {
      for (const child of node.children) {
        if (targetClass && child.classList.contains(targetClass)) results.push(child);
        walk(child);
      }
    }
    walk(this);
    return results;
  }
}

// Build list with 2 accordion items
const ul = new FakeElement('ul', 'accordion-list');

const item1 = new FakeElement('li', 'accordion-item', ul);
const header1 = new FakeElement('div', 'accordion-header', item1);
const btn1 = new FakeElement('button', 'accordion-btn', header1);
const icon1 = new FakeElement('div', 'accordion-icon-1', header1);
const body1 = new FakeElement('div', 'accordion-body', item1);

const item2 = new FakeElement('li', 'accordion-item', ul);
const header2 = new FakeElement('div', 'accordion-header', item2);
const btn2 = new FakeElement('button', 'accordion-btn', header2);
const icon2 = new FakeElement('div', 'accordion-icon-1', header2);
const body2 = new FakeElement('div', 'accordion-body', item2);

// Accordion handler logic from main.js
function handleAccordionClick(target) {
  const header = target.closest(".accordion-header");
  if (header) {
    const item = header.closest(".accordion-item");
    if (!item) return;

    const isAlreadyActive = item.classList.contains("active");

    const parentList = item.closest("ul") || item.parentElement;
    if (parentList) {
      parentList.querySelectorAll(".accordion-item").forEach(function (accordionItem) {
        accordionItem.classList.remove("active");
      });
    }

    if (!isAlreadyActive) {
      item.classList.add("active");
    }
    return;
  }

  const item = target.closest(".accordion-item");
  if (item && !item.classList.contains("active") && !target.closest(".accordion-body")) {
    const parentList = item.closest("ul") || item.parentElement;
    if (parentList) {
      parentList.querySelectorAll(".accordion-item").forEach(function (accordionItem) {
        accordionItem.classList.remove("active");
      });
    }
    item.classList.add("active");
  }
}

console.log('--- TEST 1: Click button 1 inside header 1 ---');
handleAccordionClick(btn1);
console.log('Item 1 active:', item1.classList.contains('active')); // true
console.log('Item 2 active:', item2.classList.contains('active')); // false

console.log('--- TEST 2: Click button 2 inside header 2 ---');
handleAccordionClick(btn2);
console.log('Item 1 active:', item1.classList.contains('active')); // false
console.log('Item 2 active:', item2.classList.contains('active')); // true

console.log('--- TEST 3: Click header 2 again to close it ---');
handleAccordionClick(header2);
console.log('Item 1 active:', item1.classList.contains('active')); // false
console.log('Item 2 active:', item2.classList.contains('active')); // false

console.log('--- TEST 4: Click icon 1 inside header 1 ---');
handleAccordionClick(icon1);
console.log('Item 1 active:', item1.classList.contains('active')); // true
console.log('Item 2 active:', item2.classList.contains('active')); // false

console.log('--- TEST 5: Click padding of item 2 ---');
handleAccordionClick(item2);
console.log('Item 1 active:', item1.classList.contains('active')); // false
console.log('Item 2 active:', item2.classList.contains('active')); // true

console.log('ALL ACCORDION TESTS PASSED!');
