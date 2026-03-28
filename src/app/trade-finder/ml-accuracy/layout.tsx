import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Prediction Accuracy',
  description: 'Transparent ML model accuracy for NSE stock direction predictions — daily updates, 30-day history, and confidence scores. See exactly how our AI performs.',
  openGraph: {
    title: 'AI Prediction Accuracy | DT\'s Terminal',
    description: 'Transparent ML model accuracy for NSE stock predictions — daily updates, 30-day history, and confidence scores.',
    url: '/trade-finder/ml-accuracy',
  },
}

export default function MlAccuracyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
