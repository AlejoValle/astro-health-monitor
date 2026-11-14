# AstroVitals

Health self-monitoring for astronauts on long-duration missions, built for the NASA Space Apps Challenge 2026:
[Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

AstroVitals is a web app designed for a phone worn on the wrist. A crew member measures, sees at a glance how they are doing, and is told in plain language what to do next and when to contact the crew medical officer or the flight surgeon. It runs entirely on the device, so it keeps working when there is no link to Earth.

> AstroVitals is a self-care and triage guide. It does not diagnose and does not replace a flight surgeon. It has not been clinically validated.

## What it does

| Screen | What the crew member does |
| --- | --- |
| Home | Sees an overall status and the latest value of six indicators: heart rate, blood pressure, glucose, temperature, sleep and mood |
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
- **Simulated demo data.** The app starts empty. "Load a simulated 14-day mission" on the Home screen fills it with simulated readings for a demo. They are labelled "Simulated data" wherever they appear.

## NASA resources used

- [5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) and [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/), NASA Human Research Program: mission locations and the structure of the symptom tree.
- [Reaction Self-Test on the ISS](https://humanresearchroadmap.nasa.gov/Tasks/?i=1651): basis of the reaction test (3 minutes, taps slower than 355 ms count as lapses).
- [Space Adaptation Sickness](https://www.nasa.gov/wp-content/uploads/2025/09/ochmo-mtb-004-space-adaptation-sickness-sas.pdf), [Spaceflight Experience and Medical Care](https://www.nasa.gov/wp-content/uploads/2023/07/ochmo-tb-033-spaceflight-experience-medical-care-rev-c.pdf) and [Spaceflight Associated Neuro-ocular Syndrome](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/): space-specific branches of the symptom tree.
- [Astronaut Exercise](https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/) and [Counteracting Bone and Muscle Loss in Microgravity](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity/): rationale for the exercise plans.

Number ranges and warning signs come from the American Heart Association, the American Diabetes Association and the CDC. The complete list of 17 references is in `src/data/sources.ts` and on the Sources screen.

No NASA dataset of astronaut health readings is used. The readings are entered by the crew member or simulated.

## Limitations

- Web Bluetooth works in Chrome on Android and desktop. It is not available in Safari on iPhone or iPad, where manual entry is used.
- The Bluetooth heart rate parser is unit tested, but the connection has not been tested with a physical sensor.
- The stress check questions were written for this app. They are not a validated clinical scale.
- The reaction test compares a result with the crew member's own earlier tests. It has no universal cutoff.
- The self-care steps in the symptom tree are general guidance and have not been reviewed by a medical professional.
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

The code in this repository was written with Devin, an AI software engineering assistant by Cognition AI, directed and reviewed by the team.
