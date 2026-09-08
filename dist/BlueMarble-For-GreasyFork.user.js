// ==UserScript==
// @name            Blue Marble
// @name:en         Blue Marble
// @namespace       https://github.com/SwingTheVine/
// @version         0.93.1
// @description     A userscript to enhance the user experience on Wplace.live. This includes, but is not limited to: uploading images to display locally on a canvas, adding a button to move the Wplace color palette menu, and other QoL features.
// @description:en  A userscript to enhance the user experience on Wplace.live. This includes, but is not limited to: uploading images to display locally on a canvas, adding a button to move the Wplace color palette menu, and other QoL features.
// @author          SwingTheVine
// @license         MPL-2.0
// @supportURL      https://discord.gg/tpeBPy46hf
// @homepageURL     https://bluemarble.lol/
// @icon            https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/98c47de88de0b2e7a1756f0030822cf3225a4566/dist/assets/Favicon.png
// @updateURL       https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/main/dist/BlueMarble-For-GreasyFork.user.js
// @downloadURL     https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/main/dist/BlueMarble-For-GreasyFork.user.js
// @match           https://wplace.live/*
// @run-at          document-start
// @grant           GM.getResourceText
// @grant           GM.addStyle
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM.deleteValue
// @grant           GM.xmlhttpRequest
// @grant           GM.download
// @connect         telemetry.thebluecorner.net
// @resource        CSS-BM-File https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/98c47de88de0b2e7a1756f0030822cf3225a4566/dist/BlueMarble-For-GreasyFork.user.css
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @antifeature     tracking Anonymous opt-in telemetry data
// @noframes
// ==/UserScript==

// Wplace  --> https://wplace.live
// License --> https://www.mozilla.org/en-US/MPL/2.0/
// Donate  --> https://ko-fi.com/swingthevine

/*!
  This script is not affiliated with Wplace.live in any way, use at your own risk.
  This script is not affiliated with any userscript manager.
  The author of this userscript is not responsible for any damages, issues, loss of data, or punishment that may occur as a result of using this script.
  This script is provided "as is" under the MPL-2.0 license.
  The "Blue Marble" icon is licensed under CC0 1.0 Universal (CC0 1.0) Public Domain Dedication.
  The "Blue Marble" image is owned by NASA.
*/

