<table>
  <tr>
    <td><a href="#contributing">Contributing</a></td>
    <td valign="top" rowspan="99"><a href="https://discord.gg/tpeBPy46hf"><img alt="Discord Banner" src="https://discord.com/api/guilds/796124137042608188/widget.png?style=banner4"></a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#summary">Summary</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#why-follow-guidelines">Why Follow Guidelines?</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#what-can-i-contribute">What Can I Contribute?</a></td>
  </tr>
  <tr>
    <td>&emsp;&emsp;<a href="#programming">Programming</a></td>
  </tr>
  <tr>
    <td>&emsp;&emsp;<a href="#translation">Translation</a></td>
  </tr>
  <tr>
    <td>&emsp;&emsp;<a href="#everything-else">Everything Else</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#what-can-i-not-do">What Can I Not Do?</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#guidelines">Guidelines</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#our-mission">Our Mission</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#how-to-contribute">How to Contribute</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#production-enviroment">Production Enviroment</a></td>
  </tr>
  <tr>
    <td>&emsp;&emsp;<a href="#npm-run">Npm Run</a></td>
  </tr>
  <tr>
    <td>&emsp;&emsp;<a href="#charts">Charts</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#development-environment">Development Environment</a></td>
  </tr>
</table>

<h1>Contributing</h1>
<a href="https://github.com/SwingTheVine/Wplace-BlueMarble/blob/main/LICENSE.txt" target="_blank" rel="noopener noreferrer"><img alt="Software License: MPL-2.0" src="https://img.shields.io/badge/Software_License-MPL--2.0-slateblue?style=flat"></a>
<p>
  Thank you for wanting to contribute to the userscript "Blue Marble"! It means a lot to me that someone likes my project enough to want to help it grow. If you haven't already done so, consider joining our Discord. You can ask questions about the userscript there and receive feedback. You can also visit the <a href="https://bluemarble.lol/" target="_blank" rel="noopener noreferrer">official Blue Marble website</a> for more information.
  <br>
  <b>Note</b>: If you are using AI, and you want to tell the AI how the codebase files are related to each-other, go to the <code>Class diagram of relationships for Blue Marble</code> diagram in the chart section of this file. Copy the chart, and give it to the AI.
  <br>
  <b>Note</b>: If you are contributing to this project, make your fork from the latest release branch. The latest release branch number should be one MINOR version higher than the current. E.g. if the latest release is 1.2.3, you should fork <code>release/v1.3.0</code>. If you fork main, and make a PR from <code>main</code> -> <code>main</code> your PR might be rejected. This is because <code>main</code> is not up-to-date, and your changes might conflict with the bleeding-edge.
</p>

<h2>Summary</h2>
<p>
  <ul>
    <li>I don't want to waste your time, so double check with me before starting a big change like adding a new feature. For example, imagine you spend 50 hours making a bot that automatically places pixels, then your pull request was rejected because a bot that automatically places pixles does not align with the "Mission" of Blue Marble. That would be sad :(</li>
    <li>Follow the style of the project. E.g., if all overlays are made by calling <code>Overlay()</code>, and you want to make a new overlay, you should probably call <code>Overlay()</code> as well.</li>
    <li>Low quality code will be rejected. If I can't maintain the code, it will be rejected.</li>
    <li>Low quality Pull Requests will be rejected. Communicate with the reviewers, make changes to your Pull Request when asked, and take responsibility for the code until the PR is merged. If you make a PR and abandon the PR, it will be rejected.
    <li>You can find documentation for Blue Marble <a href="https://swingthevine.github.io/Wplace-BlueMarble/index.html" target="_blank" rel="noopener noreferrer">here</a>.</li>
    <li>Make your code <a href="https://en.wikipedia.org/wiki/Modular_programming" target="_blank" rel="noopener noreferrer">modular</a>. If you are adding a new feature, and it is feasable to stick your feature inside a new function, then use a new function. This will make your code conflict less with other people's code. Ideally, most features should be their own function.</li>
  </ul>
</p>

<h2>Why Follow Guidelines?</h2>
<p>
  Following the guidelines on this page helps everyone. Writing code that follows the guidelines:
  <ul>
    <li>Helps me implement (and continue support for) your feature.</li>
    <li>You get your feature implemented.</li>
    <li>Everyone else gets a new supported feature.</li>
  </ul>
  It's a win-win-win scenario!
