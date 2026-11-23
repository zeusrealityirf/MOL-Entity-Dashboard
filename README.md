# MOL Entity Dashboard

**Ministry of Labour | Entity Activity & Statistical Monitoring**

[![Live Dashboard](https://img.shields.io/badge/Live_Dashboard-View_Website-8B0000?style=for-the-badge)](https://zeusrealityirf.github.io/MOL-Entity-Dashboard/)

## Overview

The **MOL Entity Dashboard** is a web-based statistical monitoring platform designed to provide an overview of licensed entity activity, event participation and operational performance within the Ministry of Labour (MOL).

The dashboard consolidates information from Google Sheets into a centralised interface, allowing users to monitor activity levels, identify inactive entities and assess overall performance through interactive charts and statistics.

The application is built using React and Vite and is hosted through GitHub Pages.

## Features

### Entity Monitoring
- View registered and licensed entities.
- Monitor entity ownership, classifications and activity.
- Track the time elapsed since an entity's most recent event.
- Identify active, inactive and declining entities.
- Search entities by name or owner.
- Filter entities by classification.

### Event Statistics
- Monitor total recorded events.
- Track event activity over the previous seven days.
- Visualise event distribution and historical trends.
- Analyse event categories and participation.
- Compare current and previous activity periods.

### Performance Analytics
- View weekly entity activity.
- Track event-hosting statistics.
- Display weekly host and entity leaderboards.
- Monitor participation and attendance records.
- Identify inactivity through automatically calculated status indicators.

### Automatic Data Synchronisation
The dashboard retrieves information from configured Google Sheets CSV endpoints.

Data is automatically refreshed approximately every **120 seconds**, allowing the displayed statistics to reflect updates to the underlying records.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development and production builds |
| JavaScript | Application logic and calculations |
| Tailwind CSS | Styling and responsive layout |
| Recharts | Statistical charts and visualisations |
| Google Sheets | External data source |
| GitHub Actions | Automated deployment |
| GitHub Pages | Website hosting |

## Installation

To run the dashboard locally, ensure that Node.js and npm are installed.

**1. Clone the repository**

`git clone https://github.com/zeusrealityirf/MOL-Entity-Dashboard.git`

**2. Navigate to the project**

`cd MOL-Entity-Dashboard`

**3. Install dependencies**

`npm install`

**4. Start the development server**

`npm run dev`

Open the local URL displayed in your terminal, typically `http://localhost:5173/`.

## Project Structure

- `public/` — Logos, images and static assets.
- `src/` — React application code and styling.
- `src/App.jsx` — Main dashboard, data processing and visualisations.
- `index.html` — Application HTML entry point.
- `package.json` — Dependencies and project scripts.
- `vite.config.js` — Vite configuration and base URL.
- `.github/workflows/deploy.yml` — Automated GitHub Pages deployment.

## Data Sources

The dashboard retrieves entity registration and event logging records from external Google Sheets.

The data processing system converts CSV records into structured information for display within the dashboard.

Data source URLs are configured in `src/App.jsx` using:

- `EVENTS_TAB_URL` — Event logging records.
- `ENTITY_TAB_URL` — Licensed entity records.

To use a different dataset, update these endpoints and ensure that the new data follows the expected column structure.

**Note:** The dashboard depends on access to its configured Google Sheets. If those sources become unavailable or their structure changes, data loading and statistical calculations may be affected.

## Deployment

The dashboard is deployed using GitHub Actions and GitHub Pages.

Changes committed to the `main` branch trigger the deployment workflow, which:

1. Installs the required dependencies.
2. Builds the React application.
3. Generates the production files.
4. Uploads the compiled website.
5. Publishes the website through GitHub Pages.

**Live website:** https://zeusrealityirf.github.io/MOL-Entity-Dashboard/

## Customisation

The dashboard can be customised by modifying the React components, styling and supporting assets.

Possible modifications include:

- Updating ministry and organisational branding.
- Replacing logos and images.
- Adjusting dashboard colours and layouts.
- Adding new statistical metrics and charts.
- Connecting alternative data sources.
- Expanding entity monitoring functionality.

When changing the repository name, ensure that the Vite `base` configuration matches the GitHub Pages repository path.

## Credits & Acknowledgements

**Current repository and adaptations:** [zeusrealityirf](https://github.com/zeusrealityirf)

**Original project:** [President1327](https://github.com/president1327irf/MOL-Entity-Dashboard2)

Credit is retained for President1327, identified in the original project documentation as a Senior Labour Officer and former second-in-command of LAB.

## Disclaimer

This dashboard is a statistical monitoring and visualisation tool. The accuracy of its displayed information depends on the quality, completeness and availability of its source data.

The project should not be treated as an independent, authoritative source of official records.

## Licensing

No software licence is specified in this README. Reuse and redistribution of the original project's code and assets remain subject to the permissions of their respective rights holders.

---

**MOL Entity Dashboard — Entity Monitoring, Event Statistics & Performance Analytics.**
