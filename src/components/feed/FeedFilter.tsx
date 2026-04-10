'use client'

import Link from 'next/link'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'building', label: 'Building' },
  { value: 'raising', label: 'Raising' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'feedback_wanted', label: 'Feedback' },
]

export default function FeedFilter({ active }: { active?: string }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {CATEGORIES.map(({ value, label }) => {
        const isActive = active === value || (!active && value === '')
        return (
          <Link key={value} href={value ? `/feed?category=${value}` : '/feed'}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isActive
                ? 'bg-white text-black'
                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.05]'
            }`}>
            {label}
          </Link>
        )
      })}
    </div>
  )
}
