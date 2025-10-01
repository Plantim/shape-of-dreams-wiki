# Shape of Dreams - Fan-Made Database & Wiki

[![Website](https://img.shields.io/badge/Website-online-brightgreen.svg)](https://plantim.github.io/shape-of-dreams-wiki/)

Welcome to the repository for the Shape of Dreams database project. This fan-made website aims to provide a clean, fast, and user-friendly interface to browse, filter, and search for the various Memories and Essences found in the game.

### ► Live Demo

The site is hosted on GitHub Pages and is publicly available at:

**[https://plantim.github.io/shape-of-dreams-wiki/](https://plantim.github.io/shape-of-dreams-wiki/)**

---

## ✨ Features

* **Comprehensive Databases:** Browse through all in-game Memories and Essences.
* **Multi-language Support:** The website is available in multiple languages, using official in-game data.
* **Advanced Filtering:** Filter items by:
    * Rarity (Common, Rare, Epic, etc.)
    * Element (Fire, Cold, Light, Dark)
    * Specific tags
    * Stat Type (AP / AD)
    * Character (for Memories)
* **Instant Search:** Find any item by its name (in your selected language or in English) or by its description.
* **Dynamic Stat Calculation:** Skill values automatically scale based on the level or quality percentage selected via the slider.

---

## 🛠️ Tech Stack

This is a static website built with performance and simplicity in mind.
* **HTML5**
* **CSS3** with **Tailwind CSS** and the **DaisyUI** component framework.
* **Vanilla JavaScript (ES6+)**: No frameworks, just pure JavaScript to handle the data fetching, filtering, and dynamic rendering logic.

---

## 📂 Project Structure

The project is organized with a clean and scalable structure to facilitate maintenance and future updates.

```
.
|-- index.html, essences.html, memories.html  # The site's pages
|
|-- assets/                   # Contains all static assets
|   |-- css/                  # Stylesheets
|   |-- js/                   # JavaScript logic for each page
|   |-- data/                 # All JSON game data
|   |   |-- locales/          # Language-specific data (memories, achievements...)
|   |   `-- ...
|   |-- game/                 # Assets extracted from the game
|   |   |-- images/
|   |   `-- sprites/
|   `-- ui/                   # Site-specific UI elements (favicons...)
|
|-- scripts/
|   `-- update_version.py     # Python utility script to bump file versions
|
`-- README.md                 # This file
```

---

## 💬 Feedback & Bug Reports

For any questions, suggestions, or bug reports, please feel free to contact me on Discord.

* **Discord:** `Plantim`

---

## 🙏 Credits and Acknowledgements

* **Game Developers:** All game data, images, and sprites are the property of **Lizard Smoothie**, the developers of **Shape of Dreams**. This is an unofficial, fan-made project created for the community, by [Plantim](https://github.com/Plantim).
* **Community:** Thank you to the player community for their invaluable feedback and suggestions.