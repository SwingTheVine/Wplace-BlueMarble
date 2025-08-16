import * as icons from "./icons.js";

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

    this.apiManager = null; // The API manager instance. Later populated when setApiManager is called
    
    this.outputStatusId = 'bm-output-status'; // ID for status element

    this.overlay = null; // The overlay root DOM HTMLElement
    this.currentParent = null; // The current parent HTMLElement in the overlay
    this.parentStack = []; // Tracks the parent elements BEFORE the currentParent so we can nest elements
  }

  /** Populates the apiManager variable with the apiManager class.
   * @param {apiManager} apiManager - The apiManager class instance
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
      element[property] = value;
    }

    // For every passed in additional property, apply the it to the element
    for (const [property, value] of Object.entries(additionalProperties)) {
      element[property] = value;
    }
    
    return element;
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
   * @param {function(Overlay, HTMLParagraphElement):void} [callback=()=>{}] - Additional JS modification to the `small`.
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
      'style': 'display: none !important; visibility: hidden !important; position: absolute !important; left: -9999px !important; width: 0 !important; height: 0 !important; opacity: 0 !important;'
    }; // Complete file input hiding to prevent native browser text interference
    const text = additionalProperties['textContent'] ?? ''; // Retrieves the text content

    delete additionalProperties['textContent']; // Deletes the text content before applying the additional properties to the file input

    const container = this.#createElement('div'); // Container for file input
    const input = this.#createElement('input', properties, additionalProperties); // Creates the file input
    this.buildElement(); // Signifies that we are done adding children to the file input
    const button = this.#createElement('button');
    this.addDiv({ innerHTML: icons.uploadIcon }).buildElement(); // Adds an upload icon to the button
    const buttonContent = this.#createElement('span', {'textContent': text}); // Creates the button content with the text
    this.buildElement(); // Signifies that we are done adding children to the button content
    this.buildElement(); // Signifies that we are done adding children to the button
    this.buildElement(); // Signifies that we are done adding children to the container

    // Prevent file input from being accessible or visible by screen-readers and tabbing
    input.setAttribute('tabindex', '-1');
    input.setAttribute('aria-hidden', 'true');
    
    button.addEventListener('click', () => {
      input.click(); // Clicks the file input
    });

    // Update button text when file is selected
    input.addEventListener('change', () => {
      button.style.maxWidth = `${button.offsetWidth}px`;
      if (input.files.length > 0) {
        buttonContent.textContent = input.files[0].name;
      } else {
        buttonContent.textContent = text;
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

  /** Handles dragging of the overlay.
   * Uses requestAnimationFrame for smooth animations and GPU-accelerated transforms.
   * @param {string} moveMe - The ID of the element to be moved
   * @param {string} iMoveThings - The ID of the drag handle element
   * @since 0.8.2
  */
  handleDrag(moveMe, iMoveThings) {
    let isDragging = false;
    let offsetX, offsetY = 0;
    let animationFrame = null;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    // Retrieves the elements (allows either '#id' or 'id' to be passed in)
    moveMe = document.querySelector(moveMe?.[0] == '#' ? moveMe : '#' + moveMe);
    iMoveThings = document.querySelector(iMoveThings?.[0] == '#' ? iMoveThings : '#' + iMoveThings);

    // What to do when one of the two elements are not found
    if (!moveMe || !iMoveThings) {
      this.handleDisplayError(`Can not drag! ${!moveMe ? 'moveMe' : ''} ${!moveMe && !iMoveThings ? 'and ' : ''}${!iMoveThings ? 'iMoveThings ' : ''}was not found!`);
      return; // Kills itself
    }

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

    // Cache initial position to avoid expensive getBoundingClientRect calls during drag
    let initialRect = null;
    
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
      iMoveThings.classList.add('dragging');
      
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
      iMoveThings.classList.remove('dragging');
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

    // Mouse move - update target position
    document.addEventListener('mousemove', function(event) {
      if (isDragging && initialRect) {
        targetX = event.clientX - offsetX;
        targetY = event.clientY - offsetY;
      }
    }, { passive: true });

    // Touch move - update target position
    document.addEventListener('touchmove', function(event) {
      if (isDragging && initialRect) {
        const touch = event?.touches?.[0];
        if (!touch) {return;}
        targetX = touch.clientX - offsetX;
        targetY = touch.clientY - offsetY;
        event.preventDefault();
      }
    }, { passive: false });

    // End drag events
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    document.addEventListener('touchcancel', endDrag);
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