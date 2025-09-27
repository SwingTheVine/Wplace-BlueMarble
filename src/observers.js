/** This class contains all MutationObservers used (which is 1 probably).
 * This is not an object, but rather a "collection" of functions (in a class).
 * @class Observers
 * @since 0.43.2
 */
export default class Observers {

  /** The constructor for the observer class
   * @since 0.43.2
   */
  constructor() {
    this.observerBody = null;
    this.observerBodyTarget = null;
    this.targetDisplayCoords = '#bm-display-coords';
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

          if (!(node instanceof HTMLElement)) {continue;} // Does not track non-HTMLElements
          
          if (node.matches?.(this.targetDisplayCoords)) {

          }
        }
      }
    })

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
  observe(observer, watchChildList=false, watchSubtree=false) {
    observer.observe(this.observerBodyTarget, {
      childList: watchChildList,
      subtree: watchSubtree
    });
  }
}