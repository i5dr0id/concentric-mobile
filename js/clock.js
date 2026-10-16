// Clock page: just the dial, as large as the screen allows.

const { $, pad, createRing, setRing, sweep, everySecond, onResize } = Concentric

const MINUTES = { labelRadius: 178, tickRadius: 202 }
const SECONDS = { labelRadius: 256, tickRadius: 286 }
const OUTER_RADIUS = SECONDS.tickRadius + 22

const minutes = createRing({ ...MINUTES, className: 'minutes' })
const seconds = createRing({ ...SECONDS, className: 'seconds' })
$('.rings').append(minutes.el, seconds.el)

// The rings reach almost to the right edge, unless the screen is too short.
onResize(() => {
  const scale = Math.min(innerWidth * 0.94, innerHeight * 0.48) / OUTER_RADIUS
  $('.dial').style.scale = scale
})

sweep(seconds)

everySecond((now) => {
  setRing(minutes, now.getMinutes())
  $('.hour').textContent = pad(now.getHours())
  $('main').setAttribute('aria-label', now.toLocaleTimeString())
})
