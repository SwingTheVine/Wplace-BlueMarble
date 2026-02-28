import Overlay from "./Overlay";
import Template from "./Template";
import TemplateManager from "./templateManager";
import { encodedToNumber, escapeHTML, getWplaceVersion, localizeDate, localizeNumber, sleep } from "./utils";

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
   * @param {TemplateManager} [templateManager=undefined] - (Optional) The TemplateManager class instance
   * @since 0.88.434
   * @see {@link Overlay#constructor} for examples
   */
  constructor(name, version, schemaVersionBleedingEdge, templateManager = undefined) {
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

    this.templateManager = templateManager;
  }

  /** Spawns a Template Wizard window.
   * If another template wizard window already exists, we DON'T spawn another!
   * Parent/child relationships in the DOM structure below are indicated by indentation.
   * @since 0.88.434
   */
  buildWindow() {

    // If a template wizard window already exists, close it
    if (document.querySelector(`#${this.windowID}`)) {
      document.querySelector(`#${this.windowID}`).remove();
      return;
    }

    let style = ''; // Window style

    // If the main window does not exist yet...
    if (!document.querySelector(`#bm-window-main`)) {
      style = style.concat('z-index: 9001;').trim();
    }
    // Forces the Wizard window to show above the main window if and only if the schema is bad when Blue Marble loads for the first time this session

    // Creates a new template wizard window
    this.window = this.addDiv({'id': this.windowID, 'class': 'bm-window', 'style': style}, (instance, div) => {
      // div.onclick = (event) => {
      //   if (event.target.closest('button, a, input, select')) {return;} // Exit-early if interactive child was clicked
      //   div.parentElement.appendChild(div); // When the window is clicked on, bring to top
      // }
    }).addDragbar()
        .addButton({'class': 'bm-button-circle', 'textContent': '▼', 'aria-label': 'Minimize window "Template Wizard"', 'data-button-status': 'expanded'}, (instance, button) => {
          button.onclick = () => instance.handleMinimization(button);
          button.ontouchend = () => {button.click()}; // Needed only to negate weird interaction with dragbar
        }).buildElement()
        .addDiv().buildElement() // Contains the minimized h1 element
        .addButton({'class': 'bm-button-circle', 'textContent': '✖', 'aria-label': 'Close window "Template Wizard"'}, (instance, button) => {
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
          .addHeader(2, {'textContent': 'Status'}).buildElement()
          .addP({'id': 'bm-wizard-status', 'textContent': 'Loading template storage status...'}).buildElement()
        .buildElement()
        .addDiv({'class': 'bm-container bm-scrollable'})
          .addHeader(2, {'textContent': 'Detected templates:'}).buildElement()
          // Detected templates will show up here
        .buildElement()
      .buildElement()
    .buildElement().buildOverlay(this.windowParent);

    // Creates dragging capability on the drag bar for dragging the window
    this.handleDrag(`#${this.windowID}.bm-window`, `#${this.windowID} .bm-dragbar`);

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
    // If the MAJOR version is up-to-date...
    if (schemaVersionArray[0] == schemaVersionBleedingEdgeArray[0]) {

      // ...AND IF the MINOR version is up-to-date...
      if (schemaVersionArray[1] == schemaVersionBleedingEdgeArray[1]) {
        schemaHealthBanner = 'Template storage health: <b style="color:#0f0;">Healthy!</b><br>No futher action required. (Reason: Semantic version matches)';
        this.schemaHealth = 'Good';
      } else { // ...else, the MINOR version is out-of-date
        schemaHealthBanner = 'Template storage health: <b style="color:#ff0;">Poor!</b><br>You can still use your template, but some features may not work. It is recommended that you update Blue Marble\'s template storage. (Reason: MINOR version mismatch)';
        this.schemaHealth = 'Poor';
      }
    } else if (schemaVersionArray[0] < schemaVersionBleedingEdgeArray[0]) {
      // ...ELSE IF the MAJOR version is out-of-date
      
      schemaHealthBanner = 'Template storage health: <b style="color:#f00;">Bad!</b><br>It is guaranteed that some features are broken. You <em>might</em> still be able to use the template. It is HIGHLY recommended that you download all templates and update Blue Marble\'s template storage before continuing. (Reason: MAJOR version mismatch)';
      this.schemaHealth = 'Bad';
    } else {
      // ...ELSE the Semantic version is unknown

      schemaHealthBanner = 'Template storage health: <b style="color:#f00">Dead!</b><br>Blue Marble can not load the template storage. (Reason: MAJOR version unknown)';
      this.schemaHealth = 'Dead';
    }

    // Further recovery directions (only displayed if health is NOT 'Good')
    const recoveryInstructions = `<hr style="margin:.5ch">If you want to continue using your current templates, then make sure the template storage (schema) is up-to-date.<br>If you don't want to update the template storage, then downgrade Blue Marble to version <b>${escapeHTML(this.scriptVersion)}</b> to continue using your templates.<br>Alternatively, if you don't care about corrupting the templates listed below, you can fix any issues with the template storage by uploading a new template.`;

    // Obtains the last time Wplace was updated
    const wplaceUpdateTime = getWplaceVersion();
    let wplaceUpdateTimeLocalized = wplaceUpdateTime ? localizeDate(wplaceUpdateTime) : '???';

    // Display schema health to user
    this.updateInnerHTML('#bm-wizard-status', `${schemaHealthBanner}<br>Your templates were created during Blue Marble version <b>${escapeHTML(this.scriptVersion)}</b> with schema version <b>${escapeHTML(this.schemaVersion)}</b>.<br>The current Blue Marble version is <b>${escapeHTML(this.version)}</b> and requires schema version <b>${escapeHTML(this.schemaVersionBleedingEdge)}</b>.<br>Wplace was last updated on <b>${wplaceUpdateTimeLocalized}</b>.${(this.schemaHealth != 'Good') ? recoveryInstructions : ''}`);
    
    // Create button options (only if schema is not 'Dead')
    const buttonOptions = new Overlay(this.name, this.version);
    if (this.schemaHealth != 'Dead') {
      buttonOptions.addDiv({'class': 'bm-container bm-flex-center bm-center-vertically', 'style': 'gap: 1.5ch;'})
        buttonOptions.addButton({'textContent': 'Download all templates'}, (instance, button) => {
          button.onclick = () => {
            button.disabled = true;
            this.templateManager.downloadAllTemplatesFromStorage().then(() => {
              button.disabled = false;
            })
          };
        }).buildElement();
      // Leave the container open for the next button to be added
    }
    // If the schema health is Poor or Bad, then show update option
    if ((this.schemaHealth == 'Poor') || (this.schemaHealth == 'Bad')) {
      buttonOptions.addButton({'textContent': `Update template storage to ${this.schemaVersionBleedingEdge}`}, (instance, button) => {
        button.onclick = () => {

          button.disabled = true; // Disables the button

          // Converts the template schema from 1.x.x to 2.x.x
          this.#convertSchema_1_x_x_To_2_x_x(true);
        };
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

    // If there is at least one template loaded...
    if (Object.keys(templates).length > 0) {

      // Obtains the parent element for the template list
      const templateListParentElement = document.querySelector(`#${this.windowID} .bm-scrollable`);

      // Creates the template list DOM tree
      const templateList = new Overlay(this.name, this.version);
      templateList.addDiv({'id': 'bm-wizard-tlist', 'class': 'bm-container'})

      // For each template...
      for (const template in templates) {

        const templateKey = template; // The identification key for the template. E.g., "0 $Z"
        const templateValue = templates[template]; // The actual content of the template

        // If the template is a direct child of the templates Object...
        if (templates.hasOwnProperty(template)) {

          // Obtain template information
          const templateKeyArray = templateKey.split(' '); // E.g., "0 $Z" -> ["0", "$Z"]
          const sortID = Number(templateKeyArray?.[0]); // Sort ID of the template
          const authorID = encodedToNumber(templateKeyArray?.[1] || '0', this.templateManager.encodingBase); // User ID of the person who exported the template
          const displayName = templateValue.name || `Template ${sortID || ''}`; // Display name of the template
          const coords = templateValue?.coords?.split(',').map(Number); // "1,2,3,4" -> [1, 2, 3, 4]
          const totalPixelCount = templateValue.pixels?.total ?? undefined;
          const templateImage = undefined; // TODO: Add template image

          // Localization of information to display to the user
          const sortIDLocalized = (typeof sortID == 'number') ? localizeNumber(sortID) : '???';
          const authorIDLocalized = (typeof authorID == 'number') ? localizeNumber(authorID) : '???';
          const totalPixelCountLocalized = (typeof totalPixelCount == 'number') ? localizeNumber(totalPixelCount) : '???';

          templateList.addDiv({'class': 'bm-container bm-flex-center'})
            .addDiv({'class': 'bm-flex-center', 'style': 'flex-direction: column; gap: 0;'})
              .addDiv({'class': 'bm-wizard-template-container-image', 'textContent': templateImage || '🖼️'})
                // TODO: Add image element and SVG fallback
              .buildElement()
              .addSmall({'textContent': `#${sortIDLocalized}`}).buildElement()
            .buildElement()
            .addDiv({'class': 'bm-flex-center bm-wizard-template-container-flavor'})
              .addHeader(3, {'textContent': displayName}).buildElement()
              .addSpan({'textContent': `Uploaded by user #${authorIDLocalized}`}).buildElement()
              .addSpan({'textContent': `Coordinates: ${coords.join(', ')}`}).buildElement()
              .addSpan({'textContent': `Total Pixels: ${totalPixelCountLocalized}`}).buildElement()
            .buildElement()
          .buildElement()
        }
      }

      // Adds the template list to the real DOM tree
      templateList.buildElement().buildOverlay(templateListParentElement);
    }
  }

  /** Converts schema version 1.0.0 to schema version 2.0.0.
   * @param {boolean} shouldWindowWizardOpen - Should we open a new Template Wizard window after schema conversion? This will close any Template Wizard already open.
   * @since 0.88.504
   */
  async #convertSchema_1_x_x_To_2_x_x(shouldWindowWizardOpen) {

    // Creates loading screen
    if (shouldWindowWizardOpen) {
      
      // Obtains the Template Wizard window content container
      const windowContent = document.querySelector(`#${this.windowID} .bm-window-content`);

      // Deletes all content in the Template Wizard window content container
      windowContent.innerHTML = '';

      const loadingScreen = new Overlay(this.name, this.version);
      loadingScreen.addDiv({'class': 'bm-container'})
        .addDiv({'class': 'bm-container bm-center-vertically'})
          .addHeader(1, {'textContent': 'Template Wizard'}).buildElement()
        .buildElement()
        .addHr().buildElement()
        .addDiv({'class': 'bm-container'})
          .addHeader(2, {'textContent': 'Status'}).buildElement()
          .addP({'textContent': 'Updating template storage. Please wait...'}).buildElement()
        .buildElement()
      .buildElement().buildOverlay(windowContent);
    }

    // Deletes the bmCoords value set in 1.0.0 which is unused in 2.0.0
    GM_deleteValue('bmCoords');

    // Obtains the templates from JSON storage
    const templates = this.currentJSON?.templates;

    // If there is at least one template loaded...
    if (Object.keys(templates).length > 0) {

      // For each template loaded...
      for (const [key, template] of Object.entries(templates)) {

        // If the template is a direct child of the templates Object...
        if (templates.hasOwnProperty(key)) {

          // Creates a dummy Template class instance
          const _template = new Template({
            displayName: template.name,
            chunked: template.tiles
          });

          _template.calculateCoordsFromChunked(); // Updates `Template.coords`

          // Converts the template to a Blob
          const blob = await this.templateManager.convertTemplateToBlob(_template);

          // Uses the information from the dummy Template class instance to make the actual Template
          await this.templateManager.createTemplate(blob, _template.displayName, _template.coords);
        }
      }
    }

    // If it has been requested that we open a new Template Wizard window, we do so
    if (shouldWindowWizardOpen) {
      console.log(`Restarting Template Wizard...`);
      document.querySelector(`#${this.windowID}`).remove();
      new WindowWizard(this.name, this.version, this.schemaVersionBleedingEdge, this.templateManager).buildWindow();
    }
  }
}
