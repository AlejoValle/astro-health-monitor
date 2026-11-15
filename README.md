# AstroVitals

Health self-monitoring for astronauts on long-duration missions, built for the NASA Space Apps Challenge 2026:
[Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

AstroVitals is a web app designed for a phone worn on the wrist. A crew member measures, sees at a glance how they are doing, and is told in plain language what to do next and when to contact the crew medical officer or the flight surgeon. It runs entirely on the device, so it keeps working when there is no link to Earth.

> AstroVitals is a self-care and triage guide. It does not diagnose and does not replace a flight surgeon. It has not been clinically validated.

## What it does

| Screen | What the crew member does |
| --- | --- |
| Home | Sees an overall status, the latest value of six indicators (heart rate, blood pressure, glucose, temperature, sleep and mood), the mission radiation dose and the five hazards at a glance |
| Hazards | Sees NASA's five hazards of spaceflight, how much each weighs at the current location, its status from the crew member's own data, and the tools that track it |
| Radiation | Logs the active dosimeter, sees the mission and career dose against NASA's 600 mSv limit, the expected dose rate at the location, and a solar storm protocol |
| Routine | Follows a morning, midday and evening routine that ticks itself off when a real measurement is logged, and earns points, rank, a streak and mission patches |
| Alerts | Sees early warnings found in their own history: streaks out of range, worsening trends, values heading out of range within a week, and combined patterns such as accumulated fatigue, sleep debt, early infection signs and exercise below target |
| Report | Writes a note and copies, shares or downloads a plain-text report for the flight surgeon with vitals, warnings, radiation, exercise and mind checks, always in English for the ground team |
| Body map | Taps a body system (brain, eyes, heart, immune, gut, bones, muscles) to see what it does, what space does to it, its status from the crew member's data, and filters by hazard |
| Measure | Reads heart rate from a Bluetooth sensor, or types any reading by hand, with instructions on how to take it |
| Symptoms | Taps the part of the body that feels wrong and answers yes/no questions to get a likely explanation, self-care steps and an escalation level |
| Mind | Rates mood, answers a four-question stress check and takes a reaction test |
| Exercise | Follows a daily plan that changes with the mission location, and logs the minutes done |
| Sounds | Plays one of six ambient sounds with a sleep timer |
| Trends | Sees each indicator over time against its OK range |
| Sources | Reads the full list of references and which parts are the app's own design choices |

The mission location is chosen in the header: Earth orbit, deep space transit, lunar surface or Mars surface. It changes the exercise plan and the wording about who to contact, because a crew in transit or on Mars cannot count on a real-time answer from the ground.

## How it works

- **Offline first.** There is no backend. Readings are stored in IndexedDB on the device, and a service worker caches the app so it opens with no connection after the first visit.
- **Explainable rules.** Each reading is rated OK, Watch or Act by deterministic rules in `src/lib/rules.ts`. Every result shows the sources behind it. No machine learning model is used to assess health.
- **Symptom tree as data.** The triage tree in `src/data/symptomTree.ts` has 5 body areas, 20 questions and 19 outcomes. A generic engine in `src/lib/triage.ts` walks it, and a test checks that every path ends in an outcome with a source.
- **Bluetooth with a manual fallback.** Heart rate uses the standard Bluetooth Heart Rate Service through Web Bluetooth. Manual entry is always available.
- **Sounds without audio files.** The six sounds are generated on the device with the Web Audio API.
- **Radiation from NASA numbers.** The expected dose rate per location and solar cycle comes from NASA's Moon to Mars radiation paper (ISS 0.2 to 0.5, deep space 0.6 to 1.3, lunar surface 0.4 to 0.9, Mars surface 0.35 to 0.65 mSv per day). The career and solar storm limits come from NASA-STD-3001. The total starts from the latest dosimeter reading, or from the mission start if there is none, and adds the expected rate since.
- **Five hazards as data.** `src/data/hazards.ts` maps each NASA hazard to the indicators, checks and screens that track it, and rates how much it weighs at each location. A hazard's status is the worst status among its trackers that have data.
- **A routine that cannot be faked.** `src/data/routine.ts` lists the daily and every-few-days tasks. `src/lib/routine.ts` credits each one from the records it needs (a reading, a check, a workout or a dosimeter log), so there are no checkboxes to tick without measuring. Points, a streak of full days, five crew ranks and eight mission patches are all computed from those records. On Mars the mission day is shown as a sol.
- **Reminders.** Home shows the next task due for the time of day. Optional browser notifications fire once per routine slot while the app is open or installed; there is no push server.
- **Motion with restraint.** A canvas starfield with orbit rings around the current body, a short warp jump between screens, staggered entrances and numbers that count up. All of it is off when the system asks for reduced motion.
- **Device preview.** In a desktop browser, a Web / Tablet / Phone switch shows the real app in a device frame, so judges can try the phone layout without a phone.
- **Early warnings as rules.** `src/lib/alerts.ts` looks at the last 14 days: a streak of 3 or more days out of range, the last 3 days against the days before, a least-squares projection that would leave the OK range within 7 days, and patterns where several signals each move part of the way in the same direction. Every warning says why it fired and what to do. A test checks the simulated mission always shows a fatigue pattern.
- **Report for the flight surgeon.** `src/lib/report.ts` builds the text; it works offline and is written in English whatever the app language, so a delayed message carries the whole picture.
- **Six languages.** English by default, plus Spanish, Russian, Chinese (Simplified), Japanese and French: the working languages of the ISS and Tiangong crews and of the main partner agencies. Pick one from the globe button in the header. Every string goes through `t()` with the English text as its key, and `src/i18n/catalog/` holds one row per string with all six languages side by side. A test fails if any string the app shows is missing a translation or a placeholder. The translations were made with AI help and have not been reviewed by medical translators; source titles stay in their original language.
- **Simulated demo data.** The app starts empty. "Load a simulated 14-day mission" on the Home screen fills it with simulated readings for a demo. They are labelled "Simulated data" wherever they appear.

## NASA resources used

- [5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) and [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/), NASA Human Research Program: mission locations and the structure of the symptom tree.
- [Reaction Self-Test on the ISS](https://humanresearchroadmap.nasa.gov/Tasks/?i=1651): basis of the reaction test (3 minutes, taps slower than 355 ms count as lapses).
- [Space Adaptation Sickness](https://www.nasa.gov/wp-content/uploads/2025/09/ochmo-mtb-004-space-adaptation-sickness-sas.pdf), [Spaceflight Experience and Medical Care](https://www.nasa.gov/wp-content/uploads/2023/07/ochmo-tb-033-spaceflight-experience-medical-care-rev-c.pdf) and [Spaceflight Associated Neuro-ocular Syndrome](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/): space-specific branches of the symptom tree.
- [Hazard pages for each of the five hazards](https://www.nasa.gov/hrp/hazards/): the Hazards screen, one card per hazard.
- [Moon 2 Mars Space Radiation Protection](https://ntrs.nasa.gov/citations/20250006168), NASA Technical Reports Server: expected dose rate at each location and solar condition, and expected dose from a large solar storm.
- [NASA-STD-3001 Technical Brief: Design for Ionizing Radiation Protection](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf): 600 mSv career limit, 250 mSv solar storm limit and the storm shelter steps.
- [Curiosity RAD cruise measurements](https://www.jpl.nasa.gov/news/data-from-nasa-rovers-voyage-to-mars-aids-planning/), NASA JPL: measured dose rate on the way to Mars, shown for context.
- [Monitoring Radiation for Astronaut Health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp), Canadian Space Agency: neutron share of the ISS dose and why dosimetry matters.
- [Astronaut Exercise](https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/) and [Counteracting Bone and Muscle Loss in Microgravity](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/): rationale for the exercise plans.

Number ranges and warning signs come from the American Heart Association, the American Diabetes Association and the CDC. The complete list of references is in `src/data/sources.ts` and on the Sources screen.

No NASA dataset of individual astronaut health readings is public. The vital signs are entered by the crew member or simulated. The radiation numbers are NASA's published dose rates and limits.

## Limitations

- Web Bluetooth works in Chrome on Android and desktop. It is not available in Safari on iPhone or iPad, where manual entry is used.
- The Bluetooth heart rate parser is unit tested, but the connection has not been tested with a physical sensor.
- The stress check questions were written for this app. They are not a validated clinical scale.
- The reaction test compares a result with the crew member's own earlier tests. It has no universal cutoff.
- The self-care steps in the symptom tree are general guidance and have not been reviewed by a medical professional.
- The radiation total is an estimate for self-awareness. Official dose records come from the mission's radiation team and dosimetry lab.
- The expected dose rate uses one location at a time. A mission that moves, such as transit then Mars, is best corrected with a dosimeter reading after each move.
- The exercise plans are based on NASA sources but are not NASA's official crew prescription.

## Run it

Requires Node.js 24.

```bash
npm ci
npm run dev      # development server
npm test         # unit tests
npm run lint
npm run build    # static site in dist/
npm run preview  # serve the built site
```

The build is a static site with relative paths, so `dist/` can be hosted on any static host.

## Tech stack

React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, Dexie (IndexedDB), Recharts, Motion, Lucide icons, vite-plugin-pwa and Vitest.

## Use of AI

The code in this repository was written with AI software engineering assistants, directed and reviewed by the team:

- **Devin** (Cognition AI): the first version of the app.
- **Claude Code** (Anthropic): the radiation and five hazards screens, the mission routine with points and patches, the motion and opening animation, the device preview and the translations into five languages.

The translations were made with AI help and have not been reviewed by medical translators.
