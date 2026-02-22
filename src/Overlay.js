/** The overlay builder for the Blue Marble script.
 * @description This class handles the overlay UI for the Blue Marble script.
 * @class Overlay
 * @since 0.0.2
 * @example
 * const overlay = new Overlay();
 * overlay.addDiv({ 'id': 'overlay' })
 *   .addDiv({ 'id': 'header' })
 *     .addHeader(1, {'textContent': 'Your Overlay'}).buildElement()
 *     .addP({'textContent': 'This is your overlay. It is versatile.'}).buildElement()
 *   .buildElement() // Marks the end of the header <div>
 *   .addHr().buildElement()
 * .buildOverlay(document.body);
 * // Output:
 * // (Assume <body> already exists in the webpage)
 * <body>
 *   <div id="overlay">
 *     <div id="header">
 *       <h1>Your Overlay</h1>
 *       <p>This is your overlay. It is versatile.</p>
 *     </div>
 *     <hr>
 *   </div>
 * </body>
*/
export default class Overlay {

  /** Constructor for the Overlay class.
   * @param {string} name - The name of the userscript
   * @param {string} version - The version of the userscript
   * @since 0.0.2
   * @see {@link Overlay}
   */
  constructor(name, version) {
    this.name = name; // Name of userscript
    this.version = version; // Version of userscript

    /** The API manager instance. Later populated when setApiManager is called @type {ApiManager} */
    this.apiManager = null;
    
    this.outputStatusId = 'bm-output-status'; // ID for status element

    this.overlay = null; // The overlay root DOM HTMLElement
    this.currentParent = null; // The current parent HTMLElement in the overlay
    this.parentStack = []; // Tracks the parent elements BEFORE the currentParent so we can nest elements
  }

  /** Populates the apiManager variable with the apiManager class.
   * @param {ApiManager} apiManager - The apiManager class instance
   * @since 0.41.4
   */
  setApiManager(apiManager) {this.apiManager = apiManager;}

  /** Creates an element.
   * For **internal use** of the {@link Overlay} class.
   * @param {string} tag - The tag name as a string.
   * @param {Object.<string, any>} [properties={}] - The DOM properties of the element.
   * @returns {HTMLElement} HTML Element
   * @since 0.43.2
   */
  #createElement(tag, properties = {}, additionalProperties={}) {

    const element = document.createElement(tag); // Creates the element

    // If this is the first element made...
    if (!this.overlay) {
      this.overlay = element; // Declare it the highest overlay element
      this.currentParent = element;
    } else {
      this.currentParent?.appendChild(element); // ...else delcare it the child of the last element
      this.parentStack.push(this.currentParent);
      this.currentParent = element;
    }

    // For every passed in property (shared by all like-elements), apply the it to the element
    for (const [property, value] of Object.entries(properties)) {
      this.#applyAttribute(element, property, value);
    }

    // For every passed in additional property, apply the it to the element
    for (const [property, value] of Object.entries(additionalProperties)) {
      this.#applyAttribute(element, property, value);
    }
    
