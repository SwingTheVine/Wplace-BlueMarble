import Overlay from "./Overlay";
import { escapeHTML } from "./utils";

/** Wizard that manages template updates & recovery
 * @class WindowWizard
 * @since 0.88.434
 * @see {@link Overlay} for examples
 */
export default class WindowWizard extends Overlay {

  /** Constructor for the Template Wizard window
   * @param {string} name - The name of the userscript
   * @param {string} version - The version of the userscript
   * @param {string} schemaVersionBleedingEdge - The bleeding edge of schema versions for Blue Marble
   * @since 0.88.434
   * @see {@link Overlay#constructor} for examples
   */
  constructor(name, version, schemaVersionBleedingEdge) {
    super(name, version); // Executes the code in the Overlay constructor
    this.window = null; // Contains the *window* DOM tree
    this.windowID = 'bm-window-wizard'; // The ID attribute for this window
    this.windowParent = document.body; // The parent of the window DOM tree

    // Retrieves data from storage
    this.currentJSON = JSON.parse(GM_getValue('bmTemplates', '{}')); // The current Blue Marble storage
    this.scriptVersion = this.currentJSON?.scriptVersion; // Script version when template was created
    this.schemaVersion = this.currentJSON?.schemaVersion; // Schema version when template was created

    this.schemaHealth = undefined; // Current schema health. This is: 'Good', 'Poor', 'Bad', or 'Dead' for full match, MINOR mismatch, MAJOR mismatch, and unknown, respectively.
    this.schemaVersionBleedingEdge = schemaVersionBleedingEdge; // Latest schema version
  }

  /** Spawns a Template Wizard window.
   * If another template wizard window already exists, we DON'T spawn another!
   * Parent/child relationships in the DOM structure below are indicated by indentation.
   * @since 0.88.434
   */
  buildWindow() {

    // If a template wizard window already exists, throw an error and return early
    if (document.querySelector(`#${this.windowID}`)) {
      this.handleDisplayError('Template Wizard window already exists!');
      return;
    }

    // Creates a new template wizard window
    this.window = this.addDiv({'id': this.windowID, 'class': 'bm-window', 'style': 'z-index: 9001;'})
      .addDragbar()
        .addButton({'class': 'bm-button-circle', 'textContent': '▼', 'aria-label': 'Minimize window "Template Wizard"', 'data-button-status': 'expanded'}, (instance, button) => {
          button.onclick = () => instance.handleMinimization(button);
          button.ontouchend = () => {button.click()}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
        .addDiv().buildElement() // Contains the minimized h1 element
        .addButton({'class': 'bm-button-circle', 'textContent': '🞪', 'aria-label': 'Close window "Template Wizard"'}, (instance, button) => {
          button.onclick = () => {document.querySelector(`#${this.windowID}`)?.remove();};
          button.ontouchend = () => {button.click();}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
      .buildElement()
      .addDiv({'class': 'bm-window-content'})
        .addDiv({'class': 'bm-container bm-center-vertically'})
          .addHeader(1, {'textContent': 'Template Wizard'}).buildElement()
        .buildElement()
        .addHr().buildElement()
        .addDiv({'class': 'bm-container'})
          .addP({'id': 'bm-wizard-status', 'textContent': 'Loading template storage status...'}).buildElement()
        .buildElement()
        .addDiv({'class': 'bm-container bm-scrollable'})
          .addSpan({'textContent': 'Detected templates:'}).buildElement()
          // Detected templates will show up here
        .buildElement()
      .buildElement()
    .buildElement().buildOverlay(this.windowParent);

    this.#displaySchemaHealth();
  }

  /** Determines how "healthy" the template storage is.
   * @since 0.88.436
   */
  #displaySchemaHealth() {

    // SemVer -> string[]
    const schemaVersionArray = this.schemaVersion.split(/[-\.\+]/);
    const schemaVersionBleedingEdgeArray = this.schemaVersionBleedingEdge.split(/[-\.\+]/);

    // Calculates the health that is displayed as a banner
    let schemaHealthBanner = '';
    if (schemaVersionArray[0] == schemaVersionBleedingEdgeArray[0]) {

      if (schemaVersionArray[1] == schemaVersionBleedingEdgeArray[1]) {
        schemaHealthBanner = 'Template storage health: <b>Healthy!</b><br>No futher action required. (Reason: Semantic version matches)';
        this.schemaHealth = 'Good';
      } else {
        schemaHealthBanner = 'Template storage health: <b>Poor!</b><br>You can still use your template, but some features may not work. It is recommended that you update Blue Marble\'s template storage. (Reason: MINOR version mismatch)';
        this.schemaHealth = 'Poor';
      }
    } else {
      schemaHealthBanner = 'Template storage health: <b>Dead!</b><br>Blue Marble can not load the template storage. (Reason: MAJOR version mismatch)';
      this.schemaHealth = 'Dead';
    }

    // Display schema health to user
    this.updateInnerHTML('#bm-wizard-status', `${schemaHealthBanner}<br>The current schema version (<b>${escapeHTML(this.schemaVersion)}</b>) was created during Blue Marble version <b>${escapeHTML(this.scriptVersion)}</b>.<br>The current Blue Marble version (<b>${escapeHTML(this.version)}</b>) requires schema version <b>${escapeHTML(this.schemaVersionBleedingEdge)}</b>.<br>If you don't want to upgrade the template storage (schema), then downgrade Blue Marble to version <b>${escapeHTML(this.scriptVersion)}</b>.`);
    
    // If the schema health is Poor or Bad, then show update options
    if ((this.schemaHealth == 'Poor') || (this.schemaHealth == 'Bad')) {
      const buttonOptions = new Overlay(this.name, this.version);
      buttonOptions.addDiv({'class': 'bm-container bm-flex-center bm-center-vertically'})
        .addButton({'textContent': 'Recover (download) templates'}, (instance, button) => {
          button.onclick = () => {

          }
        }).buildElement()
        .addButton({'textContent': `Update template storage to ${this.schemaVersionBleedingEdge}`}, (instance, button) => {
          button.onclick = () => {

          }
        }).buildElement()
      .buildElement().buildOverlay(document.querySelector('#bm-wizard-status').parentNode)
    }
  }
}