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

    this.settingsManager = null; // The settings manager

    // Enum for requesting window state variables from settingsManager
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
    });
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

    // Should the window start off minimized?
    const wStartsExp = !this.settingsManager.getWindowStateVariable('sett', this.WStateVariables.WINDOW_MINIMIZED);

    // Obtains if the window was in the DOM tree during the last cold save
    const windowWasInDOM = this.settingsManager.getWindowStateVariable('sett', this.WStateVariables.WINDOW_EXISTS);

    // Obtains the draw depth from the last save
    const drawDepthOld = this.settingsManager.getWindowStateVariable('sett', this.WStateVariables.DRAW_DEPTH);

    // If this window was open when the user left the page, we request the draw depth this window had when the page closed.
    // If this window was NOT open, then we put it on top
    const drawDepthNew = this.handleDrawDepth(windowWasInDOM ? drawDepthOld : undefined);

    // Raw translation coordinates
    let translateX = this.settingsManager.getWindowStateVariable('sett', this.WStateVariables.X_TRANSLATION_IS_NEGATIVE) ? -1 * this.settingsManager.getWindowStateVariable('sett', this.WStateVariables.X_TRANSLATION) : this.settingsManager.getWindowStateVariable('sett', this.WStateVariables.X_TRANSLATION);
    let translateY = this.settingsManager.getWindowStateVariable('sett', this.WStateVariables.Y_TRANSLATION_IS_NEGATIVE) ? -1 * this.settingsManager.getWindowStateVariable('sett', this.WStateVariables.Y_TRANSLATION) : this.settingsManager.getWindowStateVariable('sett', this.WStateVariables.Y_TRANSLATION);
    
    // Clampped coordinates, so you can't permanantly lose the window
    translateX = Math.max(-100, Math.min(window.innerWidth - 40, translateX));
    translateY = Math.max(-10, Math.min(window.innerHeight - 35, translateY));
    
    // If the window has NOT been moved, use the default starting location.
    const startingPosition = !this.settingsManager.getWindowStateVariable('sett', this.WStateVariables.WINDOW_MOVED) ? '' : `top: 0px; left: 0px; transform: translate(${translateX}px, ${translateY}px);`;

    // If we don't call this, and the DOM tree loaded AFTER the class, but BEFORE the .buildWindow() call, BM will crash
    this.windowParent = document.body; // The parent of the window DOM tree

    this.window = this.addDiv({'id': this.windowID, 'class': 'bm-window', 'style': `${startingPosition} z-index: ${9000 + drawDepthNew};`, 'data-draw-depth': drawDepthNew})
      .addDragbar()
        .addButton({'class': 'bm-button-circle', 'textContent': wStartsExp ? '▼' : '▶', 'aria-label': wStartsExp ? 'Minimize window "Settings"' : 'Unminimize window "Settings"', 'data-button-status': wStartsExp ? 'expanded' : 'collapsed'}, (instance, button) => {
          button.onclick = () => instance.handleMinimization(button);
          button.ontouchend = () => {button.click()}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
        .addDiv(undefined, (instance, div) => {
          if (!wStartsExp) { // If we start collapsed, add the dragbar header
            instance.addHeader(1, {'textContent': 'Settings'}).buildElement();
          }
        }).buildElement() // Contains the minimized h1 element
        .addDiv({'class': 'bm-flex-center'})
          .addButton({'class': 'bm-button-circle', 'textContent': '✖', 'aria-label': 'Close window "Color Filter"'}, (instance, button) => {
            button.onclick = () => {document.querySelector(`#${this.windowID}`)?.remove();};
            button.ontouchend = () => {button.click();}; // Needed only to negate weird interaction with dragbar
          }).buildElement()
        .buildElement()
      .buildElement()
      .addDiv({'class': 'bm-window-content', 'style': wStartsExp ? '' : 'height: 0px; display: none;'})
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

  /** Populates the settingsManager variable with the settingsManager class.
   * @param {SettingsManager} settingsManager - The settingsManager class instance
   * @since 0.94.31
   */
  setSettingsManager(settingsManager) {
    this.settingsManager = settingsManager;
  }
}