</p>

<h2>What Can I Contribute?</h2>
<h3>Programming</h3>
  <p>
    Most of the work to be done in this userscript is related to programming. It is helpful to have a background in programming, but not required. If you are looking to learn JavaScript and its syntax, check out this <a href="https://roadmap.sh/javascript" target="_blank" rel="noopener noreferrer">roadmap for learning JavaScript</a>. We strongly recommend that you understand functions, methods, classes, and Object-Oriented-Programming if you plan to implement a brand new feature. More technical knowledge like method chaining and lambda expressions are useful but not required. You can find the documentation for Blue Marble <a href="https://swingthevine.github.io/Wplace-BlueMarble/index.html" target="_blank" rel="noopener noreferrer">here</a>. Make your code modular whenever possible. In other words, you should "blackbox" your code by putting it in a function when possible. For example, if you are adding a color filter to remove colors from being displayed on the template, the function should pass in the template information and tile information, and output the filtered template/tile information. This way, other people's code can't interfere with the color filter. For example:
    <br>
    <ol>
      <li>The template image is generated and the tile information is retrieved.</li>
      <li>The template image and the tile information is passed into the color filter function. The color filter overrides the template image with the filtered colors, and outputs that as the template image.</li>
      <li>The modified template image and the tile information is passed into the pixel counter function, and it outputs the pixel count.</li>
      <li>The modified template image and the tile information is used to render the template.</li>
    </ol>
    In the example above, modifying the pixel count code will not modify the color filter. If a PR is made for the pixel count code, and another PR is made for the color filter, both PR's can be merged without conflicts.
  </p>
<h3>Translation</h3>
<p>
  While typically overlooked, translating is a powerful way to contribute to a project. If you can write, there is something you can contribute! From minor grammar mistakes, to translating an entire language, all help is appreciated.
</p>
<h3>Everything Else</h3>
  <p>
    Although userscripts are oriented around coding, there are many ways to contribute! From improving the README file, to making tutorials, you can contribute in many ways that don't require programming skills. For example, if you have an idea for a feature, but you don't have the skills to implement it, submit a feature request! Someone might see it, think it is cool, and implement it.
  </p>

<h2>What Can I Not Do?</h2>
<p>
  Please do not use <a href="https://github.com/SwingTheVine/Wplace-BlueMarble/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a> for asking support questions (e.g. "How do I install this?" or "What does <code>cssMangler</code> do?"). We use the GitHub issue tracker for bug reports and feature requests. If you are having trouble and need help, ask on our <a href="https://discord.gg/tpeBPy46hf" target="_blank" rel="noopener noreferrer">Discord</a>. <b>However, you <i>should</i> make a feature request on our issue tracker before starting work on your contribution.</b> Nothing sucks more than working hard on a high-quality contribution just for it to be rejected because it does not align with the mission of the mod. Ask first!
</p>
<p>
  Please contribute in good faith. We will reject pull requests with bad code, comments, or pull requests that damage the mod. 
</p>

<h2>Guidelines</h2>
<ul>
  <li>Always submit a <a href="https://github.com/SwingTheVine/Wplace-BlueMarble/issues/new/choose" target="_blank" rel="noopener noreferrer">feature request</a> and receive authorization to work on your contribution <i>before</i> you start working on your contribution. This will save you time if we end up rejecting the contribution. Small contributions (like fixing spelling errors) don't need a feature request.</li>
  <li>Follow the <a href="https://github.com/SwingTheVine/.github/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noopener noreferrer">Code of Conduct</a>. This includes both your contributions and the way you interact with this community.</li>
  <li>Always write a clear message that explains the changes. "Added some things" does <i>not</i> explain what was changed.</li>
  <li>Different feature, different pull request. If you submit a pull request for templates and localization (i18n) together, and we want to reject the localization, your template code is rejected along with the localization since they are the same pull request. They should be separate pull requests since they are separate features.</li>
  <li>The file structure must be maintained (unless you were authorized to change it). For example, all code should go in `src/` and all code affecting the overlay should go in the Overlay class file.</li>
  <li>The naming structure must be maintained (unless you were authorized to change it). For example, the template image variable could be called "templateDataImage." Most things are named to be grouped based on what they share in common first. In the previous example, the variable is first related to a "template," then "data" which is an "image." This is because the variable stores an image that comes from the data of a template. The main reason for naming things this way is to aid you when you try to find the name of something. "I need the image of a template, so the variable probably starts with 'template'".</li>
  <li>Your code must be commented, explaining what everything does. We may reject the pull request if we can't understand what the code does.</li>
