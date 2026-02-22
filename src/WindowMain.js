import Overlay from "./Overlay";
import WindowFilter from "./WindowFilter";

/** The overlay builder for the main Blue Marble window.
 * @description This class handles the overlay UI for the main window of the Blue Marble userscript.
 * @class WindowMain
 * @since 0.88.326
 * @see {@link Overlay} for examples
 */
export default class WindowMain extends Overlay {

  /** Constructor for the main Blue Marble window
   * @param {string} name - The name of the userscript
   * @param {string} version - The version of the userscript
   * @since 0.88.326
   * @see {@link Overlay#constructor}
   */
  constructor(name, version) {
    super(name, version); // Executes the code in the Overlay constructor
    this.window = null; // Contains the *window* DOM tree
    this.windowID = 'bm-window-main'; // The ID attribute for this window
    this.windowParent = document.body; // The parent of the window DOM tree
  }

  /** Creates the main Blue Marble window.
   * Parent/child relationships in the DOM structure below are indicated by indentation.
   * @since 0.58.3
   */
  buildWindow() {

    // If the main window already exists, throw an error and return early
    if (document.querySelector(`#${this.windowID}`)) {
      this.handleDisplayError('Main window already exists!');
      return;
    }

    // Creates the window
    this.window = this.addDiv({'id': this.windowID, 'class': 'bm-window', 'style': 'top: 10px; left: unset; right: 75px;'})
      .addDragbar()
        .addButton({'class': 'bm-button-circle', 'textContent': '▼', 'aria-label': 'Minimize window "Blue Marble"', 'data-button-status': 'expanded'}, (instance, button) => {
          button.onclick = () => instance.handleMinimization(button);
          button.ontouchend = () => {button.click();}; // Needed ONLY to negate weird interaction with dragbar
        }).buildElement()
        .addDiv().buildElement() // Contains the minimized h1 element
      .buildElement()
      .addDiv({'class': 'bm-window-content'})
        .addDiv({'class': 'bm-container'})
          .addImg({'class': 'bm-favicon', 'src': 'https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/main/dist/assets/Favicon.png'}).buildElement()
          .addHeader(1, {'textContent': this.name}).buildElement()
        .buildElement()
        .addHr().buildElement()
        .addDiv({'class': 'bm-container'})
          .addSpan({'id': 'bm-user-droplets', 'textContent': 'Droplets:'}).buildElement()
          .addBr().buildElement()
          .addSpan({'id': 'bm-user-nextlevel', 'textContent': 'Next level in...'}).buildElement()
          .addBr().buildElement()
          .addSpan({'textContent': 'Charges: '})
            .addTimer(Date.now(), 1000, {'style': 'font-weight: 700;'}, (instance, timer) => {
              instance.apiManager.chargeRefillTimerID = timer.id; // Store the timer ID in apiManager so we can update the timer automatically
            }).buildElement()
          .buildElement()
        .buildElement()
        .addHr().buildElement()
        .addDiv({'class': 'bm-container'})
          .addDiv({'class': 'bm-container'})
            .addButton({'class': 'bm-button-circle bm-button-pin', 'style': 'margin-top: 0;', 'innerHTML': '<svg viewBox="0 0 4 6"><path d="M.5,3.4A2,2 0 1 1 3.5,3.4L2,6"/><circle cx="2" cy="2" r=".7" fill="#fff"/></svg>'},
              (instance, button) => {
                button.onclick = () => {
                  const coords = instance.apiManager?.coordsTilePixel; // Retrieves the coords from the API manager
                  if (!coords?.[0]) {
                    instance.handleDisplayError('Coordinates are malformed! Did you try clicking on the canvas first?');
                    return;
                  }
                  instance.updateInnerHTML('bm-input-tx', coords?.[0] || '');
                  instance.updateInnerHTML('bm-input-ty', coords?.[1] || '');
                  instance.updateInnerHTML('bm-input-px', coords?.[2] || '');
                  instance.updateInnerHTML('bm-input-py', coords?.[3] || '');
                }
              }
            ).buildElement()
            .addInput({'type': 'number', 'id': 'bm-input-tx', 'class': 'bm-input-coords', 'placeholder': 'Tl X', 'min': 0, 'max': 2047, 'step': 1, 'required': true}, (instance, input) => {
              //if a paste happens on tx, split and format it into other coordinates if possible
              input.addEventListener("paste", (event) => {
                let splitText = (event.clipboardData || window.clipboardData).getData("text").split(" ").filter(n => n).map(Number).filter(n => !isNaN(n)); //split and filter all Non Numbers
                if (splitText.length !== 4 ) { // If we don't have 4 clean coordinates, end the function.
                  return;
                }
                let coords = selectAllCoordinateInputs(document); 
                for (let i = 0; i < coords.length; i++) { 
                  coords[i].value = splitText[i]; //add the split vales
                }
                event.preventDefault(); //prevent the pasting of the original paste that would overide the split value
              })
            }).buildElement()
            .addInput({'type': 'number', 'id': 'bm-input-ty', 'class': 'bm-input-coords', 'placeholder': 'Tl Y', 'min': 0, 'max': 2047, 'step': 1, 'required': true}).buildElement()
            .addInput({'type': 'number', 'id': 'bm-input-px', 'class': 'bm-input-coords', 'placeholder': 'Px X', 'min': 0, 'max': 2047, 'step': 1, 'required': true}).buildElement()
            .addInput({'type': 'number', 'id': 'bm-input-py', 'class': 'bm-input-coords', 'placeholder': 'Px Y', 'min': 0, 'max': 2047, 'step': 1, 'required': true}).buildElement()
          .buildElement()
          .addDiv({'class': 'bm-container'})
            .addInputFile({'class': 'bm-input-file', 'textContent': 'Upload Template', 'accept': 'image/png, image/jpeg, image/webp, image/bmp, image/gif'}).buildElement()
          .buildElement()
          .addDiv({'class': 'bm-container bm-flex-between'})
            .addButton({'textContent': 'Disable', 'data-button-status': 'shown'}, (instance, button) => {
              button.onclick = () => {
                button.disabled = true; // Disables the button until the transition ends
                if (button.dataset['buttonStatus'] == 'shown') { // If templates are currently being 'shown' then hide them
                  instance.apiManager?.templateManager?.setTemplatesShouldBeDrawn(false); // Disables templates from being drawn
                  button.dataset['buttonStatus'] = 'hidden'; // Swap internal button status tracker
                  button.textContent = 'Enable'; // Swap button text
                  instance.handleDisplayStatus(`Disabled templates!`); // Inform the user
                } else { // In all other cases, we should show templates instead of hiding them
                  instance.apiManager?.templateManager?.setTemplatesShouldBeDrawn(true); // Allows templates to be drawn
                  button.dataset['buttonStatus'] = 'shown'; // Swap internal button status tracker
                  button.textContent = 'Disable'; // Swap button text
                  instance.handleDisplayStatus(`Enabled templates!`); // Inform the user
                }
                button.disabled = false; // Enables the button
              }
            }).buildElement()
            .addButton({'textContent': 'Create'}, (instance, button) => {
              button.onclick = () => {
                const input = document.querySelector(`#${this.windowID} .bm-input-file`);

                // Checks to see if the coordinates are valid. Throws an error if they are not
                const coordTlX = document.querySelector('#bm-input-tx');
                if (!coordTlX.checkValidity()) {coordTlX.reportValidity(); instance.handleDisplayError('Coordinates are malformed! Did you try clicking on the canvas first?'); return;}
                const coordTlY = document.querySelector('#bm-input-ty');
                if (!coordTlY.checkValidity()) {coordTlY.reportValidity(); instance.handleDisplayError('Coordinates are malformed! Did you try clicking on the canvas first?'); return;}
                const coordPxX = document.querySelector('#bm-input-px');
                if (!coordPxX.checkValidity()) {coordPxX.reportValidity(); instance.handleDisplayError('Coordinates are malformed! Did you try clicking on the canvas first?'); return;}
                const coordPxY = document.querySelector('#bm-input-py');
                if (!coordPxY.checkValidity()) {coordPxY.reportValidity(); instance.handleDisplayError('Coordinates are malformed! Did you try clicking on the canvas first?'); return;}

                // Kills itself if there is no file
                if (!input?.files[0]) {instance.handleDisplayError(`No file selected!`); return;}

                instance?.apiManager?.templateManager.createTemplate(input.files[0], input.files[0]?.name.replace(/\.[^/.]+$/, ''), [Number(coordTlX.value), Number(coordTlY.value), Number(coordPxX.value), Number(coordPxY.value)]);
                instance.handleDisplayStatus(`Drew to canvas!`);
              }
            }).buildElement()
            .addButton({'textContent': 'Filter'}, (instance, button) => {
              button.onclick = () => this.#buildWindowFilter();
            }).buildElement()
          .buildElement()
          .addDiv({'class': 'bm-container'})
            .addTextarea({'id': this.outputStatusId, 'placeholder': `Status: Sleeping...\nVersion: ${this.version}`, 'readOnly': true}).buildElement()
          .buildElement()
          .addDiv({'class': 'bm-container bm-flex-between', 'style': 'margin-bottom: 0;'})
            .addDiv({'class': 'bm-flex-between'})
              // .addButton({'class': 'bm-button-circle', 'innerHTML': '🖌'}).buildElement()
              .addButton({'class': 'bm-button-circle', 'innerHTML': '🎨', 'title': 'Template Color Converter'}, (instance, button) => {
                button.onclick = () => {
                  window.open('https://pepoafonso.github.io/color_converter_wplace/', '_blank', 'noopener noreferrer');
                }
              }).buildElement()
              .addButton({'class': 'bm-button-circle', 'innerHTML': '🌐', 'title': 'Official Blue Marble Website'}, (instance, button) => {
                button.onclick = () => {
                  window.open('https://bluemarble.lol/', '_blank', 'noopener noreferrer');
                }
              }).buildElement()
            .buildElement()
            .addSmall({'textContent': 'Made by SwingTheVine', 'style': 'margin-top: auto;'}).buildElement()
          .buildElement()
        .buildElement()
      .buildElement()
    .buildElement().buildOverlay(this.windowParent);

    // Creates dragging capability on the drag bar for dragging the window
    this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
  }

  /** Displays a new color filter window.
   * @since 0.88.330
   */
  #buildWindowFilter() {
    const windowFilter = new WindowFilter(this); // Creates a new color filter window instance
    windowFilter.buildWindow();
  }
}