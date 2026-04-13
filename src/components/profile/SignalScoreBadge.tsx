'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import type { SignalScoreBreakdown } from '@/lib/signalScore'
import { SIGNAL_SCORE_V1_RULES } from '@/lib/signalScore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Props = {
  breakdown: SignalScoreBreakdown
}

export default function SignalScoreBadge({ breakdown }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/35">Signal</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-white/90">{breakdown.total}</span>
        <DialogTrigger>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-white/40 hover:text-white/80"
            aria-label="What is Signal?"
          >
            <Info className="size-3.5" />
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent
        showCloseButton
        className="max-w-md border-white/10 bg-[#120f1e] text-white sm:max-w-md ring-white/10"
      >
        <DialogHeader>
          <DialogTitle className="text-white">What is Signal?</DialogTitle>
          <DialogDescription className="text-white/50">
            Signal v1 estimates how much you are contributing and how much trusted members recognize that contribution.
            It is not a popularity score.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-white/75">
          <p className="text-white/55 text-xs uppercase tracking-widest">Your breakdown</p>
          <ul className="space-y-1.5 font-mono text-xs text-white/70">
            <li className="flex justify-between gap-4">
              <span>Posting (28d)</span>
              <span className="text-white/90">{breakdown.posting}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Recognition (signals)</span>
              <span className="text-white/90">{breakdown.recognition}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Conversation (others&apos; comments)</span>
              <span className="text-white/90">{breakdown.conversation}</span>
            </li>
            <li className="flex justify-between gap-4 border-t border-white/10 pt-2 text-white/90">
              <span>Total</span>
              <span>{breakdown.total}</span>
            </li>
          </ul>
        </div>

        <div className="space-y-2 text-xs text-white/45 leading-relaxed">
          <p className="text-white/55 text-[11px] uppercase tracking-widest">How v1 is calculated</p>
          <ul className="list-disc space-y-1.5 pl-4">
            {SIGNAL_SCORE_V1_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