</ul>

<h2>Our Mission</h2>
<p>
  Our "mission" makes up the essence of this userscipt. Without it, this project would not exist. 
</p>
<p>
  The mission of this userscript is to provide a well-documented, high-quality, open-source template overlay.
</p>
<p>
  <ul>
    <li>We recognize that most pixel canvas overlays do not have high-quality open-source code. Either the overlay is high-quality & close-sourced, or the overlay is low-quality & open-sourced. This userscript strives to fix that.</li>
    <li>We recognize that most pixel canvas overlay userscripts are obfuscated. While it is possible to modify them, it is unnecessarily challenging. This userscript hopes to change the precedence by being unobfuscated.</li>
    <li>We recognize that most pixel canvas overlay userscripts do not have enough documentation to allow their community to modify (or understand) the inner workings of the overlay. This userscript strives to be as beginner-friendly as possible.</li>
  </ul>
</p>

<h2>How To Contribute</h2>
<p>
  <ol>
    <li>Read all of the <a href="https://github.com/SwingTheVine/Wplace-BlueMarble/blob/main/docs/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">contributing guidelines</a>.</li>
    <li>If you would like to contribute, submit a request <a href="https://github.com/SwingTheVine/Wplace-BlueMarble/issues/new/choose" target="_blank" rel="noopener noreferrer">here</a>.</li>
    <li>If you have received authorization to start working on your contribution, set up the development environment on your device.</li>
    <li>Fork the project.</li>
    <li>Download your fork to the development environment.</li>
    <li>If applicable, it might be useful to learn how a (already in the userscript) feature similar to your contribution works. For example, if you want to add a new popup window, it might be benifical to learn how the <code>Overlay</code> popup window works.</li>
    <li>Make your contribution.</li>
    <li>Commit to your fork.</li>
    <li>Submit a pull request between your fork and this project.</li>
  </ol>
</p>

<h2>Production Enviroment</h2>
<p>
  Here lies information that may be of interest to those who wish to modify Blue Marble.

  <h3>Npm Run</h3>
  <p>
    Running <code>npm run build</code> will compile Blue Marble. The compiled files can be found in the <code>dist/</code> directory. Running <code>npm run patch</code> will increment the patch version, and compile Blue Marble.
  </p>

  <h3>Charts</h3>
  <p>
    Use the arrow and zoom buttons to navigate the charts. Use the ↔️ button to go fullscreen. Use the 🔄 button to reset. All buttons can be found on the chart. Use the "two squares" icon to copy the chart. If you need assistance reading the chart, copy the chart into an AI using the "two squares" button on the chart.
  </p>
</p>

<!-- https://mermaid.js.org/syntax/classDiagram.html -->

Class diagram of relationships for Blue Marble:
(last updated 0.74.0)
```mermaid
---
  config:
    class:
      hideEmptyMembersBox: true
---
classDiagram
  class main {
    name : string
    version : string
    +inject()
    +observeBlack()
    +buildOverlayMain()
  }
  class utils {
    +escapeHTML()
    +serverTPtoDisplayTP()
    +negativeSafeModulo()
    +consoleLog()
    +consoleError()
    +consoleWarn()
    +numberToEncoded()
    +uint8ToBase64()
    +base64ToUint8()
  }
  class apiManager {
    coordsTilePixel : number[4]
    +spontaneousResponseListener()
  }
  class templateManager {
    userID : number
    templatesShouldBeDrawn : boolean
    +createJSON()
    +createTemplate()
    -storeTemplates()
    +disableTemplate()
    +drawTemplateOnTile()
    +importJSON()
    +parseBlueMarble()
    +setTemplatesShouldBeDrawn()
  }
  class Template {
    +createTemplateTiles()
  }
  class Overlay {
    +setApiManager()
    -createElement()
    +add...()
    +buildElement()
    +buildOverlay()
    +updateInnerHTML()
    +handleDrag()
    +handleDisplayStatus()
    +handleDisplayError()
  }

  main o-- apiManager : creates
  main o-- utils : creates
  main o-- Overlay : creates main, tabTemplate
  main o-- templateManager : creates
  apiManager ..> templateManager : calls drawTemplateOnTiles(), sets userID
  apiManager ..> utils : calls escapeHTML(), numberToEncoded(), serverTPtoDisplayTP()
  Overlay ..> apiManager : uses coordsTilePixel
  Overlay ..> templateManager : calls setTemplatesShouldBeDrawn()
  templateManager *-- Template : manages
  templateManager ..> utils : calls base64ToUint8(), numberToEncoded()
  Template ..> utils : calls uint8ToBase64()
```

