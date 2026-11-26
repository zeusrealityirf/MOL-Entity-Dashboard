# MOL Entity Dashboard

**Ministry of Labour | Entity Monitoring & Statistical Analysis**

[![Live Dashboard](https://img.shields.io/badge/Live_Dashboard-View_Website-8B0000?style=for-the-badge)](https://zeusrealityirf.github.io/MOL-Entity-Dashboard/)

---

## Overview

The **MOL Entity Dashboard** is a centralised monitoring and statistical analysis platform designed to provide comprehensive insights into the operational activity and performance of licensed entities under the Ministry of Labour (MOL).

The dashboard presents entity records, event statistics, activity classifications, and performance indicators through an organised and accessible interface.

Its primary objective is to support transparency, oversight, and informed decision-making by providing a clear overview of entity operations and engagement.

## Key Features

### Entity Activity Monitoring

The dashboard provides an overview of licensed entities and their current activity classifications.

- Active and inactive entity identification
- Entity ownership and classification records
- Activity monitoring based on recorded events
- Identification of prolonged inactivity
- Entity-specific performance statistics

### Statistical Analytics

A range of statistical indicators provides insight into overall entity performance.

- Total recorded events
- Weekly event activity
- Event distribution and trends
- Average participation statistics
- Comparative performance indicators

### Performance Tracking

The dashboard allows activity patterns and operational performance to be assessed across licensed entities.

- Weekly activity summaries
- Entity participation monitoring
- Event-hosting statistics
- Inactivity indicators
- Historical activity comparisons

### Data Visualisation

Interactive charts and organised statistical panels provide a clear representation of entity activity and engagement.

The visual interface allows users to interpret operational data efficiently and identify trends across the Ministry's registered entities.

## Running and verifying the dashboard

Use Node 22 or newer. Run `npm ci`, then `npm run dev`. Development startup and production builds generate a fresh reporting snapshot. Run `npm run lint`, `npm test`, and `npm run build` before release. Use `npm run preview` to inspect the built site. To update data during a development session, run `npm run snapshot`.

The Pages workflow rebuilds on pushes to main, manual dispatch, and a 15-minute schedule. A failed build leaves the previous deployment available. Browsers check the deployed snapshot every two minutes. Its generation time is visible in UTC. GitHub can delay scheduled runs.

### Reporting data and access

The build reads the two CSVs and writes a generated `public/report.json`. Only the snapshot ships with Pages. It contains dated events (time, host, event type, matched entity ID and attendance count), registry details, quality counts and the ten highest-ranked named attendees. Original attendee lists, proof links and leave fields are excluded. Source sheet permissions are independent of this publication. For restricted source records, point `EVENTS_CSV_URL` and `ENTITIES_CSV_URL` in the build environment at dedicated reporting feeds and manage access to the originals separately.

Sheet timestamps are interpreted as UTC. Registry status uses rolling 7-, 14- and 30-day windows. Reporting periods use inclusive UTC calendar dates. Unknown attendance is excluded from averages; explicit zero and numeric headcounts are included. Named attendance is deduplicated case-insensitively per event. The all-time named-attendee leaderboard omits numeric-only and unknown attendance. Historical events without a unique registry match still count in global analytics. The current event feed supplies names, so matching uses exact normalized names; overlapping names never receive automatic substring credit.

## Activity Classifications

Entities are categorised according to their recorded activity levels.

| Classification | Description |
|---|---|
| Active | Entities demonstrating recent recorded activity |
| Early Inactivity | Entities showing initial signs of reduced activity |
| Severe Inactivity | Entities experiencing prolonged periods of inactivity |
| Inactive | Entities classified as inactive under the dashboard's monitoring criteria |

These classifications assist with identifying activity trends and areas that may require additional attention.

## Dashboard Objectives

The MOL Entity Dashboard aims to:

1. Provide a centralised overview of licensed entity operations.
2. Improve visibility of activity and engagement trends.
3. Support statistical reporting and performance assessment.
4. Facilitate the identification of inactive entities.
5. Present operational information through a clear, structured interface.

## Live Dashboard

**Access the dashboard:**

https://zeusrealityirf.github.io/MOL-Entity-Dashboard/

## Credits & Acknowledgements

**Dashboard Repository:** [zeusrealityirf](https://github.com/zeusrealityirf)

**Original Development:** [President1327](https://github.com/president1327irf/MOL-Entity-Dashboard2)

Acknowledgement is given to the original developer for the foundational dashboard implementation.

## Disclaimer

The information displayed within the dashboard is dependent on the accuracy, completeness, and availability of its underlying records.

Statistics and activity classifications are intended to support monitoring and analysis and should be interpreted in conjunction with relevant administrative records.

---

**Ministry of Labour**

*Entity Oversight • Statistical Monitoring • Operational Transparency*
