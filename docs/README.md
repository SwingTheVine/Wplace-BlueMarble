<table>
  <tr>
    <td><a href="#blue-marble">Blue Marble</a></td>
    <td valign="top" rowspan="99"><a href="https://discord.gg/tpeBPy46hf"><img alt="Discord Banner" src="https://discord.com/api/guilds/796124137042608188/widget.png?style=banner4"></a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#overview">Overview</a></td>
  </tr>
  <tr>
    <td>&emsp;&emsp;<a href="#script-settings">Script Settings</a></td>
  </tr>
  <tr>
    <td>&emsp;&emsp;<a href="#template-settings">Template Settings</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#how-versioning-works">How Versioning Works</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#licenses">Licenses</a></td>
  </tr>
  <tr>
    <td>&emsp;<a href="#faq">FAQ</a></td>
  </tr>
  <tr>
    <td>&emsp;&emsp;<a href="#how-do-i-hide-the-overlay">How do I hide the overlay?</a></td>
  </tr>
  <tr>
    <td>&emsp;&emsp;<a href="#why-do-game-notifications-appear-on-top-of-the-overlay">Why do game notifications appear on top of the overlay?</a></td>
  </tr>
</table>

<h1>Blue Marble</h1>
<a href="" target="_blank"><img alt="Latest Version" src="https://img.shields.io/badge/Latest_Version-0.68.0-lightblue?style=flat"></a>
<a href="https://github.com/SwingTheVine/Wplace-BlueMarble/releases" target="_blank"><img alt="Latest Release" src="https://img.shields.io/github/v/release/SwingTheVine/Wplace-BlueMarble?sort=semver&style=flat&label=Latest%20Release&color=blue"></a>
<a href="https://github.com/SwingTheVine/Wplace-BlueMarble/blob/main/LICENSE.txt" target="_blank"><img alt="Software License: MPL-2.0" src="https://img.shields.io/badge/Software_License-MPL--2.0-slateblue?style=flat"></a>
<a href="https://discord.gg/tpeBPy46hf" target="_blank"><img alt="Contact Me" src="https://img.shields.io/badge/Contact_Me-gray?style=flat&logo=Discord&logoColor=white&logoSize=auto&labelColor=cornflowerblue"></a>
<a href="" target="_blank"><img alt="WakaTime" src="https://img.shields.io/badge/Coding_Time-87hrs_0mins-blue?style=flat&logo=wakatime&logoColor=black&logoSize=auto&labelColor=white"></a>
<a href="" target="_blank"><img alt="Total Patches" src="https://img.shields.io/badge/Total_Patches-450-black?style=flat"></a>
<a href="" target="_blank"><img alt="Total Lines of Code" src="https://tokei.rs/b1/github/SwingTheVine/Wplace-BlueMarble?category=code"></a>
<a href="" target="_blank"><img alt="Total Comments" src="https://tokei.rs/b1/github/SwingTheVine/Wplace-BlueMarble?category=comments"></a>
<a href="" target="_blank"><img alt="Compression" src="https://img.shields.io/badge/Compression-73.04%25-blue"></a>
<a href="" target="_blank"><img alt="Build" src="https://github.com/SwingTheVine/Wplace-BlueMarble/actions/workflows/build.yml/badge.svg"></a>
<a href="" target="_blank"><img alt="CodeQL" src="https://github.com/SwingTheVine/Wplace-BlueMarble/actions/workflows/github-code-scanning/codeql/badge.svg"></a>

