# GEMINI.md

This file provides guidance to Gemini when working with the code in this repository.

## Project Overview

This project is a static marketing and informational website for VentusHub. It is built with HTML, CSS, and JavaScript, and utilizes the Bootstrap framework for responsive design.

### Core Technologies

- **HTML5**
- **CSS3** (with SASS for preprocessing)
- **JavaScript (ES6+)**
- **Bootstrap 5**: The primary CSS framework.
- **jQuery**: Used for DOM manipulation and various plugins.
- **Swiper.js**: For creating carousels and sliders.
- **AOS (Animate On Scroll)**: For scroll animations.
- **GSAP (GreenSock Animation Platform)**: For advanced animations.
- **SASS**: For CSS preprocessing.

## Project Structure

- **`/` (root)**: Contains the main HTML files for each page of the website (e.g., `index.html`, `contato.html`).
- **`/assets/css`**: Contains the compiled CSS files, including `bootstrap.min.css` and the main stylesheet `main.css`.
- **`/assets/js`**: Contains JavaScript libraries and the main script file `main.js`.
- **`/assets/images`**: Contains all image assets, organized into subdirectories for icons, logos, and backgrounds.
- **`/assets/sass`**: Contains the SASS source files for the project's stylesheets.
- **`/Documentation`**: Contains the documentation for the template used to build this website.

## Development Workflow

- To add a new page, create a new HTML file in the root directory, following the structure of the existing pages.
- To modify the website's styling, edit the SASS files in `/assets/sass` and then compile them to `/assets/css/main.css`.
- To add new JavaScript functionality, add the code to `/assets/js/main.js` or create a new file and link it in the HTML files.
- When adding new images, place them in the appropriate subdirectory within `/assets/images`.
