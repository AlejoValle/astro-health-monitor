export interface Source {
  id: string
  org: string
  title: string
  url: string
  kind: 'nasa' | 'partner' | 'clinical'
}

export const SOURCES: Source[] = [
  {
    id: 'hrp-hazards',
    org: 'NASA Human Research Program',
    title: '5 Hazards of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/hazards/',
    kind: 'nasa',
  },
  {
    id: 'hrp-risks',
    org: 'NASA Human Research Program',
    title: 'Risks of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/risks/',
    kind: 'nasa',
  },
  {
    id: 'hrp-research',
    org: 'NASA Human Research Program',
    title: 'Ongoing HRP Research in Space',
    url: 'https://www.nasa.gov/hrp/ongoing-hrp-research/',
    kind: 'nasa',
  },
  {
    id: 'nasa-pvt',
    org: 'NASA Human Research Roadmap',
    title: 'Psychomotor Vigilance Test (PVT) on ISS (Reaction Self-Test)',
    url: 'https://humanresearchroadmap.nasa.gov/Tasks/?i=1651',
    kind: 'nasa',
  },
  {
    id: 'aha-bp',
    org: 'American Heart Association',
    title: 'Understanding Blood Pressure Readings',
    url: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings',
    kind: 'clinical',
  },
  {
    id: 'aha-hr',
    org: 'American Heart Association',
    title: 'All About Heart Rate',
    url: 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse',
    kind: 'clinical',
  },
  {
    id: 'ada-diagnosis',
    org: 'American Diabetes Association',
    title: 'Diabetes Diagnosis & Tests',
    url: 'https://diabetes.org/about-diabetes/diagnosis',
    kind: 'clinical',
  },
  {
    id: 'ada-low',
    org: 'American Diabetes Association',
    title: 'Low Blood Glucose (Hypoglycemia)',
    url: 'https://diabetes.org/living-with-diabetes/hypoglycemia-low-blood-glucose',
    kind: 'clinical',
  },
  {
    id: 'cdc-fever',
    org: 'Centers for Disease Control and Prevention',
    title: 'Reporting Death or Illness on Ships (fever definition)',
    url: 'https://www.cdc.gov/port-health/php/maritime-guidance/reporting-death-or-illness-on-ships.html',
    kind: 'clinical',
  },
  {
    id: 'cdc-sleep',
    org: 'Centers for Disease Control and Prevention',
    title: 'About Sleep',
    url: 'https://www.cdc.gov/sleep/about/index.html',
    kind: 'clinical',
  },
]

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id)
