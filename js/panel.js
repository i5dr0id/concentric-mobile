// Panel page, designed for a phone: today's date and two widget-sized tiles
// with the month and day, month and year progress, then a round dial read at
// 12 o'clock with the hour in the middle.

const { $, pad, createRing, setRing, sweep, everySecond, onResize, dayOfYear, daysInYear, renderCalendar } =
  Concentric

const MINUTES = { labelRadius: 178, tickRadius: 202 }
const SECONDS = { labelRadius: 256, tickRadius: 286 }
const OUTER_RADIUS = SECONDS.tickRadius + 22
const DIAL = { readingAngle: -90, clockwise: true }

const minutes = createRing({ ...DIAL, ...MINUTES, className: 'minutes' })
const seconds = createRing({ ...DIAL, ...SECONDS, className: 'seconds' })
$('.rings').append(minutes.el, seconds.el)

sweep(seconds)

let shownDate = ''

everySecond((now) => {
  setRing(minutes, now.getMinutes())
  $('.hour').textContent = pad(now.getHours())
  $('main').setAttribute('aria-label', now.toLocaleTimeString())

  const minutesToday = now.getHours() * 60 + now.getMinutes()
  const day = minutesToday / 1440
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const month = (now.getDate() - 1 + day) / daysInMonth
  const year = (dayOfYear(now) - 1 + day) / daysInYear(now.getFullYear())

  setProgress('day', day, `${Math.round(day * 100)}%`)
  setProgress('month', month, `${Math.round(month * 100)}%`)
  setProgress('year', year, `${Math.round(year * 100)}%`)

  if (now.toDateString() !== shownDate) {
    shownDate = now.toDateString()
    renderDate(now)
  }
})

function setProgress(name, share, text) {
  $(`[data-ring="${name}"]`).style.strokeDasharray = `${share * 100} 100`
  $(`[data-label="${name}"]`).textContent = text
}

function renderDate(now) {
  const monthName = now.toLocaleDateString('en-GB', { month: 'long' })
  $('.weekday').textContent = now.toLocaleDateString('en-GB', { weekday: 'long' })
  $('.full-date').textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  $('.week').textContent = `W${isoWeek(now)}`
  $('.calendar').setAttribute('aria-label', `${monthName} ${now.getFullYear()}`)
  $('.calendar-title').textContent = monthName.toUpperCase()
  renderCalendar($('.calendar-grid'), now)
}

/** ISO 8601 week number: weeks start on Monday, week 1 holds the first Thursday. */
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 864e5 + 1) / 7)
}

// The dial is as large as the space under the tiles allows. Only its upper
// part is drawn fully, so it can run past the screen's sides, and it sits low,
// its center near the bottom so the top of the rings rises toward the tiles.
const VISIBLE_BELOW = 0.32 // share of the radius showing below the center

function fit() {
  const area = $('.dial-area').getBoundingClientRect()
  const visible = 1 + VISIBLE_BELOW
  const outer = Math.min(area.width * 0.8, (area.height - 16) / visible)
  const dial = $('.dial')
  dial.style.scale = outer / OUTER_RADIUS
  dial.style.top = `${area.height - outer * VISIBLE_BELOW}px`
}

onResize(fit)
document.fonts?.ready.then(fit)
