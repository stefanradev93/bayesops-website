'use client'

import { createContext, useContext, useMemo, useState } from 'react'

const DemoContext = createContext(null)

export function BayesFlowDemoProvider({ demo, children }) {
  const [exampleIndex, setExampleIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const value = useMemo(() => ({
    demo, example: demo.examples[exampleIndex], exampleIndex, revealed,
    selectExample: (index) => { setExampleIndex(index); setRevealed(false) },
    reveal: () => setRevealed(true),
  }), [demo, exampleIndex, revealed])
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useBayesFlowDemo() {
  const context = useContext(DemoContext)
  if (!context) throw new Error('BayesFlow demo components need their shared provider')
  return context
}
