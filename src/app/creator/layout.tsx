import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About the Creator',
  description: "Meet the developer behind DT's Terminal — a free stock market tool built for Indian traders and students. Support the project.",
  openGraph: {
    title: "About the Creator | DT's Terminal",
    description: "Meet the developer behind DT's Terminal — a free stock market tool built for Indian traders and students.",
    url: '/creator',
  },
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
