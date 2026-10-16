// Panel page: the dial between today's date and a calendar with day and year
// progress, laid out for a phone held upright.

const { $, pad, createRing, setRing, sweep, everySecond, onResize, dayOfYear, daysInYear, renderCalendar } =
  Concentric

const MINUTES = { labelRadius: 178, tickRadius: 202 }
const SECONDS = { labelRadius: 256, tickRadius: 286 }
const OUTER_RADIUS = SECONDS.tickRadius + 22
// How far up and down the faded rings visibly reach, as a share of the radius.
const VISIBLE_HEIGHT = 0.6

const minutes = createRing({ ...MINUTES, className: 'minutes' })
const seconds = createRing({ ...SECONDS, className: 'seconds' })
$('.rings').append(minutes.el, seconds.el)


let shownDate = ''

everySecond((now) => {
  setRing(minutes, now.getMinutes())
  $('.hour').textContent = pad(now.getHours())
  $('main').setAttribute('aria-label', now.toLocaleTimeString())

  const dayProgress = (now.getHours() * 60 + now.getMinutes()) / 1440
  $('[data-progress="day"]').style.width = `${dayProgress * 100}%`
  $('[data-label="day"]').textContent = `${Math.round(dayProgress * 100)}%`

  if (now.toDateString() !== shownDate) {
    shownDate = now.toDateString()
    renderDate(now)
  }
})

// As big as fits: across most of the width, and within the height the date
// and calendar leave. Refit once the web font arrives, as it changes that.
function fit() {
  const area = $('.dial-area').getBoundingClientRect()
  const scale = Math.min(innerWidth * 0.94, area.height / 2 / VISIBLE_HEIGHT) / OUTER_RADIUS
  $('.dial').style.scale = scale
}

onResize(fit)
document.fonts?.ready.then(fit)
sweep(seconds)

function renderDate(now) {
  const monthName = now.toLocaleDateString('en-GB', { month: 'long' })
  $('.weekday').textContent = now.toLocaleDateString('en-GB', { weekday: 'long' })
  $('.full-date').textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  $('.calendar').setAttribute('aria-label', `${monthName} ${now.getFullYear()}`)
  $('.calendar-title').textContent = monthName.toUpperCase()
  renderCalendar($('.calendar-grid'), now)

  const total = daysInYear(now.getFullYear())
  const today = dayOfYear(now)
  $('[data-progress="year"]').style.width = `${(today / total) * 100}%`
  $('[data-label="year"]').textContent = `${today}/${total}`

  // A month can span five or six calendar rows.
  fit()
}
