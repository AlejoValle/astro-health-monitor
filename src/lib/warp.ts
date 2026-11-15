/** Event that makes the background stars jump to warp for a moment. */
export const WARP_EVENT = 'astrovitals:warp'

export const warp = () => window.dispatchEvent(new Event(WARP_EVENT))
