import Overlay from "./Overlay";

/** The overlay builder for the settings window in Blue Marble.
 * The logic for this window is managed in {@link SettingsManager}
 * @description This class handles the overlay UI for the settings window of the Blue Marble userscript.
 * @class WindowSettings
 * @since 0.91.11
 * @see {@link Overlay} for examples
 */
export default class WindowSettings extends Overlay {

  /** Constructor for the Settings window
   * @param {string} name - The name of the userscript
   * @param {string} version - The version of the userscript
   * @since 0.91.11
   * @see {@link Overlay#constructor} for examples
   */
  constructor(name, version) {
    super(name, version); // Executes the code in the Overlay constructor
    this.window = null; // Contains the *window* DOM tree
    this.windowID = 'bm-window-settings'; // The ID attribute for this window
    this.windowParent = document.body; // The parent of the window DOM tree
  }

  /** Spawns a Settings window.
   * If another settings window already exists, we DON'T spawn another!
   * Parent/child relationships in the DOM structure below are indicated by indentation.
   * @since 0.91.11
   */
  buildWindow() {

    // If a settings window already exists, close it
    if (document.querySelector(`#${this.windowID}`)) {
      document.querySelector(`#${this.windowID}`).remove();
      return;
    }

    this.window = this.addDiv({'id': this.windowID, 'class': 'bm-window'})
      .addDragbar()
        .addButton({'class': 'bm-button-circle', 'textContent': '▼', 'aria-label': 'Minimize window "Color Filter"', 'data-button-status': 'expanded'}, (instance, button) => {
          button.onclick = () => instance.handleMinimization(button);
          button.ontouchend = () => {button.click()}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
        .addDiv().buildElement() // Contains the minimized h1 element
        .addDiv({'class': 'bm-flex-center'})
          .addButton({'class': 'bm-button-circle', 'textContent': '✖', 'aria-label': 'Close window "Color Filter"'}, (instance, button) => {
            button.onclick = () => {document.querySelector(`#${this.windowID}`)?.remove();};
            button.ontouchend = () => {button.click();}; // Needed only to negate weird interaction with dragbar
          }).buildElement()
        .buildElement()
      .buildElement()
      .addDiv({'class': 'bm-window-content'})
        .addDiv({'class': 'bm-container bm-center-vertically'})
          .addHeader(1, {'textContent': 'Settings'}).buildElement()
        .buildElement()
        .addHr().buildElement()
        .addP({'textContent': 'Settings take 2 seconds to save.'}).buildElement()
        .addDiv({'class': 'bm-container bm-scrollable'}, (instance, div) => {
          // Each category in the settings window
          this.buildHighlight();
          this.buildTemplate();
        }).buildElement()
      .buildElement()
    .buildElement().buildOverlay(this.windowParent);

    // Creates dragging capability on the drag bar for dragging the window
    this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);
  }

  /** Displays an error when a settings category fails to load.
   * @param {string} name - The name of the category
   * @since 0.91.11
   */
  #errorOverrideFailure(name) {
    this.window = this.addDiv({'class': 'bm-container'})
      .addHeader(2, {'textContent': name}).buildElement()
      .addHr().buildElement()
      .addP({'innerHTML': `An error occured loading the ${name} category. <code>SettingsManager</code> failed to override the ${name} function inside <code>WindowSettings</code>.`}).buildElement()
    .buildElement();
  }

  /** Builds the highlight section of the window.
   * This should be overriden by {@link SettingsManager}
   * @since 0.91.11
   */
  buildHighlight() {
    this.#errorOverrideFailure('Pixel Highlight');
  }

  /** Builds the template section of the window.
   * This should be overriden by {@link SettingsManager}
   * @since 0.91.68
   */
  buildTemplate() {
    this.#errorOverrideFailure('Template');
  }
}