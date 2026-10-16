// Shared pieces of the concentric clock, used by every page: the ring builder,
// timing, date helpers, and the PWA plumbing (wake lock, nav, service worker).
// Plain script, no modules, so the pages also open straight from disk.

const Concentric = (() => {
  const STEP = 6 // degrees per unit on a 60-unit ring
  const SVG = 'http://www.w3.org/2000/svg'
  const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const NAV_MS = 4000

  const $ = (selector) => document.querySelector(selector)
  const pad = (n) => String(n).padStart(2, '0')

  /**
   * Builds a ring of 60 ticks and its labels. The ring turns by `--turn`; the
   * labels counter-rotate by the same amount so they stay upright.
   *
   * `readingAngle` is where the active value sits, in degrees clockwise from
   * 3 o'clock. `clockwise` makes values increase clockwise.
   */
  function createRing({
    labelRadius,
    tickRadius,
    className = '',
    readingAngle = 0,
    clockwise = false,
    labelEvery = 5,
    majorTick = 22,
    minorTick = 9,
  }) {
    const dir = clockwise ? -1 : 1
    const el = document.createElement('div')
    el.className = `ring ${className}`
    el.style.setProperty('--base', `${readingAngle}deg`)
    el.style.setProperty('--dir', dir)

    const size = (tickRadius + majorTick + 10) * 2
    const svg = document.createElementNS(SVG, 'svg')
    svg.setAttribute('class', 'ticks')
    svg.setAttribute('width', size)
    svg.setAttribute('height', size)
    svg.setAttribute('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`)
    svg.setAttribute('aria-hidden', 'true')

    const labels = []
    for (let v = 0; v < 60; v++) {
      const major = v % 5 === 0
      const angle = -dir * v * STEP

      const line = document.createElementNS(SVG, 'line')
      line.setAttribute('x1', tickRadius)
      line.setAttribute('x2', tickRadius + (major ? majorTick : minorTick))
      line.setAttribute('transform', `rotate(${angle})`)
      if (major) line.setAttribute('class', 'major')
      svg.append(line)

      const label = document.createElement('span')
      label.className = 'label'
      label.style.transform = `rotate(${angle}deg) translateX(${labelRadius}px) rotate(calc(${-angle}deg - var(--turn) * var(--dir) - var(--base)))`
      label.style.opacity = v % labelEvery === 0 ? 1 : 0
      const text = document.createElement('span')
      text.textContent = pad(v)
      label.append(text)
      labels.push(label)
    }

    el.append(svg, ...labels)
    return { el, labels, labelEvery, value: null, turn: 0 }
  }

  /**
   * Rolls a stepped ring to `value`. It always turns forward by the shortest
   * amount, so waking the phone after an hour doesn't spin it round and round.
   */
  function setRing(ring, value) {
    if (ring.value === value) return
    if (ring.value === null) {
      ring.turn = value * STEP
    } else {
      ring.turn += ((value - ring.value + 60) % 60) * STEP
    }
    ring.value = value
    ring.el.style.setProperty('--turn', `${ring.turn}deg`)

    ring.labels.forEach((label, v) => {
      const distance = Math.min(Math.abs(v - value), 60 - Math.abs(v - value))
      const isActive = v === value
      label.classList.toggle('active', isActive)
      // With a label on every value, all show; with every fifth, the ones
      // crowding the active value hide.
      const visible = ring.labelEvery === 1 || isActive || (v % 5 === 0 && distance >= 3)
      label.style.opacity = visible ? 1 : 0
    })
  }

  /**
   * Sweeps a ring one revolution a minute, every frame. The angle is taken
   * from the wall clock modulo a minute, so it stays small and precise however
   * long the page runs, and is right again the moment the phone wakes.
   */
  function sweep(ring) {
    const draw = () => {
      ring.el.style.setProperty('--turn', `${((Date.now() % 60000) / 1000) * STEP}deg`)
      requestAnimationFrame(draw)
    }
    draw()
  }

  /** Calls `fn(now)` at the start of every second, and on waking. */
  function everySecond(fn) {
    let timer
    const run = () => {
      clearTimeout(timer)
      const now = new Date()
      fn(now)
      timer = setTimeout(run, 1000 - now.getMilliseconds())
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') run()
    })
    run()
  }

  /**
   * The size the page fills. A Home Screen web app on iOS that draws under the
   * status bar can lay out shorter than the screen, leaving an empty band at
   * the bottom, so there the full screen height is used instead.
   */
  function viewport() {
    const width = innerWidth
    let height = innerHeight
    if (navigator.standalone) {
      const long = Math.max(screen.width, screen.height)
      const short = Math.min(screen.width, screen.height)
      height = Math.max(height, width < height ? long : short)
    }
    return { width, height }
  }

  function fillScreen() {
    document.documentElement.style.setProperty('--app-height', `${viewport().height}px`)
  }

  /** Calls `fn()` now and whenever the viewport changes size or rotates. */
  function onResize(fn) {
    fn()
    addEventListener('resize', fn)
    visualViewport?.addEventListener('resize', fn)
  }

  // --- Dates -----------------------------------------------------------------

  /** Day cells for the month containing `date`, Monday first, padded with blanks. */
  function monthCells(date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const lead = (new Date(year, month, 1).getDay() + 6) % 7
    const days = new Date(year, month + 1, 0).getDate()
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  }

  function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1)
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return Math.round((today - start) / 864e5) + 1
  }

  function daysInYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
  }

  /** Fills a `.calendar-grid` with weekday heads and the days of the month. */
  function renderCalendar(grid, now) {
    grid.replaceChildren(
      ...WEEKDAYS.map((d) =>
        Object.assign(document.createElement('span'), { className: 'calendar-head', textContent: d }),
      ),
      ...monthCells(now).map((d) => {
        const cell = document.createElement('span')
        cell.textContent = d ?? ''
        if (d === now.getDate()) cell.className = 'today'
        return cell
      }),
    )
  }

  // --- App plumbing -------------------------------------------------------------

  // Keeps the screen on while the clock is showing. Safari drops the lock
  // whenever the page is hidden, so it's asked for again on every return.
  let wakeLock = null
  async function keepAwake() {
    if (!('wakeLock' in navigator) || wakeLock || document.visibilityState !== 'visible') return
    try {
      wakeLock = await navigator.wakeLock.request('screen')
      wakeLock.addEventListener('release', () => {
        wakeLock = null
      })
    } catch {
      // Not allowed yet (no tap so far) or not supported; the next tap retries.
    }
  }

  // The page switcher stays hidden so the clock fills the screen; a tap shows
  // it for a few seconds.
  function setUpNav() {
    const nav = $('.nav')
    if (!nav) return
    const page = document.body.dataset.page
    nav.querySelector(`[data-page="${page}"]`)?.setAttribute('aria-current', 'page')

    let timer
    addEventListener('pointerdown', (event) => {
      if (nav.contains(event.target)) return
      nav.classList.toggle('show')
      clearTimeout(timer)
      if (nav.classList.contains('show')) {
        timer = setTimeout(() => nav.classList.remove('show'), NAV_MS)
      }
    })
  }

  function start() {
    fillScreen()
    addEventListener('resize', fillScreen)
    visualViewport?.addEventListener('resize', fillScreen)
    setUpNav()
    keepAwake()
    addEventListener('pointerdown', keepAwake)
    document.addEventListener('visibilitychange', keepAwake)

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {})
    }
  }

  start()

  return {
    STEP,
    $,
    pad,
    createRing,
    setRing,
    sweep,
    everySecond,
    onResize,
    viewport,
    dayOfYear,
    daysInYear,
    renderCalendar,
  }
})()
