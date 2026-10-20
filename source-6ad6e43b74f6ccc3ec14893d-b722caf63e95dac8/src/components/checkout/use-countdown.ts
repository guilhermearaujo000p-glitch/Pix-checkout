import { useEffect, useState } from 'react'

/** Segundos restantes até `iso`. `null` até montar no navegador (evita divergência de hidratação). */
export function useCountdown(iso: string) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000)))
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [iso])
  return left
}

export function formatCountdown(seconds: number | null) {
  if (seconds === null) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mmss = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return h > 0 ? `${h}h ${mmss}` : mmss
}
