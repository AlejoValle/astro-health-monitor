import type { LocationId } from './locations'

/**
 * Solar activity changes the dose. A strong Sun pushes galactic cosmic rays away (lower daily dose)
 * but makes solar storms more likely.
 */
export type SolarActivity = 'max' | 'min'

export const SOLAR_LABEL: Record<SolarActivity, { name: string; note: string }> = {
  max: { name: 'Solar maximum', note: 'Fewer cosmic rays, more solar storms.' },
  min: { name: 'Solar minimum', note: 'More cosmic rays, fewer solar storms.' },
}

/**
 * Effective dose rate in mSv per day, by location and solar activity.
 * Source: NASA, "Moon 2 Mars Space Radiation Protection" (NTRS 20250006168).
 * ISS: 0.2 to 0.5 mSv/day; free space 0.6 to 1.3; lunar surface 0.4 to 0.9; Mars surface 0.35 to 0.65.
 * The low end is solar maximum and the high end solar minimum.
 */
export const DOSE_RATE: Record<LocationId, Record<SolarActivity, number>> = {
  orbit: { max: 0.2, min: 0.5 },
  transit: { max: 0.6, min: 1.3 },
  moon: { max: 0.4, min: 0.9 },
  mars: { max: 0.35, min: 0.65 },
}

/** Why the dose differs at each location. */
export const SHIELDING: Record<LocationId, string> = {
  orbit: "Earth's magnetic field still blocks much of the radiation in low Earth orbit.",
  transit: 'In deep space there is no planet and no magnetic field, only the walls of the spacecraft.',
  moon: 'The Moon blocks half of the sky but has no atmosphere and no magnetic field.',
  mars: 'The planet blocks half of the sky and the thin atmosphere adds a little shielding.',
}

/** NASA-STD-3001: career effective dose limit for spaceflight, the same for all ages and sexes. */
export const CAREER_LIMIT_MSV = 600

/** NASA-STD-3001: short-term limit for one solar particle event. */
export const SPE_LIMIT_MSV = 250

/**
 * Expected dose from a large solar storm with shelter, by location.
 * Source: NASA NTRS 20250006168 (Orion design, lunar and Mars surface estimates).
 */
export const STORM_DOSE: Record<LocationId, string> = {
  orbit: "Partly shielded by Earth's magnetic field. Follow the station procedure.",
  transit: 'The spacecraft shelter is designed to keep it under 150 mSv.',
  moon: 'Around 100 mSv for a large storm.',
  mars: 'Under 25 mSv with shelter, around 40 mSv without.',
}

/** Steps when a solar storm alert arrives. Paraphrased from NASA OCHMO-TB-020. */
export const STORM_STEPS = [
  'If you are outside on a spacewalk, stop and head back now. Ending within 2 hours with shelter nearby gives strong protection.',
  'Go to the storm shelter: the most shielded spot, such as crew quarters surrounded by water bags and stowage.',
  'Keep your active dosimeter on and stay until the alert is cleared.',
  'Afterwards, log the dosimeter reading here so your total stays correct.',
]

/** Everyday comparisons. Source: NASA NTRS 20250006168. */
export const CHEST_XRAY_MSV = 0.1
export const EARTH_BACKGROUND_MSV_PER_YEAR = 3

/** Measured by Curiosity's RAD instrument inside its cruise stage to Mars, 2011 to 2012. Source: NASA JPL. */
export const MSL_CRUISE_MSV_PER_DAY = 1.8

/** Share of ISS radiation dose that comes from neutrons. Source: CSA. */
export const ISS_NEUTRON_SHARE = 0.3

export const RADIATION_SOURCE_IDS = [
  'nasa-m2m-radiation',
  'nasa-radiation-std',
  'jpl-msl-rad',
  'hrp-radiation',
  'csa-radiation',
]
