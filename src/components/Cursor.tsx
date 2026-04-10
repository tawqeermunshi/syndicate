'use client'

import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!media.matches || reducedMotion.matches) return

    document.body.classList.add('has-custom-cursor')

    let mouseX = 0, mouseY = 0
    let ringX = 0, ringY = 0
    let dotX = 0, dotY = 0
    let animId: number

    function onMove(e: MouseEvent) {
      mouseX = e.clientX
      mouseY = e.clientY
      document.body.classList.add('custom-cursor-visible')
    }

    function onMouseDown() {
      document.body.classList.add('custom-cursor-pressed')
    }

    function onMouseUp() {
      document.body.classList.remove('custom-cursor-pressed')
    }

    function onLeaveWindow() {
      document.body.classList.remove('custom-cursor-visible')
    }

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

    function animate() {
      dotX = lerp(dotX, mouseX, 0.35)
      dotY = lerp(dotY, mouseY, 0.35)
      ringX = lerp(ringX, mouseX, 0.13)
      ringY = lerp(ringY, mouseY, 0.13)
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      }
      animId = requestAnimationFrame(animate)
    }

    function bindHoverTargets() {
      const selectors = [
        'a',
        'button',
        'input',
        'textarea',
        'select',
        '[role="button"]',
        '[data-cursor="interactive"]',
      ].join(',')
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(selectors))
      const onEnter = () => document.body.classList.add('custom-cursor-hover')
      const onLeave = () => document.body.classList.remove('custom-cursor-hover')
      nodes.forEach((node) => {
        node.addEventListener('mouseenter', onEnter)
        node.addEventListener('mouseleave', onLeave)
      })
      return () => {
        nodes.forEach((node) => {
          node.removeEventListener('mouseenter', onEnter)
          node.removeEventListener('mouseleave', onLeave)
        })
      }
    }

    const unbindHoverTargets = bindHoverTargets()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mouseleave', onLeaveWindow)
    animId = requestAnimationFrame(animate)

    return () => {
      unbindHoverTargets()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mouseleave', onLeaveWindow)
      cancelAnimationFrame(animId)
      document.body.classList.remove(
        'has-custom-cursor',
        'custom-cursor-visible',
        'custom-cursor-hover',
        'custom-cursor-pressed'
      )
    }
  }, [])

  return (
    <>
      <div id="cursor-dot" ref={dotRef} />
      <div id="cursor-ring" ref={ringRef} />
    </>
  )
}
