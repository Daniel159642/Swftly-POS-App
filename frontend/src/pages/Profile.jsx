import { useState, useEffect } from 'react'
import { usePermissions } from '../contexts/PermissionContext'
import AdminDashboard from '../components/AdminDashboard'

function Profile({ employeeId, employeeName }) {
  const { hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [weekSchedules, setWeekSchedules] = useState([])
  const [hoursStats, setHoursStats] = useState({ thisWeek: 0, thisMonth: 0 })
  const [availability, setAvailability] = useState({
    monday: { available: true, start: '09:00', end: '17:00' },
    tuesday: { available: true, start: '09:00', end: '17:00' },
    wednesday: { available: true, start: '09:00', end: '17:00' },
    thursday: { available: true, start: '09:00', end: '17:00' },
    friday: { available: true, start: '09:00', end: '17:00' },
    saturday: { available: false, start: '09:00', end: '17:00' },
    sunday: { available: false, start: '09:00', end: '17:00' }
  })
  const [unavailableDates, setUnavailableDates] = useState([])
  const [showAddDate, setShowAddDate] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newNote, setNewNote] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [unavailableStartTime, setUnavailableStartTime] = useState('')
  const [unavailableEndTime, setUnavailableEndTime] = useState('')
  const [editingAvailability, setEditingAvailability] = useState(false)

  useEffect(() => {
    if (employeeId) {
      loadProfileData()
    }
  }, [employeeId])

  const loadProfileData = async () => {
    setLoading(true)
    try {
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      
      const startDate = startOfWeek.toISOString().split('T')[0]
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      const endDate = endOfMonth.toISOString().split('T')[0]

      // Get schedules for the month
      const scheduleRes = await fetch(`/api/employee_schedule?employee_id=${employeeId}&start_date=${startDate}&end_date=${endDate}`)
      const scheduleData = await scheduleRes.json()
      const allSchedules = scheduleData.data || []

      // Get this week's schedules
      const weekScheds = allSchedules
        .filter(s => {
          const sDate = new Date(s.schedule_date)
          return sDate >= startOfWeek && sDate <= endOfWeek
        })
        .sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date))
      setWeekSchedules(weekScheds)

      // Calculate hours
      const thisWeekHours = allSchedules
        .filter(s => {
          const sDate = new Date(s.schedule_date)
          return sDate >= startOfWeek && sDate <= endOfWeek && s.hours_worked
        })
        .reduce((sum, s) => sum + (s.hours_worked || 0), 0)
      
      const thisMonthHours = allSchedules
        .filter(s => {
          const sDate = new Date(s.schedule_date)
          return sDate.getMonth() === today.getMonth() && 
                 sDate.getFullYear() === today.getFullYear() && 
                 s.hours_worked
        })
        .reduce((sum, s) => sum + (s.hours_worked || 0), 0)

      setHoursStats({ thisWeek: thisWeekHours, thisMonth: thisMonthHours })

      // Load availability
      try {
        const availRes = await fetch(`/api/employee_availability?employee_id=${employeeId}`)
        if (availRes.ok) {
          const availData = await availRes.json()
          if (availData.data) {
            const loaded = {}
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            days.forEach(day => {
              if (availData.data[day]) {
                try {
                  const parsed = JSON.parse(availData.data[day])
                  loaded[day] = parsed
                } catch {
                  loaded[day] = { available: true, start: '09:00', end: '17:00' }
                }
              } else {
                loaded[day] = { available: true, start: '09:00', end: '17:00' }
              }
            })
            setAvailability(loaded)
          }
        }
      } catch (err) {
        console.error('Error loading availability:', err)
      }
    } catch (err) {
      console.error('Error loading profile data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAvailabilityChange = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const handleSaveAvailability = async () => {
    try {
      const formatted = {}
      Object.keys(availability).forEach(day => {
        formatted[day] = JSON.stringify(availability[day])
      })

      const response = await fetch('/api/employee_availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          ...formatted
        })
      })
      const data = await response.json()
      if (data.success) {
        alert('Availability saved')
      } else {
        alert('Failed to save availability')
      }
    } catch (err) {
      console.error('Error saving availability:', err)
      alert('Failed to save availability')
    }
  }

  const handleAddUnavailableDate = () => {
    if (!newDate) return
    const startDate = new Date(newDate)
    if (isNaN(startDate.getTime())) {
      alert('Please enter a valid date')
      return
    }

    // If end date is provided, create entries for all days in range
    const datesToAdd = []
    if (newEndDate && newEndDate >= newDate) {
      const endDate = new Date(newEndDate)
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        datesToAdd.push({
          date: currentDate.toISOString().split('T')[0],
          note: newNote,
          allDay: allDay,
          startTime: allDay ? null : unavailableStartTime,
          endTime: allDay ? null : unavailableEndTime
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else {
      // Single date
      datesToAdd.push({
        date: newDate,
        note: newNote,
        allDay: allDay,
        startTime: allDay ? null : unavailableStartTime,
        endTime: allDay ? null : unavailableEndTime
      })
    }

    setUnavailableDates(prev => [...prev, ...datesToAdd])
    setNewDate('')
    setNewEndDate('')
    setNewNote('')
    setAllDay(true)
    setUnavailableStartTime('')
    setUnavailableEndTime('')
    setShowAddDate(false)
  }

  const handleRemoveUnavailableDate = (index) => {
    setUnavailableDates(prev => prev.filter((_, i) => i !== index))
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getDayName = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  if (loading) {
    return (
      <div style={{ 
        padding: '60px', 
        textAlign: 'center', 
        color: '#999', 
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        fontSize: '16px'
      }}>
        Loading...
      </div>
    )
  }

  const hasAdminAccess = hasPermission('manage_permissions') || hasPermission('add_employee')

  return (
    <div style={{ 
      padding: '32px 24px', 
      backgroundColor: '#f5f5f5', 
      minHeight: 'calc(100vh - 200px)',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Tab Selector */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '10px 16px',
              backgroundColor: activeTab === 'profile' ? 'rgba(128, 0, 128, 0.7)' : 'rgba(128, 0, 128, 0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: activeTab === 'profile' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(128, 0, 128, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: activeTab === 'profile' ? 600 : 500,
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'profile' ? '0 4px 15px rgba(128, 0, 128, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : '0 2px 8px rgba(128, 0, 128, 0.1)'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'profile') {
                e.currentTarget.style.backgroundColor = 'rgba(128, 0, 128, 0.3)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(128, 0, 128, 0.2)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'profile') {
                e.currentTarget.style.backgroundColor = 'rgba(128, 0, 128, 0.2)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(128, 0, 128, 0.1)'
              }
            }}
          >
            Profile Settings
          </button>
          {hasAdminAccess && (
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                padding: '10px 16px',
                backgroundColor: activeTab === 'admin' ? 'rgba(128, 0, 128, 0.7)' : 'rgba(128, 0, 128, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: activeTab === 'admin' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(128, 0, 128, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: activeTab === 'admin' ? 600 : 500,
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === 'admin' ? '0 4px 15px rgba(128, 0, 128, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : '0 2px 8px rgba(128, 0, 128, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'admin') {
                  e.currentTarget.style.backgroundColor = 'rgba(128, 0, 128, 0.3)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(128, 0, 128, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'admin') {
                  e.currentTarget.style.backgroundColor = 'rgba(128, 0, 128, 0.2)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(128, 0, 128, 0.1)'
                }
              }}
            >
              Admin
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <>
          {/* Hours Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '28px',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
        }}
        >
          <div style={{ 
            fontSize: '13px', 
            color: '#666', 
            marginBottom: '12px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
          }}>
            This Week
          </div>
          <div style={{ 
            fontSize: '42px', 
            fontWeight: 700,
            color: '#1a1a1a',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            lineHeight: '1.2'
          }}>
            {hoursStats.thisWeek.toFixed(1)}h
          </div>
        </div>

        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '28px',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
        }}
        >
          <div style={{ 
            fontSize: '13px', 
            color: '#666', 
            marginBottom: '12px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
          }}>
            This Month
          </div>
          <div style={{ 
            fontSize: '42px', 
            fontWeight: 700,
            color: '#1a1a1a',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            lineHeight: '1.2'
          }}>
            {hoursStats.thisMonth.toFixed(1)}h
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '28px',
        backgroundColor: 'white',
        marginBottom: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '22px', 
          fontWeight: 600,
          color: '#1a1a1a',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
        }}>
          This Week's Schedule
        </h2>
        {weekSchedules.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {weekSchedules.map((schedule) => (
              <div 
                key={schedule.schedule_id} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                  backgroundColor: '#fafafa',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                  e.currentTarget.style.borderColor = '#d0d0d0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fafafa'
                  e.currentTarget.style.borderColor = '#e8e8e8'
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: '#1a1a1a' }}>
                    {getDayName(schedule.schedule_date)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {formatDate(schedule.schedule_date)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>
                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                  </div>
                  {schedule.hours_worked && (
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                      {schedule.hours_worked.toFixed(1)}h worked
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            color: '#999', 
            fontSize: '14px', 
            textAlign: 'center', 
            padding: '60px 20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
          }}>
            No schedules for this week
          </div>
        )}
      </div>

      {/* Availability Section */}
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '28px',
        backgroundColor: 'white',
        marginBottom: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ 
          margin: '0 0 28px 0', 
          fontSize: '22px', 
          fontWeight: 600,
          color: '#1a1a1a',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
        }}>
          Availability
        </h2>

        {/* Weekly Availability */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
          }}>
            <div style={{ 
              fontSize: '15px', 
              color: '#333',
              fontWeight: 500,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
            }}>
              Weekly Availability
            </div>
            <button
              onClick={() => setEditingAvailability(!editingAvailability)}
              style={{
                padding: '8px 16px',
                backgroundColor: editingAvailability ? '#666' : '#1a1a1a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!editingAvailability) {
                  e.currentTarget.style.backgroundColor = '#333'
                }
              }}
              onMouseLeave={(e) => {
                if (!editingAvailability) {
                  e.currentTarget.style.backgroundColor = '#1a1a1a'
                }
              }}
            >
              {editingAvailability ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {!editingAvailability ? (
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)',
                borderBottom: '1px solid #e0e0e0',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                backgroundColor: '#f5f5f5'
              }}>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div 
                    key={day}
                    style={{
                      padding: '14px 8px',
                      borderRight: day !== 'sunday' ? '1px solid #e0e0e0' : 'none',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      color: '#555'
                    }}
                  >
                    {day.substring(0, 3)}
                  </div>
                ))}
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
              }}>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div 
                    key={day}
                    style={{
                      padding: '16px 8px',
                      borderRight: day !== 'sunday' ? '1px solid #e0e0e0' : 'none',
                      textAlign: 'center',
                      fontSize: '13px',
                      color: availability[day]?.available ? '#1a1a1a' : '#999',
                      whiteSpace: 'nowrap',
                      fontWeight: availability[day]?.available ? 500 : 400
                    }}
                  >
                    {availability[day]?.available 
                      ? `${availability[day]?.start || '09:00'} - ${availability[day]?.end || '17:00'}`
                      : 'Unavailable'
                    }
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              padding: '24px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#fafafa',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div key={day} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      textTransform: 'capitalize', 
                      marginBottom: '4px',
                      color: '#1a1a1a'
                    }}>
                      {day}
                    </div>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}>
                      <input
                        type="checkbox"
                        checked={availability[day]?.available || false}
                        onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                        style={{ 
                          cursor: 'pointer', 
                          width: '18px', 
                          height: '18px',
                          accentColor: '#1a1a1a'
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#333' }}>Available</span>
                    </label>
                    {availability[day]?.available && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        marginLeft: '28px',
                        flexWrap: 'wrap'
                      }}>
                        <label style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>From:</label>
                        <input
                          type="time"
                          value={availability[day]?.start || '09:00'}
                          onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            backgroundColor: 'white',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#1a1a1a'}
                          onBlur={(e) => e.target.style.borderColor = '#ccc'}
                        />
                        <label style={{ fontSize: '14px', color: '#666', fontWeight: 500, marginLeft: '8px' }}>To:</label>
                        <input
                          type="time"
                          value={availability[day]?.end || '17:00'}
                          onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            backgroundColor: 'white',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#1a1a1a'}
                          onBlur={(e) => e.target.style.borderColor = '#ccc'}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    handleSaveAvailability()
                    setEditingAvailability(false)
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '12px 24px',
                    backgroundColor: '#1a1a1a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    alignSelf: 'flex-start',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                >
                  Save All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Unavailable Dates */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ 
              fontSize: '15px', 
              color: '#333',
              fontWeight: 500,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
            }}>
              Days I Can't Work
            </div>
            <button
              onClick={() => setShowAddDate(!showAddDate)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
            >
              + Add Date
            </button>
          </div>

          {showAddDate && (
            <div style={{
              padding: '24px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: 'white',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ 
                    fontSize: '14px', 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 500,
                    color: '#333'
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      backgroundColor: 'white',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a1a1a'}
                    onBlur={(e) => e.target.style.borderColor = '#ccc'}
                  />
                </div>
                <div>
                  <label style={{ 
                    fontSize: '14px', 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 500,
                    color: '#333'
                  }}>
                    End Date (optional - leave blank for single day)
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    min={newDate}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      backgroundColor: 'white',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a1a1a'}
                    onBlur={(e) => e.target.style.borderColor = '#ccc'}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}>
                    <input
                      type="checkbox"
                      checked={allDay}
                      onChange={(e) => setAllDay(e.target.checked)}
                      style={{ 
                        cursor: 'pointer', 
                        width: '18px', 
                        height: '18px',
                        accentColor: '#1a1a1a'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#333' }}>All day</span>
                  </label>
                </div>
                {!allDay && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ 
                        fontSize: '14px', 
                        display: 'block', 
                        marginBottom: '8px',
                        fontWeight: 500,
                        color: '#333'
                      }}>
                        Can't work from:
                      </label>
                      <input
                        type="time"
                        value={unavailableStartTime}
                        onChange={(e) => setUnavailableStartTime(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          backgroundColor: 'white',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#1a1a1a'}
                        onBlur={(e) => e.target.style.borderColor = '#ccc'}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        fontSize: '14px', 
                        display: 'block', 
                        marginBottom: '8px',
                        fontWeight: 500,
                        color: '#333'
                      }}>
                        Can't work until:
                      </label>
                      <input
                        type="time"
                        value={unavailableEndTime}
                        onChange={(e) => setUnavailableEndTime(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          backgroundColor: 'white',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#1a1a1a'}
                        onBlur={(e) => e.target.style.borderColor = '#ccc'}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ 
                    fontSize: '14px', 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 500,
                    color: '#333'
                  }}>
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g., Vacation, Doctor appointment"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      backgroundColor: 'white',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a1a1a'}
                    onBlur={(e) => e.target.style.borderColor = '#ccc'}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleAddUnavailableDate}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#1a1a1a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDate(false)
                      setNewDate('')
                      setNewEndDate('')
                      setNewNote('')
                      setAllDay(true)
                      setUnavailableStartTime('')
                      setUnavailableEndTime('')
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'white',
                      color: '#333',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                      e.currentTarget.style.borderColor = '#999'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white'
                      e.currentTarget.style.borderColor = '#ccc'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {unavailableDates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {unavailableDates.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                    e.currentTarget.style.borderColor = '#d0d0d0'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa'
                    e.currentTarget.style.borderColor = '#e8e8e8'
                  }}
                >
                  <div>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: 600,
                      color: '#1a1a1a',
                      marginBottom: '4px'
                    }}>
                      {new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {!item.allDay && item.startTime && item.endTime && (
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        Can't work: {item.startTime} - {item.endTime}
                      </div>
                    )}
                    {item.note && (
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        {item.note}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveUnavailableDate(index)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'white',
                      color: '#d32f2f',
                      border: '1px solid #d32f2f',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffebee'
                      e.currentTarget.style.borderColor = '#c62828'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white'
                      e.currentTarget.style.borderColor = '#d32f2f'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              color: '#999', 
              fontSize: '14px', 
              textAlign: 'center', 
              padding: '40px 20px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
            }}>
              No unavailable dates added
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {activeTab === 'admin' && hasAdminAccess && (
        <div>
          <AdminDashboard />
        </div>
      )}
    </div>
  )
}

export default Profile