    return element;
  }

  /** Applies an attribute to an element
   * @param {HTMLElement} element - The element to apply the attribute to
   * @param {String} property - The name of the attribute to apply
   * @param {String} value - The value of the attribute
   * @since 0.88.136
   */
  #applyAttribute(element, property, value) {
    if (property == 'class') {
      element.classList.add(...value.split(/\s+/)); // converts `'foo bar'` to `'foo', 'bar'` which is accepted
    } else if (property == 'for') {
      element.htmlFor = value;
    } else if (property == 'tabindex') {
      element.tabIndex = Number(value);
    } else if (property == 'readonly') {
      element.readOnly = ((value == 'true') || (value == '1'));
    } else if (property == 'maxlength') {
      element.maxLength = Number(value);
    } else if (property.startsWith('data')) {
      element.dataset[
        property.slice(5).split('-').map(
          (part, i) => (i == 0) ? part : part[0].toUpperCase() + part.slice(1)
        ).join('')
      ] = value;
    } else if (property.startsWith('aria')) {
      const camelCase = property.slice(5).split('-').map(
        (part, i) => (i == 0) ? part : part[0].toUpperCase() + part.slice(1)
      ).join('');
      element['aria' + camelCase[0].toUpperCase() + camelCase.slice(1)] = value;
    } else {
      element[property] = value;
    }
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

    // Resets the class-bound variables of this class instance back to default so overlay can be build again later
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
  addDiv(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <div> DOM properties

    const div = this.#createElement('div', properties, additionalProperties); // Creates the <div> element
    callback(this, div); // Runs any script passed in through the callback
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
  addP(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <p> DOM properties

    const p = this.#createElement('p', properties, additionalProperties); // Creates the <p> element
    callback(this, p); // Runs any script passed in through the callback
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
  addSmall(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <small> DOM properties

    const small = this.#createElement('small', properties, additionalProperties); // Creates the <small> element
    callback(this, small); // Runs any script passed in through the callback
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
  addSpan(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <span> DOM properties

    const span = this.#createElement('span', properties, additionalProperties); // Creates the <span> element
    callback(this, span); // Runs any script passed in through the callback
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
  addDetails(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <details> DOM properties

    const details = this.#createElement('details', properties, additionalProperties); // Creates the <details> element
    callback(this, details); // Runs any script passed in through the callback
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
  addSummary(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <summary> DOM properties

    const summary = this.#createElement('summary', properties, additionalProperties); // Creates the <summary> element
    callback(this, summary); // Runs any script passed in through the callback
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
  addImg(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <img> DOM properties

    const img = this.#createElement('img', properties, additionalProperties); // Creates the <img> element
    callback(this, img); // Runs any script passed in through the callback
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
  addHeader(level, additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared header DOM properties

    const header = this.#createElement('h' + level, properties, additionalProperties); // Creates the header element
    callback(this, header); // Runs any script passed in through the callback
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
  addHr(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <hr> DOM properties

    const hr = this.#createElement('hr', properties, additionalProperties); // Creates the <hr> element
    callback(this, hr); // Runs any script passed in through the callback
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
  addBr(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <br> DOM properties

    const br = this.#createElement('br', properties, additionalProperties); // Creates the <br> element
    callback(this, br); // Runs any script passed in through the callback
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
  addForm(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <form> DOM properties

    const form = this.#createElement('form', properties, additionalProperties); // Creates the <form> element
    callback(this, form); // Runs any script passed in through the callback
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
  addFieldset(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <fieldset> DOM properties

    const fieldset = this.#createElement('fieldset', properties, additionalProperties); // Creates the <fieldset> element
    callback(this, fieldset); // Runs any script passed in through the callback
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
  addLegend(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <legend> DOM properties

    const legend = this.#createElement('legend', properties, additionalProperties); // Creates the <legend> element
    callback(this, legend); // Runs any script passed in through the callback
    return this;
  }

  /** Adds a checkbox to the overlay.
   * This checkbox element will have properties shared between all checkbox elements in the overlay.
   * You can override the shared properties by using a callback. Note: the checkbox element is inside a label element.
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
   *     "Foobar."
   *   </label>
   * </body>
   */
  addCheckbox(additionalProperties = {}, callback = () => {}) {

    const properties = {'type': 'checkbox'}; // Shared checkbox DOM properties

    const label = this.#createElement('label', {'textContent': additionalProperties['textContent'] ?? ''}); // Creates the label element
    delete additionalProperties['textContent']; // Deletes 'textContent' DOM property before adding the properties to the checkbox
    const checkbox = this.#createElement('input', properties, additionalProperties); // Creates the checkbox element
    label.insertBefore(checkbox, label.firstChild); // Makes the checkbox the first child of the label (before the text content)
    this.buildElement(); // Signifies that we are done adding children to the checkbox
    callback(this, label, checkbox); // Runs any script passed in through the callback
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
  addSelect(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared select DOM properties

    const label = this.#createElement('label', {'textContent': additionalProperties['textContent'] ?? '', 'for': additionalProperties['id'] ?? ''}); // Creates the label element
    delete additionalProperties['textContent']; // Deletes 'textContent' DOM property before adding the properties to the select
    this.buildElement(); // Signifies that we are done adding children to the label
    
    const select = this.#createElement('select', properties, additionalProperties); // Creates the select element
    callback(this, label, select); // Runs any script passed in through the callback
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
  addOption(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <option> DOM properties

    const option = this.#createElement('option', properties, additionalProperties); // Creates the <option> element
    callback(this, option); // Runs any script passed in through the callback
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
  addOl(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <ol> DOM properties

    const ol = this.#createElement('ol', properties, additionalProperties); // Creates the <ol> element
    callback(this, ol); // Runs any script passed in through the callback
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
  addUl(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <ul> DOM properties

    const ul = this.#createElement('ul', properties, additionalProperties); // Creates the <ul> element
    callback(this, ul); // Runs any script passed in through the callback
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
  addMenu(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <menu> DOM properties

    const menu = this.#createElement('menu', properties, additionalProperties); // Creates the <menu> element
    callback(this, menu); // Runs any script passed in through the callback
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
  addLi(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <li> DOM properties

    const li = this.#createElement('li', properties, additionalProperties); // Creates the <li> element
    callback(this, li); // Runs any script passed in through the callback
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
  addTable(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <table> DOM properties

    const table = this.#createElement('table', properties, additionalProperties); // Creates the <table> element
    callback(this, table); // Runs any script passed in through the callback
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
  addCaption(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <caption> DOM properties

    const caption = this.#createElement('caption', properties, additionalProperties); // Creates the <caption> element
    callback(this, caption); // Runs any script passed in through the callback
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
  addThead(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <thead> DOM properties

    const thead = this.#createElement('thead', properties, additionalProperties); // Creates the <thead> element
    callback(this, thead); // Runs any script passed in through the callback
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
  addTbody(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <tbody> DOM properties

    const tbody = this.#createElement('tbody', properties, additionalProperties); // Creates the <tbody> element
    callback(this, tbody); // Runs any script passed in through the callback
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
  addTfoot(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <tfoot> DOM properties

    const tfoot = this.#createElement('tfoot', properties, additionalProperties); // Creates the <tfoot> element
    callback(this, tfoot); // Runs any script passed in through the callback
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
  addTr(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <tfoot> DOM properties

    const tr = this.#createElement('tr', properties, additionalProperties); // Creates the <tr> element
    callback(this, tr); // Runs any script passed in through the callback
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
  addTh(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <th> DOM properties

    const th = this.#createElement('th', properties, additionalProperties); // Creates the <th> element
    callback(this, th); // Runs any script passed in through the callback
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
  addTd(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <td> DOM properties

    const td = this.#createElement('td', properties, additionalProperties); // Creates the <td> element
    callback(this, td); // Runs any script passed in through the callback
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
  addButton(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <button> DOM properties

    const button = this.#createElement('button', properties, additionalProperties); // Creates the <button> element
    callback(this, button); // Runs any script passed in through the callback
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
  addButtonHelp(additionalProperties = {}, callback = () => {}) {

    const tooltip = additionalProperties['title'] ?? additionalProperties['textContent'] ?? 'Help: No info'; // Retrieves the tooltip

    // Makes sure the tooltip is stored in the title property
    delete additionalProperties['textContent'];
    additionalProperties['title'] = `Help: ${tooltip}`;

    // Shared help button DOM properties
    const properties = {
      'textContent': '?',
      'className': 'bm-help',
      'onclick': () => {
        this.updateInnerHTML(this.outputStatusId, tooltip);
      }
    };

    const help = this.#createElement('button', properties, additionalProperties); // Creates the <button> element
    callback(this, help); // Runs any script passed in through the callback
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
  addInput(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <input> DOM properties

    const input = this.#createElement('input', properties, additionalProperties); // Creates the <input> element
    callback(this, input); // Runs any script passed in through the callback
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
  addInputFile(additionalProperties = {}, callback = () => {}) {
    
    const properties = {
      'type': 'file', 
      'tabindex': '-1',
      'aria-hidden': 'true'
    }; // Complete file input hiding to prevent native browser text interference
    const text = additionalProperties['textContent'] ?? ''; // Retrieves the text content

    delete additionalProperties['textContent']; // Deletes the text content before applying the additional properties to the file input

    const container = this.#createElement('div'); // Container for file input
    const input = this.#createElement('input', properties, additionalProperties); // Creates the file input
    this.buildElement(); // Signifies that we are done adding children to the file input
    const button = this.#createElement('button', {'textContent': text});
    this.buildElement(); // Signifies that we are done adding children to the button
    this.buildElement(); // Signifies that we are done adding children to the container
    
    button.addEventListener('click', () => {
      input.click(); // Clicks the file input
    });

    // Update button text when file is selected
    input.addEventListener('change', () => {
      button.style.maxWidth = `${button.offsetWidth}px`;
      if (input.files.length > 0) {
        button.textContent = input.files[0].name;
      } else {
        button.textContent = text;
      }
    });

    callback(this, container, input, button); // Runs any script passed in through the callback
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
  addTextarea(additionalProperties = {}, callback = () => {}) {

    const properties = {}; // Shared <textarea> DOM properties

    const textarea = this.#createElement('textarea', properties, additionalProperties); // Creates the <textarea> element
    callback(this, textarea); // Runs any script passed in through the callback
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
  addDragbar(additionalProperties = {}, callback = () => {}) {

    // Shared dragbar DOM properties
    const properties = {
      'class': 'bm-dragbar'
    };

    const dragbar = this.#createElement('div', properties, additionalProperties); // Creates the dragbar element
    callback(this, dragbar); // Runs any script passed in through the callback
    return this;
  }

  /** Adds a timer `time` element to the overlay.
   * This timer will countdown until it reaches the end date that was passed in.
   * Additionally, you can update the end date by changing the endDate dataset attribute on the element.
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
  addTimer(endDate = Date.now(), updateInterval = 500, additionalProperties = {}, callback = () => {}) {

    const timerClass = 'bm-timer';

    // Use the provided ID attribute. Otherwise, generate a random one.
    // "Random" ID is 8 pseudo-random hexdecimal characters from a UUIDv4 string
    // The ID has a prefix that is equal to the bm-timer class, then a dash, then the random hexdecimal digits
    const timerID = additionalProperties?.['id'] || (timerClass + '-' + crypto.randomUUID().slice(0, 8));

    // Shared timer DOM properties
    const properties = {
      'class': timerClass
    }

    const timer = this.#createElement('time', properties, additionalProperties); // Creates the timer element
    timer.id = timerID; // Adds the ID to the timer
    timer.dataset['endDate'] = endDate; // Adds the end date to the timer

    // Creates the logic that keeps updating the timer
    setInterval(() => {

      // Kills the timer logic if the timer element does not exist in the main DOM tree
      if (!timer.isConnected) {/*clearInterval(timer);*/ return;}

      // Returns time remaining in seconds, or 0 seconds if timer has reached end time.
      // "Total" indicates it is the total time for that unit. E.g. 62 minutes is "62" minutes.
      const timeRemainingTotalMs = Math.max(timer.dataset['endDate'] - Date.now(), 0);
      const timeRemainingTotalSec = Math.floor(timeRemainingTotalMs / 1000);
      const timeRemainingTotalHr = Math.floor(timeRemainingTotalSec / 3600);
      
      // Remaining time in certain units.
      // "Only" indicates it is formatted in that unit. E.g. 62 minutes is "2" minutes.
      const timeRemainingOnlySec = Math.floor(timeRemainingTotalSec % 60);
      const timeRemainingOnlyMin = Math.floor((timeRemainingTotalSec % 3600) / 60);

      // Date-time string that is compliant with the HTML Standard for durations
      timer.setAttribute('datetime', `PT${timeRemainingTotalHr}H${timeRemainingOnlyMin}M${timeRemainingOnlySec}S`);
      // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-duration-string

      // Formats the timer as HH:MM:SS and displays it to the user
      timer.textContent = 
        String(timeRemainingTotalHr).padStart(2, '0') + ':' +
        String(timeRemainingOnlyMin).padStart(2, '0') + ':' +
        String(timeRemainingOnlySec).padStart(2, '0')
      ;
    }, updateInterval);

    callback(this, timer); // Runs any script passed in through the callback
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
  updateInnerHTML(id, html, doSafe=false) {

    const element = document.getElementById(id.replace(/^#/, '')); // Retrieve the element from the 'id' (removed the '#')
    
    if (!element) {return;} // Kills itself if the element does not exist

    // Input elements don't have innerHTML, so we modify the value attribute instead
    if (element instanceof HTMLInputElement) {
      element.value = html;
      return;
    } 

    if (doSafe) {
      element.textContent = html; // Populate element with plain-text HTML/text
    } else {
      element.innerHTML = html; // Populate element with HTML/text
    }
  }

  /** Handles the minimization logic for windows spawned by Blue Marble
   * @param {HTMLButtonElement} button - The UI button that triggered this minimization event
   * @since 0.88.142
  */
  handleMinimization(button) {

    if (button.disabled) {return;} // Don't minimize if the window is currently minimizing

    button.disabled = true; // Disables the button until the transition ends
    button.style.textDecoration = 'none'; // Disables the disabled button text decoration strikethrough line

    const window = button.closest('.bm-window'); // Get the window
    const dragbar = button.closest('.bm-dragbar'); // Get the dragbar
    const header = window.querySelector('h1'); // Get the header
    const windowContent = window.querySelector('.bm-window-content'); // Get the window content container

    // If window content is open...
    if (button.dataset['buttonStatus'] == 'expanded') {
      // ...we want to close it
      
      // Logic for the transition animation to collapse the window
      windowContent.style.height = windowContent.scrollHeight + 'px';
      window.style.width = window.scrollWidth + 'px'; // So the width of the window does not change due to the lack of content
      windowContent.style.height = '0'; // Set the height to 0px
      windowContent.addEventListener('transitionend', function handler() { // Add an event listener to cleanup once the minimize transition is complete
        windowContent.style.display = 'none'; // Changes "display" to "none" for screen readers
        button.disabled = false; // Enables the button
        button.style.textDecoration = ''; // Resets the text decoration to default
        windowContent.removeEventListener('transitionend', handler); // Removes the event listener
      });
      
      // Makes a clone of the h1 element inside the window, and adds it to the dragbar
      const dragbarHeader1 = header.cloneNode(true);
      const dragbarHeader1Text = dragbarHeader1.textContent;
      button.nextElementSibling.appendChild(dragbarHeader1);
      
      button.textContent = '▶'; // Swap button icon
      button.dataset['buttonStatus'] = 'collapsed'; // Swap button status tracker
      button.ariaLabel = `Unminimize window "${dragbarHeader1Text}"`; // Screen reader label
    } else {
      // Else, the window is closed, and we want to open it

      // Deletes the h1 element inside the dragbar
      const dragbarHeader1 = dragbar.querySelector('h1');
      const dragbarHeader1Text = dragbarHeader1.textContent;
      dragbarHeader1.remove();

      // Logic for the transition animation to expand the window
      windowContent.style.display = ''; // Resets display to default
      windowContent.style.height = '0'; // Sets the height to 0
      window.style.width = ''; // Resets the window width to default
      windowContent.style.height = windowContent.scrollHeight + 'px'; // Change the height back to normal
      windowContent.addEventListener('transitionend', function handler() { // Add an event listener to cleanup once the minimize transition is complete
        windowContent.style.height = ''; // Changes the height back to default
        button.disabled = false; // Enables the button
        button.style.textDecoration = ''; // Resets the text decoration to default
        windowContent.removeEventListener('transitionend', handler); // Removes the event listener
      });

      button.textContent = '▼'; // Swap button icon
      button.dataset['buttonStatus'] = 'expanded'; // Swap button status tracker
      button.ariaLabel = `Minimize window "${dragbarHeader1Text}"`; // Screen reader label
    }
  }

  /** Handles dragging of the overlay.
   * Uses requestAnimationFrame for smooth animations and GPU-accelerated transforms.
   * Make sure to use the appropriate CSS selectors.
   * @param {string} moveMe - The element to be moved
   * @param {string} iMoveThings - The drag handle element
   * @since 0.8.2
  */
  handleDrag(moveMe, iMoveThings) {

    // Retrieves the elements (allows either '#id' or 'id' to be passed in)
    moveMe = document.querySelector(moveMe);
    iMoveThings = document.querySelector(iMoveThings);
    
    // What to do when one of the two elements are not found
    if (!moveMe || !iMoveThings) {
      this.handleDisplayError(`Can not drag! ${!moveMe ? 'moveMe' : ''} ${!moveMe && !iMoveThings ? 'and ' : ''}${!iMoveThings ? 'iMoveThings ' : ''}was not found!`);
      return; // Kills itself
    }

    let isDragging = false;
    let offsetX, offsetY = 0;
    let animationFrame = null;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let initialRect = null; // Cache initial position to avoid expensive getBoundingClientRect calls during drag

    // Smooth animation loop using requestAnimationFrame for optimal performance
    const updatePosition = () => {
      if (isDragging) {
        // Only update DOM if position changed significantly (reduce repaints)
        const deltaX = Math.abs(currentX - targetX);
        const deltaY = Math.abs(currentY - targetY);
        
        if (deltaX > 0.5 || deltaY > 0.5) {
          currentX = targetX;
          currentY = targetY;
          
          // Use CSS transform for GPU acceleration instead of left/top
          moveMe.style.transform = `translate(${currentX}px, ${currentY}px)`;
          moveMe.style.left = '0px';
          moveMe.style.top = '0px';
          moveMe.style.right = '';
        }
        
        animationFrame = requestAnimationFrame(updatePosition);
      }
    };
    
    const startDrag = (clientX, clientY) => {
      isDragging = true;
      initialRect = moveMe.getBoundingClientRect();
      offsetX = clientX - initialRect.left;
      offsetY = clientY - initialRect.top;
      
      // Get current position from transform or use element position
      const computedStyle = window.getComputedStyle(moveMe);
      const transform = computedStyle.transform;
      
      if (transform && transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        currentX = matrix.m41;
        currentY = matrix.m42;
      } else {
        currentX = initialRect.left;
        currentY = initialRect.top;
      }
      
      targetX = currentX;
      targetY = currentY;
      
      document.body.style.userSelect = 'none';
      iMoveThings.classList.add('bm-dragging');

      // Add move listeners when dragging starts
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('mouseup', endDrag);
      document.addEventListener('touchend', endDrag);
      document.addEventListener('touchcancel', endDrag);
      
      // Start animation loop
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
      document.body.style.userSelect = '';
      iMoveThings.classList.remove('bm-dragging');

      // Remove move listeners when drag ends
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchend', endDrag);
      document.removeEventListener('touchcancel', endDrag);
    };

    // Mouse move
    const onMouseMove = event => {
      if (isDragging && initialRect) {
        targetX = event.clientX - offsetX;
        targetY = event.clientY - offsetY;
      }
    }

    // Touch move
    const onTouchMove = event => {
      if (isDragging && initialRect) {
        const touch = event.touches[0];
        if (!touch) return;
        targetX = touch.clientX - offsetX;
        targetY = touch.clientY - offsetY;
        event.preventDefault();
      }
    };

    // Mouse down - start dragging
    iMoveThings.addEventListener('mousedown', function(event) {
      event.preventDefault();
      startDrag(event.clientX, event.clientY);
    });

    // Touch start - start dragging
    iMoveThings.addEventListener('touchstart', function(event) {
      const touch = event?.touches?.[0];
      if (!touch) {return;}
      startDrag(touch.clientX, touch.clientY);
      event.preventDefault();
    }, { passive: false });
  }

  /** Handles status display.
   * This will output plain text into the output Status box.
   * Additionally, this will output an info message to the console.
   * @param {string} text - The status text to display.
   * @since 0.58.4
   */
  handleDisplayStatus(text) {
    const consoleInfo = console.info; // Creates a copy of the console.info function
    consoleInfo(`${this.name}: ${text}`); // Outputs something like "ScriptName: text" as an info message to the console
    this.updateInnerHTML(this.outputStatusId, 'Status: ' + text, true); // Update output Status box
  }

  /** Handles error display.
   * This will output plain text into the output Status box.
   * Additionally, this will output an error to the console.
   * @param {string} text - The error text to display.
   * @since 0.41.6
   */
  handleDisplayError(text) {
    const consoleError = console.error; // Creates a copy of the console.error function
    consoleError(`${this.name}: ${text}`); // Outputs something like "ScriptName: text" as an error message to the console
    this.updateInnerHTML(this.outputStatusId, 'Error: ' + text, true); // Update output Status box
  }
}