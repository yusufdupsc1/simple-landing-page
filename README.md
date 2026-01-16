# School Management Demo (HTML/CSS/JS)

Hand-written static site oriented around a school management system demo. Everything is plain HTML, CSS, and vanilla JS—no build tools required. The goal is to communicate thoughtful UX, realistic data, and the kinds of operational workflows a district-level team actually needs to see.

## Project Layout
- `index.html` — base markup and navigation
- `css/style.css` — page styling and layout
- `js/script.js` — DOM helpers for dates, announcements, progress indicators, and table filtering

## Engineering Narrative (what a recruiter should see)
This project was intentionally built without frameworks so every section, style, and interaction was hand-authored. The objective was to demonstrate front-end craft and full‑stack product thinking in a minimal environment while still addressing realistic operational needs.

### Realistic challenges & how they were addressed
1. **Information density vs. clarity**
   - **Challenge:** School operations dashboards have a lot of information. It is easy to overwhelm the user or bury the most important signal.
   - **Approach:** I created a strong hierarchy (banner → hero → cards → data table) and grouped related actions into discrete cards. I also used restrained color and consistent spacing to prevent visual noise.

2. **Designing for multiple roles**
   - **Challenge:** District leaders, principals, and ops teams need different slices of the same data.
   - **Approach:** I wrote copy and data labels that are role‑agnostic but actionable (e.g., staffing coverage, budget utilization, priority queue). The layout supports scanning at multiple depth levels: quick signal cards, then deeper tables and lists.

3. **Interactivity without a framework**
   - **Challenge:** Provide a “live system” feel without a build pipeline.
   - **Approach:** I used small, focused vanilla JS helpers for dates, announcements, progress indicators, and roster filtering. The logic is explicit and readable to show intentional engineering choices rather than relying on hidden abstractions.

4. **Responsive behavior**
   - **Challenge:** Ensure the UI still reads cleanly when the navigation collapses or cards stack.
   - **Approach:** I built the layout using CSS Grid/Flex with flexible min‑widths, and added a breakpoint to collapse navigation links while keeping actions visible.

5. **Credible demo data**
   - **Challenge:** Placeholder text looks fake and undermines credibility.
   - **Approach:** I authored realistic operational metrics, dates, and copy so the page reads like a true internal tool, not a marketing-only landing page.

## Changelog (keep extending from here)
- 2025-11-29 `d888e16` — initial landing page scaffold with HTML and CSS layout/styling.
- 2025-11-29 `3b90d78` — added neon glass landing visuals.
- 2025-11-30 `5a05e70` — revamped neon landing page styling and structure.
- 2025-12-01 `e2b42cd` — DOM cleanup adjustments.
- 2025-12-02 `9159323` — refactored content toward a school management system demo; simplified styles and JS banner/footer helpers.
- 2025-12-03 `cc88f48` — expanded the landing page into a staff-level operations workspace with richer layout, data cards, and interactivity.
- 2025-12-03 `HEAD` — documented the engineering narrative and real-world challenges to showcase intentional hand-built design decisions.

To log future work: append new entries below with the date, commit hash, and a one-line summary of the change.
