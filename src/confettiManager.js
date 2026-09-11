import { colorpalette } from "./utils";

/** Manages the confetti animation.
 * @description Manages any confetti animation used by Blue Marble.
 * @class ConfettiManager
 * @since 0.88.356
 */
export default class ConfettiManager {

  /** The constructor for the confetti manager.
   * @since 0.88.356
   */
  constructor() {

    // Shards of confetti to spawn
    this.confettiCount = Math.ceil((80 / 1300) * window.innerWidth);
    // Number of confetti is based on screen width

    this.colorPalette = colorpalette.slice(1); // Color palette for confetti
  }

  /** Immedently creates confetti inside the parent element.
   * @param {HTMLElement} parentElement - The parent element to create confetti inside of
   * @since 0.88.356
   */
  createConfetti(parentElement) {

    const confettiContainer = document.createElement('div'); // Creates confetti container

    // For each piece of confetti to spawn...
    for (let currentCount = 0; currentCount < this.confettiCount; currentCount++) {

      // Creates a new confetti shard
      const confettiShard = document.createElement('confetti-piece');

      // Randomly generates the variables that the CSS needs
      confettiShard.style.setProperty('--x', `${Math.random() * 100}vw`);
      confettiShard.style.setProperty('--delay', `${Math.random() * 2}s`);
      confettiShard.style.setProperty('--duration', `${3 + Math.random() * 3}s`);
      confettiShard.style.setProperty('--rot', `${Math.random() * 360}deg`);
      confettiShard.style.setProperty('--size', `${6 + Math.random() * 6}px`);
      confettiShard.style.backgroundColor = `rgb(${this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)].rgb.join(',')})`;

      // Deletes the confetti shard when the animation ends
      confettiShard.onanimationend = () => {
        if (confettiShard.parentNode.childElementCount <= 1) {
          confettiShard.parentNode.remove(); // Deletes the container instead if no confetti is left
        } else {
          confettiShard.remove(); // Removes the confetti shard
        }
      }

      confettiContainer.appendChild(confettiShard); // Adds the confetti shard to the container
    }

    // Adds the container to the parent element
    parentElement.appendChild(confettiContainer);
  }
}

// Creates a custom element called <confetti-piece>
class BlueMarbleConfettiPiece extends HTMLElement {}
customElements.define('confetti-piece', BlueMarbleConfettiPiece);