Class diagram of relationships for Blue Marble's compiler/builder:
(last updated 0.74.0)
```mermaid
---
  config:
    class:
      hideEmptyMembersBox: true
---
classDiagram

  namespace npm_run_patch {
    class `patch.js` {
    }

    class `docs/README.md` {
    }
  }

  namespace npm_run_build {
    class `build.js` {
      mapCSS : JSON Object
    }

    class `cssMangler.js` {
      importMap : JSON Object
      returnMap : JSON Object
      +mangleSelectors()
      +escapeRegex()
      +numberToEncoded()
    }

    class `update-version.js` {
    }

    class `utils.js` {
      +consoleStyle()
    }

    class esbuild {
      +build()
    }

    class terser {
      +minify()
    }

    class `dist/BlueMarble.user.js` {
    }

    class `dist/BlueMarble.user.css` {
    }

    class `dist/BlueMarble.user.css.map.json` {
    }

    class `src/BlueMarble.meta.js` {
    }

    class `src/main.js` {
    }

    class `package.json` {
    }
  }

  note for `patch.js` "calls npm_run_build"
  `build.js` ..> terser : requires
  `build.js` ..> `utils.js` : calls consoleStyle()
  `build.js` ..> `update-version.js` : executes
  `build.js` ..> `src/BlueMarble.meta.js` : reads
  `build.js` ..> esbuild : calls build()
  `build.js` ..> `dist/BlueMarble.user.css` : writes
  esbuild ..> `src/main.js` : reads
  `build.js` ..> `dist/BlueMarble.user.js` : writes
  terser ..> `dist/BlueMarble.user.js` : reads & writes
  `build.js` ..> `cssMangler.js` : calls manglerSelectors()
  `cssMangler.js` ..> `dist/BlueMarble.user.css.map.json` : reads
  `cssMangler.js` ..> `dist/BlueMarble.user.js` : reads & writes
  `cssMangler.js` ..> `dist/BlueMarble.user.css` : reads & writes
  `build.js` <.. `cssMangler.js` : returns mapCSS
  `build.js` ..> `dist/BlueMarble.user.css.map.json` : writes mapCSS
  `patch.js` ..> `docs/README.md` : reads & writes
  `patch.js` ..> `utils.js` : calls consoleStyle()
  `update-version.js` ..> `package.json` : reads
  `update-version.js` ..> `src/BlueMarble.meta.js` : reads & writes
  `update-version.js` ..> `utils.js` : calls consoleStyle()
```

<h2>Development Environment</h2>
<p>
  This is what SwingTheVine uses to program Blue Marble. You don't have to use the exact same thing. This is provided for reference.

  <h3>IDE</h3>
  Visual Studio Code<br>
  <code>Version: 1.109.0</code><br>

  <h3>Browser</h3>
  Google Chrome<br>
  Version: <code>144.0.7559.133 (Official Build) (64-bit)</code><br>
  TamperMonkey Version: <code>5.4.1</code>

  <h3>Operating System</h3>
  Windows 11 Home<br>
  Version: <code>25H2</code><br>
  OS Build:	<code>26200.7705</code><br>
  Processor: <code>Intel Core i7-9750H CPU @ 2.60GHz</code><br>
  RAM: <code>16.0 GB</code><br>
  Storage: <code>932 GB SSD Samsung SSD 970 EVO Plus 1TB, 238 GB SSD HFM256GDJTNG-8310A</code><br>
  Graphics Card: <code>NVIDIA GeForce GTX 1660 Ti (6 GB)</code><br>
  System Type: <code>64-bit operating system</code>
</p>
