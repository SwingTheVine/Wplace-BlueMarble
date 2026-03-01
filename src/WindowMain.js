import ConfettiManager from "./confetttiManager";
import Overlay from "./Overlay";
import { getClipboardData } from "./utils";
import WindowCredts from "./WindowCredits";
import WindowFilter from "./WindowFilter";
import WindowWizard from "./WindowWizard";

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
    this.window = this.addDiv({'id': this.windowID, 'class': 'bm-window bm-windowed', 'style': 'top: 10px; left: unset; right: 75px;'}, (instance, div) => {
      // div.onclick = (event) => {
      //   if (event.target.closest('button, a, input, select')) {return;} // Exit-early if interactive child was clicked
      //   div.parentElement.appendChild(div); // When the window is clicked on, bring to top
      // }
    }).addDragbar()
        .addButton({'class': 'bm-button-circle', 'textContent': '▼', 'aria-label': 'Minimize window "Blue Marble"', 'data-button-status': 'expanded'}, (instance, button) => {
          button.onclick = () => instance.handleMinimization(button);
          button.ontouchend = () => {button.click();}; // Needed ONLY to negate weird interaction with dragbar
        }).buildElement()
        .addDiv().buildElement() // Contains the minimized h1 element
      .buildElement()
      .addDiv({'class': 'bm-window-content'})
        .addDiv({'class': 'bm-container'})
          .addImg({'class': 'bm-favicon', 'src': 'https://raw.githubusercontent.com/SwingTheVine/Wplace-BlueMarble/main/dist/assets/Favicon.png'}, (instance, img) => {
            // Adds a birthday hat & confetti to the window if it is Blue Marble's birthday
            const date = new Date();
            const dayOfTheYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)) + 1;
            if (dayOfTheYear == 204) {
              img.parentNode.style.position = 'relative';
              img.parentNode.innerHTML = img.parentNode.innerHTML + `<svg viewBox="0 0 9 7" width="2em" height="2em" style="position: absolute; top: -.75em; left: 3.25ch;"><path d="M0,3L9,0L2,7" fill="#0af"/><path d="M0,3A.4,.4 0 1 1 1,5" fill="#a00"/><path d="M1.5,6A1,1 0 0 1 3,6L2,7" fill="#a0f"/><path d="M4,5A.6,.6 0 1 1 5,4" fill="#0a0"/><path d="M6,3A.8,.8 0 1 1 7,2" fill="#fa0"/><path d="M4.5,1.5A1,1 0 0 1 3,2" fill="#aa0"/></svg>`;
              img.onload = () => {
                const confettiManager = new ConfettiManager();
                confettiManager.createConfetti(document.querySelector(`#${this.windowID}`));
              };
            }
          }).buildElement()
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
              input.addEventListener("paste", event => this.#coordinateInputPaste(instance, input, event));
            }).buildElement()
            .addInput({'type': 'number', 'id': 'bm-input-ty', 'class': 'bm-input-coords', 'placeholder': 'Tl Y', 'min': 0, 'max': 2047, 'step': 1, 'required': true}, (instance, input) => {
              input.addEventListener("paste", event => this.#coordinateInputPaste(instance, input, event));
            }).buildElement()
            .addInput({'type': 'number', 'id': 'bm-input-px', 'class': 'bm-input-coords', 'placeholder': 'Px X', 'min': 0, 'max': 2047, 'step': 1, 'required': true}, (instance, input) => {
              input.addEventListener("paste", event => this.#coordinateInputPaste(instance, input, event));
            }).buildElement()
            .addInput({'type': 'number', 'id': 'bm-input-py', 'class': 'bm-input-coords', 'placeholder': 'Px Y', 'min': 0, 'max': 2047, 'step': 1, 'required': true}, (instance, input) => {
              input.addEventListener("paste", event => this.#coordinateInputPaste(instance, input, event));
            }).buildElement()
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
          .addDiv({'class': 'bm-container bm-flex-between', 'style': 'margin-bottom: 0; flex-direction: column;'})
            .addDiv({'class': 'bm-flex-between'})
              // .addButton({'class': 'bm-button-circle', 'innerHTML': '🖌'}).buildElement()
              .addButton({'class': 'bm-button-circle', 'innerHTML': '🧙', 'title': 'Template Wizard'}, (instance, button) => {
                button.onclick = () => {
                  const templateManager = instance.apiManager?.templateManager;
                  const wizard = new WindowWizard(this.name, this.version, templateManager?.schemaVersion, templateManager);
                  wizard.buildWindow();
                }
              }).buildElement()
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
              .addButton({'class': 'bm-button-circle', 'title': 'Donate to SwingTheVine', 'innerHTML': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#fff" style="width:80%; margin:auto;"><path d="M249.8 75c89.8 0 113 1.1 146.3 4.4 78.1 7.8 123.6 56 123.6 125.2l0 8.9c0 64.3-47.1 116.9-110.8 122.4-5 16.6-12.8 33.2-23.3 49.9-24.4 37.7-73.1 85.3-162.9 85.3l-17.7 0c-73.1 0-129.7-31.6-163.5-89.2-29.9-50.4-33.8-106.4-33.8-181.2 0-73.7 44.4-113.6 96.4-120.2 39.3-5 88.1-5.5 145.7-5.5zm0 41.6c-60.4 0-103.6 .5-136.3 5.5-46 6.7-64.3 32.7-64.3 79.2l.2 25.7c1.2 57.3 7.1 97.1 27.5 134.5 26.6 49.3 74.8 68.2 129.7 68.2l17.2 0c72 0 107-34.9 126.3-65.4 9.4-15.5 17.7-32.7 22.2-54.3l3.3-13.8 19.9 0c44.3 0 82.6-36 82.6-82l0-8.3c0-51.5-32.2-78.7-88.1-85.3-31.6-2.8-50.4-3.9-140.2-3.9zM267 169.2c38.2 0 64.8 31.6 64.8 67 0 32.7-18.3 61-42.1 83.1-15 15-39.3 30.5-55.9 40.5-4.4 2.8-10 4.4-16.7 4.4-5.5 0-10.5-1.7-15.5-4.4-16.6-10-41-25.5-56.5-40.5-21.8-20.8-39.2-46.9-41.3-77l-.2-6.1c0-35.5 25.5-67 64.3-67 22.7 0 38.8 11.6 49.3 27.7 11.6-16.1 27.2-27.7 49.9-27.7zm122.5-3.9c28.3 0 43.8 16.6 43.8 43.2s-15.5 42.7-43.8 42.7c-8.9 0-13.8-5-13.8-11.7l0-62.6c0-6.7 5-11.6 13.8-11.6z"/></svg>'}, (instance, button) => {
                button.onclick = () => {
                  window.open('https://ko-fi.com/swingthevine', '_blank', 'noopener noreferrer');
                }
              }).buildElement()
              .addButton({'class': 'bm-button-circle', 'innerHTML': '🤝', 'title': 'Credits'}, (instance, button) => {
                button.onclick = () => {
                  const credits = new WindowCredts(this.name, this.version);
                  credits.buildWindow();
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
   * This is a helper function that creates a new class instance.
   * This might cause a memory leak. I pray that this is not the case...
   * @since 0.88.330
   */
  #buildWindowFilter() {
    const windowFilter = new WindowFilter(this); // Creates a new color filter window instance
    windowFilter.buildWindow();
  }

  /** Handles pasting into the coordinate input boxes in the main Blue Marble window.
   * @param {Overlay} instance - The Overlay class instance
   * @param {HTMLInputElement} input - The input element that was pasted into
   * @param {ClipboardEvent} event - The event that triggered this
   * @since 0.88.426
   */
  async #coordinateInputPaste(instance, input, event) {

    event.preventDefault(); // Stops the paste so we can process it

    const data = await getClipboardData(event); // Obtains the clipboard text

    const coords = data.split(/[^a-zA-Z0-9]+/) // Split. Delimiter to split on is "alphanumeric" `f00 bar 4` -> `['f00', 'bar', '4', '']`
      .filter(index => index) // Only preserves non-empty indexes `['f00', 'bar', '4']`
      .map(Number) // Converts every index to a number `[NaN, NaN, 4]`
      .filter(number => !isNaN(number) // Removes NaN `[4]`
    );

    // If there are only two coordinates, and they were pasted into the pixel coords...
    if ((coords.length == 2) && (input.id == 'bm-input-px')) {
      // ...then paste into the pixel inputs

      instance.updateInnerHTML('bm-input-px', coords?.[0] || '');
      instance.updateInnerHTML('bm-input-py', coords?.[1] || '');
    } else if ((coords.length == 1)) {
      // Else if there is only 1 coordinate, we paste into the input like normal

      instance.updateInnerHTML(input.id, coords?.[0] || '');
    } else {
      // Else we paste like normal

      instance.updateInnerHTML('bm-input-tx', coords?.[0] || '');
      instance.updateInnerHTML('bm-input-ty', coords?.[1] || '');
      instance.updateInnerHTML('bm-input-px', coords?.[2] || '');
      instance.updateInnerHTML('bm-input-py', coords?.[3] || '');
    }
  }
}