import Overlay from "./Overlay";
import { encodedToNumber, escapeHTML } from "./utils";

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
   * @param {string} encodingBase - The encoding base typically used by Blue Marble for encoding numbers
   * @since 0.88.434
   * @see {@link Overlay#constructor} for examples
   */
  constructor(name, version, schemaVersionBleedingEdge, encodingBase) {
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

    this.encodingBase = encodingBase; // The encoding base typically used by Blue Marble for encoding numbers
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
          .addHeader(2, {'textContent': 'Detected templates:'}).buildElement()
          // Detected templates will show up here
        .buildElement()
      .buildElement()
    .buildElement().buildOverlay(this.windowParent);

    this.#displaySchemaHealth(); // Displays template storage health to the user
    this.#displayTemplateList(); // Displays a list of all templates in the template storage
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
        schemaHealthBanner = 'Template storage health: <b style="color:#0f0;">Healthy!</b><br>No futher action required. (Reason: Semantic version matches)';
        this.schemaHealth = 'Good';
      } else {
        schemaHealthBanner = 'Template storage health: <b style="color:#ff0;">Poor!</b><br>You can still use your template, but some features may not work. It is recommended that you update Blue Marble\'s template storage. (Reason: MINOR version mismatch)';
        this.schemaHealth = 'Poor';
      }
    } else {
      schemaHealthBanner = 'Template storage health: <b style="color:#f00">Dead!</b><br>Blue Marble can not load the template storage. (Reason: MAJOR version mismatch)';
      this.schemaHealth = 'Dead';
    }

    // Display schema health to user
    this.updateInnerHTML('#bm-wizard-status', `${schemaHealthBanner}<br>The current schema version (<b>${escapeHTML(this.schemaVersion)}</b>) was created during Blue Marble version <b>${escapeHTML(this.scriptVersion)}</b>.<br>The current Blue Marble version (<b>${escapeHTML(this.version)}</b>) requires schema version <b>${escapeHTML(this.schemaVersionBleedingEdge)}</b>.<br>If you don't want to upgrade the template storage (schema), then downgrade Blue Marble to version <b>${escapeHTML(this.scriptVersion)}</b>.`);
    
    // Create button options (only if schema is not 'Dead')
    const buttonOptions = new Overlay(this.name, this.version);
    if (this.schemaHealth != 'Dead') {
      buttonOptions.addDiv({'class': 'bm-container bm-flex-center bm-center-vertically'})
        buttonOptions.addButton({'textContent': 'Download all templates'}, (instance, button) => {
          button.onclick = () => {
  
          }
        }).buildElement();
    }
    // If the schema health is Poor or Bad, then show update option
    if ((this.schemaHealth == 'Poor') || (this.schemaHealth == 'Bad')) {
      buttonOptions.addButton({'textContent': `Update template storage to ${this.schemaVersionBleedingEdge}`}, (instance, button) => {
        button.onclick = () => {

        }
      }).buildElement();
    }

    // Add the button options DOM tree to the actual DOM tree
    buttonOptions.buildElement().buildOverlay(document.querySelector('#bm-wizard-status').parentNode);
  }

  /** Displays loaded templates to the user.
   * @since 0.88.441
   */
  #displayTemplateList() {

    const templates = this.currentJSON?.templates; // Templates in user storage
    console.log('Loading Template Wizard...');
    console.log(templates);

    console.log(Object.keys(templates).length);

    // If there is at least one template loaded...
    if (Object.keys(templates).length > 0) {

      // Obtains the parent element for the template list
      const templateListParentElement = document.querySelector(`#${this.windowID} .bm-scrollable`);
      
      console.log(templateListParentElement);

      // Creates the template list DOM tree
      const templateList = new Overlay(this.name, this.version);
      templateList.addDiv({'id': 'bm-wizard-tlist', 'class': 'bm-container'})

      // For each template...
      for (const template in templates) {

        const templateKey = template; // The identification key for the template. E.g., "0 $Z"
        const templateValue = templates[template]; // The actual content of the template
        console.log(`Wzrd - Template Key: ${templateKey}`);

        // If the template is a direct child of the templates Object...
        if (templates.hasOwnProperty(template)) {

          // Obtain template information
          const templateKeyArray = templateKey.split(' '); // E.g., "0 $Z" -> ["0", "$Z"]
          const sortID = Number(templateKeyArray?.[0]); // Sort ID of the template
          const authorID = encodedToNumber(templateKeyArray?.[1] || '0', this.encodingBase); // User ID of the person who exported the template
          const displayName = templateValue.name || `Template ${sortID || ''}`; // Display name of the template
          const coords = templateValue?.coords?.split(',').map(Number); // "1,2,3,4" -> [1, 2, 3, 4]
          const totalPixelCount = templateValue.pixels?.total ?? undefined;
          const templateImage = undefined; // TODO: Add template image

          console.log('Sort ID:', sortID);
          console.log('Author ID:', authorID);
          console.log('Display Name:', displayName);
          console.log('Coords', coords);
          console.log('Pixels:', totalPixelCount);

          templateList.addDiv({'class': 'bm-container bm-flex-center'})
            .addDiv({'class': 'bm-flex-center', 'style': 'flex-direction: column; gap: 0;'})
              .addDiv({'class': 'bm-wizard-template-container-image', 'textContent': templateImage || '🖼️'})
                // TODO: Add image element and SVG fallback
              .buildElement()
              .addSmall({'textContent': `#${sortID}`}).buildElement()
            .buildElement()
            .addDiv({'class': 'bm-flex-center bm-wizard-template-container-flavor'})
              .addHeader(3, {'textContent': displayName}).buildElement()
              .addSpan({'textContent': `Uploaded by user #${authorID}`}).buildElement()
              .addSpan({'textContent': `Coordinates: ${coords.join(', ')}`}).buildElement()
              .addSpan({'textContent': `Total Pixels: ${totalPixelCount || '???'}`}).buildElement()
            .buildElement()
          .buildElement()
        }
      }

      // Adds the template list to the real DOM tree
      templateList.buildElement().buildOverlay(templateListParentElement);
    }
  }
}