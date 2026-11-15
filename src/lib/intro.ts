import { create } from 'zustand'

/** Whether the opening animation has finished, so screens can replay their entrance after it. */
export const useIntro = create<{ done: boolean }>(() => ({ done: false }))

export const finishIntro = () => useIntro.setState({ done: true })
