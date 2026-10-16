// Horizon page: a large hour over two arcs, the minutes above the seconds,
// both read at the top center.

const { $, pad, createRing, setRing, sweep, everySecond, onResize, viewport } = Concentric

// Design units on a 393px-wide phone (iPhone 15 Pro). The circles are wide
// enough that neighbouring labels sit about 55px apart along the arc.
const DESIGN_WIDTH = 393
const MINUTE_RADIUS = 540
const SECONDS_RADIUS = 440
const READING_LINE = 0.62 // share of screen height where the minute arc peaks

const ARC = { readingAngle: -90, clockwise: true, labelEvery: 1 }
const minutes = createRing({
  ...ARC,
  className: 'minutes',
  labelRadius: MINUTE_RADIUS,
  tickRadius: MINUTE_RADIUS + 30,
  majorTick: 18,
  minorTick: 8,
})
const seconds = createRing({
  ...ARC,
  className: 'seconds',
  labelRadius: SECONDS_RADIUS,
  tickRadius: SECONDS_RADIUS + 24,
  majorTick: 16,
  minorTick: 7,
})
$('.rings').append(minutes.el, seconds.el)

// Scales with the shorter side, so turning the phone shows more of the arcs
// rather than blowing them up.
onResize(() => {
  const { width, height } = viewport()
  const scale = Math.min(width, height) / DESIGN_WIDTH
  const peak = height * READING_LINE
  $('main').style.setProperty('--scale', scale)
  const dial = $('.dial')
  dial.style.scale = scale
  dial.style.top = `${peak + MINUTE_RADIUS * scale}px`
  // The marker starts just under the seconds labels.
  $('.marker').style.top = `${peak + (MINUTE_RADIUS - SECONDS_RADIUS + 18) * scale}px`
})

sweep(seconds)

let shownDate = ''

everySecond((now) => {
  setRing(minutes, now.getMinutes())
  $('.hour').textContent = pad(now.getHours())
  $('main').setAttribute('aria-label', now.toLocaleTimeString())

  if (now.toDateString() !== shownDate) {
    shownDate = now.toDateString()
    $('.weekday-name').textContent = now.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()
    $('.day-month').textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }).toUpperCase()
  }
})
