import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  X,
  CalendarClock,
  FileText,
  Pencil,
  Link2
} from 'lucide-react'
import api from '../services/api'
import ProfileButton from '../components/ProfileButton'
import './Calendar.css'

const EVENT_TYPES = ['holiday', 'event', 'meeting', 'shipment', 'schedule', 'maintenance']
const EVENT_COLORS = {
  schedule: '#3b82f6',
  shipment: '#0ea5e9',
  holiday: '#ef4444',
  event: '#8b5cf6',
  meeting: '#8b5cf6',
  maintenance: '#f59e0b',
  other: '#6b7280'
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const part = (timeStr + '').trim().slice(0, 5)
  const [h, m] = part.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${(m || '00').padStart(2, '0')} ${ampm}`
}

function toYMD(d) {
  if (typeof d === 'string') return d.slice(0, 10)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Calendar() {
  const navigate = useNavigate()
  const calendarRef = useRef(null)
  const [viewRange, setViewRange] = useState({ start: null, end: null })
  const [selectedDate, setSelectedDate] = useState(() => toYMD(new Date()))
  const [currentView, setCurrentView] = useState('dayGridMonth')
  const [calendarTitle, setCalendarTitle] = useState('')
  const [events, setEvents] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [eventFilters, setEventFilters] = useState({
    holiday: true,
    event: true,
    meeting: true,
    shipment: true,
    schedule: true,
    maintenance: true
  })
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false)
  const [showLinkDropdown, setShowLinkDropdown] = useState(false)
  const filterRef = useRef(null)
  const scheduleRef = useRef(null)
  const linkRef = useRef(null)
  const lastRangeRef = useRef({ start: null, end: null })

  const [showEventModal, setShowEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    event_type: 'event',
    description: '',
    start_time: '09:00',
    end_time: '17:00',
    forEveryone: true,
    selectedEmployees: []
  })
  const [newEventDate, setNewEventDate] = useState(() => toYMD(new Date()))
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [employees, setEmployees] = useState([])
  const [showEventDetail, setShowEventDetail] = useState(null)

  const [showScheduleCreate, setShowScheduleCreate] = useState(false)
  const [scheduleStart, setScheduleStart] = useState('')
  const [scheduleEnd, setScheduleEnd] = useState('')
  const [scheduleGenerating, setScheduleGenerating] = useState(false)
  const [showDraftsList, setShowDraftsList] = useState(false)
  const [draftList, setDraftList] = useState([])
  const [loadingDrafts, setLoadingDrafts] = useState(false)
  const [showEditList, setShowEditList] = useState(false)
  const [editList, setEditList] = useState([])
  const [loadingEditList, setLoadingEditList] = useState(false)

  const [subscriptionUrls, setSubscriptionUrls] = useState(null)
  const [loadingSubscription, setLoadingSubscription] = useState(false)

  const loadData = async (startDate, endDate) => {
    if (!startDate || !endDate) return
    setLoading(true)
    setError('')
    try {
      const [eventsRes, schedRes] = await Promise.all([
        api.get(`master_calendar?start_date=${startDate}&end_date=${endDate}`),
        api.get(`employee_schedule?start_date=${startDate}&end_date=${endDate}`)
      ])
      const eventsData = eventsRes.data?.data || eventsRes.data || []
      const schedData = schedRes.data?.data || schedRes.data || []
      setEvents(Array.isArray(eventsData) ? eventsData : [])
      setSchedules(Array.isArray(schedData) ? schedData : [])
    } catch (e) {
      setError('Could not load calendar')
      setEvents([])
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const fullCalendarEvents = useMemo(() => {
    const out = []
    events.forEach((event) => {
      if (eventFilters[event.event_type]) {
        const startDate = event.event_date || event.start_datetime || ''
        const startStr = (startDate + '').slice(0, 10)
        const startTime = (event.start_time || '09:00').toString().replace(/^(\d{1,2}):(\d{2})$/, '$1:$2:00').slice(0, 8)
        const endTime = (event.end_time || '17:00').toString().replace(/^(\d{1,2}):(\d{2})$/, '$1:$2:00').slice(0, 8)
        const start = new Date(`${startStr}T${startTime}`)
        const end = new Date(`${startStr}T${endTime}`)
        out.push({
          id: `event-${event.event_id || event.id}`,
          title: event.title || event.event_type,
          start: start.toISOString(),
          end: end.toISOString(),
          backgroundColor: EVENT_COLORS[event.event_type] || EVENT_COLORS.other,
          borderColor: EVENT_COLORS[event.event_type] || EVENT_COLORS.other,
          extendedProps: { ...event, type: 'event', eventType: event.event_type }
        })
      }
    })
    if (eventFilters.schedule) {
      schedules.forEach((schedule) => {
        const scheduleDate = (schedule.schedule_date || '').toString().slice(0, 10)
        if (!scheduleDate) return
        const startTime = (schedule.start_time || '09:00').toString().replace(/^(\d{1,2}):(\d{2})$/, '$1:$2:00').slice(0, 8)
        const endTime = (schedule.end_time || '17:00').toString().replace(/^(\d{1,2}):(\d{2})$/, '$1:$2:00').slice(0, 8)
        const start = new Date(`${scheduleDate}T${startTime}`)
        const end = new Date(`${scheduleDate}T${endTime}`)
        out.push({
          id: `schedule-${schedule.schedule_id || schedule.id}`,
          title: `${schedule.employee_name || 'Employee'}: ${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`,
          start: start.toISOString(),
          end: end.toISOString(),
          backgroundColor: EVENT_COLORS.schedule,
          borderColor: EVENT_COLORS.schedule,
          extendedProps: { ...schedule, type: 'schedule', eventType: 'schedule' }
        })
      })
    }
    return out
  }, [events, schedules, eventFilters])

  const dayListEvents = useMemo(() => {
    if (!selectedDate) return []
    return fullCalendarEvents.filter((event) => toYMD(event.start) === selectedDate)
  }, [fullCalendarEvents, selectedDate])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterDropdown(false)
      if (scheduleRef.current && !scheduleRef.current.contains(e.target)) setShowScheduleDropdown(false)
      if (linkRef.current && !linkRef.current.contains(e.target)) setShowLinkDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDatesSet = (arg) => {
    const startStr = toYMD(arg.start)
    const endStr = toYMD(arg.end)
    setCalendarTitle(arg.view.title)
    setCurrentView(arg.view.type)
    setViewRange({ start: startStr, end: endStr })
    if (lastRangeRef.current.start !== startStr || lastRangeRef.current.end !== endStr) {
      lastRangeRef.current = { start: startStr, end: endStr }
      loadData(startStr, endStr)
    }
  }

  const navigatePrev = () => {
    if (calendarRef.current) calendarRef.current.getApi().prev()
  }
  const navigateNext = () => {
    if (calendarRef.current) calendarRef.current.getApi().next()
  }
  const goToday = () => {
    if (calendarRef.current) calendarRef.current.getApi().today()
    setSelectedDate(toYMD(new Date()))
  }
  const changeView = (viewName) => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(viewName)
      setCurrentView(viewName)
    }
  }

  const handleEventClick = (clickInfo) => {
    setShowEventDetail(clickInfo.event.extendedProps)
  }

  const handleDateClick = (dateClickInfo) => {
    setSelectedDate(dateClickInfo.dateStr.slice(0, 10))
  }

  const fetchEmployees = async () => {
    try {
      const res = await api.get('employees')
      const data = res.data?.data || res.data || []
      setEmployees(Array.isArray(data) ? data.filter((e) => e.active !== 0) : [])
    } catch {
      setEmployees([])
    }
  }

  const toggleFilter = (type) => {
    setEventFilters((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const openAddEvent = () => {
    setNewEventDate(selectedDate)
    setNewEvent({
      title: '',
      event_type: 'event',
      description: '',
      start_time: '09:00',
      end_time: '17:00',
      forEveryone: true,
      selectedEmployees: []
    })
    setShowEventModal(true)
    fetchEmployees()
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!newEvent.title.trim()) return
    setCreatingEvent(true)
    try {
      const token = localStorage.getItem('sessionToken')
      await api.post('master_calendar', {
        session_token: token,
        event_date: newEventDate,
        event_type: newEvent.event_type,
        title: newEvent.title.trim(),
        description: newEvent.description || null,
        start_time: newEvent.start_time || null,
        end_time: newEvent.end_time || null,
        employee_ids: newEvent.forEveryone ? [] : newEvent.selectedEmployees
      })
      if (viewRange.start && viewRange.end) await loadData(viewRange.start, viewRange.end)
      setShowEventModal(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create event')
    } finally {
      setCreatingEvent(false)
    }
  }

  const fetchDrafts = async () => {
    setShowScheduleDropdown(false)
    setLoadingDrafts(true)
    setShowDraftsList(true)
    setDraftList([])
    try {
      const res = await api.get('schedule/drafts')
      const data = res.data?.data || res.data || []
      setDraftList(Array.isArray(data) ? data : [])
    } catch {
      setDraftList([])
    } finally {
      setLoadingDrafts(false)
    }
  }

  const fetchPublished = async () => {
    setShowScheduleDropdown(false)
    setLoadingEditList(true)
    setShowEditList(true)
    setEditList([])
    try {
      const res = await api.get('schedule/published')
      const data = res.data?.data || res.data || []
      setEditList(Array.isArray(data) ? data : [])
    } catch {
      setEditList([])
    } finally {
      setLoadingEditList(false)
    }
  }

  const handleGenerateSchedule = async (e) => {
    e.preventDefault()
    if (!scheduleStart || !scheduleEnd) return
    setScheduleGenerating(true)
    try {
      await api.post('schedule/generate', {
        week_start_date: scheduleStart,
        settings: { week_end_date: scheduleEnd }
      })
      if (viewRange.start && viewRange.end) await loadData(viewRange.start, viewRange.end)
      setShowScheduleCreate(false)
      setScheduleStart('')
      setScheduleEnd('')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate schedule')
    } finally {
      setScheduleGenerating(false)
    }
  }

  const openSubscriptionDropdown = async () => {
    setShowLinkDropdown(true)
    if (subscriptionUrls == null) {
      setLoadingSubscription(true)
      try {
        const res = await api.get('calendar/subscription/urls')
        setSubscriptionUrls(res.data?.data || res.data || {})
      } catch {
        setSubscriptionUrls({})
      } finally {
        setLoadingSubscription(false)
      }
    }
  }

  const googleCalendarUrl = (ev) => {
    const date = ev.event_date || ev.start_datetime || selectedDate
    const st = (ev.start_time || '09:00').toString().slice(0, 5).replace(':', '')
    const et = (ev.end_time || '17:00').toString().slice(0, 5).replace(':', '')
    const start = `${date.replace(/-/g, '')}T${st}00`
    const end = `${date.replace(/-/g, '')}T${et}00`
    const title = encodeURIComponent(ev.title || ev.event_type || 'Event')
    const details = encodeURIComponent(ev.description || '')
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <ProfileButton />
        <h1 className="calendar-title">Calendar</h1>
      </div>

      <div className="calendar-toolbar">
        <button type="button" className="calendar-nav-btn" onClick={navigatePrev} aria-label="Previous">
          <ChevronLeft size={24} />
        </button>
        <button type="button" className="calendar-month-label" onClick={goToday}>
          {calendarTitle || 'Calendar'}
        </button>
        <button type="button" className="calendar-nav-btn" onClick={navigateNext} aria-label="Next">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="calendar-buttons-row">
        <div ref={filterRef} className="calendar-dropdown-wrap">
          <button
            type="button"
            className={`calendar-action-btn ${showFilterDropdown ? 'calendar-action-btn--open' : ''}`}
            onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowScheduleDropdown(false); setShowLinkDropdown(false) }}
          >
            Filter
            <ChevronDown size={16} />
          </button>
          {showFilterDropdown && (
            <div className="calendar-dropdown">
              {EVENT_TYPES.map((type) => (
                <label key={type} className="calendar-dropdown-item">
                  <input type="checkbox" checked={eventFilters[type]} onChange={() => toggleFilter(type)} />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button type="button" className="calendar-action-btn" onClick={openAddEvent}>
          <Plus size={16} />
          Event
        </button>

        <div ref={scheduleRef} className="calendar-dropdown-wrap">
          <button
            type="button"
            className={`calendar-action-btn ${showScheduleDropdown ? 'calendar-action-btn--open' : ''}`}
            onClick={() => { setShowScheduleDropdown(!showScheduleDropdown); setShowFilterDropdown(false); setShowLinkDropdown(false) }}
          >
            <CalendarClock size={16} />
            Schedule
            <ChevronDown size={14} />
          </button>
          {showScheduleDropdown && (
            <div className="calendar-dropdown">
              <button type="button" className="calendar-dropdown-btn" onClick={() => { setShowScheduleCreate(true); setShowScheduleDropdown(false) }}>
                <Plus size={16} />
                Create
              </button>
              <button type="button" className="calendar-dropdown-btn" onClick={fetchDrafts}>
                <FileText size={16} />
                Drafts
              </button>
              <button type="button" className="calendar-dropdown-btn" onClick={fetchPublished}>
                <Pencil size={16} />
                Edit
              </button>
            </div>
          )}
        </div>

        <div className="calendar-view-toggle">
          <button type="button" className={`calendar-view-btn ${currentView === 'dayGridMonth' ? 'calendar-view-btn--active' : ''}`} onClick={() => changeView('dayGridMonth')}>Month</button>
          <button type="button" className={`calendar-view-btn ${currentView === 'timeGridWeek' ? 'calendar-view-btn--active' : ''}`} onClick={() => changeView('timeGridWeek')}>Week</button>
          <button type="button" className={`calendar-view-btn ${currentView === 'timeGridDay' ? 'calendar-view-btn--active' : ''}`} onClick={() => changeView('timeGridDay')}>Day</button>
        </div>

        <div ref={linkRef} className="calendar-dropdown-wrap">
          <button
            type="button"
            className={`calendar-action-btn calendar-action-btn--icon ${showLinkDropdown ? 'calendar-action-btn--open' : ''}`}
            onClick={openSubscriptionDropdown}
            title="Subscribe"
          >
            <Link2 size={18} />
          </button>
          {showLinkDropdown && (
            <div className="calendar-dropdown calendar-dropdown--right">
              {loadingSubscription ? (
                <div className="calendar-dropdown-item">Loading…</div>
              ) : subscriptionUrls?.webcal_url ? (
                <>
                  <div className="calendar-dropdown-item calendar-dropdown-item--label">Subscribe in your calendar app:</div>
                  <button
                    type="button"
                    className="calendar-dropdown-btn"
                    onClick={() => {
                      navigator.clipboard?.writeText(subscriptionUrls.webcal_url || subscriptionUrls.ical_url || '')
                    }}
                  >
                    Copy link
                  </button>
                </>
              ) : (
                <div className="calendar-dropdown-item">Subscribe URL not available.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="calendar-fc-wrap">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          events={fullCalendarEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          height="auto"
          editable={false}
          selectable={false}
          dayMaxEvents={2}
          moreLinkClick="popover"
        />
      </div>

      <div className="calendar-day-title">
        {selectedDate === toYMD(new Date()) ? 'Today' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>

      {error && <div className="calendar-error">{error}</div>}

      <div className="calendar-list-wrap">
        {loading ? (
          <p className="calendar-muted">Loading…</p>
        ) : dayListEvents.length === 0 ? (
          <p className="calendar-muted">No events this day.</p>
        ) : (
          <ul className="calendar-list">
            {dayListEvents.map((event) => {
              const props = event.extendedProps
              const isSchedule = props?.type === 'schedule'
              return (
                <li
                  key={event.id}
                  className="calendar-event"
                  style={{ borderLeftColor: event.backgroundColor }}
                  onClick={() => setShowEventDetail(props)}
                >
                  {isSchedule ? <Clock size={16} className="calendar-event-icon" /> : <CalendarIcon size={16} className="calendar-event-icon" />}
                  <div className="calendar-event-body">
                    <span className="calendar-event-title">{event.title}</span>
                    {props?.start_time != null || props?.end_time != null ? (
                      <span className="calendar-event-time">{formatTime(props.start_time)} – {formatTime(props.end_time)}</span>
                    ) : null}
                    {props?.description && <span className="calendar-event-desc">{props.description}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="calendar-modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2 className="calendar-modal-title">Add Event</h2>
              <button type="button" className="calendar-modal-close" onClick={() => setShowEventModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateEvent} className="calendar-form">
              <label className="calendar-form-label">Date</label>
              <input type="date" className="calendar-form-input" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} required />
              <label className="calendar-form-label">Title *</label>
              <input type="text" className="calendar-form-input" value={newEvent.title} onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))} required />
              <label className="calendar-form-label">Type</label>
              <select className="calendar-form-input" value={newEvent.event_type} onChange={(e) => setNewEvent((p) => ({ ...p, event_type: e.target.value }))}>
                {EVENT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
              <label className="calendar-form-label">Description</label>
              <textarea className="calendar-form-input calendar-form-textarea" value={newEvent.description} onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))} rows={2} />
              <div className="calendar-form-row">
                <div className="calendar-form-group">
                  <label className="calendar-form-label">Start</label>
                  <input type="time" className="calendar-form-input" value={newEvent.start_time} onChange={(e) => setNewEvent((p) => ({ ...p, start_time: e.target.value }))} />
                </div>
                <div className="calendar-form-group">
                  <label className="calendar-form-label">End</label>
                  <input type="time" className="calendar-form-input" value={newEvent.end_time} onChange={(e) => setNewEvent((p) => ({ ...p, end_time: e.target.value }))} />
                </div>
              </div>
              <label className="calendar-form-label">
                <input type="checkbox" checked={newEvent.forEveryone} onChange={(e) => setNewEvent((p) => ({ ...p, forEveryone: e.target.checked }))} />
                For everyone
              </label>
              {!newEvent.forEveryone && (
                <>
                  <div className="calendar-form-label">Assign to</div>
                  {employees.slice(0, 20).map((emp) => (
                    <label key={emp.employee_id} className="calendar-form-label calendar-form-label--inline">
                      <input
                        type="checkbox"
                        checked={newEvent.selectedEmployees.includes(emp.employee_id)}
                        onChange={(e) => {
                          if (e.target.checked) setNewEvent((p) => ({ ...p, selectedEmployees: [...p.selectedEmployees, emp.employee_id] }))
                          else setNewEvent((p) => ({ ...p, selectedEmployees: p.selectedEmployees.filter((id) => id !== emp.employee_id) }))
                        }}
                      />
                      {emp.first_name} {emp.last_name}
                    </label>
                  ))}
                </>
              )}
              <div className="calendar-form-actions">
                <button type="button" className="calendar-btn calendar-btn--secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
                <button type="submit" className="calendar-btn calendar-btn--primary" disabled={creatingEvent}>{creatingEvent ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventDetail && (
        <div className="calendar-modal-overlay" onClick={() => setShowEventDetail(null)}>
          <div className="calendar-modal calendar-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2 className="calendar-modal-title">{showEventDetail.type === 'schedule' ? 'Shift' : (showEventDetail.title || showEventDetail.event_type)}</h2>
              <button type="button" className="calendar-modal-close" onClick={() => setShowEventDetail(null)}><X size={24} /></button>
            </div>
            <div className="calendar-event-detail">
              {showEventDetail.type === 'schedule' && (
                <>
                  <p><strong>{showEventDetail.employee_name || 'Shift'}</strong></p>
                  <p className="calendar-event-detail-time">{formatTime(showEventDetail.start_time)} – {formatTime(showEventDetail.end_time)}</p>
                </>
              )}
              {showEventDetail.type === 'event' && (
                <>
                  <p><strong>{showEventDetail.title || showEventDetail.event_type}</strong></p>
                  <p className="calendar-event-detail-type">{showEventDetail.event_type}</p>
                  {(showEventDetail.start_time || showEventDetail.end_time) && (
                    <p className="calendar-event-detail-time">{formatTime(showEventDetail.start_time)} – {formatTime(showEventDetail.end_time)}</p>
                  )}
                  {showEventDetail.description && <p className="calendar-event-detail-desc">{showEventDetail.description}</p>}
                  <a href={googleCalendarUrl(showEventDetail)} target="_blank" rel="noopener noreferrer" className="calendar-btn calendar-btn--primary calendar-btn--block">
                    Add to Google Calendar
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Create Modal */}
      {showScheduleCreate && (
        <div className="calendar-modal-overlay" onClick={() => setShowScheduleCreate(false)}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2 className="calendar-modal-title">New Schedule</h2>
              <button type="button" className="calendar-modal-close" onClick={() => setShowScheduleCreate(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleGenerateSchedule} className="calendar-form">
              <label className="calendar-form-label">Week start</label>
              <input type="date" className="calendar-form-input" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} required />
              <label className="calendar-form-label">Week end</label>
              <input type="date" className="calendar-form-input" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} required />
              <div className="calendar-form-actions">
                <button type="button" className="calendar-btn calendar-btn--secondary" onClick={() => setShowScheduleCreate(false)}>Cancel</button>
                <button type="submit" className="calendar-btn calendar-btn--primary" disabled={scheduleGenerating}>{scheduleGenerating ? 'Generating…' : 'Generate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drafts List Modal */}
      {showDraftsList && (
        <div className="calendar-modal-overlay" onClick={() => setShowDraftsList(false)}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2 className="calendar-modal-title">Drafts</h2>
              <button type="button" className="calendar-modal-close" onClick={() => setShowDraftsList(false)}><X size={24} /></button>
            </div>
            <div className="calendar-list-wrap">
              {loadingDrafts ? <p className="calendar-muted">Loading…</p> : draftList.length === 0 ? <p className="calendar-muted">No drafts.</p> : (
                <ul className="calendar-list">
                  {draftList.map((d) => (
                    <li key={d.period_id} className="calendar-event">
                      <span>{d.week_start_date} – {d.week_end_date}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit (Published) List Modal */}
      {showEditList && (
        <div className="calendar-modal-overlay" onClick={() => setShowEditList(false)}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2 className="calendar-modal-title">Published Schedules</h2>
              <button type="button" className="calendar-modal-close" onClick={() => setShowEditList(false)}><X size={24} /></button>
            </div>
            <div className="calendar-list-wrap">
              {loadingEditList ? <p className="calendar-muted">Loading…</p> : editList.length === 0 ? <p className="calendar-muted">None.</p> : (
                <ul className="calendar-list">
                  {editList.map((p) => (
                    <li key={p.period_id} className="calendar-event">
                      <span>{p.week_start_date} – {p.week_end_date}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <button type="button" className="nav-item" aria-label="Dashboard" onClick={() => navigate('/')}><LayoutDashboard size={24} strokeWidth={2} /></button>
        <button type="button" className="nav-item" aria-label="Orders" onClick={() => navigate('/orders')}><ClipboardList size={24} strokeWidth={2} /></button>
        <button type="button" className="nav-item nav-item--cart" aria-label="POS" onClick={() => navigate('/checkout')}>
          <span className="nav-cart-circle"><ShoppingCart size={24} strokeWidth={2} /></span>
        </button>
        <button type="button" className="nav-item nav-item--active" aria-label="Calendar" onClick={() => navigate('/calendar')}><CalendarIcon size={24} strokeWidth={2} /></button>
        <button type="button" className="nav-item" aria-label="Inventory" onClick={() => navigate('/inventory')}><Package size={24} strokeWidth={2} /></button>
      </nav>
    </div>
  )
}