(() => {
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // src/observers.js
  var Observers = class {
    /** The constructor for the observer class
     * @since 0.43.2
     */
    constructor() {
      this.observerBody = null;
      this.observerBodyTarget = null;
      this.targetDisplayCoords = "#bm-display-coords";
    }
    /** Creates the MutationObserver for document.body
     * @param {HTMLElement} target - Targeted element to watch
     * @returns {Observers} this (Observers class)
     * @since 0.43.2
     */
    createObserverBody(target) {
      this.observerBodyTarget = target;
      this.observerBody = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (!(node instanceof HTMLElement)) {
              continue;
            }
            if (node.matches?.(this.targetDisplayCoords)) {
            }
          }
        }
      });
      return this;
    }
    /** Retrieves the MutationObserver that watches document.body
     * @returns {MutationObserver}
     * @since 0.43.2
     */
    getObserverBody() {
      return this.observerBody;
    }
    /** Observe a MutationObserver
     * @param {MutationObserver} observer - The MutationObserver
     * @param {boolean} watchChildList - (Optional) Should childList be watched? False by default
     * @param {boolean} watchSubtree - (Optional) Should childList be watched? False by default
     * @since 0.43.2
     */
    observe(observer, watchChildList = false, watchSubtree = false) {
      observer.observe(this.observerBodyTarget, {
        childList: watchChildList,
        subtree: watchSubtree
      });
    }
  };

  // src/Overlay.js
  var _Overlay_instances, createElement_fn, applyAttribute_fn;
  var Overlay = class {
    /** Constructor for the Overlay class.
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @since 0.0.2
     * @see {@link Overlay}
     */
    constructor(name2, version2) {
      __privateAdd(this, _Overlay_instances);
      this.name = name2;
      this.version = version2;
      this.apiManager = null;
      this.settingsManager = null;
      this.outputStatusId = "bm-output-status";
      this.overlay = null;
      this.currentParent = null;
      this.parentStack = [];
    }
    /** Populates the apiManager variable with the apiManager class.
     * @param {ApiManager} apiManager - The apiManager class instance
     * @since 0.41.4
     */
    setApiManager(apiManager) {
      this.apiManager = apiManager;
    }
    /** Populates the settingsManager variable with the settingsManager class.
     * @param {SettingsManager} settingsManager - The settingsManager class instance
     * @since 0.91.11
     */
    setSettingsManager(settingsManager) {
      this.settingsManager = settingsManager;
    }
    /** Finishes building an element.
     * Call this after you are finished adding children.
     * If the element will have no children, call it anyways.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.2
     * @example
     * overlay
     *   .addDiv()
     *     .addHeader(1).buildElement() // Breaks out of the <h1>
     *     .addP().buildElement() // Breaks out of the <p>
     *   .buildElement() // Breaks out of the <div>
     *   .addHr() // Since there are no more elements, calling buildElement() is optional
     * .buildOverlay(document.body);
     */
    buildElement() {
      if (this.parentStack.length > 0) {
        this.currentParent = this.parentStack.pop();
      }
      return this;
    }
    /** Finishes building the overlay and displays it.
     * Call this when you are done chaining methods.
     * @param {HTMLElement} parent - The parent HTMLElement this overlay should be appended to as a child.
     * @since 0.43.2
     * @example
     * overlay
     *   .addDiv()
     *     .addP().buildElement()
     *   .buildElement()
     * .buildOverlay(document.body); // Adds DOM structure to document body
     * // <div><p></p></div>
     */
    buildOverlay(parent) {
      parent?.appendChild(this.overlay);
      this.overlay = null;
      this.currentParent = null;
      this.parentStack = [];
    }
    /** Adds a `div` to the overlay.
     * This `div` element will have properties shared between all `div` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `div` that are NOT shared between all overlay `div` elements. These should be camelCase.
     * @param {function(Overlay, HTMLDivElement):void} [callback=()=>{}] - Additional JS modification to the `div`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.2
     * @example
     * // Assume all <div> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addDiv({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <div id="foo" class="bar"></div>
     * </body>
     */
    addDiv(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const div = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "div", properties, additionalProperties);
      callback(this, div);
      return this;
    }
    /** Adds a `p` to the overlay.
     * This `p` element will have properties shared between all `p` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `p` that are NOT shared between all overlay `p` elements. These should be camelCase.
     * @param {function(Overlay, HTMLParagraphElement):void} [callback=()=>{}] - Additional JS modification to the `p`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.2
     * @example
     * // Assume all <p> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addP({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <p id="foo" class="bar">Foobar.</p>
     * </body>
     */
    addP(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const p = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "p", properties, additionalProperties);
      callback(this, p);
      return this;
    }
    /** Adds a `small` to the overlay.
     * This `small` element will have properties shared between all `small` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `small` that are NOT shared between all overlay `small` elements. These should be camelCase.
     * @param {function(Overlay, HTMLElement):void} [callback=()=>{}] - Additional JS modification to the `small`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.55.8
     * @example
     * // Assume all <small> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addSmall({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <small id="foo" class="bar">Foobar.</small>
     * </body>
     */
    addSmall(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const small = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "small", properties, additionalProperties);
      callback(this, small);
      return this;
    }
    /** Adds a `span` to the overlay.
     * This `span` element will have properties shared between all `span` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `span` that are NOT shared between all overlay `span` elements. These should be camelCase.
     * @param {function(Overlay, HTMLSpanElement):void} [callback=()=>{}] - Additional JS modification to the `span`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.55.8
     * @example
     * // Assume all <span> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addSpan({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <span id="foo" class="bar">Foobar.</span>
     * </body>
     */
    addSpan(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const span = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "span", properties, additionalProperties);
      callback(this, span);
      return this;
    }
    /** Adds a `details` to the overlay.
     * This `details` element will have properties shared between all `details` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `details` that are NOT shared between all overlay `details` elements. These should be camelCase.
     * @param {function(Overlay, HTMLDetailsElement):void} [callback=()=>{}] - Additional JS modification to the `details`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.96
     * @example
     * // Assume all <details> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addDetails({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <details id="foo" class="bar"></details>
     * </body>
     */
    addDetails(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const details = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "details", properties, additionalProperties);
      callback(this, details);
      return this;
    }
    /** Adds a `summary` to the overlay.
     * This `summary` element will have properties shared between all `summary` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `summary` that are NOT shared between all overlay `summary` elements. These should be camelCase.
     * @param {function(Overlay, HTMLElement):void} [callback=()=>{}] - Additional JS modification to the `summary`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.96
     * @example
     * // Assume all <summary> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addSummary({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <summary id="foo" class="bar">Foobar.</summary>
     * </body>
     */
    addSummary(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const summary = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "summary", properties, additionalProperties);
      callback(this, summary);
      return this;
    }
    /** Adds a `img` to the overlay.
     * This `img` element will have properties shared between all `img` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `img` that are NOT shared between all overlay `img` elements. These should be camelCase.
     * @param {function(Overlay, HTMLImageElement):void} [callback=()=>{}] - Additional JS modification to the `img`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.2
     * @example
     * // Assume all <img> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addimg({'id': 'foo', 'src': './img.png'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <img id="foo" src="./img.png" class="bar">
     * </body>
     */
    addImg(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const img = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "img", properties, additionalProperties);
      callback(this, img);
      return this;
    }
    /** Adds a header to the overlay.
     * This header element will have properties shared between all header elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {number} level - The header level. Must be between 1 and 6 (inclusive)
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the header that are NOT shared between all overlay header elements. These should be camelCase.
     * @param {function(Overlay, HTMLHeadingElement):void} [callback=()=>{}] - Additional JS modification to the header.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.7
     * @example
     * // Assume all header elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addHeader(6, {'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <h6 id="foo" class="bar">Foobar.</h6>
     * </body>
     */
    addHeader(level, additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const header = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "h" + level, properties, additionalProperties);
      callback(this, header);
      return this;
    }
    /** Adds a `hr` to the overlay.
     * This `hr` element will have properties shared between all `hr` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `hr` that are NOT shared between all overlay `hr` elements. These should be camelCase.
     * @param {function(Overlay, HTMLHRElement):void} [callback=()=>{}] - Additional JS modification to the `hr`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.7
     * @example
     * // Assume all <hr> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addhr({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <hr id="foo" class="bar">
     * </body>
     */
    addHr(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const hr = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "hr", properties, additionalProperties);
      callback(this, hr);
      return this;
    }
    /** Adds a `br` to the overlay.
     * This `br` element will have properties shared between all `br` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `br` that are NOT shared between all overlay `br` elements. These should be camelCase.
     * @param {function(Overlay, HTMLBRElement):void} [callback=()=>{}] - Additional JS modification to the `br`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.11
     * @example
     * // Assume all <br> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addbr({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <br id="foo" class="bar">
     * </body>
     */
    addBr(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const br = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "br", properties, additionalProperties);
      callback(this, br);
      return this;
    }
    /** Adds a `form` to the overlay.
     * This `form` element will have properties shared between all `form` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `form` that are NOT shared between all overlay `form` elements. These should be camelCase.
     * @param {function(Overlay, HTMLFormElement):void} [callback=()=>{}] - Additional JS modification to the `form`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.246
     * @example
     * // Assume all <form> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addForm({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <form id="foo" class="bar"></form>
     * </body>
     */
    addForm(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const form = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "form", properties, additionalProperties);
      callback(this, form);
      return this;
    }
    /** Adds a `fieldset` to the overlay.
     * This `fieldset` element will have properties shared between all `fieldset` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `fieldset` that are NOT shared between all overlay `fieldset` elements. These should be camelCase.
     * @param {function(Overlay, HTMLFieldSetElement):void} [callback=()=>{}] - Additional JS modification to the `fieldset`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.246
     * @example
     * // Assume all <fieldset> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addFieldset({'id': 'foo'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <fieldset id="foo" class="bar"></fieldset>
     * </body>
     */
    addFieldset(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const fieldset = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "fieldset", properties, additionalProperties);
      callback(this, fieldset);
      return this;
    }
    /** Adds a `legend` to the overlay.
     * This `legend` element will have properties shared between all `legend` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `legend` that are NOT shared between all overlay `legend` elements. These should be camelCase.
     * @param {function(Overlay, HTMLLegendElement):void} [callback=()=>{}] - Additional JS modification to the `legend`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.246
     * @example
     * // Assume all <legend> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addLegend({'id': 'foo', textContent: 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <legend id="foo" class="bar">
     *     "Foobar."
     *   </legend>
     * </body>
     */
    addLegend(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const legend = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "legend", properties, additionalProperties);
      callback(this, legend);
      return this;
    }
    /** Adds a checkbox to the overlay.
     * This checkbox element will have properties shared between all checkbox elements in the overlay.
     * You can override the shared properties by using a callback.
     * Note: The checkbox element is inside a label element.
     * Note: The text content is contained within a `<span>` element.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the checkbox that are NOT shared between all overlay checkbox elements. These should be camelCase.
     * @param {function(Overlay, HTMLLabelElement, HTMLInputElement):void} [callback=()=>{}] - Additional JS modification to the checkbox.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.10
     * @example
     * // Assume all checkbox elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addCheckbox({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <label>
     *     <input type="checkbox" id="foo" class="bar">
     *     <span>"Foobar."<span>
     *   </label>
     * </body>
     */
    addCheckbox(additionalProperties = {}, callback = () => {
    }) {
      const properties = { "type": "checkbox" };
      const labelTextContent = {};
      if (!!additionalProperties["textContent"]) {
        labelTextContent["textContent"] = additionalProperties["textContent"];
        delete additionalProperties["textContent"];
      } else if (!!additionalProperties["innerHTML"]) {
        labelTextContent["innerHTML"] = additionalProperties["innerHTML"];
        delete additionalProperties["innerHTML"];
      }
      const label = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "label");
      const checkbox = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "input", properties, additionalProperties);
      this.buildElement();
      label.appendChild(checkbox);
      const span = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "span", labelTextContent);
      this.buildElement();
      label.appendChild(span);
      callback(this, label, checkbox);
      return this;
    }
    /** Adds a label & select element to the overlay.
     * This select element will have properties shared between all select elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the checkbox that are NOT shared between all overlay select elements. These should be camelCase.
     * @param {function(Overlay, HTMLLabelElement, HTMLSelectElement):void} [callback=()=>{}] - Additional JS modification to the label/select elements.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.243
     * @example
     * // Assume all select elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addSelect({'id': 'foo', 'textContent': 'Foobar: '}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <label for="foo">
     *     "Foobar: "
     *   </label>
     *   <select id="foo" class="bar"></select>
     * </body>
     */
    addSelect(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const label = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "label", { "textContent": additionalProperties["textContent"] ?? "", "for": additionalProperties["id"] ?? "" });
      delete additionalProperties["textContent"];
      this.buildElement();
      const select = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "select", properties, additionalProperties);
      callback(this, label, select);
      return this;
    }
    /** Adds an option to the overlay.
     * This `option` element will have properties shared between all `option` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `option` that are NOT shared between all overlay `option` elements. These should be camelCase.
     * @param {function(Overlay, HTMLOptionElement):void} [callback=()=>{}] - Additional JS modification to the `option`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.244
     * @example
     * // Assume all <option> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addOption({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <option id="foo" class="bar">Foobar.</option>
     * </body>
     */
    addOption(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const option = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "option", properties, additionalProperties);
      callback(this, option);
      return this;
    }
    /** Adds an ordered list to the overlay.
     * This `ol` element will have properties shared between all `ol` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `ol` that are NOT shared between all overlay `ol` elements. These should be camelCase.
     * @param {function(Overlay, HTMLOListElement):void} [callback=()=>{}] - Additional JS modification to the `ol`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <ol> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addOl({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <ol id="foo" class="bar">Foobar.</ol>
     * </body>
     */
    addOl(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const ol = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "ol", properties, additionalProperties);
      callback(this, ol);
      return this;
    }
    /** Adds an unordered list to the overlay.
     * This `ul` element will have properties shared between all `ul` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `ul` that are NOT shared between all overlay `ul` elements. These should be camelCase.
     * @param {function(Overlay, HTMLUListElement):void} [callback=()=>{}] - Additional JS modification to the `ul`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <ul> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addUl({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <ul id="foo" class="bar">Foobar.</ul>
     * </body>
     */
    addUl(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const ul = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "ul", properties, additionalProperties);
      callback(this, ul);
      return this;
    }
    /** Adds a `menu` to the overlay.
     * This `menu` element will have properties shared between all `menu` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `menu` that are NOT shared between all overlay `menu` elements. These should be camelCase.
     * @param {function(Overlay, HTMLMenuElement):void} [callback=()=>{}] - Additional JS modification to the `menu`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <menu> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addMenu({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <menu id="foo" class="bar">Foobar.</menu>
     * </body>
     */
    addMenu(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const menu = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "menu", properties, additionalProperties);
      callback(this, menu);
      return this;
    }
    /** Adds a list item to the overlay.
     * This `li` element will have properties shared between all `li` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `li` that are NOT shared between all overlay `li` elements. These should be camelCase.
     * @param {function(Overlay, HTMLLIElement):void} [callback=()=>{}] - Additional JS modification to the `li`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <li> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addLi({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <li id="foo" class="bar">Foobar.</li>
     * </body>
     */
    addLi(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const li = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "li", properties, additionalProperties);
      callback(this, li);
      return this;
    }
    /** Adds a table to the overlay.
     * This `table` element will have properties shared between all `table` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `table` that are NOT shared between all overlay `table` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableElement):void} [callback=()=>{}] - Additional JS modification to the `table`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <table> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTable({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <table id="foo" class="bar">Foobar.</table>
     * </body>
     */
    addTable(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const table = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "table", properties, additionalProperties);
      callback(this, table);
      return this;
    }
    /** Adds a table caption to the overlay.
     * This `caption` element will have properties shared between all `caption` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `caption` that are NOT shared between all overlay `caption` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableCaptionElement):void} [callback=()=>{}] - Additional JS modification to the `caption`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <caption> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addCaption({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <caption id="foo" class="bar">Foobar.</caption>
     * </body>
     */
    addCaption(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const caption = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "caption", properties, additionalProperties);
      callback(this, caption);
      return this;
    }
    /** Adds a table header to the overlay.
     * This `thead` element will have properties shared between all `thead` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `thead` that are NOT shared between all overlay `thead` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableSectionElement):void} [callback=()=>{}] - Additional JS modification to the `thead`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <thead> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addThead({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <thead id="foo" class="bar">Foobar.</thead>
     * </body>
     */
    addThead(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const thead = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "thead", properties, additionalProperties);
      callback(this, thead);
      return this;
    }
    /** Adds a table body to the overlay.
     * This `tbody` element will have properties shared between all `tbody` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `tbody` that are NOT shared between all overlay `tbody` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableSectionElement):void} [callback=()=>{}] - Additional JS modification to the `tbody`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <tbody> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTbody({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <tbody id="foo" class="bar">Foobar.</tbody>
     * </body>
     */
    addTbody(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const tbody = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "tbody", properties, additionalProperties);
      callback(this, tbody);
      return this;
    }
    /** Adds a table footer to the overlay.
     * This `tfoot` element will have properties shared between all `tfoot` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `tfoot` that are NOT shared between all overlay `tfoot` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableSectionElement):void} [callback=()=>{}] - Additional JS modification to the `tfoot`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <tfoot> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTfoot({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <tfoot id="foo" class="bar">Foobar.</tfoot>
     * </body>
     */
    addTfoot(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const tfoot = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "tfoot", properties, additionalProperties);
      callback(this, tfoot);
      return this;
    }
    /** Adds a table row to the overlay.
     * This `tr` element will have properties shared between all `tr` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `tr` that are NOT shared between all overlay `tr` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableRowElement):void} [callback=()=>{}] - Additional JS modification to the `tr`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <tr> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTr({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <tr id="foo" class="bar">Foobar.</tr>
     * </body>
     */
    addTr(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const tr = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "tr", properties, additionalProperties);
      callback(this, tr);
      return this;
    }
    /** Adds a table header (label) cell to the overlay.
     * This `th` element will have properties shared between all `th` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `th` that are NOT shared between all overlay `th` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableCellElement):void} [callback=()=>{}] - Additional JS modification to the `th`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <th> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTh({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <th id="foo" class="bar">Foobar.</th>
     * </body>
     */
    addTh(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const th = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "th", properties, additionalProperties);
      callback(this, th);
      return this;
    }
    /** Adds a table data cell to the overlay.
     * This `td` element will have properties shared between all `td` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `td` that are NOT shared between all overlay `td` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTableCellElement):void} [callback=()=>{}] - Additional JS modification to the `td`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.180
     * @example
     * // Assume all <td> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTd({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <td id="foo" class="bar">Foobar.</td>
     * </body>
     */
    addTd(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const td = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "td", properties, additionalProperties);
      callback(this, td);
      return this;
    }
    /** Adds a `button` to the overlay.
     * This `button` element will have properties shared between all `button` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `button` that are NOT shared between all overlay `button` elements. These should be camelCase.
     * @param {function(Overlay, HTMLButtonElement):void} [callback=()=>{}] - Additional JS modification to the `button`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.12
     * @example
     * // Assume all <button> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addButton({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <button id="foo" class="bar">Foobar.</button>
     * </body>
     */
    addButton(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const button = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "button", properties, additionalProperties);
      callback(this, button);
      return this;
    }
    /** Adds a help button to the overlay. It will have a "?" icon unless overridden in callback.
     * On click, the button will attempt to output the title to the output element (ID defined in Overlay constructor).
     * This `button` element will have properties shared between all `button` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `button` that are NOT shared between all overlay `button` elements. These should be camelCase.
     * @param {function(Overlay, HTMLButtonElement):void} [callback=()=>{}] - Additional JS modification to the `button`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.12
     * @example
     * // Assume all help button elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addButtonHelp({'id': 'foo', 'title': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <button id="foo" class="bar" title="Help: Foobar.">?</button>
     * </body>
     * @example
     * // Assume all help button elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addButtonHelp({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <button id="foo" class="bar" title="Help: Foobar.">?</button>
     * </body>
     */
    addButtonHelp(additionalProperties = {}, callback = () => {
    }) {
      const tooltip = additionalProperties["title"] ?? additionalProperties["textContent"] ?? "Help: No info";
      delete additionalProperties["textContent"];
      additionalProperties["title"] = `Help: ${tooltip}`;
      const properties = {
        "textContent": "?",
        "className": "bm-help",
        "onclick": () => {
          this.updateInnerHTML(this.outputStatusId, tooltip);
        }
      };
      const help = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "button", properties, additionalProperties);
      callback(this, help);
      return this;
    }
    /** Adds a `input` to the overlay.
     * This `input` element will have properties shared between all `input` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `input` that are NOT shared between all overlay `input` elements. These should be camelCase.
     * @param {function(Overlay, HTMLInputElement):void} [callback=()=>{}] - Additional JS modification to the `input`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.13
     * @example
     * // Assume all <input> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addInput({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <input id="foo" class="bar">Foobar.</input>
     * </body>
     */
    addInput(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const input = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "input", properties, additionalProperties);
      callback(this, input);
      return this;
    }
    /** Adds a file input to the overlay with enhanced visibility controls.
     * This input element will have properties shared between all file input elements in the overlay.
     * Uses multiple hiding methods to prevent browser native text from appearing during minimize/maximize.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the file input that are NOT shared between all overlay file input elements. These should be camelCase.
     * @param {function(Overlay, HTMLDivElement, HTMLInputElement, HTMLButtonElement):void} [callback=()=>{}] - Additional JS modification to the file input.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.17
     * @example
     * // Assume all file input elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addInputFile({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <div>
     *     <input type="file" id="foo" class="bar" style="display: none"></input>
     *     <button>Foobar.</button>
     *   </div>
     * </body>
     */
    addInputFile(additionalProperties = {}, callback = () => {
    }) {
      const properties = {
        "type": "file",
        "tabindex": "-1",
        "aria-hidden": "true"
      };
      const text = additionalProperties["textContent"] ?? "";
      delete additionalProperties["textContent"];
      const container = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "div");
      const input = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "input", properties, additionalProperties);
      this.buildElement();
      const button = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "button", { "textContent": text });
      this.buildElement();
      this.buildElement();
      button.addEventListener("click", () => {
        input.click();
      });
      input.addEventListener("change", () => {
        button.style.maxWidth = `${button.offsetWidth}px`;
        if (input.files.length > 0) {
          button.textContent = input.files[0].name;
        } else {
          button.textContent = text;
        }
      });
      callback(this, container, input, button);
      return this;
    }
    /** Adds a `textarea` to the overlay.
     * This `textarea` element will have properties shared between all `textarea` elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the `textarea` that are NOT shared between all overlay `textarea` elements. These should be camelCase.
     * @param {function(Overlay, HTMLTextAreaElement):void} [callback=()=>{}] - Additional JS modification to the `textarea`.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.43.13
     * @example
     * // Assume all <textarea> elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addTextarea({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <textarea id="foo" class="bar">Foobar.</textarea>
     * </body>
     */
    addTextarea(additionalProperties = {}, callback = () => {
    }) {
      const properties = {};
      const textarea = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "textarea", properties, additionalProperties);
      callback(this, textarea);
      return this;
    }
    /** Adds a dragbar `div` element to the overlay.
     * This dragbar element will have properties shared between all dragbar elements in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the dragbar that are NOT shared between all overlay dragbars. These should be camelCase.
     * @param {function(Overlay, HTMLDivElement):void} [callback=()=>{}] - Additional JS modification to the dragbar.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.145
     * @example
     * // Assume all dragbar elements have a shared class (e.g. {'className': 'bar'})
     * overlay.addDragbar({'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <div id="foo" class="bar">Foobar.</div>
     * </body>
     */
    addDragbar(additionalProperties = {}, callback = () => {
    }) {
      const properties = {
        "class": "bm-dragbar"
      };
      const dragbar = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "div", properties, additionalProperties);
      callback(this, dragbar);
      return this;
    }
    /** Adds a timer `time` element to the overlay.
     * This timer will countdown until it reaches the end date that was passed in.
     * Additionally, you can update the end date by changing the endDate dataset attribute on the element.
     * Timer elements are not localized. Output is HH:MM:SS with no units.
     * This timer will have properties shared between all timers in the overlay.
     * You can override the shared properties by using a callback.
     * @param {Date} [endDate=Date.now()] - The time to count down to.
     * @param {number} [updateInterval=500] - The time in milliseconds to update the display of the timer. Default is 500 milliseconds.
     * @param {Object.<string, any>} [additionalProperties={}] - The DOM properties of the timer that are NOT shared between all overlay timers. These should be camelCase.
     * @param {function(Overlay, HTMLTimeElement):void} [callback=()=>{}] - Additional JS modification to the timer.
     * @returns {Overlay} Overlay class instance (this)
     * @since 0.88.313
     * @example
     * // Assume all timers have a shared class (e.g. {'className': 'bar'})
     * overlay.addTimer(Date.now() + 2211632704000, 500, {'id': 'foo', 'textContent': 'Foobar.'}).buildOverlay(document.body);
     * // Output:
     * // (Assume <body> already exists in the webpage)
     * <body>
     *   <time id="bm-timer-dh8fhw80" class="bar" datetime="PT27H34M56S" data-end-date="1771749296000">27:34:56</div>
     * </body>
     */
    addTimer(endDate = Date.now(), updateInterval = 500, additionalProperties = {}, callback = () => {
    }) {
      const timerClass = "bm-timer";
      const timerID = additionalProperties?.["id"] || timerClass + "-" + crypto.randomUUID().slice(0, 8);
      const properties = {
        "class": timerClass
      };
      const timer = __privateMethod(this, _Overlay_instances, createElement_fn).call(this, "time", properties, additionalProperties);
      timer.id = timerID;
      timer.dataset["endDate"] = endDate;
      setInterval(() => {
        if (!timer.isConnected) {
          return;
        }
        const timeRemainingTotalMs = Math.max(timer.dataset["endDate"] - Date.now(), 0);
        const timeRemainingTotalSec = Math.floor(timeRemainingTotalMs / 1e3);
        const timeRemainingTotalHr = Math.floor(timeRemainingTotalSec / 3600);
        const timeRemainingOnlySec = Math.floor(timeRemainingTotalSec % 60);
        const timeRemainingOnlyMin = Math.floor(timeRemainingTotalSec % 3600 / 60);
        timer.setAttribute("datetime", `PT${timeRemainingTotalHr}H${timeRemainingOnlyMin}M${timeRemainingOnlySec}S`);
        timer.textContent = String(timeRemainingTotalHr).padStart(2, "0") + ":" + String(timeRemainingOnlyMin).padStart(2, "0") + ":" + String(timeRemainingOnlySec).padStart(2, "0");
      }, updateInterval);
      callback(this, timer);
      return this;
    }
    /** Updates the inner HTML of the element.
     * The element is discovered by it's id.
     * If the element is an `input`, it will modify the value attribute instead.
     * @param {string} id - The ID of the element to change
     * @param {string} html - The HTML/text to update with
     * @param {boolean} [doSafe] - (Optional) Should `textContent` be used instead of `innerHTML` to avoid XSS? False by default
     * @since 0.24.2
     */
    updateInnerHTML(id, html, doSafe = false) {
      const element = document.getElementById(id.replace(/^#/, ""));
      if (!element) {
        return;
      }
      if (element instanceof HTMLInputElement) {
        element.value = html;
        return;
      }
      if (doSafe) {
        element.textContent = html;
      } else {
        element.innerHTML = html;
      }
    }
    /** Handles the minimization logic for windows spawned by Blue Marble
     * @param {HTMLButtonElement} button - The UI button that triggered this minimization event
     * @since 0.88.142
    */
    handleMinimization(button) {
      if (button.disabled) {
        return;
      }
      button.disabled = true;
      button.style.textDecoration = "none";
      const window2 = button.closest(".bm-window");
      const dragbar = button.closest(".bm-dragbar");
      const header = window2.querySelector("h1");
      const windowContent = window2.querySelector(".bm-window-content");
      window2.parentElement.append(window2);
      if (button.dataset["buttonStatus"] == "expanded") {
        windowContent.style.height = windowContent.scrollHeight + "px";
        window2.style.width = window2.scrollWidth + "px";
        windowContent.style.height = "0";
        windowContent.addEventListener("transitionend", function handler() {
          windowContent.style.display = "none";
          button.disabled = false;
          button.style.textDecoration = "";
          windowContent.removeEventListener("transitionend", handler);
        });
        const dragbarHeader1 = header.cloneNode(true);
        const dragbarHeader1Text = dragbarHeader1.textContent;
        button.nextElementSibling.appendChild(dragbarHeader1);
        button.textContent = "\u25B6";
        button.dataset["buttonStatus"] = "collapsed";
        button.ariaLabel = `Unminimize window "${dragbarHeader1Text}"`;
      } else {
        const dragbarHeader1 = dragbar.querySelector("h1");
        const dragbarHeader1Text = dragbarHeader1.textContent;
        dragbarHeader1.remove();
        windowContent.style.display = "";
        windowContent.style.height = "0";
        window2.style.width = "";
        windowContent.style.height = windowContent.scrollHeight + "px";
        windowContent.addEventListener("transitionend", function handler() {
          windowContent.style.height = "";
          button.disabled = false;
          button.style.textDecoration = "";
          windowContent.removeEventListener("transitionend", handler);
        });
        button.textContent = "\u25BC";
        button.dataset["buttonStatus"] = "expanded";
        button.ariaLabel = `Minimize window "${dragbarHeader1Text}"`;
      }
    }
    /** Handles dragging of the overlay.
     * Uses requestAnimationFrame for smooth animations and GPU-accelerated transforms.
     * Make sure to use the appropriate CSS selectors.
     * @param {string} moveMeSelector - The element to be moved
     * @param {string} iMoveThingsSelector - The drag handle element
     * @since 0.8.2
    */
    handleDrag(moveMeSelector, iMoveThingsSelector) {
      const moveMe = document.querySelector(moveMeSelector);
      const iMoveThings = document.querySelector(iMoveThingsSelector);
      if (!moveMe || !iMoveThings) {
        this.handleDisplayError(`Can not drag! ${!moveMe ? "moveMe" : ""} ${!moveMe && !iMoveThings ? "and " : ""}${!iMoveThings ? "iMoveThings " : ""}was not found!`);
        return;
      }
      let isDragging = false;
      let offsetX, offsetY = 0;
      let animationFrame = null;
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;
      let initialRect = null;
      const updatePosition = () => {
        if (isDragging) {
          const deltaX = Math.abs(currentX - targetX);
          const deltaY = Math.abs(currentY - targetY);
          if (deltaX > 0.5 || deltaY > 0.5) {
            currentX = targetX;
            currentY = targetY;
            moveMe.style.transform = `translate(${currentX}px, ${currentY}px)`;
            moveMe.style.left = "0px";
            moveMe.style.top = "0px";
            moveMe.style.right = "";
          }
          animationFrame = requestAnimationFrame(updatePosition);
        }
      };
      const startDrag = (clientX, clientY) => {
        isDragging = true;
        initialRect = moveMe.getBoundingClientRect();
        offsetX = clientX - initialRect.left;
        offsetY = clientY - initialRect.top;
        const computedStyle = window.getComputedStyle(moveMe);
        const transform = computedStyle.transform;
        if (transform && transform !== "none") {
          const matrix = new DOMMatrix(transform);
          currentX = matrix.m41;
          currentY = matrix.m42;
        } else {
          currentX = initialRect.left;
          currentY = initialRect.top;
        }
        targetX = currentX;
        targetY = currentY;
        document.body.style.userSelect = "none";
        iMoveThings.classList.add("bm-dragging");
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("mouseup", endDrag);
        document.addEventListener("touchend", endDrag);
        document.addEventListener("touchcancel", endDrag);
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        updatePosition();
      };
      const endDrag = () => {
        isDragging = false;
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        document.body.style.userSelect = "";
        iMoveThings.classList.remove("bm-dragging");
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("mouseup", endDrag);
        document.removeEventListener("touchend", endDrag);
        document.removeEventListener("touchcancel", endDrag);
      };
      const onMouseMove = (event) => {
        if (isDragging && initialRect) {
          targetX = event.clientX - offsetX;
          targetY = event.clientY - offsetY;
        }
      };
      const onTouchMove = (event) => {
        if (isDragging && initialRect) {
          const touch = event.touches[0];
          if (!touch) return;
          targetX = touch.clientX - offsetX;
          targetY = touch.clientY - offsetY;
          event.preventDefault();
        }
      };
      iMoveThings.addEventListener("mousedown", function(event) {
        event.preventDefault();
        startDrag(event.clientX, event.clientY);
      });
      iMoveThings.addEventListener("touchstart", function(event) {
        const touch = event?.touches?.[0];
        if (!touch) {
          return;
        }
        startDrag(touch.clientX, touch.clientY);
        event.preventDefault();
      }, { passive: false });
    }
    /** Manages the logic required to maintain the draw depth order.
     * Manages z-index offset... because thats what draw depth is for.
     * Automatically moves windows' draw depth to insert this window's draw depth.
     * If draw depth is omited, the window is added to the top.
     * The primary purpose of requesting draw depth is to draw all windows in the same order they were in during the last cold save.
     * (i.e. if you refresh the tab, your overlapping windows will be stacked exactly the same as before you refreshed)
     * If the window does not exist in the DOM tree, and the window is being built, don't request a draw depth.
     * If the window exists in the DOM tree, and the window is being built, the draw depth should be requested.
     * The window must have a Blue Marble ID. This should always be true, unless you try to apply draw depth to something that is *not* a Blue Marble window.
     * 
     * @param {number} [requestedDrawDepth] - The draw depth to (possibly) be inserted at
     * @returns {number} The draw depth your new window will use
     * @since 0.92.92
     */
    handleDrawDepth(requestedDrawDepth) {
      if (requestedDrawDepth < 0 || requestedDrawDepth > 91 || typeof requestedDrawDepth !== "number" || !Number.isInteger(requestedDrawDepth)) {
        consoleWarn(`Window requested invalid draw depth (${typeof requestedDrawDepth}: ${requestedDrawDepth})! The window will be put on top.`);
        requestedDrawDepth = void 0;
      }
      if (typeof requestedDrawDepth !== "undefined" && !document.querySelector(`body [id^="bm-"][data-draw-depth="${requestedDrawDepth}"]`)) {
        return requestedDrawDepth;
      }
      const windows = document.querySelectorAll('body [id^="bm-"][data-draw-depth]');
      if (windows.length >= 92) {
        consoleWarn(`Maximum draw depth reached! For as long as 92 windows are open, new windows will overload the highest draw depth.`);
        this.handleDisplayError("Maximum draw depth reached! Close some windows!");
        return 91;
      }
      const windowsSortedAsc = Array.from(windows).sort((a, b) => Number(a.dataset["drawDepth"]) - Number(b.dataset["drawDepth"]));
      if (document.querySelector('[id^="bm-"][data-draw-depth="91"]')) {
        consoleInfo(`Maximum draw depth reached! Defragmenting the depth list...`);
        windowsSortedAsc.forEach((bmWindow, index) => {
          bmWindow.dataset["drawDepth"] = index;
          bmWindow.style.zIndex = 9e3 + index;
        });
      }
      if (typeof requestedDrawDepth === "undefined") {
        return Number(windowsSortedAsc[windowsSortedAsc.length - 1]?.dataset["drawDepth"]) + 1;
      }
      const windowsSortedDesc = windowsSortedAsc.slice().reverse();
      windowsSortedDesc.forEach((windowElement) => {
        const drawDepth = Number(windowElement.dataset["drawDepth"]);
        if (drawDepth >= requestedDrawDepth) {
          windowElement.dataset["drawDepth"] = drawDepth + 1;
          windowElement.style.zIndex = 9e3 + drawDepth + 1;
        }
      });
      return requestedDrawDepth;
    }
    /** Handles status display.
     * This will output plain text into the output Status box.
     * Additionally, this will output an info message to the console.
     * @param {string} text - The status text to display.
     * @since 0.58.4
     */
    handleDisplayStatus(text) {
      const consoleInfo2 = console.info;
      consoleInfo2(`${this.name}: ${text}`);
      this.updateInnerHTML(this.outputStatusId, "Status: " + text, true);
    }
    /** Handles error display.
     * This will output plain text into the output Status box.
     * Additionally, this will output an error to the console.
     * @param {string} text - The error text to display.
     * @since 0.41.6
     */
    handleDisplayError(text) {
      const consoleError2 = console.error;
      consoleError2(`${this.name}: ${text}`);
      this.updateInnerHTML(this.outputStatusId, "Error: " + text, true);
    }
  };
  _Overlay_instances = new WeakSet();
  /** Creates an element.
   * For **internal use** of the {@link Overlay} class.
   * @param {string} tag - The tag name as a string.
   * @param {Object.<string, any>} [properties={}] - The DOM properties of the element.
   * @returns {HTMLElement} HTML Element
   * @since 0.43.2
   */
  createElement_fn = function(tag, properties = {}, additionalProperties = {}) {
    const element = document.createElement(tag);
    if (!this.overlay) {
      this.overlay = element;
      this.currentParent = element;
    } else {
      this.currentParent?.appendChild(element);
      this.parentStack.push(this.currentParent);
      this.currentParent = element;
    }
    for (const [property, value] of Object.entries(properties)) {
      __privateMethod(this, _Overlay_instances, applyAttribute_fn).call(this, element, property, value);
    }
    for (const [property, value] of Object.entries(additionalProperties)) {
      __privateMethod(this, _Overlay_instances, applyAttribute_fn).call(this, element, property, value);
    }
    return element;
  };
  /** Applies an attribute to an element
   * @param {HTMLElement} element - The element to apply the attribute to
   * @param {String} property - The name of the attribute to apply
   * @param {String} value - The value of the attribute
   * @since 0.88.136
   */
  applyAttribute_fn = function(element, property, value) {
    if (property == "class") {
      element.classList.add(...value.split(/\s+/));
    } else if (property == "for") {
      element.htmlFor = value;
    } else if (property == "tabindex") {
      element.tabIndex = Number(value);
    } else if (property == "readonly") {
      element.readOnly = value == "true" || value == "1";
    } else if (property == "maxlength") {
      element.maxLength = Number(value);
    } else if (property.startsWith("data")) {
      element.dataset[property.slice(5).split("-").map(
        (part, i) => i == 0 ? part : part[0].toUpperCase() + part.slice(1)
      ).join("")] = value;
    } else if (property.startsWith("aria")) {
      element.setAttribute(property, value);
    } else {
      element[property] = value;
    }
  };

  // src/utils.js
  function getWplaceVersion() {
    const wplaceVersionElement = [...document.querySelectorAll(`body > div > .hidden`)].filter((match) => /version:/i.test(match.textContent));
    if (wplaceVersionElement[0]) {
      const wplaceUpdateTime = wplaceVersionElement[0].textContent?.match(/\d+/);
      return wplaceUpdateTime ? new Date(Number(wplaceUpdateTime[0])) : void 0;
    }
    return void 0;
  }
  function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
  function localizeNumber(number) {
    const numberFormat = new Intl.NumberFormat();
    return numberFormat.format(number);
  }
  function localizePercent(percent) {
    const percentFormat = new Intl.NumberFormat(void 0, {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return percentFormat.format(percent);
  }
  function localizeDate(date) {
    const options = {
      month: "long",
      // July
      day: "numeric",
      // 23
      hour: "2-digit",
      // 17
      minute: "2-digit",
      // 47
      second: "2-digit"
      // 00
    };
    return date.toLocaleString(void 0, options);
  }
  function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  function serverTPtoDisplayTP(tile, pixel) {
    return [parseInt(tile[0]) % 4 * 1e3 + parseInt(pixel[0]), parseInt(tile[1]) % 4 * 1e3 + parseInt(pixel[1])];
  }
  function consoleLog(...args) {
    ((consoleLog2) => consoleLog2(...args))(console.log);
  }
  function consoleInfo(...args) {
    ((consoleInfo2) => consoleInfo2(...args))(console.info);
  }
  function consoleError(...args) {
    ((consoleError2) => consoleError2(...args))(console.error);
  }
  function consoleWarn2(...args) {
    ((consoleWarn3) => consoleWarn3(...args))(console.warn);
  }
  var defaultEncoding = "!#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";
  function numberToEncoded(number, encoding = defaultEncoding) {
    if (typeof number !== "number") {
      new Overlay().handleDisplayError(`numberToEncoded() recieved '${typeof number}' and crashed BM to minimize data loss.`);
      throw new Error(`numberToEncoded expected a number, but recieved a ${typeof number}! Value: ${number}`);
    }
    if (number === 0) return encoding[0];
    let result = "";
    const base = encoding.length;
    while (number > 0) {
      result = encoding[number % base] + result;
      number = Math.floor(number / base);
    }
    return result;
  }
  function encodedToNumber(encoded, encoding = defaultEncoding) {
    if (typeof encoded !== "string") {
      consoleWarn2(`Invalid encoded string passed into encodedToNumber()! Expected string type, but recieved ${typeof encoded}.
Returning zero...`);
      return 0;
    }
    let decodedNumber = 0;
    const base = encoding.length;
    for (const character of encoded) {
      const decodedCharacter = encoding.indexOf(character);
      if (decodedCharacter == -1) {
        consoleError(`Invalid character '${character}' encountered whilst decoding in encodedToNumber()! Is the decode alphabet/base incorrect?`);
      }
      decodedNumber = decodedNumber * base + decodedCharacter;
    }
    return decodedNumber;
  }
  function uint8ToBase64(uint8) {
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }
  function base64ToUint8(base64) {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return array;
  }
  function set32BitPosition(number, position, value) {
    let modifiedNumber = void 0;
    const mask = 1 << position;
    if (value) {
      modifiedNumber = number | mask;
    } else {
      modifiedNumber = number & ~mask;
    }
    return modifiedNumber >>> 0;
  }
  function numberUnsignedTo32BitBooleanArray(number) {
    if (!Number.isInteger(number) || number < 0 || number > 4294967295) {
      consoleError(`Tried to convert an unsigned 32-bit number to a boolean array, but the ${typeof number} value passed in was not valid! Value: ${number}. Returning zeros...`);
      const zeros = [];
      for (let i = 0; i <= 31; i++) {
        zeros[i] = false;
      }
      return zeros;
    }
    const outputArray = [];
    for (let bitIndex = 0; bitIndex <= 31; bitIndex++) {
      outputArray[bitIndex] = (number & 1 << bitIndex) !== 0;
    }
    return outputArray;
  }
  async function getClipboardData(event = void 0) {
    let data = "";
    if (event) {
      data = event.clipboardData.getData("text/plain");
    }
    if (data.length != 0) {
      return data;
    }
    await navigator.clipboard.readText().then((text) => {
      data = text;
    }).catch((error) => {
      consoleLog(`Failed to retrieve clipboard data using navigator! Using fallback methods...`);
    });
    if (data.length != 0) {
      return data;
    }
    data = window.clipboardData?.getData("Text");
    return data;
  }
  function calculateRelativeLuminance(array) {
    const srgb = array.map((channel) => {
      channel /= 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }
  function rgbToHex(red, green, blue) {
    if (Array.isArray(red)) {
      [red, green, blue] = red;
    }
    return (1 << 24 | red << 16 | green << 8 | blue).toString(16).slice(1);
  }
  function colorpaletteForBlueMarble(tolerance) {
    const colorpaletteBM = colorpalette;
    colorpaletteBM.unshift({ "id": -1, "premium": false, "name": "Erased", "rgb": [222, 250, 206] });
    colorpaletteBM.unshift({ "id": -2, "premium": false, "name": "Other", "rgb": [0, 0, 0] });
    const lookupTable = /* @__PURE__ */ new Map();
    for (const color of colorpaletteBM) {
      if (color.id == 0 || color.id == -2) continue;
      const targetRed = color.rgb[0];
      const targetGreen = color.rgb[1];
      const targetBlue = color.rgb[2];
      for (let deltaRedRange = -tolerance; deltaRedRange <= tolerance; deltaRedRange++) {
        for (let deltaGreenRange = -tolerance; deltaGreenRange <= tolerance; deltaGreenRange++) {
          for (let deltaBlueRange = -tolerance; deltaBlueRange <= tolerance; deltaBlueRange++) {
            const derivativeRed = targetRed + deltaRedRange;
            const derivativeGreen = targetGreen + deltaGreenRange;
            const derivativeBlue = targetBlue + deltaBlueRange;
            if (derivativeRed < 0 || derivativeRed > 255 || derivativeGreen < 0 || derivativeGreen > 255 || derivativeBlue < 0 || derivativeBlue > 255) continue;
            const derivativeColor32 = (255 << 24 | derivativeBlue << 16 | derivativeGreen << 8 | derivativeRed) >>> 0;
            if (!lookupTable.has(derivativeColor32)) {
              lookupTable.set(derivativeColor32, color.id);
            }
          }
        }
      }
    }
    return { palette: colorpaletteBM, LUT: lookupTable };
  }
  var colorpalette = [
    { "id": 0, "premium": false, "name": "Transparent", "rgb": [0, 0, 0] },
    { "id": 1, "premium": false, "name": "Black", "rgb": [0, 0, 0] },
    { "id": 2, "premium": false, "name": "Dark Gray", "rgb": [60, 60, 60] },
    { "id": 3, "premium": false, "name": "Gray", "rgb": [120, 120, 120] },
    { "id": 4, "premium": false, "name": "Light Gray", "rgb": [210, 210, 210] },
    { "id": 5, "premium": false, "name": "White", "rgb": [255, 255, 255] },
    { "id": 6, "premium": false, "name": "Deep Red", "rgb": [96, 0, 24] },
    { "id": 7, "premium": false, "name": "Red", "rgb": [237, 28, 36] },
    { "id": 8, "premium": false, "name": "Orange", "rgb": [255, 127, 39] },
    { "id": 9, "premium": false, "name": "Gold", "rgb": [246, 170, 9] },
    { "id": 10, "premium": false, "name": "Yellow", "rgb": [249, 221, 59] },
    { "id": 11, "premium": false, "name": "Light Yellow", "rgb": [255, 250, 188] },
    { "id": 12, "premium": false, "name": "Dark Green", "rgb": [14, 185, 104] },
    { "id": 13, "premium": false, "name": "Green", "rgb": [19, 230, 123] },
    { "id": 14, "premium": false, "name": "Light Green", "rgb": [135, 255, 94] },
    { "id": 15, "premium": false, "name": "Dark Teal", "rgb": [12, 129, 110] },
    { "id": 16, "premium": false, "name": "Teal", "rgb": [16, 174, 166] },
    { "id": 17, "premium": false, "name": "Light Teal", "rgb": [19, 225, 190] },
    { "id": 18, "premium": false, "name": "Dark Blue", "rgb": [40, 80, 158] },
    { "id": 19, "premium": false, "name": "Blue", "rgb": [64, 147, 228] },
    { "id": 20, "premium": false, "name": "Cyan", "rgb": [96, 247, 242] },
    { "id": 21, "premium": false, "name": "Indigo", "rgb": [107, 80, 246] },
    { "id": 22, "premium": false, "name": "Light Indigo", "rgb": [153, 177, 251] },
    { "id": 23, "premium": false, "name": "Dark Purple", "rgb": [120, 12, 153] },
    { "id": 24, "premium": false, "name": "Purple", "rgb": [170, 56, 185] },
    { "id": 25, "premium": false, "name": "Light Purple", "rgb": [224, 159, 249] },
    { "id": 26, "premium": false, "name": "Dark Pink", "rgb": [203, 0, 122] },
    { "id": 27, "premium": false, "name": "Pink", "rgb": [236, 31, 128] },
    { "id": 28, "premium": false, "name": "Light Pink", "rgb": [243, 141, 169] },
    { "id": 29, "premium": false, "name": "Dark Brown", "rgb": [104, 70, 52] },
    { "id": 30, "premium": false, "name": "Brown", "rgb": [149, 104, 42] },
    { "id": 31, "premium": false, "name": "Beige", "rgb": [248, 178, 119] },
    { "id": 32, "premium": true, "name": "Medium Gray", "rgb": [170, 170, 170] },
    { "id": 33, "premium": true, "name": "Dark Red", "rgb": [165, 14, 30] },
    { "id": 34, "premium": true, "name": "Light Red", "rgb": [250, 128, 114] },
    { "id": 35, "premium": true, "name": "Dark Orange", "rgb": [228, 92, 26] },
    { "id": 36, "premium": true, "name": "Light Tan", "rgb": [214, 181, 148] },
    { "id": 37, "premium": true, "name": "Dark Goldenrod", "rgb": [156, 132, 49] },
    { "id": 38, "premium": true, "name": "Goldenrod", "rgb": [197, 173, 49] },
    { "id": 39, "premium": true, "name": "Light Goldenrod", "rgb": [232, 212, 95] },
    { "id": 40, "premium": true, "name": "Dark Olive", "rgb": [74, 107, 58] },
    { "id": 41, "premium": true, "name": "Olive", "rgb": [90, 148, 74] },
    { "id": 42, "premium": true, "name": "Light Olive", "rgb": [132, 197, 115] },
    { "id": 43, "premium": true, "name": "Dark Cyan", "rgb": [15, 121, 159] },
    { "id": 44, "premium": true, "name": "Light Cyan", "rgb": [187, 250, 242] },
    { "id": 45, "premium": true, "name": "Light Blue", "rgb": [125, 199, 255] },
    { "id": 46, "premium": true, "name": "Dark Indigo", "rgb": [77, 49, 184] },
    { "id": 47, "premium": true, "name": "Dark Slate Blue", "rgb": [74, 66, 132] },
    { "id": 48, "premium": true, "name": "Slate Blue", "rgb": [122, 113, 196] },
    { "id": 49, "premium": true, "name": "Light Slate Blue", "rgb": [181, 174, 241] },
    { "id": 50, "premium": true, "name": "Light Brown", "rgb": [219, 164, 99] },
    { "id": 51, "premium": true, "name": "Dark Beige", "rgb": [209, 128, 81] },
    { "id": 52, "premium": true, "name": "Light Beige", "rgb": [255, 197, 165] },
    { "id": 53, "premium": true, "name": "Dark Peach", "rgb": [155, 82, 73] },
    { "id": 54, "premium": true, "name": "Peach", "rgb": [209, 128, 120] },
    { "id": 55, "premium": true, "name": "Light Peach", "rgb": [250, 182, 164] },
    { "id": 56, "premium": true, "name": "Dark Tan", "rgb": [123, 99, 82] },
    { "id": 57, "premium": true, "name": "Tan", "rgb": [156, 132, 107] },
    { "id": 58, "premium": true, "name": "Dark Slate", "rgb": [51, 57, 65] },
    { "id": 59, "premium": true, "name": "Slate", "rgb": [109, 117, 141] },
    { "id": 60, "premium": true, "name": "Light Slate", "rgb": [179, 185, 209] },
    { "id": 61, "premium": true, "name": "Dark Stone", "rgb": [109, 100, 63] },
    { "id": 62, "premium": true, "name": "Stone", "rgb": [148, 140, 107] },
    { "id": 63, "premium": true, "name": "Light Stone", "rgb": [205, 197, 158] }
  ];

  // src/WindowSettings.js
  var _WindowSettings_instances, errorOverrideFailure_fn;
  var WindowSettings = class extends Overlay {
    /** Constructor for the Settings window
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @since 0.91.11
     * @see {@link Overlay#constructor} for examples
     */
    constructor(name2, version2) {
      super(name2, version2);
      __privateAdd(this, _WindowSettings_instances);
      this.window = null;
      this.windowID = "bm-window-settings";
      this.windowParent = document.body;
    }
    /** Spawns a Settings window.
     * If another settings window already exists, we DON'T spawn another!
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.91.11
     */
    buildWindow() {
      if (document.querySelector(`#${this.windowID}`)) {
        document.querySelector(`#${this.windowID}`).remove();
        return;
      }
      this.window = this.addDiv({ "id": this.windowID, "class": "bm-window" }).addDragbar().addButton({ "class": "bm-button-circle", "textContent": "\u25BC", "aria-label": 'Minimize window "Color Filter"', "data-button-status": "expanded" }, (instance, button) => {
        button.onclick = () => instance.handleMinimization(button);
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addDiv().buildElement().addDiv({ "class": "bm-flex-center" }).addButton({ "class": "bm-button-circle", "textContent": "\u2716", "aria-label": 'Close window "Color Filter"' }, (instance, button) => {
        button.onclick = () => {
          document.querySelector(`#${this.windowID}`)?.remove();
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().buildElement().buildElement().addDiv({ "class": "bm-window-content" }).addDiv({ "class": "bm-container bm-center-vertically" }).addHeader(1, { "textContent": "Settings" }).buildElement().buildElement().addHr().buildElement().addP({ "textContent": "Settings take 2 seconds to save." }).buildElement().addDiv({ "class": "bm-container bm-scrollable" }, (instance, div) => {
        this.buildHighlight();
        this.buildTemplate();
      }).buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
      this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
    }
    /** Builds the highlight section of the window.
     * This should be overriden by {@link SettingsManager}
     * @since 0.91.11
     */
    buildHighlight() {
      __privateMethod(this, _WindowSettings_instances, errorOverrideFailure_fn).call(this, "Pixel Highlight");
    }
    /** Builds the template section of the window.
     * This should be overriden by {@link SettingsManager}
     * @since 0.91.68
     */
    buildTemplate() {
      __privateMethod(this, _WindowSettings_instances, errorOverrideFailure_fn).call(this, "Template");
    }
  };
  _WindowSettings_instances = new WeakSet();
  /** Displays an error when a settings category fails to load.
   * @param {string} name - The name of the category
   * @since 0.91.11
   */
  errorOverrideFailure_fn = function(name2) {
    this.window = this.addDiv({ "class": "bm-container" }).addHeader(2, { "textContent": name2 }).buildElement().addHr().buildElement().addP({ "innerHTML": `An error occured loading the ${name2} category. <code>SettingsManager</code> failed to override the ${name2} function inside <code>WindowSettings</code>.` }).buildElement().buildElement();
  };

  // src/settingsManager.js
  var _windowStatesObject, _windowStatesObjectEncoded, _SettingsManager_instances, updateHighlightSettings_fn, updateHighlightToPreset_fn, updateFilteredColors_fn, updateWindowState_fn, decodeWindowStateToObject_fn;
  var SettingsManager = class extends WindowSettings {
    /** Constructor for the SettingsManager class
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @param {Object} userSettings - The user settings as an object
     * @since 0.91.11
     */
    constructor(name2, version2, userSettings) {
      var _a;
      super(name2, version2);
      __privateAdd(this, _SettingsManager_instances);
      __privateAdd(this, _windowStatesObject);
      __privateAdd(this, _windowStatesObjectEncoded);
      this.zerothEncodingAlphabetCharacter = numberToEncoded(0);
      this.onethEncodingAlphabetCharacter = numberToEncoded(1);
      this.windowMain = null;
      this.templateManager = null;
      this.apiManager = null;
      this.userSettings = userSettings;
      (_a = this.userSettings).flags ?? (_a.flags = []);
      this.userSettingsOld = structuredClone(this.userSettings);
      this.userSettingsSaveLocation = "bmUserSettings";
      this.commonStatesByteLength = 8;
      __privateSet(this, _windowStatesObjectEncoded, this.userSettings?.windowStates ?? {});
      __privateSet(this, _windowStatesObject, __privateMethod(this, _SettingsManager_instances, decodeWindowStateToObject_fn).call(this, __privateGet(this, _windowStatesObjectEncoded)) ?? {});
      this.commonWindowStateTranslateRegEx = new RegExp(/translate\((-?\d*\.?\d*)\w*\s*,?\s*(-?\d*\.?\d*)/i);
      this.updateFrequency = 2e3;
      this.lastUpdateTime = 0;
      setInterval(__privateMethod(this, _SettingsManager_instances, updateWindowState_fn).bind(this), this.updateFrequency * 0.6);
      setInterval(this.updateUserStorage.bind(this), this.updateFrequency);
    }
    /** Updates the user settings in userscript storage
     * @since 0.91.39
     */
    async updateUserStorage() {
      await __privateMethod(this, _SettingsManager_instances, updateFilteredColors_fn).call(this);
      this.userSettings["windowStates"] = __privateGet(this, _windowStatesObjectEncoded);
      const userSettingsCurrent = JSON.stringify(this.userSettings);
      const userSettingsOld = JSON.stringify(this.userSettingsOld);
      if (userSettingsCurrent != userSettingsOld && Date.now() - this.lastUpdateTime > this.updateFrequency) {
        await GM.setValue(this.userSettingsSaveLocation, userSettingsCurrent);
        this.userSettingsOld = structuredClone(this.userSettings);
        this.lastUpdateTime = Date.now();
        console.log(userSettingsCurrent);
      }
    }
    /** Toggles a boolean flag to the state that was passed in.
     * If no state was passed in, the flag will flip to the opposite state.
     * The existence of the flag determines its state. If it exists, it is `true`.
     * @param {string} flagName - The name of the flag to toggle
     * @param {boolean} [state=undefined] - (Optional) The state to change the flag to
     * @since 0.91.60
     */
    toggleFlag(flagName, state = void 0) {
      const flagIndex = this.userSettings?.flags?.indexOf(flagName) ?? -1;
      if (flagIndex != -1 && state !== true) {
        this.userSettings?.flags?.slice(flagIndex, 1);
      } else if (flagIndex == -1 && state !== false) {
        this.userSettings?.flags?.push(flagName);
      }
    }
    // This is one of the most insane OOP setups I have ever laid my eyes on
    /** Builds the "highlight" category of the settings window
     * @since 0.91.18
     * @see WindowSettings#buildHighlight
     */
    buildHighlight() {
      const highlightPresetOff = '<svg viewBox="0 0 3 3"><path d="M0,0H3V3H0ZM0,1H3M0,2H3M1,0V3M2,0V3" fill="#fff"/><path d="M1,1H2V2H1Z" fill="#2f4f4f"/></svg>';
      const highlightPresetCross = '<svg viewBox="0 0 3 3"><path d="M0,0H3V3H0Z" fill="#fff"/><path d="M1,0H2V1H3V2H2V3H1V2H0V1H1Z" fill="brown"/><path d="M1,1H2V2H1Z" fill="#2f4f4f"/></svg>';
      const storedHighlight = this.userSettings?.highlight ?? [[1, 0, 1], [2, 0, 0], [1, -1, 0], [1, 1, 0], [1, 0, -1]];
      this.window = this.addDiv({ "class": "bm-container" }).addHeader(2, { "textContent": "Pixel Highlight" }).buildElement().addHr().buildElement().addDiv({ "class": "bm-container", "style": "margin-left: 1.5ch;" }).addCheckbox({ "textContent": "Highlight transparent pixels" }, (instance, label, checkbox) => {
        checkbox.checked = !this.userSettings?.flags?.includes("hl-noTrans");
        checkbox.onchange = (event) => this.toggleFlag("hl-noTrans", !event.target.checked);
      }).buildElement().addP({ "id": "bm-highlight-preset-label", "textContent": "Choose a preset:", "style": "font-weight: 700;" }).buildElement().addDiv({ "class": "bm-flex-center", "role": "group", "aria-labelledby": "bm-highlight-preset-label" }).addDiv({ "class": "bm-highlight-preset-container" }).addSpan({ "textContent": "None" }).buildElement().addButton({ "innerHTML": highlightPresetOff, "aria-label": 'Preset "None"' }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _SettingsManager_instances, updateHighlightToPreset_fn).call(this, "None");
      }).buildElement().buildElement().addDiv({ "class": "bm-highlight-preset-container" }).addSpan({ "textContent": "Cross" }).buildElement().addButton({ "innerHTML": highlightPresetCross, "aria-label": 'Preset "Cross Shape"' }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _SettingsManager_instances, updateHighlightToPreset_fn).call(this, "Cross");
      }).buildElement().buildElement().addDiv({ "class": "bm-highlight-preset-container" }).addSpan({ "textContent": "X" }).buildElement().addButton({ "innerHTML": highlightPresetCross.replace('d="M1,0H2V1H3V2H2V3H1V2H0V1H1Z"', 'd="M0,0V1H3V0H2V3H3V2H0V3H1V0Z"'), "aria-label": 'Preset "X Shape"' }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _SettingsManager_instances, updateHighlightToPreset_fn).call(this, "X");
      }).buildElement().buildElement().addDiv({ "class": "bm-highlight-preset-container" }).addSpan({ "textContent": "Full" }).buildElement().addButton({ "innerHTML": highlightPresetOff.replace("#fff", "#2f4f4f"), "aria-label": 'Preset "Full Template"' }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _SettingsManager_instances, updateHighlightToPreset_fn).call(this, "Full");
      }).buildElement().buildElement().buildElement().addP({ "id": "bm-highlight-grid-label", "textContent": "Create a custom pattern:", "style": "font-weight: 700;" }).buildElement().addDiv({ "class": "bm-highlight-grid", "role": "group", "aria-labelledby": "bm-highlight-grid-label" });
      for (let buttonY = -1; buttonY <= 1; buttonY++) {
        for (let buttonX = -1; buttonX <= 1; buttonX++) {
          const buttonState = storedHighlight[storedHighlight.findIndex(([, x, y]) => x == buttonX && y == buttonY)]?.[0] ?? 0;
          let buttonStateName = "Disabled";
          if (buttonState == 1) {
            buttonStateName = "Incorrect";
          } else if (buttonState == 2) {
            buttonStateName = "Template";
          }
          this.window = this.addButton({
            "data-status": buttonStateName,
            "aria-label": `Sub-pixel ${buttonStateName.toLowerCase()}`
          }, (instance, button) => {
            button.onclick = () => __privateMethod(this, _SettingsManager_instances, updateHighlightSettings_fn).call(this, button, [buttonX, buttonY]);
          }).buildElement();
        }
      }
      this.window = this.buildElement().buildElement().buildElement();
    }
    /** Decodes the filtered color bit flags that came from user storage.
     * @param {string} encodedString - The filtered color save-state from user storage
     * @returns {Map<number, boolean>} A map containing only entries of colors to filter
     * @since 0.92.18
     */
    decodeFilteredColorBitFlags(encodedString) {
      const shouldColorBeFiltered = /* @__PURE__ */ new Map();
      if (typeof encodedString !== "string") {
        consoleWarn2("Could not decode filtered colors from user storage! Either the filtered colors are not stored as a string, or the user storage does not exist. Assuming no colors are filtered...");
        return shouldColorBeFiltered;
      }
      if (!encodedString || encodedString == this.zerothEncodingAlphabetCharacter.repeat(15)) {
        return shouldColorBeFiltered;
      }
      const minSupportedBitFlag = -32;
      const maxSupportedBitFlag = 63;
      const supportedEncodedBitFlags = encodedString.slice(0, 15);
      const bitFlagsNegSmall = encodedToNumber(supportedEncodedBitFlags.slice(0, 5));
      const bitFlagsPosSmall = encodedToNumber(supportedEncodedBitFlags.slice(5, 10));
      const bitFlagsPosLarge = encodedToNumber(supportedEncodedBitFlags.slice(10, 15));
      for (let id = minSupportedBitFlag; id <= maxSupportedBitFlag; id++) {
        let isBitTrue = false;
        if (id >= -32 && id <= -1) {
          isBitTrue = (bitFlagsNegSmall & 1 << id + 32) !== 0;
        } else if (id >= 0 && id <= 31) {
          isBitTrue = (bitFlagsPosSmall & 1 << id) !== 0;
        } else if (id >= 32 && id <= 63) {
          isBitTrue = (bitFlagsPosLarge & 1 << id - 32) !== 0;
        }
        if (isBitTrue) {
          shouldColorBeFiltered.set(id, true);
        }
      }
      return shouldColorBeFiltered;
    }
    /** Build the "template" category of settings window
     * @since 0.91.68
     * @see WindowSettings#buildTemplate
     */
    buildTemplate() {
      this.window = this.addDiv({ "class": "bm-container" }).addHeader(2, { "textContent": "Template" }).buildElement().addHr().buildElement().addDiv({ "class": "bm-container", "style": "margin-left: 1.5ch;" }).addCheckbox({ "textContent": "Template creation should skip transparent tiles" }, (instance, label, checkbox) => {
        checkbox.checked = !this.userSettings?.flags?.includes("hl-noSkip");
        checkbox.onchange = (event) => this.toggleFlag("hl-noSkip", !event.target.checked);
      }).buildElement().addCheckbox({ "innerHTML": "Experimental: Template creation should <em>aggressively</em> skip transparent tiles" }, (instance, label, checkbox) => {
        checkbox.checked = this.userSettings?.flags?.includes("hl-agSkip");
        checkbox.onchange = (event) => this.toggleFlag("hl-agSkip", event.target.checked);
      }).buildElement().buildElement().buildElement();
    }
    /** Returns the decoded window states
     * @since 0.92.69
     * @returns {Object} An object containing window states
     */
    getWindowStatesObject() {
      console.log("#windowStatesObject: ", __privateGet(this, _windowStatesObject));
      return __privateGet(this, _windowStatesObject);
    }
    /** Returns the corresponding variable's value from the window state.
     * This was specifically so an enum value could be passed in as the `index`.
     * @param {string} tinyID - The ID for the window that is ONLY used inside user storage
     * @param {number} index - The Array index that contains the value
     * @since 0.92.77
     * @returns {number | boolean}
     */
    getWindowStateVariable(tinyID, index) {
      if (typeof tinyID !== "string" || typeof index !== "number") {
        consoleError(`Attempted to get window state variable with type (string, number), but recieved type (${typeof tinyID}, ${typeof index}) instead! Value: (${tinyID}, ${index})
Returning zero...`);
        return 0;
      }
      const windowState = __privateGet(this, _windowStatesObject)?.[tinyID];
      if (!Number.isInteger(index) || index < 0 || index > windowState.length - 1) {
        consoleError(`Attempted to retrieve index ${index} in '${tinyID}' window state, but the index is out-of-bounds! Valid: 0 - ${windowState.length - 1}
 Returning zero...`);
        return 0;
      }
      return windowState[index];
    }
    /** Populates the windowMain variable with the windowMain class.
     * @param {WindowMain} windowMain - The windowMain class instance
     * @since 0.92.23
     */
    setWindowMain(windowMain) {
      this.windowMain = windowMain;
    }
    /** Populates the templateManager variable with the templateManager class.
     * @param {TemplateManager} templateManager - The templateManager class instance
     * @since 0.92.22
     */
    setTemplateManager(templateManager) {
      this.templateManager = templateManager;
    }
    /** Populates the apiManager variable with the apiManager class.
     * @param {ApiManager} apiManager - The apiManager class instance
     * @since 0.92.23
     */
    setApiManager(apiManager) {
      this.apiManager = apiManager;
    }
  };
  _windowStatesObject = new WeakMap();
  _windowStatesObjectEncoded = new WeakMap();
  _SettingsManager_instances = new WeakSet();
  /** Updates the display of the highlight buttons in the settings window.
   * Additionally, it will update user settings with the new selection.
   * @param {HTMLButtonElement} button - The button that was pressed
   * @param {Array<number, number>} coords - The relative coordinates of the button
   * @since 0.91.46
   */
  updateHighlightSettings_fn = function(button, coords2) {
    button.disabled = true;
    const status = button.dataset["status"];
    const userStorageOld = this.userSettings?.highlight ?? [[1, 0, 1], [2, 0, 0], [1, -1, 0], [1, 1, 0], [1, 0, -1]];
    let userStorageChange = [2, 0, 0];
    const userStorageNew = userStorageOld;
    switch (status) {
      // If the button was in the "Disabled" state
      case "Disabled":
        button.dataset["status"] = "Incorrect";
        button.ariaLabel = "Sub-pixel incorrect";
        userStorageChange = [1, ...coords2];
        break;
      // If the button was in the "Incorrect" state
      case "Incorrect":
        button.dataset["status"] = "Template";
        button.ariaLabel = "Sub-pixel template";
        userStorageChange = [2, ...coords2];
        break;
      // If the button was in the "Template" state
      case "Template":
        button.dataset["status"] = "Disabled";
        button.ariaLabel = "Sub-pixel disabled";
        userStorageChange = [0, ...coords2];
        break;
    }
    const indexOfChange = userStorageOld.findIndex(([, x, y]) => x == userStorageChange[1] && y == userStorageChange[2]);
    if (userStorageChange[0] != 0) {
      if (indexOfChange != -1) {
        userStorageNew[indexOfChange] = userStorageChange;
      } else {
        userStorageNew.push(userStorageChange);
      }
    } else if (indexOfChange != -1) {
      userStorageNew.slice(indexOfChange, 1);
    }
    this.userSettings["highlight"] = userStorageNew;
    button.disabled = false;
  };
  updateHighlightToPreset_fn = async function(preset) {
    const presetButtons = document.querySelectorAll(".bm-highlight-preset-container button");
    for (const button of presetButtons) {
      button.disabled = true;
    }
    let presetArray = [0, 0, 0, 0, 2, 0, 0, 0, 0];
    switch (preset) {
      case "Cross":
        presetArray = [0, 1, 0, 1, 2, 1, 0, 1, 0];
        break;
      case "X":
        presetArray = [1, 0, 1, 0, 2, 0, 1, 0, 1];
        break;
      case "Full":
        presetArray = [2, 2, 2, 2, 2, 2, 2, 2, 2];
        break;
    }
    const buttons = document.querySelector(".bm-highlight-grid")?.childNodes ?? [];
    for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {
      const button = buttons[buttonIndex];
      let buttonState = button.dataset["status"];
      buttonState = buttonState != "Disabled" ? buttonState != "Incorrect" ? 2 : 1 : 0;
      let buttonStateDelta = presetArray[buttonIndex] - buttonState;
      if (buttonStateDelta == 0) {
        continue;
      }
      buttonStateDelta += buttonStateDelta < 0 ? 3 : 0;
      button.click();
      if (buttonStateDelta == 2) {
        for (let timeWaited = 0; timeWaited < 200; timeWaited += 10) {
          if (!button.disabled) {
            break;
          }
          await sleep(10);
        }
        button.click();
      }
    }
    for (const button of presetButtons) {
      button.disabled = false;
    }
  };
  updateFilteredColors_fn = async function() {
    const filteredColorMap = this.templateManager.shouldFilterColor;
    if (!filteredColorMap.size) {
      this.userSettings.filter = this.zerothEncodingAlphabetCharacter.repeat(15);
      return;
    }
    let mutableBitFlagsNegSmall = 0;
    let mutableBitFlagsPosSmall = 0;
    let mutableBitFlagsPosLarge = 0;
    for (const [id, value] of filteredColorMap) {
      if (id >= -32 && id <= -1) {
        mutableBitFlagsNegSmall = set32BitPosition(mutableBitFlagsNegSmall, id + 32, value);
      } else if (id >= 0 && id <= 31) {
        mutableBitFlagsPosSmall = set32BitPosition(mutableBitFlagsPosSmall, id, value);
      } else if (id >= 32 && id <= 63) {
        mutableBitFlagsPosLarge = set32BitPosition(mutableBitFlagsPosLarge, id - 32, value);
      } else {
        consoleError(`Attempted to store filter color with ID #${id} but this ID number is out of bounds (-32 to 63)! The color will not be stored.`);
      }
    }
    const encodedBitFlags = numberToEncoded(mutableBitFlagsNegSmall).padStart(5, this.zerothEncodingAlphabetCharacter) + numberToEncoded(mutableBitFlagsPosSmall).padStart(5, this.zerothEncodingAlphabetCharacter) + numberToEncoded(mutableBitFlagsPosLarge).padStart(5, this.zerothEncodingAlphabetCharacter);
    this.userSettings.filter = encodedBitFlags;
  };
  /** Retrieves all window states, and *overrides* the user storage version stored in `this.userStorage.windowStates`.
   * This encodes window states.
   * @since 0.92.23
   */
  updateWindowState_fn = function() {
    const obtainCommonStates = (windowElement, userStorageID) => {
      console.log(__privateGet(this, _windowStatesObjectEncoded)?.[userStorageID]?.slice(0, this.commonStatesByteLength) ?? this.zerothEncodingAlphabetCharacter.repeat(this.commonStatesByteLength));
      const commonStatesOld = __privateGet(this, _windowStatesObjectEncoded)?.[userStorageID]?.slice(0, this.commonStatesByteLength) ?? this.zerothEncodingAlphabetCharacter.repeat(this.commonStatesByteLength);
      if (!windowElement) {
        return commonStatesOld.slice(0, 1) + numberToEncoded(set32BitPosition(encodedToNumber(commonStatesOld.slice(1, 2)), 0, false)) + commonStatesOld.slice(2);
      }
      const drawDepth = Math.max(0, Math.min(Number(windowElement.dataset["drawDepth"] ?? 0), 91));
      let bitFlagsMutable = set32BitPosition(0, 0, true);
      const windowMinimizationButton = windowElement.querySelector("button[data-button-status]");
      const isWindowMinimized = windowMinimizationButton?.dataset["buttonStatus"] == "collapsed";
      bitFlagsMutable = set32BitPosition(bitFlagsMutable, 1, isWindowMinimized);
      const windowStyle = windowElement.style;
      const matches = this.commonWindowStateTranslateRegEx.exec(windowStyle.getPropertyValue("transform") ?? "");
      bitFlagsMutable = set32BitPosition(bitFlagsMutable, 2, !!matches);
      const xTransCoord = Number(matches?.[1] ?? 0);
      const yTransCoord = Number(matches?.[2] ?? 0);
      bitFlagsMutable = set32BitPosition(bitFlagsMutable, 3, !(Math.sign(xTransCoord) + 1));
      bitFlagsMutable = set32BitPosition(bitFlagsMutable, 4, !(Math.sign(yTransCoord) + 1));
      const windowCoordinateMaximum = 778687;
      const windowTransX = numberToEncoded(Math.min(Math.abs(xTransCoord), windowCoordinateMaximum));
      const windowTransY = numberToEncoded(Math.min(Math.abs(yTransCoord), windowCoordinateMaximum));
      return numberToEncoded(drawDepth).slice(-1) + numberToEncoded(bitFlagsMutable).slice(-1) + windowTransX.padStart(3, this.zerothEncodingAlphabetCharacter).slice(-3) + windowTransY.padStart(3, this.zerothEncodingAlphabetCharacter).slice(-3);
    };
    const windowMainID = this.windowMain?.windowID;
    const windowMainElement = windowMainID ? document.querySelector("#" + this.windowMain?.windowID) : void 0;
    const windowMainCommonStates = obtainCommonStates(windowMainElement, "bm");
    let windowMainUniqueStatesMutable = 0;
    const windowMainTemplateCoordinateX = Math.min(2047999, Math.max(0, Number(windowMainElement?.querySelector("#bm-input-tx")?.value ?? 0) * 1e3 + Number(windowMainElement?.querySelector("#bm-input-px")?.value ?? 0)));
    const windowMainTemplateCoordinateY = Math.min(2047999, Math.max(0, Number(windowMainElement?.querySelector("#bm-input-ty")?.value ?? 0) * 1e3 + Number(windowMainElement?.querySelector("#bm-input-py")?.value ?? 0)));
    const windowMainState = windowMainCommonStates + numberToEncoded(windowMainUniqueStatesMutable).padStart(2, this.zerothEncodingAlphabetCharacter).slice(-2) + numberToEncoded(windowMainTemplateCoordinateX).padStart(4, this.zerothEncodingAlphabetCharacter).slice(-4) + numberToEncoded(windowMainTemplateCoordinateY).padStart(4, this.zerothEncodingAlphabetCharacter).slice(-4);
    __privateGet(this, _windowStatesObjectEncoded)["bm"] = windowMainState ?? this.zerothEncodingAlphabetCharacter.repeat(18);
  };
  /** Decodes & builds the window state object.
   * This function parses user storage into a readable format,
   * then passes it to the {@link SettingsManager}, which is the owner of the windows state object.
   * @param {Object} windowState - The encoded state of all windows saved in user storage
   * @since 0.92.23
   */
  decodeWindowStateToObject_fn = function(windowState) {
    console.log("Recieved window state to decode: ", windowState);
    const decodeCommonStates = (encodedString) => {
      if (typeof encodedString !== "string" || encodedString.length == 0) {
        consoleWarn2(`Could not decode common states of a window! Expected a 'string' that is ${this.commonStatesByteLength} bytes long, but recieved a '${typeof encodedString}' with value: ${encodedString}
Assuming all common states are zeros...`);
        encodedString = this.zerothEncodingAlphabetCharacter.repeat(this.commonStatesByteLength);
      }
      const drawDepth = encodedToNumber(encodedString.slice(0, 1));
      const bitFlags = encodedToNumber(encodedString.slice(1, 2));
      const isWindowInDOM = (bitFlags & 1 << 0) !== 0;
      const isWindowMinimized = (bitFlags & 1 << 1) !== 0;
      const hasWindowBeenMoved = (bitFlags & 1 << 2) !== 0;
      const xAxisSignIsNegative = (bitFlags & 1 << 3) !== 0;
      const yAxisSignIsNegative = (bitFlags & 1 << 4) !== 0;
      const reservedCommonFlag = false;
      const xAxisShiftTrans = encodedToNumber(encodedString.slice(2, 5));
      const yAxisShiftTrans = encodedToNumber(encodedString.slice(5, 8));
      const commonStates = [drawDepth, isWindowInDOM, isWindowMinimized, hasWindowBeenMoved, xAxisSignIsNegative, yAxisSignIsNegative, reservedCommonFlag, xAxisShiftTrans, yAxisShiftTrans];
      console.log(commonStates);
      return commonStates;
    };
    const mainWindowStateDefault = "!#!!!!!!!!!!!!!!!!";
    const mainWindowEncodedState = windowState["bm"] ?? mainWindowStateDefault;
    const mainWindowEncodedCommon = mainWindowEncodedState?.slice(0, this.commonStatesByteLength);
    const mainWindowEncodedFlags = mainWindowEncodedState?.slice(this.commonStatesByteLength, 10);
    const mainWindowTemplateCoordX = encodedToNumber(mainWindowEncodedState?.slice(10, 14));
    const mainWindowTemplateCoordY = encodedToNumber(mainWindowEncodedState?.slice(14, 18));
    const mainWindowState = decodeCommonStates(mainWindowEncodedCommon).concat(
      numberUnsignedTo32BitBooleanArray(encodedToNumber(mainWindowEncodedFlags) >>> 0).slice(-13),
      // If we don't clamp to the last 13 flags, we will return 19 additional flags that don't exist
      mainWindowTemplateCoordX,
      mainWindowTemplateCoordY
    );
    console.log(mainWindowState);
    return {
      "bm": mainWindowState
    };
  };

  // src/Template.js
  var _Template_instances, calculateTotalPixelsFromImageData_fn;
  var Template = class {
    /** The constructor for the {@link Template} class with enhanced pixel tracking.
     * @param {Object} [params={}] - Object containing all optional parameters
     * @param {string} [params.displayName='My template'] - The display name of the template
     * @param {number} [params.sortID=0] - The sort number of the template for rendering priority
     * @param {string} [params.authorID=''] - The user ID of the person who exported the template (prevents sort ID collisions)
     * @param {string} [params.url=''] - The URL to the source image
     * @param {File} [params.file=null] - The template file (pre-processed File or processed bitmap)
     * @param {Array<number, number, number, number>} [params.coords=null] - The coordinates of the top left corner as (tileX, tileY, pixelX, pixelY)
     * @param {Object} [params.chunked=null] - The affected chunks of the template, and their template for each chunk as a bitmap
     * @param {Object} [params.chunked32={}] - The affected chunks of the template, and their template for each chunk as a Uint32Array
     * @param {number} [params.tileSize=1000] - The size of a tile in pixels (assumes square tiles)
     * @param {Object} [params.pixelCount={total:0, colors:Map}] - Total number of pixels in the template (calculated automatically during processing)
     * @since 0.65.2
     */
    constructor({
      displayName = "My template",
      sortID = 0,
      authorID = "",
      url = "",
      file = null,
      coords: coords2 = null,
      chunked = null,
      chunked32 = {},
      tileSize = 1e3
    } = {}) {
      __privateAdd(this, _Template_instances);
      this.displayName = displayName;
      this.sortID = sortID;
      this.authorID = authorID;
      this.url = url;
      this.file = file;
      this.coords = coords2;
      this.chunked = chunked;
      this.chunked32 = chunked32;
      this.tileSize = tileSize;
      this.pixelCount = { total: 0, colors: /* @__PURE__ */ new Map() };
      this.shouldSkipTransTiles = true;
      this.shouldAggSkipTransTiles = false;
    }
    /** Creates chunks of the template for each tile.
     * @param {Number} tileSize - Size of the tile as determined by templateManager
     * @param {Object} paletteBM - An collection of Uint32Arrays containing the palette BM uses
     * @param {boolean} shouldSkipTransTiles - Should transparent tiles be skipped over when creating the template?
     * @param {boolean} shouldAggSkipTransTiles - Should transparent tiles be aggressively skipped over when creating the template?
     * @returns {Object} Collection of template bitmaps & buffers organized by tile coordinates
     * @since 0.65.4
     */
    async createTemplateTiles(tileSize, paletteBM, shouldSkipTransTiles, shouldAggSkipTransTiles) {
      console.log("Template coordinates:", this.coords);
      this.shouldSkipTransTiles = shouldSkipTransTiles;
      this.shouldAggSkipTransTiles = shouldAggSkipTransTiles;
      const shreadSize = 3;
      const bitmap = await createImageBitmap(this.file);
      const imageWidth = bitmap.width;
      const imageHeight = bitmap.height;
      this.tileSize = tileSize;
      const templateTiles = {};
      const templateTilesBuffers = {};
      const canvas = new OffscreenCanvas(this.tileSize, this.tileSize);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const transCanvas = new OffscreenCanvas(this.tileSize, this.tileSize);
      const transContext = transCanvas.getContext("2d", { willReadFrequently: true });
      transContext.globalCompositeOperation = "destination-over";
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      context.imageSmoothingEnabled = false;
      context.drawImage(bitmap, 0, 0);
      let timer = Date.now();
      const totalPixelMap = __privateMethod(this, _Template_instances, calculateTotalPixelsFromImageData_fn).call(this, context.getImageData(0, 0, imageWidth, imageHeight), paletteBM);
      console.log(`Calculating total pixels took ${(Date.now() - timer) / 1e3} seconds`);
      let totalPixels = 0;
      const transparentColorID = 0;
      for (const [color, total] of totalPixelMap) {
        if (color == transparentColorID) {
          continue;
        }
        totalPixels += total;
      }
      this.pixelCount = { total: totalPixels, colors: totalPixelMap };
      timer = Date.now();
      const canvasMask = new OffscreenCanvas(3, 3);
      const contextMask = canvasMask.getContext("2d");
      contextMask.clearRect(0, 0, 3, 3);
      contextMask.fillStyle = "white";
      contextMask.fillRect(1, 1, 1, 1);
      for (let pixelY = this.coords[3]; pixelY < imageHeight + this.coords[3]; ) {
        const drawSizeY = Math.min(this.tileSize - pixelY % this.tileSize, imageHeight - (pixelY - this.coords[3]));
        console.log(`Math.min(${this.tileSize} - (${pixelY} % ${this.tileSize}), ${imageHeight} - (${pixelY - this.coords[3]}))`);
        for (let pixelX = this.coords[2]; pixelX < imageWidth + this.coords[2]; ) {
          console.log(`Pixel X: ${pixelX}
Pixel Y: ${pixelY}`);
          const drawSizeX = Math.min(this.tileSize - pixelX % this.tileSize, imageWidth - (pixelX - this.coords[2]));
          if (shouldSkipTransTiles) {
            const isTemplateTileTransparent = !this.calculateCanvasTransparency({
              bitmap,
              bitmapParams: [pixelX - this.coords[2], pixelY - this.coords[3], drawSizeX, drawSizeY],
              // Top left X, Top left Y, Width, Height
              transCanvas,
              transContext
            });
            console.log(`Tile contains template: ${!isTemplateTileTransparent}`);
            if (isTemplateTileTransparent) {
              pixelX += drawSizeX;
              continue;
            }
          }
          console.log(`Math.min(${this.tileSize} - (${pixelX} % ${this.tileSize}), ${imageWidth} - (${pixelX - this.coords[2]}))`);
          console.log(`Draw Size X: ${drawSizeX}
Draw Size Y: ${drawSizeY}`);
          const canvasWidth = drawSizeX * shreadSize;
          const canvasHeight = drawSizeY * shreadSize;
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          console.log(`Draw X: ${drawSizeX}
Draw Y: ${drawSizeY}
Canvas Width: ${canvasWidth}
Canvas Height: ${canvasHeight}`);
          context.imageSmoothingEnabled = false;
          console.log(`Getting X ${pixelX}-${pixelX + drawSizeX}
Getting Y ${pixelY}-${pixelY + drawSizeY}`);
          context.clearRect(0, 0, canvasWidth, canvasHeight);
          context.drawImage(
            bitmap,
            // Bitmap image to draw
            pixelX - this.coords[2],
            // Coordinate X to draw *from*
            pixelY - this.coords[3],
            // Coordinate Y to draw *from*
            drawSizeX,
            // X width to draw *from*
            drawSizeY,
            // Y height to draw *from*
            0,
            // Coordinate X to draw *at*
            0,
            // Coordinate Y to draw *at*
            drawSizeX * shreadSize,
            // X width to draw *at*
            drawSizeY * shreadSize
            // Y height to draw *at*
          );
          context.save();
          context.globalCompositeOperation = "destination-in";
          console.log(`Should Skip: ${shouldSkipTransTiles}; Should Agg Skip: ${shouldAggSkipTransTiles}`);
          context.fillStyle = context.createPattern(canvasMask, "repeat");
          context.fillRect(0, 0, canvasWidth, canvasHeight);
          context.restore();
          const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
          console.log(`Shreaded pixels for ${pixelX}, ${pixelY}`, imageData);
          const templateTileName = `${(this.coords[0] + Math.floor(pixelX / 1e3)).toString().padStart(4, "0")},${(this.coords[1] + Math.floor(pixelY / 1e3)).toString().padStart(4, "0")},${(pixelX % 1e3).toString().padStart(3, "0")},${(pixelY % 1e3).toString().padStart(3, "0")}`;
          this.chunked32[templateTileName] = new Uint32Array(imageData.data.buffer);
          templateTiles[templateTileName] = await createImageBitmap(canvas);
          const canvasBlob = await canvas.convertToBlob();
          const canvasBuffer = await canvasBlob.arrayBuffer();
          const canvasBufferBytes = Array.from(new Uint8Array(canvasBuffer));
          templateTilesBuffers[templateTileName] = uint8ToBase64(canvasBufferBytes);
          console.log(templateTiles);
          pixelX += drawSizeX;
        }
        pixelY += drawSizeY;
      }
      console.log(`Parsing template took ${(Date.now() - timer) / 1e3} seconds`);
      console.log("Template Tiles: ", templateTiles);
      console.log("Template Tiles Buffers: ", templateTilesBuffers);
      console.log("Template Tiles Uint32Array: ", this.chunked32);
      return { templateTiles, templateTilesBuffers };
    }
    /** Detects if the canvas is transparent.
     * @param {Object} param - Object that contains the parameters for the function
     * @param {ImageBitmap} param.bitmap - The bitmap template image
     * @param {Array<number, number, number, number>} param.bitmapParams - The parameters to obtain the template tile image from the bitmap
     * @param {OffscreenCanvas | HTMLCanvasElement} param.transCanvas - The canvas to draw to in order to calculate this
     * @param {OffscreenCanvasRenderingContext2D} param.transContext - The context for the transparent canvas to draw to
     * @return {boolean} Is the canvas transparent? If transparent, then `true` is returned. Otherwise, `false`.
     * @since 0.91.75
     */
    calculateCanvasTransparency({
      bitmap,
      bitmapParams,
      transCanvas,
      transContext
    }) {
      console.log(`Calculating template tile transparency...`);
      console.log(`Should Skip: ${this.shouldSkipTransTiles}; Should Agg: ${this.shouldAggSkipTransTiles}`);
      const timer = Date.now();
      const duplicationCoordinateArray = [
        [0, 1],
        // E.g. move 0 on the x axis, and 1 down on the y axis
        [1, 0],
        [0, -2],
        // E.g. move 0 on the x axis, and 2 up on the y axis
        [-2, 0],
        [0, 4],
        [4, 0],
        [0, -8],
        [-8, 0],
        [0, 16],
        [16, 0],
        [0, -32],
        [-32, 0]
      ];
      const transCanvasWidth = bitmapParams[2];
      const transCanvasHeight = bitmapParams[3];
      transCanvas.width = transCanvasWidth;
      transCanvas.height = transCanvasHeight;
      transContext.clearRect(0, 0, transCanvasWidth, transCanvasHeight);
      if (this.shouldAggSkipTransTiles) {
        transContext.drawImage(
          bitmap,
          ...bitmapParams,
          // Bitmap image parameters (x, y, width, height)
          0,
          0,
          // The coordinate draw the output *at*
          10,
          10
          // The width and height of the output
        );
      } else {
        transContext.drawImage(
          bitmap,
          ...bitmapParams,
          // Bitmap image parameters (x, y, width, height)
          0,
          0,
          // The coordinate draw the output *at*
          transCanvasWidth,
          transCanvasHeight
          // Stretch to canvas (the canvas should already be the same size as the template image)
        );
        for (const [relativeX, relativeY] of duplicationCoordinateArray) {
          transContext.drawImage(
            transCanvas,
            // The canvas we are drawing to *is* the source image
            0,
            0,
            transCanvasWidth,
            transCanvasHeight,
            // The entire canvas (as a source image)
            relativeX,
            relativeY,
            transCanvasWidth,
            transCanvasHeight
            // The output coordinates and size on the same canvas
          );
        }
        transContext.drawImage(
          transCanvas,
          // The canvas we are drawing to *is* the source image
          0,
          0,
          transCanvasWidth,
          transCanvasHeight,
          // The entire canvas (as a source image)
          0,
          0,
          10,
          10
          // The output coordinates and size on the same canvas
        );
      }
      const shunkCanvas = transContext.getImageData(0, 0, 10, 10);
      const shunkCanvas32 = new Uint32Array(shunkCanvas.data.buffer);
      console.log(`Calculated canvas transparency in ${(Date.now() - timer) / 1e3} seconds.`);
      for (const pixel of shunkCanvas32) {
        if (!!pixel) {
          return true;
        }
      }
      return false;
    }
    /** Calculates top left coordinate of template.
     * It uses `Template.chunked` to update `Template.coords`
     * @since 0.88.504
     */
    calculateCoordsFromChunked() {
      let topLeftCoord = [Infinity, Infinity, Infinity, Infinity];
      const tileKeys = Object.keys(this.chunked).sort();
      tileKeys.forEach((key, index) => {
        const [tileX, tileY, pixelX, pixelY] = key.split(",").map(Number);
        if (tileY < topLeftCoord[1] || tileY == topLeftCoord[1] && tileX < topLeftCoord[0]) {
          topLeftCoord = [tileX, tileY, pixelX, pixelY];
        }
      });
      this.coords = topLeftCoord;
    }
  };
  _Template_instances = new WeakSet();
  /** Calculates the total pixels for each color for the image.
   * 
   * @param {ImageData} imageData - The pre-shreaded image "casted" onto a canvas
   * @param {Object} paletteBM - The palette Blue Marble uses for colors
   * @param {Number} paletteTolerance - How close an RGB color has to be in order to be considered a palette color. A tolerance of "3" means the sum of the RGB can be up to 3 away from the actual value.
   * @returns {Map<Number, Number>} A map where the key is the color ID, and the value is the total pixels for that color ID
   * @since 0.88.6
   */
  calculateTotalPixelsFromImageData_fn = function(imageData, paletteBM) {
    const buffer32Arr = new Uint32Array(imageData.data.buffer);
    const { palette: _, LUT: lookupTable } = paletteBM;
    const _colorpalette = /* @__PURE__ */ new Map();
    for (let pixelIndex = 0; pixelIndex < buffer32Arr.length; pixelIndex++) {
      const pixel = buffer32Arr[pixelIndex];
      let bestColorID = -2;
      if (pixel >>> 24 == 0) {
        bestColorID = 0;
      } else {
        bestColorID = lookupTable.get(pixel) ?? -2;
      }
      const colorIDcount = _colorpalette.get(bestColorID);
      _colorpalette.set(bestColorID, colorIDcount ? colorIDcount + 1 : 1);
    }
    console.log(_colorpalette);
    return _colorpalette;
  };

  // src/confetttiManager.js
  var ConfettiManager = class {
    /** The constructor for the confetti manager.
     * @since 0.88.356
     */
    constructor() {
      this.confettiCount = Math.ceil(80 / 1300 * window.innerWidth);
      this.colorPalette = colorpalette.slice(1);
    }
    /** Immedently creates confetti inside the parent element.
     * @param {HTMLElement} parentElement - The parent element to create confetti inside of
     * @since 0.88.356
     */
    createConfetti(parentElement) {
      const confettiContainer = document.createElement("div");
      for (let currentCount = 0; currentCount < this.confettiCount; currentCount++) {
        const confettiShard = document.createElement("confetti-piece");
        confettiShard.style.setProperty("--x", `${Math.random() * 100}vw`);
        confettiShard.style.setProperty("--delay", `${Math.random() * 2}s`);
        confettiShard.style.setProperty("--duration", `${3 + Math.random() * 3}s`);
        confettiShard.style.setProperty("--rot", `${Math.random() * 360}deg`);
        confettiShard.style.setProperty("--size", `${6 + Math.random() * 6}px`);
        confettiShard.style.backgroundColor = `rgb(${this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)].rgb.join(",")})`;
        confettiShard.onanimationend = () => {
          if (confettiShard.parentNode.childElementCount <= 1) {
            confettiShard.parentNode.remove();
          } else {
            confettiShard.remove();
          }
        };
        confettiContainer.appendChild(confettiShard);
      }
      parentElement.appendChild(confettiContainer);
    }
  };
  var BlueMarbleConfettiPiece = class extends HTMLElement {
  };
  customElements.define("confetti-piece", BlueMarbleConfettiPiece);

  // src/WindowCredits.js
  var WindowCredts = class extends Overlay {
    /** Constructor for the Credits window
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @since 0.90.9
     * @see {@link Overlay#constructor} for examples
     */
    constructor(name2, version2) {
      super(name2, version2);
      this.window = null;
      this.windowID = "bm-window-credits";
      this.windowParent = document.body;
    }
    /** Spawns a Credits window.
     * If another credits window already exists, we DON'T spawn another!
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.90.9
     */
    buildWindow() {
      const ascii = `
\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557     \u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551     \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D
\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551     \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  
\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551     \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255D  
\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
\u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D

\u2588\u2588\u2588\u2557   \u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D
\u2588\u2588\u2554\u2588\u2588\u2588\u2588\u2554\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2557  
\u2588\u2588\u2551\u255A\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2550\u255D  
\u2588\u2588\u2551 \u255A\u2550\u255D \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
\u255A\u2550\u255D     \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D
`;
      if (document.querySelector(`#${this.windowID}`)) {
        document.querySelector(`#${this.windowID}`).remove();
        return;
      }
      this.window = this.addDiv({ "id": this.windowID, "class": "bm-window" }, (instance, div) => {
      }).addDragbar().addButton({ "class": "bm-button-circle", "textContent": "\u25BC", "aria-label": 'Minimize window "Credits"', "data-button-status": "expanded" }, (instance, button) => {
        button.onclick = () => instance.handleMinimization(button);
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addDiv().buildElement().addButton({ "class": "bm-button-circle", "textContent": "\u2716", "aria-label": 'Close window "Credits"' }, (instance, button) => {
        button.onclick = () => {
          document.querySelector(`#${this.windowID}`)?.remove();
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().buildElement().addDiv({ "class": "bm-window-content" }).addDiv({ "class": "bm-container bm-center-vertically" }).addHeader(1, { "textContent": "Credits" }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container bm-scrollable" }).addSpan({ "role": "img", "aria-label": this.name }).addSpan({ "innerHTML": ascii, "class": "bm-ascii", "aria-hidden": "true" }).buildElement().buildElement().addBr().buildElement().addHr().buildElement().addBr().buildElement().addSpan({ "textContent": '"Blue Marble" userscript is made by SwingTheVine.' }).buildElement().addBr().buildElement().addSpan({ "innerHTML": 'The <a href="https://bluemarble.lol/" target="_blank" rel="noopener noreferrer">Blue Marble Website</a> is made by <a href="https://github.com/crqch" target="_blank" rel="noopener noreferrer">crqch</a>.' }).buildElement().addBr().buildElement().addSpan({ "textContent": `The Blue Marble Website used until ${localizeDate(new Date(1756069320 * 1e3))} was made by Camille Daguin.` }).buildElement().addBr().buildElement().addSpan({ "textContent": 'The favicon "Blue Marble" is owned by NASA. (The image of the Earth is owned by NASA)' }).buildElement().addBr().buildElement().addSpan({ "textContent": "Special Thanks:" }).buildElement().addUl().addLi({ "textContent": "Espresso, Meqa, and Robot for moderating SwingTheVine's community." }).buildElement().addLi({ "innerHTML": 'nof, <a href="https://github.com/TouchedByDarkness" target="_blank" rel="noopener noreferrer">darkness</a> for creating similar userscripts!' }).buildElement().addLi({ "innerHTML": '<a href="https://wondapon.net/" target="_blank" rel="noopener noreferrer">Wonda</a> for the Blue Marble banner image!' }).buildElement().addLi({ "innerHTML": '<a href="https://crqch.dev/" target="_blank" rel="noopener noreferrer">crqch</a> for creating, maintaining, and hosting the <a href="https://bluemarble.lol/" target="_blank" rel="noopener noreferrer">Blue Marble website</a>!' }).buildElement().addLi({ "innerHTML": '<a href="https://github.com/BullStein" target="_blank" rel="noopener noreferrer">BullStein</a>, <a href="https://github.com/allanf181" target="_blank" rel="noopener noreferrer">allanf181</a> for being early beta testers!' }).buildElement().addLi({ "innerHTML": 'guidu_ and <a href="https://github.com/Nick-machado" target="_blank" rel="noopener noreferrer">Nick-machado</a> for the original "Minimize" Button code!' }).buildElement().addLi({ "innerHTML": '<a href="https://github.com/LolipopJ" target="_blank" rel="noopener noreferrer">LolipopJ</a> and <a href="https://github.com/Arttful" target="_blank" rel="noopener noreferrer">Arttful</a> for providing a solution to a bug I could not solve!' }).buildElement().addLi({ "innerHTML": 'Nomad and <a href="https://www.youtube.com/@gustav_vv" target="_blank" rel="noopener noreferrer">Gustav</a> for the tutorials!' }).buildElement().addLi({ "innerHTML": '<a href="https://github.com/cfpwastaken" target="_blank" rel="noopener noreferrer">cfp</a> for creating the template overlay that Blue Marble was based on!' }).buildElement().addLi({ "innerHTML": '<a href="https://forcenetwork.cloud/" target="_blank" rel="noopener noreferrer">Force Network</a> for hosting the <a href="https://github.com/SwingTheVine/Wplace-TelemetryServer" target="_blank" rel="noopener noreferrer">telemetry server</a>!' }).buildElement().addLi({ "innerHTML": '<a href="https://thebluecorner.net" target="_blank" rel="noopener noreferrer">TheBlueCorner</a> for getting me interested in online pixel canvases!' }).buildElement().buildElement().addBr().buildElement().addSpan({ "innerHTML": '<a href="https://ko-fi.com/swingthevine" target="_blank" rel="noopener noreferrer">Donators</a>:' }).buildElement().addUl().addLi({ "textContent": "Soultree" }).buildElement().addLi({ "textContent": "Espresso" }).buildElement().addLi({ "textContent": "BEST FAN" }).buildElement().addLi({ "textContent": "Ferb" }).buildElement().addLi({ "textContent": "FuchsDresden" }).buildElement().addLi({ "textContent": "Jack" }).buildElement().addLi({ "textContent": "raiken_au" }).buildElement().addLi({ "textContent": "Jacob" }).buildElement().addLi({ "textContent": "StupidOne" }).buildElement().addLi({ "textContent": "Glox" }).buildElement().addLi({ "textContent": "PintilieVasile" }).buildElement().addLi({ "textContent": "Corni" }).buildElement().addLi({ "textContent": "Liam" }).buildElement().addLi({ "textContent": "som9" }).buildElement().addLi({ "textContent": "2 Anonymous Supporters" }).buildElement().buildElement().buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
      this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
    }
  };

  // src/WindowFilter.js
  var _WindowFilter_instances, buildColorList_fn, sortColorList_fn, selectColorList_fn, calculatePixelStatistics_fn;
  var WindowFilter = class extends Overlay {
    /** Constructor for the color filter window
     * @param {*} executor - The executing class
     * @since 0.88.329
     * @see {@link Overlay#constructor}
     */
    constructor(executor) {
      super(executor.name, executor.version);
      __privateAdd(this, _WindowFilter_instances);
      this.window = null;
      this.windowID = "bm-window-filter";
      this.colorListID = "bm-filter-flex";
      this.windowParent = document.body;
      this.templateManager = executor.apiManager?.templateManager;
      this.eyeOpen = '<svg viewBox="0 .5 6 3"><path d="M0,2Q3-1 6,2Q3,5 0,2H2A1,1 0 1 0 3,1Q3,2 2,2"/></svg>';
      this.eyeClosed = '<svg viewBox="0 1 12 6"><mask id="a"><path d="M0,0H12V8L0,2" fill="#fff"/></mask><path d="M0,4Q6-2 12,4Q6,10 0,4H4A2,2 0 1 0 6,2Q6,4 4,4ZM1,2L10,6.5L9.5,7L.5,2.5" mask="url(#a)"/></svg>';
      const { palette, LUT: _ } = this.templateManager.paletteBM;
      this.palette = palette;
      this.tilesLoadedTotal = 0;
      this.tilesTotal = 0;
      this.allPixelsColor = /* @__PURE__ */ new Map();
      this.allPixelsCorrect = /* @__PURE__ */ new Map();
      this.allPixelsCorrectTotal = 0;
      this.allPixelsTotal = 0;
      this.timeRemaining = 0;
      this.timeRemainingLocalized = "";
      this.sortPrimary = "id";
      this.sortSecondary = "ascending";
      this.showUnused = false;
    }
    /** Spawns a Color Filter window.
     * If another color filter window already exists, we DON'T spawn another!
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.88.149
     */
    buildWindow() {
      if (document.querySelector(`#${this.windowID}`)) {
        document.querySelector(`#${this.windowID}`).remove();
        return;
      }
      this.window = this.addDiv({ "id": this.windowID, "class": "bm-window" }, (instance, div) => {
      }).addDragbar().addButton({ "class": "bm-button-circle", "textContent": "\u25BC", "aria-label": 'Minimize window "Color Filter"', "data-button-status": "expanded" }, (instance, button) => {
        button.onclick = () => instance.handleMinimization(button);
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addDiv().buildElement().addDiv({ "class": "bm-flex-center" }).addButton({ "class": "bm-button-circle", "textContent": "\u{1F5D7}", "aria-label": 'Switch to windowed mode for "Color Filter"' }, (instance, button) => {
        button.onclick = () => {
          document.querySelector(`#${this.windowID}`)?.remove();
          this.buildWindowed();
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addButton({ "class": "bm-button-circle", "textContent": "\u2716", "aria-label": 'Close window "Color Filter"' }, (instance, button) => {
        button.onclick = () => {
          document.querySelector(`#${this.windowID}`)?.remove();
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().buildElement().buildElement().addDiv({ "class": "bm-window-content" }).addDiv({ "class": "bm-container bm-center-vertically" }).addHeader(1, { "textContent": "Color Filter" }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container bm-flex-between bm-center-vertically", "style": "gap: 1.5ch;" }).addButton({ "textContent": "Hide All Colors" }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _WindowFilter_instances, selectColorList_fn).call(this, false);
      }).buildElement().addButton({ "textContent": "Refresh Data" }, (instance, button) => {
        button.onclick = () => {
          button.disabled = true;
          this.updateColorList();
          button.disabled = false;
        };
      }).buildElement().addButton({ "textContent": "Show All Colors" }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _WindowFilter_instances, selectColorList_fn).call(this, true);
      }).buildElement().buildElement().addDiv({ "class": "bm-container bm-scrollable" }).addDiv({ "class": "bm-container", "style": "margin-left: 2.5ch; margin-right: 2.5ch;" }).addDiv({ "class": "bm-container" }).addSpan({ "id": "bm-filter-tile-load", "innerHTML": "<b>Tiles Loaded:</b> 0 / ???" }).buildElement().addBr().buildElement().addSpan({ "id": "bm-filter-tot-correct", "innerHTML": "<b>Correct Pixels:</b> ???" }).buildElement().addBr().buildElement().addSpan({ "id": "bm-filter-tot-total", "innerHTML": "<b>Total Pixels:</b> ???" }).buildElement().addBr().buildElement().addSpan({ "id": "bm-filter-tot-remaining", "innerHTML": "<b>Complete:</b> ??? (???)" }).buildElement().addBr().buildElement().addSpan({ "id": "bm-filter-tot-completed", "innerHTML": "??? ???" }).buildElement().buildElement().addDiv({ "class": "bm-container" }).addP({ "innerHTML": `Press the \u{1F5D7} button to make this window smaller. Colors with the icon ${this.eyeOpen.replace("<svg", '<svg aria-label="Eye Open"')} will be shown on the canvas. Colors with the icon ${this.eyeClosed.replace("<svg", '<svg aria-label="Eye Closed"')} will not be shown on the canvas. The "Hide All Colors" and "Show All Colors" buttons only apply to colors that display in the list below. The amount of correct pixels is dependent on how many tiles of the template you have loaded since you last opened Wplace.live. If all tiles have been loaded, then the "correct pixel" count is accurate.` }).buildElement().buildElement().addHr().buildElement().addForm({ "class": "bm-container" }).addFieldset().addLegend({ "textContent": "Sort Options:", "style": "font-weight: 700;" }).buildElement().addDiv({ "class": "bm-container" }).addSelect({ "id": "bm-filter-sort-primary", "name": "sortPrimary", "textContent": "I want to view " }).addOption({ "value": "id", "textContent": "color IDs" }).buildElement().addOption({ "value": "name", "textContent": "color names" }).buildElement().addOption({ "value": "premium", "textContent": "premium colors" }).buildElement().addOption({ "value": "percent", "textContent": "percentage" }).buildElement().addOption({ "value": "correct", "textContent": "correct pixels" }).buildElement().addOption({ "value": "incorrect", "textContent": "incorrect pixels" }).buildElement().addOption({ "value": "total", "textContent": "total pixels" }).buildElement().buildElement().addSelect({ "id": "bm-filter-sort-secondary", "name": "sortSecondary", "textContent": " in " }).addOption({ "value": "ascending", "textContent": "ascending" }).buildElement().addOption({ "value": "descending", "textContent": "descending" }).buildElement().buildElement().addSpan({ "textContent": " order." }).buildElement().buildElement().addDiv({ "class": "bm-container" }).addCheckbox({ "id": "bm-filter-show-unused", "name": "showUnused", "textContent": "Show unused colors" }).buildElement().buildElement().buildElement().addDiv({ "class": "bm-container" }).addButton({ "textContent": "Sort Colors", "type": "submit" }, (instance, button) => {
        button.onclick = (event) => {
          event.preventDefault();
          const formData = new FormData(document.querySelector(`#${this.windowID} form`));
          const formValues = {};
          for (const [input, value] of formData) {
            formValues[input] = value;
          }
          console.log(`Primary: ${formValues["sortPrimary"]}; Secondary: ${formValues["sortSecondary"]}; Unused: ${formValues["showUnused"] == "on"}`);
          __privateMethod(this, _WindowFilter_instances, sortColorList_fn).call(this, formValues["sortPrimary"], formValues["sortSecondary"], formValues["showUnused"] == "on");
        };
      }).buildElement().buildElement().buildElement().buildElement().buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
      this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
      const scrollableContainer = document.querySelector(`#${this.windowID} .bm-container.bm-scrollable`);
      __privateMethod(this, _WindowFilter_instances, buildColorList_fn).call(this, scrollableContainer);
      __privateMethod(this, _WindowFilter_instances, sortColorList_fn).call(this, this.sortPrimary, this.sortSecondary, this.showUnused);
      this.updateInnerHTML("#bm-filter-tile-load", `<b>Tiles Loaded:</b> ${localizeNumber(this.tilesLoadedTotal)} / ${localizeNumber(this.tilesTotal)}`);
      this.updateInnerHTML("#bm-filter-tot-correct", `<b>Correct Pixels:</b> ${localizeNumber(this.allPixelsCorrectTotal)}`);
      this.updateInnerHTML("#bm-filter-tot-total", `<b>Total Pixels:</b> ${localizeNumber(this.allPixelsTotal)}`);
      this.updateInnerHTML("#bm-filter-tot-remaining", `<b>Remaining:</b> ${localizeNumber((this.allPixelsTotal || 0) - (this.allPixelsCorrectTotal || 0))} (${localizePercent(((this.allPixelsTotal || 0) - (this.allPixelsCorrectTotal || 0)) / (this.allPixelsTotal || 1))})`);
      this.updateInnerHTML("#bm-filter-tot-completed", `<b>Completed at:</b> <time datetime="${this.timeRemaining.toISOString().replace(/\.\d{3}Z$/, "Z")}">${this.timeRemainingLocalized}</time>`);
    }
    /** Spawns a windowed Color Filter window.
     * If another color filter window already exists, we DON'T spawn another!
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.90.35
     */
    buildWindowed() {
      if (document.querySelector(`#${this.windowID}`)) {
        document.querySelector(`#${this.windowID}`).remove();
        return;
      }
      this.window = this.addDiv({ "id": this.windowID, "class": "bm-window bm-windowed" }).addDragbar().addButton({ "class": "bm-button-circle", "textContent": "\u25BC", "aria-label": 'Minimize window "Color Filter"', "data-button-status": "expanded" }, (instance, button) => {
        button.onclick = () => {
          const windowedColorTotals = document.querySelector("#bm-filter-windowed-color-totals");
          if (windowedColorTotals) {
            windowedColorTotals.style.display = button.dataset["buttonStatus"] == "expanded" ? "none" : "";
          }
          instance.handleMinimization(button);
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addDiv().addSpan({ "id": "bm-filter-windowed-color-totals", "class": "bm-dragbar-text", "style": "font-weight: 700;" }).buildElement().buildElement().addDiv({ "class": "bm-flex-center" }).addButton({ "class": "bm-button-circle", "textContent": "\u{1F5D6}", "aria-label": 'Switch to fullscreen mode for "Color Filter"' }, (instance, button) => {
        button.onclick = () => {
          document.querySelector(`#${this.windowID}`)?.remove();
          this.buildWindow();
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addButton({ "class": "bm-button-circle", "textContent": "\u2716", "aria-label": 'Close window "Color Filter"' }, (instance, button) => {
        button.onclick = () => {
          document.querySelector(`#${this.windowID}`)?.remove();
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().buildElement().buildElement().addDiv({ "class": "bm-window-content" }).addDiv({ "class": "bm-container bm-center-vertically" }).addHeader(1, { "textContent": "Color Filter" }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container bm-flex-between bm-center-vertically", "style": "gap: 1.5ch;" }).addButton({ "textContent": "None" }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _WindowFilter_instances, selectColorList_fn).call(this, false);
      }).buildElement().addButton({ "textContent": "Refresh" }, (instance, button) => {
        button.onclick = () => {
          button.disabled = true;
          this.updateColorList();
          button.disabled = false;
        };
      }).buildElement().addButton({ "textContent": "All" }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _WindowFilter_instances, selectColorList_fn).call(this, true);
      }).buildElement().buildElement().addDiv({ "class": "bm-container bm-scrollable" }).buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
      this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
      const scrollableContainer = document.querySelector(`#${this.windowID} .bm-container.bm-scrollable`);
      __privateMethod(this, _WindowFilter_instances, buildColorList_fn).call(this, scrollableContainer);
      __privateMethod(this, _WindowFilter_instances, sortColorList_fn).call(this, this.sortPrimary, this.sortSecondary, this.showUnused);
    }
    /** The information about a specific color on the palette.
     * @typedef {Object} ColorData
     * @property {number | string} colorTotal
     * @property {string} colorTotalLocalized
     * @property {number | string} colorCorrect
     * @property {string} colorCorrectLocalized
     * @property {string} colorPercent
     * @property {number} colorIncorrect
     */
    /** Updates the information inside the colors in the color list.
     * If the color list does not exist yet, it returns the color information instead.
     * This assumes the information inside each element is the same between fullscreen and windowed mode.
     * @since 0.90.60
     * @returns {Object.<number, ColorData>}
     */
    updateColorList() {
      __privateMethod(this, _WindowFilter_instances, calculatePixelStatistics_fn).call(this);
      const colorList = document.querySelector(`#${this.colorListID}`);
      const colorStatistics = {};
      for (const color of this.palette) {
        const colorTotal = this.allPixelsColor.get(color.id) ?? 0;
        const colorTotalLocalized = localizeNumber(colorTotal);
        let colorCorrect = 0;
        let colorCorrectLocalized = "0";
        let colorPercent = localizePercent(1);
        if (colorTotal != 0) {
          colorCorrect = this.allPixelsCorrect.get(color.id) ?? "???";
          if (typeof colorCorrect != "number" && this.tilesLoadedTotal == this.tilesTotal && !!color.id) {
            colorCorrect = 0;
          }
          colorCorrectLocalized = typeof colorCorrect == "string" ? colorCorrect : localizeNumber(colorCorrect);
          colorPercent = isNaN(colorCorrect / colorTotal) ? "???" : localizePercent(colorCorrect / colorTotal);
        }
        const colorIncorrect = parseInt(colorTotal) - parseInt(colorCorrect);
        colorStatistics[color.id] = {
          colorTotal,
          colorTotalLocalized,
          colorCorrect,
          colorCorrectLocalized,
          colorPercent,
          colorIncorrect
        };
      }
      const windowedColorTotals = document.querySelector("#bm-filter-windowed-color-totals");
      if (windowedColorTotals) {
        const allCorrect = this.allPixelsCorrectTotal.toString().length > 7 ? this.allPixelsCorrectTotal.toString().slice(0, 2) + "\u2026" + this.allPixelsCorrectTotal.toString().slice(-3) : this.allPixelsCorrectTotal.toString();
        const allTotal = this.allPixelsTotal.toString().length > 7 ? this.allPixelsTotal.toString().slice(0, 2) + "\u2026" + this.allPixelsTotal.toString().slice(-3) : this.allPixelsTotal.toString();
        this.updateInnerHTML("#bm-filter-windowed-color-totals", `${allCorrect}/${allTotal}`, true);
      }
      if (!colorList) {
        return colorStatistics;
      }
      const colors = Array.from(colorList.children);
      for (const color of colors) {
        const colorID = parseInt(color.dataset["id"]);
        const {
          colorCorrect,
          colorCorrectLocalized,
          colorPercent,
          colorTotal,
          colorTotalLocalized,
          colorIncorrect
        } = colorStatistics[colorID];
        color.dataset["correct"] = !Number.isNaN(parseInt(colorCorrect)) ? colorCorrect : "0";
        color.dataset["total"] = colorTotal;
        color.dataset["percent"] = colorPercent.slice(-1) == "%" ? colorPercent.slice(0, -1) : "0";
        color.dataset["incorrect"] = colorIncorrect || 0;
        const pixelCount = document.querySelector(`#${this.windowID} .bm-filter-color[data-id="${colorID}"] .bm-filter-color-pxl-cnt`);
        if (pixelCount) {
          pixelCount.textContent = `${colorCorrectLocalized} / ${colorTotalLocalized}`;
        }
        const pixelDesc = document.querySelector(`#${this.windowID} .bm-filter-color[data-id="${colorID}"] .bm-filter-color-pxl-desc`);
        if (pixelDesc) {
          pixelDesc.textContent = `${typeof colorIncorrect == "number" && !isNaN(colorIncorrect) ? colorIncorrect : "???"} incorrect pixel${colorIncorrect == 1 ? "" : "s"}. Completed: ${colorPercent}`;
        }
      }
      __privateMethod(this, _WindowFilter_instances, sortColorList_fn).call(this, this.sortPrimary, this.sortSecondary, this.showUnused);
    }
  };
  _WindowFilter_instances = new WeakSet();
  /** Creates the color list container.
   * @param {HTMLElement} parentElement - Parent element to add the color list to as a child
   * @since 0.88.222
   */
  buildColorList_fn = function(parentElement) {
    const isWindowedMode = parentElement.closest(`#${this.windowID}`)?.classList.contains("bm-windowed");
    console.log(`Is Windowed Mode: ${isWindowedMode}`);
    const colorList = new Overlay(this.name, this.version);
    colorList.addDiv({ "id": this.colorListID });
    const colorStatistics = this.updateColorList();
    for (const color of this.palette) {
      const colorValueHex = "#" + rgbToHex(color.rgb).toUpperCase();
      const lumin = calculateRelativeLuminance(color.rgb);
      let textColorForPaletteColorBackground = 1.05 / (lumin + 0.05) > (lumin + 0.05) / 0.05 ? "white" : "black";
      if (!color.id) {
        textColorForPaletteColorBackground = "transparent";
      }
      const bgEffectForButtons = textColorForPaletteColorBackground == "white" ? "bm-button-hover-white" : "bm-button-hover-black";
      const {
        colorCorrect,
        colorCorrectLocalized,
        colorPercent,
        colorTotal,
        colorTotalLocalized,
        colorIncorrect
      } = colorStatistics[color.id];
      const isColorHidden = !!(this.templateManager.shouldFilterColor.get(color.id) || false);
      if (isWindowedMode) {
        const styleBackgroundStar = `background-size: auto 100%; background-repeat: repeat-x; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50,5L79,91L2,39L98,39L21,91' fill='${textColorForPaletteColorBackground}' fill-opacity='.1'/></svg>");`;
        colorList.addDiv({
          "class": "bm-container bm-filter-color bm-flex-between",
          // Dataset
          "data-id": color.id,
          "data-name": color.name,
          "data-premium": +color.premium,
          "data-correct": !Number.isNaN(parseInt(colorCorrect)) ? colorCorrect : "0",
          "data-total": colorTotal,
          "data-percent": colorPercent.slice(-1) == "%" ? colorPercent.slice(0, -1) : "0",
          "data-incorrect": colorIncorrect || 0
        }).addDiv({ "class": "bm-filter-container-rgb", "style": `background-color: rgb(${color.rgb?.map((channel) => Number(channel) || 0).join(",")});${color.premium ? styleBackgroundStar : ""}` }).addButton(
          {
            "class": "bm-button-trans " + bgEffectForButtons,
            "data-state": isColorHidden ? "hidden" : "shown",
            "aria-label": isColorHidden ? `Show the color ${color.name || ""} on templates.` : `Hide the color ${color.name || ""} on templates.`,
            "innerHTML": isColorHidden ? this.eyeClosed.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`) : this.eyeOpen.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`)
          },
          (instance, button) => {
            button.onclick = () => {
              button.style.textDecoration = "none";
              button.disabled = true;
              if (button.dataset["state"] == "shown") {
                button.innerHTML = this.eyeClosed.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`);
                button.dataset["state"] = "hidden";
                button.ariaLabel = `Show the color ${color.name || ""} on templates.`;
                this.templateManager.shouldFilterColor.set(color.id, true);
              } else {
                button.innerHTML = this.eyeOpen.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`);
                button.dataset["state"] = "shown";
                button.ariaLabel = `Hide the color ${color.name || ""} on templates.`;
                this.templateManager.shouldFilterColor.delete(color.id);
              }
              button.disabled = false;
              button.style.textDecoration = "";
            };
            if (!color.id) {
              button.disabled = true;
            }
          }
        ).buildElement().addSmall({ "textContent": `#${color.id.toString().padStart(2, 0)}`, "style": `color: ${color.id == -1 || color.id == 0 ? "white" : textColorForPaletteColorBackground}` }).buildElement().addHeader(2, { "textContent": color.name, "style": `color: ${color.id == -1 || color.id == 0 ? "white" : textColorForPaletteColorBackground}` }).buildElement().addSmall({ "class": "bm-filter-color-pxl-cnt", "textContent": `${colorCorrectLocalized} / ${colorTotalLocalized}`, "style": `color: ${color.id == -1 || color.id == 0 ? "white" : textColorForPaletteColorBackground}; flex: 1 1 auto; text-align: right;` }).buildElement().buildElement().buildElement();
      } else {
        colorList.addDiv({
          "class": "bm-container bm-filter-color bm-flex-between",
          "data-id": color.id,
          "data-name": color.name,
          "data-premium": +color.premium,
          "data-correct": !Number.isNaN(parseInt(colorCorrect)) ? colorCorrect : "0",
          "data-total": colorTotal,
          "data-percent": colorPercent.slice(-1) == "%" ? colorPercent.slice(0, -1) : "0",
          "data-incorrect": colorIncorrect || 0
        }).addDiv({ "class": "bm-flex-center", "style": "flex-direction: column;" }).addDiv({ "class": "bm-filter-container-rgb", "style": `background-color: rgb(${color.rgb?.map((channel) => Number(channel) || 0).join(",")});` }).addButton(
          {
            "class": "bm-button-trans " + bgEffectForButtons,
            "data-state": isColorHidden ? "hidden" : "shown",
            "aria-label": isColorHidden ? `Show the color ${color.name || ""} on templates.` : `Hide the color ${color.name || ""} on templates.`,
            "innerHTML": isColorHidden ? this.eyeClosed.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`) : this.eyeOpen.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`)
          },
          (instance, button) => {
            button.onclick = () => {
              button.style.textDecoration = "none";
              button.disabled = true;
              if (button.dataset["state"] == "shown") {
                button.innerHTML = this.eyeClosed.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`);
                button.dataset["state"] = "hidden";
                button.ariaLabel = `Show the color ${color.name || ""} on templates.`;
                this.templateManager.shouldFilterColor.set(color.id, true);
              } else {
                button.innerHTML = this.eyeOpen.replace("<svg", `<svg fill="${textColorForPaletteColorBackground}"`);
                button.dataset["state"] = "shown";
                button.ariaLabel = `Hide the color ${color.name || ""} on templates.`;
                this.templateManager.shouldFilterColor.delete(color.id);
              }
              button.disabled = false;
              button.style.textDecoration = "";
            };
            if (!color.id) {
              button.disabled = true;
            }
          }
        ).buildElement().buildElement().addSmall({ "textContent": color.id == -2 ? "???????" : colorValueHex }).buildElement().buildElement().addDiv({ "class": "bm-flex-between" }).addHeader(2, { "textContent": (color.premium ? "\u2605 " : "") + color.name }).buildElement().addDiv({ "class": "bm-flex-between", "style": "gap: 1.5ch;" }).addSmall({ "textContent": `#${color.id.toString().padStart(2, 0)}` }).buildElement().addSmall({ "class": "bm-filter-color-pxl-cnt", "textContent": `${colorCorrectLocalized} / ${colorTotalLocalized}` }).buildElement().buildElement().addP({ "class": "bm-filter-color-pxl-desc", "textContent": `${typeof colorIncorrect == "number" && !isNaN(colorIncorrect) ? colorIncorrect : "???"} incorrect pixel${colorIncorrect == 1 ? "" : "s"}. Completed: ${colorPercent}` }).buildElement().buildElement().buildElement();
      }
    }
    colorList.buildOverlay(parentElement);
  };
  /** Sorts the color list & hides unused colors
   * @param {string} sortPrimary - The name of the dataset attribute to sort by.
   * @param {string} sortSecondary - Secondary sort. It can be either 'ascending' or 'descending'.
   * @param {boolean} showUnused - Should unused colors be displayed in the list to the user?
   * @since 0.88.222
   */
  sortColorList_fn = function(sortPrimary, sortSecondary, showUnused) {
    this.sortPrimary = sortPrimary;
    this.sortSecondary = sortSecondary;
    this.showUnused = showUnused;
    const colorList = document.querySelector(`#${this.colorListID}`);
    const colors = Array.from(colorList.children);
    colors.sort((index, nextIndex) => {
      const indexValue = index.getAttribute("data-" + sortPrimary);
      const nextIndexValue = nextIndex.getAttribute("data-" + sortPrimary);
      const indexValueNumber = parseFloat(indexValue);
      const nextIndexValueNumber = parseFloat(nextIndexValue);
      const indexValueNumberIsNumber = !isNaN(indexValueNumber);
      const nextIndexValueNumberIsNumber = !isNaN(nextIndexValueNumber);
      if (showUnused) {
        index.classList.remove("bm-color-hide");
      } else if (!Number(index.getAttribute("data-total"))) {
        index.classList.add("bm-color-hide");
      }
      if (indexValueNumberIsNumber && nextIndexValueNumberIsNumber) {
        return sortSecondary === "ascending" ? indexValueNumber - nextIndexValueNumber : nextIndexValueNumber - indexValueNumber;
      } else {
        const indexValueString = indexValue.toLowerCase();
        const nextIndexValueString = nextIndexValue.toLowerCase();
        if (indexValueString < nextIndexValueString) return sortSecondary === "ascending" ? -1 : 1;
        if (indexValueString > nextIndexValueString) return sortSecondary === "ascending" ? 1 : -1;
        return 0;
      }
    });
    colors.forEach((color) => colorList.appendChild(color));
  };
  /** (Un)selects all colors in the color list that are visible to the user.
   * @param {boolean} userWantsUnselect - Does the user want to unselect colors?
   * @since 0.88.222
   */
  selectColorList_fn = function(userWantsUnselect) {
    const colorList = document.querySelector(`#${this.colorListID}`);
    const colors = Array.from(colorList.children);
    for (const color of colors) {
      if (color.classList?.contains("bm-color-hide")) {
        continue;
      }
      const button = color.querySelector(".bm-filter-container-rgb button");
      if (button.dataset["state"] == "hidden" && !userWantsUnselect) {
        continue;
      }
      if (button.dataset["state"] == "shown" && userWantsUnselect) {
        continue;
      }
      button.click();
    }
  };
  /** Calculates all pixel statistics used in the color filter.
   * @since 0.90.34
   */
  calculatePixelStatistics_fn = function() {
    this.allPixelsTotal = 0;
    this.allPixelsCorrectTotal = 0;
    this.allPixelsCorrect = /* @__PURE__ */ new Map();
    this.allPixelsColor = /* @__PURE__ */ new Map();
    for (const template of this.templateManager.templatesArray) {
      const total = template.pixelCount?.total ?? 0;
      this.allPixelsTotal += total ?? 0;
      const colors = template.pixelCount?.colors ?? /* @__PURE__ */ new Map();
      for (const [colorID, colorPixels] of colors) {
        const _colorPixels = Number(colorPixels) || 0;
        const allPixelsColorSoFar = this.allPixelsColor.get(colorID) ?? 0;
        this.allPixelsColor.set(colorID, allPixelsColorSoFar + _colorPixels);
      }
      const correctObject = template.pixelCount?.correct ?? {};
      this.tilesLoadedTotal += Object.keys(correctObject).length;
      this.tilesTotal += Object.keys(template.chunked).length;
      for (const map of Object.values(correctObject)) {
        for (const [colorID, correctPixels] of map) {
          const _correctPixels = Number(correctPixels) || 0;
          this.allPixelsCorrectTotal += _correctPixels;
          const allPixelsCorrectSoFar = this.allPixelsCorrect.get(colorID) ?? 0;
          this.allPixelsCorrect.set(colorID, allPixelsCorrectSoFar + _correctPixels);
        }
      }
    }
    console.log(`Tiles loaded: ${this.tilesLoadedTotal} / ${this.tilesTotal}`);
    if (this.allPixelsCorrectTotal >= this.allPixelsTotal && !!this.allPixelsTotal && this.tilesLoadedTotal == this.tilesTotal) {
      const confettiManager = new ConfettiManager();
      confettiManager.createConfetti(document.querySelector(`#${this.windowID}`));
    }
    this.timeRemaining = new Date((this.allPixelsTotal - this.allPixelsCorrectTotal) * 30 * 1e3 + Date.now());
    this.timeRemainingLocalized = localizeDate(this.timeRemaining);
  };

  // src/WindowWizard.js
  var _WindowWizard_instances, getTemplateDataFromStorage_fn, displaySchemaHealth_fn, displayTemplateList_fn, convertSchema_1_x_x_To_2_x_x_fn;
  var _WindowWizard = class _WindowWizard extends Overlay {
    /** Constructor for the Template Wizard window
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @param {string} schemaVersionBleedingEdge - The bleeding edge of schema versions for Blue Marble
     * @param {TemplateManager} [templateManager=undefined] - (Optional) The TemplateManager class instance
     * @since 0.88.434
     * @see {@link Overlay#constructor} for examples
     */
    constructor(name2, version2, schemaVersionBleedingEdge, templateManager = void 0) {
      super(name2, version2);
      __privateAdd(this, _WindowWizard_instances);
      this.window = null;
      this.windowID = "bm-window-wizard";
      this.windowParent = document.body;
      this.schemaHealth = void 0;
      this.schemaVersionBleedingEdge = schemaVersionBleedingEdge;
      this.templateManager = templateManager;
    }
    /** Spawns a Template Wizard window.
     * If another template wizard window already exists, we DON'T spawn another!
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.88.434
     */
    async buildWindow() {
      await __privateMethod(this, _WindowWizard_instances, getTemplateDataFromStorage_fn).call(this);
      if (document.querySelector(`#${this.windowID}`)) {
        document.querySelector(`#${this.windowID}`).remove();
        return;
      }
      let style = "";
      if (!document.querySelector(`#bm-window-main`)) {
        style = style.concat("z-index: 9001;").trim();
      }
      this.window = this.addDiv({ "id": this.windowID, "class": "bm-window", "style": style }, (instance, div) => {
      }).addDragbar().addButton({ "class": "bm-button-circle", "textContent": "\u25BC", "aria-label": 'Minimize window "Template Wizard"', "data-button-status": "expanded" }, (instance, button) => {
        button.onclick = () => instance.handleMinimization(button);
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addDiv().buildElement().addButton({ "class": "bm-button-circle", "textContent": "\u2716", "aria-label": 'Close window "Template Wizard"' }, (instance, button) => {
        button.onclick = () => {
          document.querySelector(`#${this.windowID}`)?.remove();
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().buildElement().addDiv({ "class": "bm-window-content" }).addDiv({ "class": "bm-container bm-center-vertically" }).addHeader(1, { "textContent": "Template Wizard" }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container" }).addHeader(2, { "textContent": "Status" }).buildElement().addP({ "id": "bm-wizard-status", "textContent": "Loading template storage status..." }).buildElement().buildElement().addDiv({ "class": "bm-container bm-scrollable" }).addHeader(2, { "textContent": "Detected templates:" }).buildElement().buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
      this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
      __privateMethod(this, _WindowWizard_instances, displaySchemaHealth_fn).call(this);
      __privateMethod(this, _WindowWizard_instances, displayTemplateList_fn).call(this);
    }
  };
  _WindowWizard_instances = new WeakSet();
  getTemplateDataFromStorage_fn = async function() {
    this.currentJSON = JSON.parse(await GM.getValue("bmTemplates", "{}"));
    this.scriptVersion = this.currentJSON?.scriptVersion;
    this.schemaVersion = this.currentJSON?.schemaVersion;
  };
  /** Determines how "healthy" the template storage is.
   * @since 0.88.436
   */
  displaySchemaHealth_fn = function() {
    const schemaVersionArray = this.schemaVersion.split(/[-\.\+]/);
    const schemaVersionBleedingEdgeArray = this.schemaVersionBleedingEdge.split(/[-\.\+]/);
    let schemaHealthBanner = "";
    if (schemaVersionArray[0] == schemaVersionBleedingEdgeArray[0]) {
      if (schemaVersionArray[1] == schemaVersionBleedingEdgeArray[1]) {
        schemaHealthBanner = 'Template storage health: <b style="color:#0f0;">Healthy!</b><br>No futher action required. (Reason: Semantic version matches)';
        this.schemaHealth = "Good";
      } else {
        schemaHealthBanner = `Template storage health: <b style="color:#ff0;">Poor!</b><br>You can still use your template, but some features may not work. It is recommended that you update Blue Marble's template storage. (Reason: MINOR version mismatch)`;
        this.schemaHealth = "Poor";
      }
    } else if (schemaVersionArray[0] < schemaVersionBleedingEdgeArray[0]) {
      schemaHealthBanner = `Template storage health: <b style="color:#f00;">Bad!</b><br>It is guaranteed that some features are broken. You <em>might</em> still be able to use the template. It is HIGHLY recommended that you download all templates and update Blue Marble's template storage before continuing. (Reason: MAJOR version mismatch)`;
      this.schemaHealth = "Bad";
    } else {
      schemaHealthBanner = 'Template storage health: <b style="color:#f00">Dead!</b><br>Blue Marble can not load the template storage. (Reason: MAJOR version unknown)';
      this.schemaHealth = "Dead";
    }
    const recoveryInstructions = `<hr style="margin:.5ch">If you want to continue using your current templates, then make sure the template storage (schema) is up-to-date.<br>If you don't want to update the template storage, then downgrade Blue Marble to version <b>${escapeHTML(this.scriptVersion)}</b> to continue using your templates.<br>Alternatively, if you don't care about corrupting the templates listed below, you can fix any issues with the template storage by uploading a new template.`;
    const wplaceUpdateTime = getWplaceVersion();
    let wplaceUpdateTimeLocalized = wplaceUpdateTime ? localizeDate(wplaceUpdateTime) : "???";
    this.updateInnerHTML("#bm-wizard-status", `${schemaHealthBanner}<br>Your templates were created during Blue Marble version <b>${escapeHTML(this.scriptVersion)}</b> with schema version <b>${escapeHTML(this.schemaVersion)}</b>.<br>The current Blue Marble version is <b>${escapeHTML(this.version)}</b> and requires schema version <b>${escapeHTML(this.schemaVersionBleedingEdge)}</b>.<br>Wplace was last updated on <b>${wplaceUpdateTimeLocalized}</b>.${this.schemaHealth != "Good" ? recoveryInstructions : ""}`);
    const buttonOptions = new Overlay(this.name, this.version);
    if (this.schemaHealth != "Dead") {
      buttonOptions.addDiv({ "class": "bm-container bm-flex-center bm-center-vertically", "style": "gap: 1.5ch;" });
      buttonOptions.addButton({ "textContent": "Download all templates" }, (instance, button) => {
        button.onclick = () => {
          button.disabled = true;
          this.templateManager.downloadAllTemplatesFromStorage().then(() => {
            button.disabled = false;
          });
        };
      }).buildElement();
    }
    if (this.schemaHealth == "Poor" || this.schemaHealth == "Bad") {
      buttonOptions.addButton({ "textContent": `Update template storage to ${this.schemaVersionBleedingEdge}` }, (instance, button) => {
        button.onclick = () => {
          button.disabled = true;
          __privateMethod(this, _WindowWizard_instances, convertSchema_1_x_x_To_2_x_x_fn).call(this, true);
        };
      }).buildElement();
    }
    buttonOptions.buildElement().buildOverlay(document.querySelector("#bm-wizard-status").parentNode);
  };
  /** Displays loaded templates to the user.
   * @since 0.88.441
   */
  displayTemplateList_fn = function() {
    const templates = this.currentJSON?.templates;
    if (Object.keys(templates).length > 0) {
      const templateListParentElement = document.querySelector(`#${this.windowID} .bm-scrollable`);
      const templateList = new Overlay(this.name, this.version);
      templateList.addDiv({ "id": "bm-wizard-tlist", "class": "bm-container" });
      for (const template in templates) {
        const templateKey = template;
        const templateValue = templates[template];
        if (templates.hasOwnProperty(template)) {
          const templateKeyArray = templateKey.split(" ");
          const sortID = Number(templateKeyArray?.[0]);
          const authorID = encodedToNumber(templateKeyArray?.[1] || "0", this.templateManager.encodingBase);
          const displayName = templateValue.name || `Template ${sortID || ""}`;
          const coords2 = templateValue?.coords?.split(",").map(Number);
          const totalPixelCount = templateValue.pixels?.total ?? void 0;
          const templateImage = void 0;
          const sortIDLocalized = typeof sortID == "number" ? localizeNumber(sortID) : "???";
          const authorIDLocalized = typeof authorID == "number" ? localizeNumber(authorID) : "???";
          const totalPixelCountLocalized = typeof totalPixelCount == "number" ? localizeNumber(totalPixelCount) : "???";
          templateList.addDiv({ "class": "bm-container bm-flex-center" }).addDiv({ "class": "bm-flex-center", "style": "flex-direction: column; gap: 0;" }).addDiv({ "class": "bm-wizard-template-container-image", "textContent": templateImage || "\u{1F5BC}\uFE0F" }).buildElement().addSmall({ "textContent": `#${sortIDLocalized}` }).buildElement().buildElement().addDiv({ "class": "bm-flex-center bm-wizard-template-container-flavor" }).addHeader(3, { "textContent": displayName }).buildElement().addSpan({ "textContent": `Uploaded by user #${authorIDLocalized}` }).buildElement().addSpan({ "textContent": `Coordinates: ${coords2.join(", ")}` }).buildElement().addSpan({ "textContent": `Total Pixels: ${totalPixelCountLocalized}` }).buildElement().buildElement().buildElement();
        }
      }
      templateList.buildElement().buildOverlay(templateListParentElement);
    }
  };
  convertSchema_1_x_x_To_2_x_x_fn = async function(shouldWindowWizardOpen) {
    if (shouldWindowWizardOpen) {
      const windowContent = document.querySelector(`#${this.windowID} .bm-window-content`);
      windowContent.innerHTML = "";
      const loadingScreen = new Overlay(this.name, this.version);
      loadingScreen.addDiv({ "class": "bm-container" }).addDiv({ "class": "bm-container bm-center-vertically" }).addHeader(1, { "textContent": "Template Wizard" }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container" }).addHeader(2, { "textContent": "Status" }).buildElement().addP({ "textContent": "Updating template storage. Please wait..." }).buildElement().buildElement().buildElement().buildOverlay(windowContent);
    }
    GM.deleteValue("bmCoords");
    const templates = this.currentJSON?.templates;
    if (Object.keys(templates).length > 0) {
      for (const [key, template] of Object.entries(templates)) {
        if (templates.hasOwnProperty(key)) {
          const _template = new Template({
            displayName: template.name,
            chunked: template.tiles
          });
          _template.calculateCoordsFromChunked();
          const blob = await this.templateManager.convertTemplateToBlob(_template);
          await this.templateManager.createTemplate(blob, _template.displayName, _template.coords);
        }
      }
    }
    if (shouldWindowWizardOpen) {
      console.log(`Restarting Template Wizard...`);
      document.querySelector(`#${this.windowID}`).remove();
      new _WindowWizard(this.name, this.version, this.schemaVersionBleedingEdge, this.templateManager).buildWindow();
    }
  };
  var WindowWizard = _WindowWizard;

  // src/WindowMain.js
  var _WindowMain_instances, buildWindowFilter_fn, coordinateInputPaste_fn;
  var WindowMain = class extends Overlay {
    /** Constructor for the main Blue Marble window
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @since 0.88.326
     * @see {@link Overlay#constructor}
     */
    constructor(name2, version2) {
      super(name2, version2);
      __privateAdd(this, _WindowMain_instances);
      this.mainWindow = null;
      this.windowID = "bm-window-main";
      this.windowParent = document.body;
      this.settingsManager = null;
      this.WStateVariables = Object.freeze({
        DRAW_DEPTH: 0,
        WINDOW_EXISTS: 1,
        WINDOW_MINIMIZED: 2,
        WINDOW_MOVED: 3,
        X_TRANSLATION_IS_NEGATIVE: 4,
        Y_TRANSLATION_IS_NEGATIVE: 5,
        // Reserved for expansion: 6
        X_TRANSLATION: 7,
        Y_TRANSLATION: 8,
        // Bit flags: 9 - 21
        TEMPLATE_COORDINATE_X: 22,
        TEMPLATE_COORDINATE_Y: 23
      });
    }
    /** Creates the main Blue Marble window.
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.58.3
     */
    buildWindow() {
      if (document.querySelector(`#${this.windowID}`)) {
        this.handleDisplayError("Main window already exists!");
        return;
      }
      const wStartsExp = !this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.WINDOW_MINIMIZED);
      const xTemplateCoord = this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.TEMPLATE_COORDINATE_X);
      const yTemplateCoord = this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.TEMPLATE_COORDINATE_Y);
      let initTemplateCoords = ["", "", "", ""];
      if (xTemplateCoord + yTemplateCoord != 0 && !isNaN(xTemplateCoord) && !isNaN(yTemplateCoord)) {
        initTemplateCoords = [Math.floor(xTemplateCoord / 1e3), Math.floor(yTemplateCoord / 1e3), xTemplateCoord % 1e3, yTemplateCoord % 1e3];
      }
      const windowWasInDOM = this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.WINDOW_EXISTS);
      const drawDepthOld = this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.DRAW_DEPTH);
      const drawDepthNew = this.handleDrawDepth(windowWasInDOM ? drawDepthOld : void 0);
      let translateX = this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.X_TRANSLATION_IS_NEGATIVE) ? -1 * this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.X_TRANSLATION) : this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.X_TRANSLATION);
      let translateY = this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.Y_TRANSLATION_IS_NEGATIVE) ? -1 * this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.Y_TRANSLATION) : this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.Y_TRANSLATION);
      translateX = Math.max(-250, Math.min(window.innerWidth - 40, translateX));
      translateY = Math.max(-10, Math.min(window.innerHeight - 35, translateY));
      const startingPosition = !this.settingsManager.getWindowStateVariable("bm", this.WStateVariables.WINDOW_MOVED) ? "top: 10px; left: unset; right: 75px;" : `top: 0px; left: 0px; transform: translate(${translateX}px, ${translateY}px);`;
      this.mainWindow = this.addDiv({ "id": this.windowID, "class": "bm-window bm-windowed", "style": `${startingPosition} z-index: ${9e3 + drawDepthNew};`, "data-draw-depth": drawDepthNew }, (instance, div) => {
      }).addDragbar().addButton({ "class": "bm-button-circle", "textContent": wStartsExp ? "\u25BC" : "\u25B6", "aria-label": wStartsExp ? 'Minimize window "Blue Marble"' : 'Unminimize window "Blue Marble"', "data-button-status": wStartsExp ? "expanded" : "collapsed" }, (instance, button) => {
        button.onclick = () => instance.handleMinimization(button);
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().addDiv(void 0, (instance, div) => {
        if (!wStartsExp) {
          instance.addHeader(1, { "textContent": this.name }).buildElement();
        }
      }).buildElement().addButton({ "class": "bm-button-circle", "innerHTML": '<svg viewbox="0 0 9 9" style="width:60%; margin:auto;"><path d="M2,4H5V7M0,9L5,4M1,1H8V8" stroke="#fff" fill="none"></svg>' }, (instance, button) => {
        button.onclick = () => {
          const thisWindow = document.querySelector("#" + this.windowID);
          thisWindow.style.top = "10px";
          thisWindow.style.left = "unset";
          thisWindow.style.right = "75px";
          thisWindow.style.transform = "";
        };
        button.ontouchend = () => {
          button.click();
        };
      }).buildElement().buildElement().addDiv({ "class": "bm-window-content", "style": wStartsExp ? "" : "height: 0px; display: none;" }).addDiv({ "class": "bm-container" }).addImg({ "class": "bm-favicon", "src": "https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/main/dist/assets/Favicon.png" }, (instance, img) => {
        const date = /* @__PURE__ */ new Date();
        const dayOfTheYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1)) / (1e3 * 60 * 60 * 24)) + 1;
        if (dayOfTheYear == 204) {
          img.parentNode.style.position = "relative";
          img.parentNode.innerHTML = img.parentNode.innerHTML + `<svg viewBox="0 0 9 7" width="2em" height="2em" style="position: absolute; top: -.75em; left: 3.25ch;"><path d="M0,3L9,0L2,7" fill="#0af"/><path d="M0,3A.4,.4 0 1 1 1,5" fill="#a00"/><path d="M1.5,6A1,1 0 0 1 3,6L2,7" fill="#a0f"/><path d="M4,5A.6,.6 0 1 1 5,4" fill="#0a0"/><path d="M6,3A.8,.8 0 1 1 7,2" fill="#fa0"/><path d="M4.5,1.5A1,1 0 0 1 3,2" fill="#aa0"/></svg>`;
          img.onload = () => {
            const confettiManager = new ConfettiManager();
            confettiManager.createConfetti(document.querySelector(`#${this.windowID}`));
          };
        }
      }).buildElement().addHeader(1, { "textContent": this.name }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container" }).addSpan({ "id": "bm-user-droplets", "textContent": "Droplets:" }).buildElement().addBr().buildElement().addSpan({ "id": "bm-user-nextlevel", "textContent": "Next level in..." }).buildElement().addBr().buildElement().addSpan({ "textContent": "Charges: " }).addTimer(Date.now(), 1e3, { "style": "font-weight: 700;" }, (instance, timer) => {
        instance.apiManager.chargeRefillTimerID = timer.id;
      }).buildElement().buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container" }).addDiv({ "class": "bm-container" }).addButton(
        { "class": "bm-button-circle bm-button-pin", "style": "margin-top: 0;", "innerHTML": '<svg viewBox="0 0 4 6"><path d="M.5,3.4A2,2 0 1 1 3.5,3.4L2,6"/><circle cx="2" cy="2" r=".7" fill="#fff"/></svg>' },
        (instance, button) => {
          button.onclick = () => {
            const coords2 = instance.apiManager?.coordsTilePixel;
            if (!coords2?.[0]) {
              instance.handleDisplayError("Coordinates are malformed! Did you try clicking on the canvas first?");
              return;
            }
            instance.updateInnerHTML("bm-input-tx", coords2?.[0] || "");
            instance.updateInnerHTML("bm-input-ty", coords2?.[1] || "");
            instance.updateInnerHTML("bm-input-px", coords2?.[2] || "");
            instance.updateInnerHTML("bm-input-py", coords2?.[3] || "");
          };
        }
      ).buildElement().addInput({ "type": "number", "id": "bm-input-tx", "class": "bm-input-coords", "placeholder": "Tl X", "value": initTemplateCoords?.[0], "min": 0, "max": 2047, "step": 1, "required": true }, (instance, input) => {
        input.addEventListener("paste", (event) => __privateMethod(this, _WindowMain_instances, coordinateInputPaste_fn).call(this, instance, input, event));
      }).buildElement().addInput({ "type": "number", "id": "bm-input-ty", "class": "bm-input-coords", "placeholder": "Tl Y", "value": initTemplateCoords?.[1], "min": 0, "max": 2047, "step": 1, "required": true }, (instance, input) => {
        input.addEventListener("paste", (event) => __privateMethod(this, _WindowMain_instances, coordinateInputPaste_fn).call(this, instance, input, event));
      }).buildElement().addInput({ "type": "number", "id": "bm-input-px", "class": "bm-input-coords", "placeholder": "Px X", "value": initTemplateCoords?.[2], "min": 0, "max": 999, "step": 1, "required": true }, (instance, input) => {
        input.addEventListener("paste", (event) => __privateMethod(this, _WindowMain_instances, coordinateInputPaste_fn).call(this, instance, input, event));
      }).buildElement().addInput({ "type": "number", "id": "bm-input-py", "class": "bm-input-coords", "placeholder": "Px Y", "value": initTemplateCoords?.[3], "min": 0, "max": 999, "step": 1, "required": true }, (instance, input) => {
        input.addEventListener("paste", (event) => __privateMethod(this, _WindowMain_instances, coordinateInputPaste_fn).call(this, instance, input, event));
      }).buildElement().buildElement().addDiv({ "class": "bm-container" }).addInputFile({ "class": "bm-input-file", "textContent": "Upload Template", "accept": "image/png, image/jpeg, image/webp, image/bmp, image/gif" }).buildElement().buildElement().addDiv({ "class": "bm-container bm-flex-between" }).addButton({ "textContent": "Disable", "data-button-status": "shown" }, (instance, button) => {
        button.onclick = () => {
          button.disabled = true;
          if (button.dataset["buttonStatus"] == "shown") {
            instance.apiManager?.templateManager?.setTemplatesShouldBeDrawn(false);
            button.dataset["buttonStatus"] = "hidden";
            button.textContent = "Enable";
            instance.handleDisplayStatus(`Disabled templates!`);
          } else {
            instance.apiManager?.templateManager?.setTemplatesShouldBeDrawn(true);
            button.dataset["buttonStatus"] = "shown";
            button.textContent = "Disable";
            instance.handleDisplayStatus(`Enabled templates!`);
          }
          button.disabled = false;
        };
      }).buildElement().addButton({ "textContent": "Create" }, (instance, button) => {
        button.onclick = () => {
          const input = document.querySelector(`#${this.windowID} .bm-input-file`);
          const coordTlX = document.querySelector("#bm-input-tx");
          if (!coordTlX.checkValidity()) {
            coordTlX.reportValidity();
            instance.handleDisplayError("Coordinates are malformed! Did you try clicking on the canvas first?");
            return;
          }
          const coordTlY = document.querySelector("#bm-input-ty");
          if (!coordTlY.checkValidity()) {
            coordTlY.reportValidity();
            instance.handleDisplayError("Coordinates are malformed! Did you try clicking on the canvas first?");
            return;
          }
          const coordPxX = document.querySelector("#bm-input-px");
          if (!coordPxX.checkValidity()) {
            coordPxX.reportValidity();
            instance.handleDisplayError("Coordinates are malformed! Did you try clicking on the canvas first?");
            return;
          }
          const coordPxY = document.querySelector("#bm-input-py");
          if (!coordPxY.checkValidity()) {
            coordPxY.reportValidity();
            instance.handleDisplayError("Coordinates are malformed! Did you try clicking on the canvas first?");
            return;
          }
          if (!input?.files[0]) {
            instance.handleDisplayError(`No file selected!`);
            return;
          }
          instance?.apiManager?.templateManager.createTemplate(input.files[0], input.files[0]?.name.replace(/\.[^/.]+$/, ""), [Number(coordTlX.value), Number(coordTlY.value), Number(coordPxX.value), Number(coordPxY.value)]);
          instance.handleDisplayStatus(`Drew to canvas!`);
        };
      }).buildElement().addButton({ "textContent": "Filter" }, (instance, button) => {
        button.onclick = () => __privateMethod(this, _WindowMain_instances, buildWindowFilter_fn).call(this);
      }).buildElement().buildElement().addDiv({ "class": "bm-container" }).addTextarea({ "id": this.outputStatusId, "placeholder": `Status: Sleeping...
Version: ${this.version}`, "readOnly": true }).buildElement().buildElement().addDiv({ "class": "bm-container bm-flex-between", "style": "margin-bottom: 0; flex-direction: column;" }).addDiv({ "class": "bm-flex-between" }).addButton({ "class": "bm-button-circle", "innerHTML": "\u2699\uFE0F", "title": "Settings" }, (instance, button) => {
        button.onclick = () => {
          instance.settingsManager.buildWindow();
        };
      }).buildElement().addButton({ "class": "bm-button-circle", "innerHTML": "\u{1F9D9}", "title": "Template Wizard" }, (instance, button) => {
        button.onclick = () => {
          const templateManager = instance.apiManager?.templateManager;
          const wizard = new WindowWizard(this.name, this.version, templateManager?.schemaVersion, templateManager);
          wizard.buildWindow();
        };
      }).buildElement().addButton({ "class": "bm-button-circle", "innerHTML": "\u{1F3A8}", "title": "Template Color Converter" }, (instance, button) => {
        button.onclick = () => {
          window.open("https://pepoafonso.github.io/color_converter_wplace/", "_blank", "noopener noreferrer");
        };
      }).buildElement().addButton({ "class": "bm-button-circle", "innerHTML": "\u{1F310}", "title": "Official Blue Marble Website" }, (instance, button) => {
        button.onclick = () => {
          window.open("https://bluemarble.lol/", "_blank", "noopener noreferrer");
        };
      }).buildElement().addButton({ "class": "bm-button-circle", "title": "Donate to SwingTheVine", "innerHTML": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#fff" style="width:80%; margin:auto;"><path d="M249.8 75c89.8 0 113 1.1 146.3 4.4 78.1 7.8 123.6 56 123.6 125.2l0 8.9c0 64.3-47.1 116.9-110.8 122.4-5 16.6-12.8 33.2-23.3 49.9-24.4 37.7-73.1 85.3-162.9 85.3l-17.7 0c-73.1 0-129.7-31.6-163.5-89.2-29.9-50.4-33.8-106.4-33.8-181.2 0-73.7 44.4-113.6 96.4-120.2 39.3-5 88.1-5.5 145.7-5.5zm0 41.6c-60.4 0-103.6 .5-136.3 5.5-46 6.7-64.3 32.7-64.3 79.2l.2 25.7c1.2 57.3 7.1 97.1 27.5 134.5 26.6 49.3 74.8 68.2 129.7 68.2l17.2 0c72 0 107-34.9 126.3-65.4 9.4-15.5 17.7-32.7 22.2-54.3l3.3-13.8 19.9 0c44.3 0 82.6-36 82.6-82l0-8.3c0-51.5-32.2-78.7-88.1-85.3-31.6-2.8-50.4-3.9-140.2-3.9zM267 169.2c38.2 0 64.8 31.6 64.8 67 0 32.7-18.3 61-42.1 83.1-15 15-39.3 30.5-55.9 40.5-4.4 2.8-10 4.4-16.7 4.4-5.5 0-10.5-1.7-15.5-4.4-16.6-10-41-25.5-56.5-40.5-21.8-20.8-39.2-46.9-41.3-77l-.2-6.1c0-35.5 25.5-67 64.3-67 22.7 0 38.8 11.6 49.3 27.7 11.6-16.1 27.2-27.7 49.9-27.7zm122.5-3.9c28.3 0 43.8 16.6 43.8 43.2s-15.5 42.7-43.8 42.7c-8.9 0-13.8-5-13.8-11.7l0-62.6c0-6.7 5-11.6 13.8-11.6z"/></svg>' }, (instance, button) => {
        button.onclick = () => {
          window.open("https://ko-fi.com/swingthevine", "_blank", "noopener noreferrer");
        };
      }).buildElement().addButton({ "class": "bm-button-circle", "innerHTML": "\u{1F91D}", "title": "Credits" }, (instance, button) => {
        button.onclick = () => {
          const credits = new WindowCredts(this.name, this.version);
          credits.buildWindow();
        };
      }).buildElement().buildElement().addSmall({ "textContent": "Made by SwingTheVine", "style": "margin-top: auto;" }).buildElement().buildElement().buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
      this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
    }
    /** Populates the settingsManager variable with the settingsManager class.
     * @param {SettingsManager} settingsManager - The settingsManager class instance
     * @since 0.92.67
     */
    setSettingsManager(settingsManager) {
      this.settingsManager = settingsManager;
    }
  };
  _WindowMain_instances = new WeakSet();
  /** Displays a new color filter window.
   * This is a helper function that creates a new class instance.
   * This might cause a memory leak. I pray that this is not the case...
   * @since 0.88.330
   */
  buildWindowFilter_fn = function() {
    const windowFilter = new WindowFilter(this);
    windowFilter.buildWindow();
  };
  coordinateInputPaste_fn = async function(instance, input, event) {
    event.preventDefault();
    const data = await getClipboardData(event);
    const coords2 = data.split(/[^a-zA-Z0-9]+/).filter((index) => index).map(Number).filter(
      (number) => !isNaN(number)
      // Removes NaN `[4]`
    );
    if (coords2.length == 2 && input.id == "bm-input-px") {
      instance.updateInnerHTML("bm-input-px", coords2?.[0] || "");
      instance.updateInnerHTML("bm-input-py", coords2?.[1] || "");
    } else if (coords2.length == 1) {
      instance.updateInnerHTML(input.id, coords2?.[0] || "");
    } else {
      instance.updateInnerHTML("bm-input-tx", coords2?.[0] || "");
      instance.updateInnerHTML("bm-input-ty", coords2?.[1] || "");
      instance.updateInnerHTML("bm-input-px", coords2?.[2] || "");
      instance.updateInnerHTML("bm-input-py", coords2?.[3] || "");
    }
  };

  // src/templateManager.js
  var _TemplateManager_instances, loadTemplate_fn, storeTemplates_fn, parseBlueMarble_fn, parseOSU_fn, calculateCorrectPixelsOnTile_And_FilterTile_fn;
  var TemplateManager = class {
    /** The constructor for the {@link TemplateManager} class.
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript (SemVer as string)
     * @since 0.55.8
     */
    constructor(name2, version2) {
      __privateAdd(this, _TemplateManager_instances);
      this.name = name2;
      this.version = version2;
      this.windowMain = null;
      this.settingsManager = null;
      this.schemaVersion = "2.0.0";
      this.userID = null;
      this.tileSize = 1e3;
      this.drawMult = 3;
      this.paletteTolerance = 3;
      this.paletteBM = colorpaletteForBlueMarble(this.paletteTolerance);
      this.template = null;
      this.templateState = "";
      this.templatesArray = [];
      this.templatesJSON = null;
      this.templatesShouldBeDrawn = true;
      this.templatePixelsCorrect = null;
      this.shouldFilterColor = /* @__PURE__ */ new Map();
    }
    /** Updates the stored instance of the main window.
     * @param {WindowMain} windowMain - The main window instance
     * @since 0.91.54
     */
    setWindowMain(windowMain) {
      this.windowMain = windowMain;
    }
    /** Updates the stored instance of the SettingsManager.
     * @param {SettingsManager} settingsManager - The settings manager instance
     * @since 0.91.54
     */
    setSettingsManager(settingsManager) {
      this.settingsManager = settingsManager;
    }
    /** Creates the JSON object to store templates in
     * @returns {{ whoami: string, scriptVersion: string, schemaVersion: string, templates: Object }} The JSON object
     * @since 0.65.4
     */
    async createJSON() {
      return {
        "whoami": this.name.replace(" ", ""),
        // Name of userscript without spaces
        "scriptVersion": this.version,
        // Version of userscript
        "schemaVersion": this.schemaVersion,
        // Version of JSON schema
        "templates": {}
        // The templates
      };
    }
    /** Creates the template from the inputed file blob
     * @param {File} blob - The file blob to create a template from
     * @param {string} name - The display name of the template
     * @param {Array<number, number, number, number>} coords - The coordinates of the top left corner of the template
     * @since 0.65.77
     */
    async createTemplate(blob, name2, coords2) {
      if (!this.templatesJSON) {
        this.templatesJSON = await this.createJSON();
        console.log(`Creating JSON...`);
      }
      this.windowMain.handleDisplayStatus(`Creating template at ${coords2.join(", ")}...`);
      const template = new Template({
        displayName: name2,
        sortID: 0,
        // Object.keys(this.templatesJSON.templates).length || 0, // Uncomment this to enable multiple templates (1/2)
        authorID: numberToEncoded(this.userID || 0),
        file: blob,
        coords: coords2
      });
      const shouldSkipTransTiles = !this.settingsManager?.userSettings?.flags?.includes("hl-noSkip");
      const shouldAggSkipTransTiles = this.settingsManager?.userSettings?.flags?.includes("hl-agSkip");
      console.log(`Should Skip: ${shouldSkipTransTiles}; Should Agg Skip: ${shouldAggSkipTransTiles}`);
      const { templateTiles, templateTilesBuffers } = await template.createTemplateTiles(this.tileSize, this.paletteBM, shouldSkipTransTiles, shouldAggSkipTransTiles);
      template.chunked = templateTiles;
      const _pixels = { "total": template.pixelCount.total, "colors": Object.fromEntries(template.pixelCount.colors) };
      this.templatesJSON.templates[`${template.sortID} ${template.authorID}`] = {
        "name": template.displayName,
        // Display name of template
        "coords": coords2.join(", "),
        // The coords of the template
        "enabled": true,
        "pixels": _pixels,
        // The total pixels in the template
        "tiles": templateTilesBuffers
        // Stores the chunked tile buffers
      };
      this.templatesArray = [];
      this.templatesArray.push(template);
      this.windowMain.handleDisplayStatus(`Template created at ${coords2.join(", ")}!`);
      console.log(Object.keys(this.templatesJSON.templates).length);
      console.log(this.templatesJSON);
      console.log(this.templatesArray);
      console.log(JSON.stringify(this.templatesJSON));
      await __privateMethod(this, _TemplateManager_instances, storeTemplates_fn).call(this);
    }
    /** Deletes a template from the JSON object.
     * Also delete's the corrosponding {@link Template} class instance
     */
    deleteTemplate() {
    }
    /** Disables the template from view
     */
    async disableTemplate() {
      if (!this.templatesJSON) {
        this.templatesJSON = await this.createJSON();
        console.log(`Creating JSON...`);
      }
    }
    /** Downloads all templates loaded.
     * Specifically, this downloads all templates LOADED in memory (hot storage).
     * This is NOT the templates saved in user storage (cold storage).
     * If a template is too big to store in user-storage, then this is the only way to download the template.
     * @since 0.88.499
     * @see {@link downloadAllTemplatesFromStorage()}
     */
    async downloadAllTemplates() {
      consoleLog(`Downloading all templates...`);
      console.log(this.templatesArray);
      for (const template of this.templatesArray) {
        await this.downloadTemplate(template);
        await sleep(500);
      }
    }
    /** Downloads all templates from Blue Marble's template storage.
     * Specifically, it downloads all templates from cold storage.
     * These templates may NOT be loaded in memory (hot storage).
     * @since 0.88.474
     * @see {@link downloadAllTemplates()}
     */
    async downloadAllTemplatesFromStorage() {
      const templates = JSON.parse(await GM.getValue("bmTemplates", "{}"))?.templates;
      console.log(templates);
      if (Object.keys(templates).length > 0) {
        for (const [key, template] of Object.entries(templates)) {
          if (templates.hasOwnProperty(key)) {
            await this.downloadTemplate(new Template({
              displayName: template.name,
              sortID: key.split(" ")?.[0],
              authorID: key.split(" ")?.[1],
              chunked: template.tiles
            }));
            await sleep(500);
          }
        }
      }
    }
    /** Downloads the template passed-in.
     * @param {Template} template - The template class instance to download
     * @since 0.88.499
     */
    async downloadTemplate(template) {
      template.calculateCoordsFromChunked();
      const templateFileName = `${template.coords.join("-")}_${template.displayName.replaceAll(" ", "-")}`;
      const blob = await this.convertTemplateToBlob(template);
      await GM.download({
        url: URL.createObjectURL(blob),
        name: templateFileName + ".png",
        conflictAction: "uniquify",
        onload: () => {
          consoleLog(`Download of template '${templateFileName}' complete!`);
        },
        onerror: (error, details) => {
          consoleError(`Download of template '${templateFileName}' failed because ${error}! Details: ${details}`);
        },
        ontimeout: () => {
          consoleWarn2(`Download of template '${templateFileName}' has timed out!`);
        }
      });
    }
    /** Converts a Template class instance into a Blob. 
     * Specifically, this takes `Template.chunked` and converts it to a Blob.
     * @since 0.88.504
     * @returns {Promise<Blob>} A Promise of a Blob PNG image of the template
     */
    async convertTemplateToBlob(template) {
      console.log(template);
      const templateTiles64 = template.chunked;
      const templateTileKeysSorted = Object.keys(templateTiles64).sort();
      const templateTilesImageSorted = await Promise.all(templateTileKeysSorted.map((tileKey) => convertBase64ToImage(templateTiles64[tileKey])));
      let absoluteSmallestX = Infinity;
      let absoluteSmallestY = Infinity;
      let absoluteLargestX = 0;
      let absoluteLargestY = 0;
      templateTileKeysSorted.forEach((key, index) => {
        const [tileX, tileY, pixelX, pixelY] = key.split(",").map(Number);
        const tileImage = templateTilesImageSorted[index];
        const absoluteX = tileX * this.tileSize + pixelX;
        const absoluteY = tileY * this.tileSize + pixelY;
        absoluteSmallestX = Math.min(absoluteSmallestX, absoluteX);
        absoluteSmallestY = Math.min(absoluteSmallestY, absoluteY);
        absoluteLargestX = Math.max(absoluteLargestX, absoluteX + tileImage.width / this.drawMult);
        absoluteLargestY = Math.max(absoluteLargestY, absoluteY + tileImage.height / this.drawMult);
      });
      console.log(`Absolute coordinates: (${absoluteSmallestX}, ${absoluteSmallestY}) and (${absoluteLargestX}, ${absoluteLargestY})`);
      const templateWidth = absoluteLargestX - absoluteSmallestX;
      const templateHeight = absoluteLargestY - absoluteSmallestY;
      const canvasWidth = templateWidth * this.drawMult;
      const canvasHeight = templateHeight * this.drawMult;
      console.log(`Template Width: ${templateWidth}
Template Height: ${templateHeight}
Canvas Width: ${canvasWidth}
Canvas Height: ${canvasHeight}`);
      const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
      const context = canvas.getContext("2d");
      templateTileKeysSorted.forEach((key, index) => {
        const [tileX, tileY, pixelX, pixelY] = key.split(",").map(Number);
        const tileImage = templateTilesImageSorted[index];
        const absoluteX = tileX * this.tileSize + pixelX;
        const absoluteY = tileY * this.tileSize + pixelY;
        console.log(`Drawing tile (${tileX}, ${tileY}, ${pixelX}, ${pixelY}) (${absoluteX}, ${absoluteY}) at (${absoluteX - absoluteSmallestX}, ${absoluteY - absoluteSmallestY}) on the canvas...`);
        context.drawImage(tileImage, (absoluteX - absoluteSmallestX) * this.drawMult, (absoluteY - absoluteSmallestY) * this.drawMult, tileImage.width, tileImage.height);
      });
      context.globalCompositeOperation = "destination-over";
      context.drawImage(canvas, 0, -1);
      context.drawImage(canvas, 0, 1);
      context.drawImage(canvas, -1, 0);
      context.drawImage(canvas, 1, 0);
      const smallCanvas = new OffscreenCanvas(templateWidth, templateHeight);
      const smallContext = smallCanvas.getContext("2d");
      smallContext.imageSmoothingEnabled = false;
      smallContext.drawImage(
        canvas,
        0,
        0,
        templateWidth * this.drawMult,
        templateHeight * this.drawMult,
        // Source image size
        0,
        0,
        templateWidth,
        templateHeight
        // Small canvas size
      );
      return smallCanvas.convertToBlob({ type: "image/png" });
      function convertBase64ToImage(base64) {
        return new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = "data:image/png;base64," + base64;
        });
      }
    }
    /** Draws all templates on the specified tile.
     * This method handles the rendering of template overlays on individual tiles.
     * @param {File} tileBlob - The pixels that are placed on a tile
     * @param {Array<number>} tileCoords - The tile coordinates [x, y]
     * @since 0.65.77
     */
    async drawTemplateOnTile(tileBlob, tileCoords) {
      if (!this.templatesShouldBeDrawn) {
        return tileBlob;
      }
      const drawSize = this.tileSize * this.drawMult;
      tileCoords = tileCoords[0].toString().padStart(4, "0") + "," + tileCoords[1].toString().padStart(4, "0");
      console.log(`Searching for templates in tile: "${tileCoords}"`);
      const templateArray = this.templatesArray;
      console.log(templateArray);
      templateArray.sort((a, b) => {
        return a.sortID - b.sortID;
      });
      console.log(templateArray);
      const templatesToDraw = templateArray.map((template) => {
        const matchingTiles = Object.keys(template.chunked).filter(
          (tile) => tile.startsWith(tileCoords)
        );
        if (matchingTiles.length === 0) {
          return null;
        }
        const matchingTileBlobs = matchingTiles.map((tile) => {
          const coords2 = tile.split(",");
          return {
            instance: template,
            bitmap: template.chunked[tile],
            chunked32: template.chunked32?.[tile],
            tileCoords: [coords2[0], coords2[1]],
            pixelCoords: [coords2[2], coords2[3]]
          };
        });
        return matchingTileBlobs?.[0];
      }).filter(Boolean);
      console.log(templatesToDraw);
      const templateCount = templatesToDraw?.length || 0;
      console.log(`templateCount = ${templateCount}`);
      if (templateCount > 0) {
        const totalPixels = templateArray.filter((template) => {
          const matchingTiles = Object.keys(template.chunked).filter(
            (tile) => tile.startsWith(tileCoords)
          );
          return matchingTiles.length > 0;
        }).reduce((sum, template) => sum + (template.pixelCount.total || 0), 0);
        const pixelCountFormatted = localizeNumber(totalPixels);
        this.windowMain.handleDisplayStatus(
          `Displaying ${templateCount} template${templateCount == 1 ? "" : "s"}.
Total pixels: ${pixelCountFormatted}`
        );
      } else {
        this.windowMain.handleDisplayStatus(`Sleeping
Version: ${this.version}`);
        return tileBlob;
      }
      const tileBitmap = await createImageBitmap(tileBlob);
      const canvas = new OffscreenCanvas(drawSize, drawSize);
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = false;
      context.beginPath();
      context.rect(0, 0, drawSize, drawSize);
      context.clip();
      context.clearRect(0, 0, drawSize, drawSize);
      context.drawImage(tileBitmap, 0, 0, drawSize, drawSize);
      const tileBeforeTemplates = context.getImageData(0, 0, drawSize, drawSize);
      const tileBeforeTemplates32 = new Uint32Array(tileBeforeTemplates.data.buffer);
      const highlightPattern = this.settingsManager?.userSettings?.highlight || [[2, 0, 0]];
      const highlightPatternIndexZero = highlightPattern?.[0];
      const highlightDisabled = highlightPattern?.length == 1 && highlightPatternIndexZero?.[0] == 2 && highlightPatternIndexZero?.[1] == 0 && highlightPatternIndexZero?.[2] == 0;
      for (const template of templatesToDraw) {
        console.log(`Template:`);
        console.log(template);
        const templateHasErased = !!template.instance.pixelCount?.colors?.get(-1);
        let templateBeforeFilter32 = template.chunked32.slice();
        const coordXtoDrawAt = Number(template.pixelCoords[0]) * this.drawMult;
        const coordYtoDrawAt = Number(template.pixelCoords[1]) * this.drawMult;
        if (this.shouldFilterColor.size == 0 && !templateHasErased) {
          context.drawImage(template.bitmap, coordXtoDrawAt, coordYtoDrawAt);
        }
        if (!templateBeforeFilter32) {
          const templateBeforeFilter = context.getImageData(coordXtoDrawAt, coordYtoDrawAt, template.bitmap.width, template.bitmap.height);
          templateBeforeFilter32 = new Uint32Array(templateBeforeFilter.data.buffer);
        }
        const timer = performance.now();
        const {
          correctPixels: pixelsCorrect,
          filteredTemplate: templateAfterFilter
        } = __privateMethod(this, _TemplateManager_instances, calculateCorrectPixelsOnTile_And_FilterTile_fn).call(this, {
          tile: tileBeforeTemplates32,
          template: templateBeforeFilter32,
          templateInfo: [coordXtoDrawAt, coordYtoDrawAt, template.bitmap.width, template.bitmap.height],
          highlightPattern,
          highlightDisabled
        });
        let pixelsCorrectTotal = 0;
        const transparentColorID = 0;
        for (const [color, total] of pixelsCorrect) {
          if (color == transparentColorID) {
            continue;
          }
          pixelsCorrectTotal += total;
        }
        if (this.shouldFilterColor.size != 0 || templateHasErased || !highlightDisabled) {
          console.log("Colors to filter: ", this.shouldFilterColor);
          context.drawImage(await createImageBitmap(new ImageData(new Uint8ClampedArray(templateAfterFilter.buffer), template.bitmap.width, template.bitmap.height)), coordXtoDrawAt, coordYtoDrawAt);
        }
        console.log(`Finished calculating correct pixels & filtering colors for the tile ${tileCoords} in ${(performance.now() - timer).toFixed(3) / 1e3} seconds!
There are ${pixelsCorrectTotal} correct pixels.`);
        if (typeof template.instance.pixelCount["correct"] == "undefined") {
          template.instance.pixelCount["correct"] = {};
        }
        template.instance.pixelCount["correct"][tileCoords] = pixelsCorrect;
      }
      return await canvas.convertToBlob({ type: "image/png" });
    }
    /** Imports the JSON object, and appends it to any JSON object already loaded
     * @param {string} json - The JSON string to parse
     */
    importJSON(json) {
      console.log(`Importing JSON...`);
      console.log(json);
      if (json?.whoami == "BlueMarble") {
        __privateMethod(this, _TemplateManager_instances, parseBlueMarble_fn).call(this, json);
      }
    }
    /** Sets the `templatesShouldBeDrawn` boolean to a value.
     * @param {boolean} value - The value to set the boolean to
     * @since 0.73.7
     */
    setTemplatesShouldBeDrawn(value) {
      this.templatesShouldBeDrawn = value;
    }
  };
  _TemplateManager_instances = new WeakSet();
  /** Generates a {@link Template} class instance from the JSON object template.
   * {@link createTemplate()} will create a class instance and save to template storage.
   * `#loadTemplate()` will create a class instance without saving to the template storage.
   * @param {Object} template - The template to load
   * @since 0.88.504
   */
  loadTemplate_fn = function(templateObject) {
    const pixelCount = {
      total: templateObject.pixels?.total,
      colors: new Map(Object.entries(templateObject.pixels?.colors || {}).map(([key, value]) => [Number(key), value]))
    };
    const template = new Template({
      displayName: templateObject.displayName,
      sortID: Object.keys(this.templatesJSON.templates).length || 0,
      authorID: numberToEncoded(this.userID || 0),
      pixelCount,
      chunked: templateObject.tiles
    });
    template.calculateCoordsFromChunked();
    this.templatesArray.push(template);
  };
  storeTemplates_fn = async function() {
    await GM.setValue("bmTemplates", JSON.stringify(this.templatesJSON));
  };
  parseBlueMarble_fn = async function(json) {
    console.log(`Parsing BlueMarble...`);
    const templates = json.templates;
    console.log(`BlueMarble length: ${Object.keys(templates).length}`);
    const schemaVersion = json?.schemaVersion;
    const schemaVersionArray = schemaVersion.split(/[-\.\+]/);
    const schemaVersionBleedingEdge = this.schemaVersion.split(/[-\.\+]/);
    const scriptVersion = json?.scriptVersion;
    console.log(`BlueMarble Template Schema: ${schemaVersion}; Script Version: ${scriptVersion}`);
    if (schemaVersionArray[0] == schemaVersionBleedingEdge[0]) {
      if (schemaVersionArray[1] != schemaVersionBleedingEdge[1]) {
        const windowWizard = new WindowWizard(this.name, this.version, this.schemaVersion, this);
        await windowWizard.buildWindow();
      }
      this.templatesArray = await loadSchema({
        tileSize: this.tileSize,
        drawMult: this.drawMult,
        templatesArray: this.templatesArray
      });
    } else if (schemaVersionArray[0] < schemaVersionBleedingEdge[0]) {
      const windowWizard = new WindowWizard(this.name, this.version, this.schemaVersion, this);
      await windowWizard.buildWindow();
    } else {
      this.windowMain.handleDisplayError(`Template version ${schemaVersion} is unsupported.
Use Blue Marble version ${scriptVersion} or load a new template.`);
    }
    async function loadSchema({
      tileSize,
      drawMult,
      templatesArray
    }) {
      if (Object.keys(templates).length > 0) {
        for (const template in templates) {
          const templateKey = template;
          const templateValue = templates[template];
          console.log(`Template Key: ${templateKey}`);
          if (templates.hasOwnProperty(template)) {
            const templateKeyArray = templateKey.split(" ");
            const sortID = Number(templateKeyArray?.[0]);
            const authorID = templateKeyArray?.[1] || "0";
            const displayName = templateValue.name || `Template ${sortID || ""}`;
            const pixelCount = {
              total: templateValue.pixels?.total,
              colors: new Map(Object.entries(templateValue.pixels?.colors || {}).map(([key, value]) => [Number(key), value]))
            };
            const tilesbase64 = templateValue.tiles;
            const templateTiles = {};
            const templateTiles32 = {};
            const actualTileSize = tileSize * drawMult;
            for (const tile in tilesbase64) {
              console.log(tile);
              if (tilesbase64.hasOwnProperty(tile)) {
                const encodedTemplateBase64 = tilesbase64[tile];
                const templateUint8Array = base64ToUint8(encodedTemplateBase64);
                const templateBlob = new Blob([templateUint8Array], { type: "image/png" });
                const templateBitmap = await createImageBitmap(templateBlob);
                templateTiles[tile] = templateBitmap;
                const canvas = new OffscreenCanvas(actualTileSize, actualTileSize);
                const context = canvas.getContext("2d");
                context.drawImage(templateBitmap, 0, 0);
                const imageData = context.getImageData(0, 0, templateBitmap.width, templateBitmap.height);
                templateTiles32[tile] = new Uint32Array(imageData.data.buffer);
              }
            }
            const template2 = new Template({
              displayName,
              sortID: sortID || this.templatesArray?.length || 0,
              authorID: authorID || ""
              //coords: coords,
            });
            template2.pixelCount = pixelCount;
            template2.chunked = templateTiles;
            template2.chunked32 = templateTiles32;
            templatesArray.push(template2);
            console.log(this.templatesArray);
            console.log(`^^^ This ^^^`);
          }
        }
      }
      return templatesArray;
    }
  };
  /** Parses the OSU! Place JSON object
   */
  parseOSU_fn = function() {
  };
  /** Calculates the correct pixels on this tile.
   * In addition, this function filters colors based on user input.
   * In addition, this function modifies colors to properly display (#deface).
   * In addition, this function modifies incorrect pixels to display highlighting.
   * This function has multiple purposes only to reduce iterations of scans over every pixel on the template.
   * @param {Object} params - Object containing all parameters
   * @param {Uint32Array} params.tile - The tile without templates as a Uint32Array
   * @param {Uint32Array} params.template - The template without filtering as a Uint32Array
   * @param {Array<Number, Number, Number, Number>} params.templateInfo - Information about template location and size
   * @param {Array<number[]>} params.highlightPattern - The highlight pattern selected by the user
   * @param {boolean} params.highlightDisabled - Should highlighting be disabled?
   * @returns {{correctPixels: Map<number, number>, filteredTemplate: Uint32Array}} A Map containing the color IDs (keys) and how many correct pixels there are for that color (values)
   */
  calculateCorrectPixelsOnTile_And_FilterTile_fn = function({
    tile: tile32,
    template: template32,
    templateInfo: templateInformation,
    highlightPattern,
    highlightDisabled
  }) {
    const pixelSize = this.drawMult;
    const tileWidth = this.tileSize * pixelSize;
    const tileHeight = tileWidth;
    const tilePixelOffsetY = -1;
    const tilePixelOffsetX = 0;
    const templateCoordX = templateInformation[0];
    const templateCoordY = templateInformation[1];
    const templateWidth = templateInformation[2];
    const templateHeight = templateInformation[3];
    const tolerance = this.paletteTolerance;
    const shouldTransparentTilePixelsBeHighlighted = !this.settingsManager?.userSettings?.flags?.includes("hl-noTrans");
    const { palette: _, LUT: lookupTable } = this.paletteBM;
    const _colorpalette = /* @__PURE__ */ new Map();
    for (let templateRow = 1; templateRow < templateHeight; templateRow += pixelSize) {
      for (let templateColumn = 1; templateColumn < templateWidth; templateColumn += pixelSize) {
        const tileRow = templateCoordY + templateRow + tilePixelOffsetY;
        const tileColumn = templateCoordX + templateColumn + tilePixelOffsetX;
        const tilePixelAbove = tile32[tileRow * tileWidth + tileColumn];
        const templatePixel = template32[templateRow * templateWidth + templateColumn];
        const templatePixelAlpha = templatePixel >>> 24 & 255;
        const tilePixelAlpha = tilePixelAbove >>> 24 & 255;
        const bestTemplateColorID = lookupTable.get(templatePixel) ?? -2;
        const bestTileColorID = lookupTable.get(tilePixelAbove) ?? -2;
        if (this.shouldFilterColor.get(bestTemplateColorID)) {
          template32[templateRow * templateWidth + templateColumn] = tilePixelAbove;
        }
        if (bestTemplateColorID == -1) {
          const blackTrans = 536870912;
          if (this.shouldFilterColor.get(bestTemplateColorID)) {
            template32[templateRow * templateWidth + templateColumn] = 0;
          } else {
            if ((tileRow / pixelSize & 1) == (tileColumn / pixelSize & 1)) {
              template32[templateRow * templateWidth + templateColumn] = blackTrans;
              template32[(templateRow - 1) * templateWidth + (templateColumn - 1)] = blackTrans;
              template32[(templateRow - 1) * templateWidth + (templateColumn + 1)] = blackTrans;
              template32[(templateRow + 1) * templateWidth + (templateColumn - 1)] = blackTrans;
              template32[(templateRow + 1) * templateWidth + (templateColumn + 1)] = blackTrans;
            } else {
              template32[templateRow * templateWidth + templateColumn] = 0;
              template32[(templateRow - 1) * templateWidth + templateColumn] = blackTrans;
              template32[(templateRow + 1) * templateWidth + templateColumn] = blackTrans;
              template32[templateRow * templateWidth + (templateColumn - 1)] = blackTrans;
              template32[templateRow * templateWidth + (templateColumn + 1)] = blackTrans;
            }
          }
        }
        if (!highlightDisabled && templatePixelAlpha > tolerance && bestTileColorID != bestTemplateColorID && !this.shouldFilterColor.get(bestTemplateColorID)) {
          if (shouldTransparentTilePixelsBeHighlighted || tilePixelAlpha > tolerance) {
            const templatePixelColor = template32[templateRow * templateWidth + templateColumn];
            for (const subpixelPattern of highlightPattern) {
              const [subpixelState, subpixelColumnDelta, subpixelRowDelta] = subpixelPattern;
              const subpixelColor = subpixelState != 0 ? subpixelState != 1 ? templatePixelColor : 4278190335 : 0;
              template32[(templateRow + subpixelRowDelta) * templateWidth + (templateColumn + subpixelColumnDelta)] = subpixelColor;
            }
          }
        }
        if (bestTemplateColorID == -1 && tilePixelAbove <= tolerance) {
          const colorIDcount2 = _colorpalette.get(bestTemplateColorID);
          _colorpalette.set(bestTemplateColorID, colorIDcount2 ? colorIDcount2 + 1 : 1);
          continue;
        }
        if (templatePixelAlpha <= tolerance || tilePixelAlpha <= tolerance) {
          continue;
        }
        if (bestTileColorID != bestTemplateColorID) {
          continue;
        }
        const colorIDcount = _colorpalette.get(bestTemplateColorID);
        _colorpalette.set(bestTemplateColorID, colorIDcount ? colorIDcount + 1 : 1);
      }
    }
    console.log(`List of template pixels that match the tile:`);
    console.log(_colorpalette);
    return { correctPixels: _colorpalette, filteredTemplate: template32 };
  };

  // src/apiManager.js
  var ApiManager = class {
    /** Constructor for ApiManager class
     * @param {TemplateManager} templateManager 
     * @since 0.11.34
     */
    constructor(templateManager) {
      this.templateManager = templateManager;
      this.disableAll = false;
      this.chargeRefillTimerID = "";
      this.coordsTilePixel = [];
      this.templateCoordsTilePixel = [];
    }
    /** Determines if the spontaneously received response is something we want.
     * Otherwise, we can ignore it.
     * Note: Due to aggressive compression, make your calls like `data['jsonData']['name']` instead of `data.jsonData.name`
     * 
     * @param {Overlay} overlay - The Overlay class instance
     * @since 0.11.1
    */
    spontaneousResponseListener(overlay) {
      window.addEventListener("message", async (event) => {
        const data = event.data;
        const dataJSON = data["jsonData"];
        if (!(data && data["source"] === "blue-marble")) {
          return;
        }
        if (!data["endpoint"]) {
          return;
        }
        const endpointText = data["endpoint"]?.split("?")[0].split("/").filter((s) => s && isNaN(Number(s))).filter((s) => s && !s.includes(".")).pop();
        console.log(`%cBlue Marble%c: Recieved message about "%s"`, "color: cornflowerblue;", "", endpointText);
        switch (endpointText) {
          case "me":
            if (dataJSON["status"] && dataJSON["status"]?.toString()[0] != "2") {
              overlay.handleDisplayError(`You are not logged in or Wplace is offline!
Could not fetch userdata.`);
              return;
            }
            const nextLevelPixels = Math.ceil(Math.pow(Math.floor(dataJSON["level"]) * Math.pow(30, 0.65), 1 / 0.65) - dataJSON["pixelsPainted"]);
            console.log(dataJSON["id"]);
            if (!!dataJSON["id"] || dataJSON["id"] === 0) {
              console.log(numberToEncoded(dataJSON["id"]));
            }
            this.templateManager.userID = dataJSON["id"];
            if (this.chargeRefillTimerID.length != 0) {
              const chargeRefillTimer = document.querySelector("#" + this.chargeRefillTimerID);
              if (chargeRefillTimer) {
                const chargeData = dataJSON["charges"];
                chargeRefillTimer.dataset["endDate"] = Date.now() + (chargeData["max"] - chargeData["count"]) * chargeData["cooldownMs"];
              }
            }
            overlay.updateInnerHTML("bm-user-droplets", `Droplets: <b>${localizeNumber(dataJSON["droplets"])}</b>`);
            overlay.updateInnerHTML("bm-user-nextlevel", `Next level in <b>${localizeNumber(nextLevelPixels)}</b> pixel${nextLevelPixels == 1 ? "" : "s"}`);
            break;
          case "pixel":
            const coordsTile = data["endpoint"].split("?")[0].split("/").filter((s) => s && !isNaN(Number(s)));
            const payloadExtractor = new URLSearchParams(data["endpoint"].split("?")[1]);
            const coordsPixel = [payloadExtractor.get("x"), payloadExtractor.get("y")];
            if (this.coordsTilePixel.length && (!coordsTile.length || !coordsPixel.length)) {
              overlay.handleDisplayError(`Coordinates are malformed!
Did you try clicking the canvas first?`);
              return;
            }
            this.coordsTilePixel = [...coordsTile, ...coordsPixel];
            const displayTP = serverTPtoDisplayTP(coordsTile, coordsPixel);
            const spanElements = document.querySelectorAll("span");
            for (const element of spanElements) {
              const elementTextTrimmed = element.textContent.trim();
              if (elementTextTrimmed.includes(displayTP[0]) && elementTextTrimmed.includes(displayTP[1])) {
                let displayCoords = document.querySelector("#bm-display-coords");
                const text = `(Tl X: ${coordsTile[0]}, Tl Y: ${coordsTile[1]}, Px X: ${coordsPixel[0]}, Px Y: ${coordsPixel[1]})`;
                const coordsLabel = ["Tl X:", "Tl Y:", "Px X:", "Px Y:"];
                const coordsID = ["bm-tile-x", "bm-tile-y", "bm-pixel-x", "bm-pixel-y"];
                const coordsCombined = [...coordsTile, ...coordsPixel];
                if (!displayCoords) {
                  displayCoords = document.createElement("span");
                  displayCoords.id = "bm-display-coords";
                  displayCoords.style = "display: flex; flex-wrap: wrap; gap: 0 1ch; font-size: small;";
                  for (const [coordIndex, coordValue] of coordsCombined.entries()) {
                    const coordElement = document.createElement("span");
                    coordElement.id = coordsID[coordsCombined.indexOf(coordValue) ?? ""];
                    coordElement.textContent = `${coordsLabel[coordIndex] ?? "??:"} ${coordValue}`;
                    displayCoords.appendChild(coordElement);
                  }
                  element.parentNode.parentNode.parentNode.insertAdjacentElement("afterend", displayCoords);
                } else {
                  for (const [coordIndex, coordID] of coordsID.entries()) {
                    const coordElement = document.getElementById(coordID);
                    coordElement.textContent = `${coordsLabel[coordIndex] ?? "??:"} ${coordsCombined[coordIndex]}`;
                  }
                }
              }
            }
            break;
          case "tile":
          case "tiles":
            let tileCoordsTile = data["endpoint"].split("/");
            tileCoordsTile = [parseInt(tileCoordsTile[tileCoordsTile.length - 2]), parseInt(tileCoordsTile[tileCoordsTile.length - 1].replace(".png", ""))];
            const blobUUID = data["blobID"];
            const blobData = data["blobData"];
            const timer = Date.now();
            const templateBlob = await this.templateManager.drawTemplateOnTile(blobData, tileCoordsTile);
            console.log(`Finished loading the tile in ${(Date.now() - timer) / 1e3} seconds!`);
            window.postMessage({
              source: "blue-marble",
              blobID: blobUUID,
              blobData: templateBlob,
              blink: data["blink"]
            });
            break;
          case "robots":
            this.disableAll = dataJSON["userscript"]?.toString().toLowerCase() == "false";
            break;
        }
      });
    }
    // Sends a heartbeat to the telemetry server
    async sendHeartbeat(version2) {
      console.log("Sending heartbeat to telemetry server...");
      let userSettings = await GM.getValue("bmUserSettings", "{}");
      userSettings = JSON.parse(userSettings);
      if (!userSettings || !userSettings.telemetry || !userSettings.uuid) {
        console.log("Telemetry is disabled, not sending heartbeat.");
        return;
      }
      const ua = navigator.userAgent;
      let browser = await this.getBrowserFromUA(ua);
      let os = this.getOS(ua);
      GM.xmlhttpRequest({
        method: "POST",
        url: "https://telemetry.thebluecorner.net/heartbeat",
        headers: {
          "Content-Type": "application/json"
        },
        data: JSON.stringify({
          uuid: userSettings.uuid,
          version: version2,
          browser,
          os
        }),
        onload: (response) => {
          if (response.status !== 200) {
            consoleError("Failed to send heartbeat:", response.statusText);
          }
        },
        onerror: (error) => {
          consoleError("Error sending heartbeat:", error);
        }
      });
    }
    async getBrowserFromUA(ua = navigator.userAgent) {
      ua = ua || "";
      if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
      if (ua.includes("Edg/")) return "Edge";
      if (ua.includes("Vivaldi")) return "Vivaldi";
      if (ua.includes("YaBrowser")) return "Yandex";
      if (ua.includes("Kiwi")) return "Kiwi";
      if (ua.includes("SamsungBrowser")) return "Samsung Internet";
      if (navigator.brave && typeof navigator.brave.isBrave === "function") {
        if (await navigator.brave.isBrave()) return "Brave";
      }
      if (ua.includes("Firefox/")) return "Firefox";
      if (ua.includes("Chrome/")) return "Chrome";
      if (ua.includes("Safari/")) return "Safari";
      return "Unknown";
    }
    getOS(ua = navigator.userAgent) {
      ua = ua || "";
      if (/Windows NT 10\.0/i.test(ua)) return "Windows 10";
      if (/Windows NT 6\.3/i.test(ua)) return "Windows 8.1";
      if (/Windows NT 6\.2/i.test(ua)) return "Windows 8";
      if (/Windows NT 6\.1/i.test(ua)) return "Windows 7";
      if (/Windows NT 6\.0/i.test(ua)) return "Windows Vista";
      if (/Windows NT 5\.1|Windows XP/i.test(ua)) return "Windows XP";
      if (/CrOS/i.test(ua)) return "ChromeOS";
      if (/Mac OS X 10[_\.]15/i.test(ua)) return "macOS Catalina";
      if (/Mac OS X 10[_\.]14/i.test(ua)) return "macOS Mojave";
      if (/Mac OS X 10[_\.]13/i.test(ua)) return "macOS High Sierra";
      if (/Mac OS X 10[_\.]12/i.test(ua)) return "macOS Sierra";
      if (/Mac OS X 10[_\.]11/i.test(ua)) return "OS X El Capitan";
      if (/Mac OS X 10[_\.]10/i.test(ua)) return "OS X Yosemite";
      if (/Mac OS X 1[5-9][_\.]/i.test(ua)) return "macOS Sequoia or newer";
      if (/Mac OS X 14[_\.]/i.test(ua)) return "macOS Sonoma";
      if (/Mac OS X 13[_\.]/i.test(ua)) return "macOS Ventura";
      if (/Mac OS X 12[_\.]/i.test(ua)) return "macOS Monterey";
      if (/Mac OS X 11[_\.]/i.test(ua)) return "macOS Big Sur";
      if (/Mac OS X 10[_\.]/i.test(ua)) return "macOS";
      if (/Android/i.test(ua)) return "Android";
      if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
      if (/Linux/i.test(ua)) return "Linux";
      return "Unknown";
    }
  };

  // src/WindowTelemetry.js
  var _WindowTelemetry_instances, setTelemetryValue_fn;
  var WindowTelemetry = class extends Overlay {
    /** Constructor for the telemetry window
     * @param {string} name - The name of the userscript
     * @param {string} version - The version of the userscript
     * @param {number} currentTelemetryVersion - The current "version" of the data collection agreement
     * @param {string} uuid - The UUID of the user
     * @since 0.88.339
     * @see {@link Overlay#constructor}
     */
    constructor(name2, version2, currentTelemetryVersion, uuid) {
      super(name2, version2);
      __privateAdd(this, _WindowTelemetry_instances);
      this.window = null;
      this.windowID = "bm-window-telemetry";
      this.windowParent = document.body;
      this.currentTelemetryVersion = currentTelemetryVersion;
      this.uuid = uuid;
    }
    /** Spawns a telemetry window.
     * If another telemetry window already exists, we DON'T spawn another!
     * Parent/child relationships in the DOM structure below are indicated by indentation.
     * @since 0.88.339
     */
    async buildWindow() {
      if (document.querySelector(`#${this.windowID}`)) {
        this.handleDisplayError("Telemetry window already exists!");
        return;
      }
      const browser = await this.apiManager.getBrowserFromUA(navigator.userAgent);
      const os = this.apiManager.getOS(navigator.userAgent);
      this.window = this.addDiv({ "id": this.windowID, "class": "bm-window", "style": "height: 80vh; z-index: 9998;" }).addDiv({ "class": "bm-window-content" }).addDiv({ "class": "bm-container bm-center-vertically" }).addHeader(1, { "textContent": `${this.name} Telemetry` }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container bm-flex-center", "style": "gap: 1.5ch; flex-wrap: wrap;" }).addButton({ "textContent": "Enable Telemetry" }, (instance, button) => {
        button.onclick = () => {
          __privateMethod(this, _WindowTelemetry_instances, setTelemetryValue_fn).call(this, this.currentTelemetryVersion);
          const element = document.getElementById(this.windowID);
          element?.remove();
        };
      }).buildElement().addButton({ "textContent": "Disable Telemetry" }, (instance, button) => {
        button.onclick = () => {
          __privateMethod(this, _WindowTelemetry_instances, setTelemetryValue_fn).call(this, 0);
          const element = document.getElementById(this.windowID);
          element?.remove();
        };
      }).buildElement().addButton({ "textContent": "More Information" }, (instance, button) => {
        button.onclick = () => {
          window.open("https://github.com/SwingTheVine/Wplace-TelemetryServer#telemetry-data", "_blank", "noopener noreferrer");
        };
      }).buildElement().buildElement().addDiv({ "class": "bm-container bm-scrollable" }).addDiv({ "class": "bm-container" }).addHeader(2, { "textContent": "Legal" }).buildElement().addP({ "textContent": `We collect anonymous telemetry data such as your browser, OS, and script version to make the experience better for everyone. The data is never shared personally. The data is never sold. You can turn this off by pressing the "Disable" button, but keeping it on helps us improve features and reliability faster. Thank you for supporting ${this.name}!` }).buildElement().buildElement().addHr().buildElement().addDiv({ "class": "bm-container" }).addHeader(2, { "textContent": "Non-Legal Summary" }).buildElement().addP({ "innerHTML": `You can disable telemetry by pressing the "Disable" button. If you would like to read more about what information we collect, press the "More Information" button.<br>This is the data <em>stored</em> on our servers:` }).buildElement().addUl().addLi({ "innerHTML": `A unique identifier (UUIDv4) generated by Blue Marble. This enables our telemetry to function without tracking your actual user ID.<br>Your UUID is: <b>${escapeHTML(this.uuid)}</b>` }).buildElement().addLi({ "innerHTML": `The version of Blue Marble you are using.<br>Your version is: <b>${escapeHTML(this.version)}</b>` }).buildElement().addLi({ "innerHTML": `Your browser type, which is used to determine Blue Marble outages and browser popularity.<br>Your browser type is: <b>${escapeHTML(browser)}</b>` }).buildElement().addLi({ "innerHTML": `Your OS type, which is used to determine Blue Marble outages and OS popularity.<br>Your OS type is: <b>${escapeHTML(os)}</b>` }).buildElement().addLi({ "innerHTML": `The date and time that Blue Marble sent the telemetry information.` }).buildElement().buildElement().addP({ "innerHTML": `All of the data mentioned above is <b>aggregated every hour</b>. This means every hour, anything that could even remotly be considered "personal data" is deleted from our server. Here, "aggregated" data means things like "42 people used Blue Marble on Google Chrome this hour", which can't be used to identify anyone in particular.` }).buildElement().buildElement().buildElement().buildElement().buildElement().buildOverlay(this.windowParent);
    }
  };
  _WindowTelemetry_instances = new WeakSet();
  setTelemetryValue_fn = async function(value) {
    const userSettings = JSON.parse(await GM.getValue("bmUserSettings", "{}"));
    userSettings.telemetry = value;
    GM.setValue("bmUserSettings", JSON.stringify(userSettings));
  };

  // src/main.js
  var name = GM_info.script.name.toString();
  var version = GM_info.script.version.toString();
  var consoleStyle = "color: cornflowerblue;";
  var injectionCode = () => {
    const script = document.currentScript;
    const name2 = script?.getAttribute("bm-name") || "Blue Marble";
    const consoleStyle2 = script?.getAttribute("bm-cStyle") || "";
    const fetchedBlobQueue = /* @__PURE__ */ new Map();
    window.addEventListener("message", (event) => {
      const { source, endpoint, blobID, blobData, blink } = event.data;
      const elapsed = Date.now() - blink;
      console.groupCollapsed(`%c${name2}%c: ${fetchedBlobQueue.size} Recieved IMAGE message about blob "${blobID}"`, consoleStyle2, "");
      console.log(`Blob fetch took %c${String(Math.floor(elapsed / 6e4)).padStart(2, "0")}:${String(Math.floor(elapsed / 1e3) % 60).padStart(2, "0")}.${String(elapsed % 1e3).padStart(3, "0")}%c MM:SS.mmm`, consoleStyle2, "");
      console.log(fetchedBlobQueue);
      console.groupEnd();
      if (source == "blue-marble" && !!blobID && !!blobData && !endpoint) {
        const callback = fetchedBlobQueue.get(blobID);
        if (typeof callback === "function") {
          callback(blobData);
        } else {
          consoleWarn2(`%c${name2}%c: Attempted to retrieve a blob (%s) from queue, but the blobID was not a function! Skipping...`, consoleStyle2, "", blobID);
        }
        fetchedBlobQueue.delete(blobID);
      }
    });
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      const cloned = response.clone();
      const endpointName = (args[0] instanceof Request ? args[0]?.url : args[0]) || "ignore";
      const contentType = cloned.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        console.log(`%c${name2}%c: Sending JSON message about endpoint "${endpointName}"`, consoleStyle2, "");
        cloned.json().then((jsonData) => {
          window.postMessage({
            source: "blue-marble",
            endpoint: endpointName,
            jsonData
          }, "*");
        }).catch((err) => {
          console.error(`%c${name2}%c: Failed to parse JSON: `, consoleStyle2, "", err);
        });
      } else if (contentType.includes("image/") && (!endpointName.includes("openfreemap") && !endpointName.includes("maps"))) {
        const blink = Date.now();
        const blob = await cloned.blob();
        console.log(`%c${name2}%c: ${fetchedBlobQueue.size} Sending IMAGE message about endpoint "${endpointName}"`, consoleStyle2, "");
        return new Promise((resolve) => {
          const blobUUID = crypto.randomUUID();
          fetchedBlobQueue.set(blobUUID, (blobProcessed) => {
            resolve(new Response(blobProcessed, {
              headers: cloned.headers,
              status: cloned.status,
              statusText: cloned.statusText
            }));
            console.log(`%c${name2}%c: ${fetchedBlobQueue.size} Processed blob "${blobUUID}"`, consoleStyle2, "");
          });
          window.postMessage({
            source: "blue-marble",
            endpoint: endpointName,
            blobID: blobUUID,
            blobData: blob,
            blink
          });
        }).catch((exception) => {
          const elapsed = Date.now();
          console.error(`%c${name2}%c: Failed to Promise blob!`, consoleStyle2, "");
          console.groupCollapsed(`%c${name2}%c: Details of failed blob Promise:`, consoleStyle2, "");
          console.log(`Endpoint: ${endpointName}
There are ${fetchedBlobQueue.size} blobs processing...
Blink: ${blink.toLocaleString()}
Time Since Blink: ${String(Math.floor(elapsed / 6e4)).padStart(2, "0")}:${String(Math.floor(elapsed / 1e3) % 60).padStart(2, "0")}.${String(elapsed % 1e3).padStart(3, "0")} MM:SS.mmm`);
          console.error(`Exception stack:`, exception);
          console.groupEnd();
        });
      }
      return response;
    };
  };
  function inject(callback) {
    const script = document.createElement("script");
    script.setAttribute("bm-name", name);
    script.setAttribute("bm-cStyle", consoleStyle);
    script.textContent = `(${callback})();`;
    document.documentElement?.appendChild(script);
    script.remove();
  }
  if (document.readyState === "loading") {
    consoleLog("DOM is still loading! Using an event listener to inject spying code...");
    document.addEventListener("DOMContentLoaded", inject(injectionCode));
  } else {
    inject(injectionCode);
  }
  (async () => {
    const prayThisIsNotTrue = document.querySelector("#bm-window-main");
    if (prayThisIsNotTrue) {
      new WindowMain(name, version).handleDisplayError("You have multiple copies of Blue Marble running! Open your userscript manager and disable them.");
      throw new Error(`Blue Marble has already initalized! Do you have multiple copies of Blue Marble running simultaneously?`);
    }
    const cssOverlay = await GM.getResourceText("CSS-BM-File");
    GM.addStyle(cssOverlay);
    const robotoMonoInjectionPoint = "robotoMonoInjectionPoint";
    if (!!(robotoMonoInjectionPoint.indexOf("@font-face") + 1)) {
      console.log(`Loading Roboto Mono as a file...`);
      GM.addStyle(robotoMonoInjectionPoint);
    } else {
      var stylesheetLink = document.createElement("link");
      stylesheetLink.href = "https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap";
      stylesheetLink.rel = "preload";
      stylesheetLink.as = "style";
      stylesheetLink.onload = function() {
        this.onload = null;
        this.rel = "stylesheet";
      };
      document.head?.appendChild(stylesheetLink);
    }
    const userSettings = JSON.parse(await GM.getValue("bmUserSettings", "{}"));
    const observers = new Observers();
    const windowMain = new WindowMain(name, version);
    const templateManager = new TemplateManager(name, version);
    const apiManager = new ApiManager(templateManager);
    const settingsManager = new SettingsManager(name, version, userSettings);
    windowMain.setSettingsManager(settingsManager);
    windowMain.setApiManager(apiManager);
    templateManager.setWindowMain(windowMain);
    templateManager.setSettingsManager(settingsManager);
    settingsManager.setTemplateManager(templateManager);
    templateManager.shouldFilterColor = settingsManager.decodeFilteredColorBitFlags(userSettings?.filter);
    settingsManager.filteredColorsMapOld = templateManager.shouldFilterColor;
    settingsManager.setWindowMain(windowMain);
    settingsManager.setTemplateManager(templateManager);
    settingsManager.setApiManager(apiManager);
    const storageTemplates = JSON.parse(await GM.getValue("bmTemplates", "{}"));
    console.log(storageTemplates);
    templateManager.importJSON(storageTemplates);
    console.log(userSettings);
    console.log(Object.keys(userSettings).length);
    if (Object.keys(userSettings).length == 0) {
      const uuid = crypto.randomUUID();
      console.log(uuid);
      await GM.setValue("bmUserSettings", JSON.stringify({
        "uuid": uuid
      }));
    }
    setInterval(() => apiManager.sendHeartbeat(version), 1e3 * 60 * 30);
    const currentTelemetryVersion = 1;
    const previousTelemetryVersion = userSettings?.telemetry;
    console.log(`Telemetry is ${!(previousTelemetryVersion == void 0)}`);
    if (previousTelemetryVersion == void 0 || previousTelemetryVersion > currentTelemetryVersion) {
      const windowTelemetry = new WindowTelemetry(name, version, currentTelemetryVersion, userSettings?.uuid);
      windowTelemetry.setApiManager(apiManager);
      windowTelemetry.buildWindow();
    }
    windowMain.buildWindow();
    apiManager.spontaneousResponseListener(windowMain);
    observeBlack();
    consoleLog(`%c${name}%c (${version}) userscript has loaded!`, "color: cornflowerblue;", "");
    function observeBlack() {
      const observer = new MutationObserver((mutations, observer2) => {
        const black = document.querySelector("#color-1");
        if (!black) {
          return;
        }
        let move = document.querySelector("#bm-button-move");
        if (!move) {
          move = document.createElement("button");
          move.id = "bm-button-move";
          move.textContent = "Move \u2191";
          move.dataset["screenPosition"] = "bottom";
          move.className = "btn btn-soft";
          move.onclick = function() {
            const paletteWindowVisible = this.closest('div:has(dialog):not(:has([id="map"])');
            const paletteWindow = paletteWindowVisible.closest('div:is([class~="bottom-0"], [class~="top-0"])');
            const shouldMoveUp = this.dataset?.["screenPosition"] == "bottom";
            paletteWindow.className = paletteWindow?.className?.replace(shouldMoveUp ? "bottom-0" : "top-0", shouldMoveUp ? "top-0" : "bottom-0");
            paletteWindowVisible.style.borderTopLeftRadius = shouldMoveUp ? "0px" : "var(--radius-box)";
            paletteWindowVisible.style.borderTopRightRadius = shouldMoveUp ? "0px" : "var(--radius-box)";
            paletteWindowVisible.style.borderBottomLeftRadius = shouldMoveUp ? "var(--radius-box)" : "0px";
            paletteWindowVisible.style.borderBottomRightRadius = shouldMoveUp ? "var(--radius-box)" : "0px";
            this.textContent = shouldMoveUp ? "Move \u2193" : "Move \u2191";
            this.dataset["screenPosition"] = shouldMoveUp ? "top" : "bottom";
            if (paletteWindowVisible?.getBoundingClientRect()?.width <= 650) {
              this.textContent = this.textContent.slice(-1);
            }
          };
          const paletteWindowInteractiveUiContainer = black.closest("div[id]:has(h2):has(canvas)");
          const paletteToolbar = paletteWindowInteractiveUiContainer?.querySelector('div:has(h2) div:has(button):has(div[class~="tooltip"] kbd):not(:has(h2))');
          if (paletteToolbar) {
            paletteToolbar.appendChild(move);
          } else {
            consoleWarn2("Could not find palette toolbar to inject Move button into!");
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  })();
})();