<h2>Overview</h2>
<p>
  Welcome to Blue Marble! Blue Marble is a userscript for the website <a href="https://wplace.live/" target="_blank">wplace.live</a>. If you like this userscript, please ⭐ the repository!

  <h3>Installation Instructions</h3>
  <a href="" target="_blank"><img alt="Supported Browsers" src="https://img.shields.io/badge/Supported%20Browsers-Chrome%20%7C%20Some%20Firefox%20%7C%20Safari%20%7C%20Edge-orange?style=flat"></a>
  <a href="" target="_blank"><img alt="Unupported Browsers" src="https://img.shields.io/badge/Unsupported%20Browsers-Brave%20%7C%20Some%20FireFox%20%7C%20Kiwi-red?style=flat"></a>
  <p>
    Blue Marble has been verified to work on mobile devices. Blue Marble was designed on Chrome, but Blue Marble might work on "unsupported" browsers not listed above.
    <br>
    Here is how you install the Blue Marble userscript:
    <ol>
      <li>Install <a href="https://www.tampermonkey.net/index.php" target="_blank">TamperMonkey</a>.</li>
      <li>Enable Developer Mode & Userscripts (on Chrome).</li>
      <li>Download the <a href="https://github.com/SwingTheVine/Wplace-BlueMarble/releases" target="_blank">BlueMarble.user.js</a> file.</li>
      <li>Put the <code>BlueMarble.user.js</code> file inside the dashboard of TamperMonkey.</li>
      <li>Enable BlueMarble inside TamperMonkey</li>
    </ol>
  </p>

  <h3>Script Settings</h3>
  <p>
    There are many settings available for the Blue Marble userscript! Through these settings, you can control how the script behaves.
    <h4>Stealth Mode</h4>
    <a href="" target="_blank"><img alt="Default: Enabled" src="https://img.shields.io/badge/Default-Enabled-lightgreen?style=flat"></a>
    <p>
      Stealth Mode, when enabled, requires the game to make a request to the server instead of Blue Marble making its own requests. However, this means Blue Marble will wait indefinitely until the request is made. <b>This should be used with Possessed Mode</b> so Blue Marble can "suggest" the game make certain requests instead of waiting for the requests to naturally occur.
    </p>
    <h4>Possessed Mode</h4>
    <a href="" target="_blank"><img alt="Default: Enabled" src="https://img.shields.io/badge/Default-Enabled-lightgreen?style=flat"></a>
    <p>
      In Possessed Mode, Blue Marble will prioritize controling the game over directly interacting with the server. For example, assume a situation where Blue Marble is trying to place a pixel. However, the tile is not loaded. Typically, Blue Marble would make a request to the server to fetch the tile. When <b>Possessed Mode</b> is enabled, Blue Marble will teleport the game to the tile, which causes the game to fetch the tile. The difference lies in <i>who</i> sends the request to the server. When <b>Stealth Mode</b> and <b>Possessed Mode</b> are both enabled, it is harder to detect the userscript since most actions are made through the game, not the userscript.
    </p>
  </p>

  <h3>Template Settings</h3>
  <p>
    <h4>Transparent Pixels</h4>
    <p>
      Templates for Blue Marble work slightly different from normal. Since there is a "Transparent" color, and transparent pixels in templates are typically ignored, your template should have a custom color to signify "Transparent" colored pixels. If a specific pixel can be any color, it should be transparent in the template. If a specific pixel should be "Transparent" color, it should have the <code>#deface</code> hex color. Any <code>#deface</code> colored pixel in your template will be interpereted as the "Transparent" color. Any transparent colored pixel in your template will be interpereted as ignored.
    </p>
    <h4>Coordinates</h4>
    <p>
      The coordinate system for wplace.live is unique. Instead of all pixels having a global coordinate number (x, y), the coordinate number is relative to the tile. This means you need to know the tile number and the coordinate number to do anything.
      <br>
      The template is aligned from the top left corner. You can auto-fill this position using the "pin" icon next to the coordinate input boxes.
    </p>
  </p>
</p>

<h2>How Versioning Works</h2>
<p>
  The versioning system for this userscript follows the <a href="https://semver.org/" target="_blank">Semantic Versioning rules</a>. As such, it is formatted in an <code>X.Y.Z</code> format where:
  <ul>
    <li>X is the major version. This is incremented when a non-backward compatible update is pushed. This is for new features that break previous versions of the userscript. Additionally, if wplace.live breaks the userscript, this will be incremented.</li>
    <li>Y is the minor version. This is incremented whenever I push to GitHub. This is for stable bug-fixes and new (non-breaking) features.</li>
    <li>Z is the patch version. This is incremented whenever I launch a development version of the userscript to test a patch. This is for unstable bug-fixes/features.</li>
  </ul>
</p>

<h2>Licenses</h2>
<p>
  (Below, all mentions of the "userscript" refer to the "Blue Marble" userscript made by SwingTheVine) <br>
  Most of this userscript is licensed under the <code>Mozilla Public License Version 2.0</code> (MPL-2.0). All software, code, and libraries in this repository are licensed under the MPL-2.0 license. However, the "Blue Marble" image in this userscript is owned by NASA and is licensed under the <code>Creative Commons 0 1.0 Universal</code> (CC0 1.0) license.
</p>

<h2>FAQ</h2>
<p>
  <h3>How do I hide the overlay?</h3>
  <p><b>A:</b> Turn the userscript off and refresh the page.</p>

  <h3>Why do game notifications appear on top of the overlay?</h3>
  <p><b>A:</b> Game notifications only appear when they need immediate attention. Therefore, they have priority over the overlay (which typically needs no attention).</p>
</p>