import React, { useState, useEffect } from 'react';
import './SimpleSchedule.css';

function SimpleScheduleView({ periodId }) {
  const [schedule, setSchedule] = useState(null);
  const [view, setView] = useState('grid'); // 'grid', 'list', 'timeline', or 'gantt'
  const [loading, setLoading] = useState(true);
  const [currentDayIndex, setCurrentDayIndex] = useState(0); // For Gantt view day navigation

  useEffect(() => {
    loadSchedule();
  }, [periodId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/schedule/${periodId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load schedule');
      }
      
      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error('Error loading schedule:', error);
      alert('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { short: 'Mon', full: 'Monday' },
    { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' },
    { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' },
    { short: 'Sat', full: 'Saturday' },
    { short: 'Sun', full: 'Sunday' }
  ];

  const getShiftsForDay = (dayIndex) => {
    if (!schedule || !schedule.shifts) return [];
    
    const weekStart = new Date(schedule.period.week_start_date);
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    return schedule.shifts
      .filter(shift => shift.shift_date === dateStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDate = (dayIndex) => {
    if (!schedule) return new Date();
    const weekStart = new Date(schedule.period.week_start_date);
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    return date;
  };

  if (loading) {
    return <div className="simple-schedule-loading">Loading schedule...</div>;
  }

  if (!schedule) {
    return <div className="simple-schedule-error">Schedule not found</div>;
  }

  return (
    <div className="simple-schedule">
      {/* Header with Week Info */}
      <div className="schedule-header">
        <div className="week-info">
          <h1>Schedule</h1>
          <h2>
            {new Date(schedule.period.week_start_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} - {new Date(schedule.period.week_end_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
        </div>

        {/* View Toggle */}
        <div className="view-toggle">
          <button 
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
          >
            Grid View
          </button>
          <button 
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            List View
          </button>
          <button 
            className={view === 'timeline' ? 'active' : ''}
            onClick={() => setView('timeline')}
          >
            Timeline View
          </button>
          <button 
            className={view === 'gantt' ? 'active' : ''}
            onClick={() => setView('gantt')}
          >
            Gantt View
          </button>
        </div>

        {/* Print Button */}
        <button className="print-btn" onClick={() => window.print()}>
          Print
        </button>
      </div>

      {/* Grid View - Best for at-a-glance */}
      {view === 'grid' && (
        <div className="schedule-grid-view">
          {days.map((day, dayIndex) => (
            <div key={day.short} className="day-column">
              <div className="day-header">
                <div className="day-name">{day.full}</div>
                <div className="day-date">
                  {getDate(dayIndex).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <div className="shifts-container">
                {getShiftsForDay(dayIndex).length === 0 ? (
                  <div className="no-shifts">No shifts scheduled</div>
                ) : (
                  getShiftsForDay(dayIndex).map(shift => (
                    <div key={shift.scheduled_shift_id} className="shift-box">
                      <div className="employee-name">
                        {shift.first_name} {shift.last_name}
                      </div>
                      <div className="shift-time">
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </div>
                      {shift.position && (
                        <div className="shift-position">{shift.position}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View - Good for detailed reading */}
      {view === 'list' && (
        <div className="schedule-list-view">
          {days.map((day, dayIndex) => {
            const dayShifts = getShiftsForDay(dayIndex);
            if (dayShifts.length === 0) return null;

            return (
              <div key={day.short} className="day-section">
                <h3 className="day-title">
                  {day.full}, {getDate(dayIndex).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>

                <div className="shifts-list">
                  {dayShifts.map(shift => (
                    <div key={shift.scheduled_shift_id} className="shift-row">
                      <div className="shift-time-large">
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </div>
                      <div className="shift-details">
                        <div className="employee-name-large">
                          {shift.first_name} {shift.last_name}
                        </div>
                        {shift.position && (
                          <div className="position-badge">{shift.position}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline View - Visual hour-by-hour */}
      {view === 'timeline' && (() => {
        // Get all unique employees from the schedule
        const employees = [...new Map(
          schedule.shifts?.map(shift => [
            shift.employee_id,
            { id: shift.employee_id, name: `${shift.first_name} ${shift.last_name}` }
          ])
        ).values()].sort((a, b) => a.name.localeCompare(b.name));

        const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM
        const hourHeight = 40; // Height in pixels for each hour

        const getShiftForEmployeeAndDay = (employeeId, dayIndex) => {
          const dayShifts = getShiftsForDay(dayIndex);
          return dayShifts.find(shift => shift.employee_id === employeeId);
        };

        const getShiftPosition = (startTime, endTime) => {
          const startHour = parseInt(startTime.split(':')[0]);
          const startMin = parseInt(startTime.split(':')[1]);
          const endHour = parseInt(endTime.split(':')[0]);
          const endMin = parseInt(endTime.split(':')[1]);

          // Calculate top position (6 AM = 0)
          const startPosition = ((startHour - 6) + startMin / 60) * hourHeight;
          // Calculate height
          const height = ((endHour - startHour) + (endMin - startMin) / 60) * hourHeight;

          return { top: startPosition, height };
        };

        return (
          <div className="schedule-timeline-view">
            <div className="timeline-grid">
              {/* Header row with hour labels */}
              <div className="timeline-hour-header-row">
                <div className="timeline-corner-cell"></div>
                {days.map((day, dayIndex) => (
                  <div key={day.short} className="timeline-day-header-cell">
                    <div className="timeline-day-name">{day.short}</div>
                    <div className="timeline-day-date">{getDate(dayIndex).getDate()}</div>
                  </div>
                ))}
              </div>

              {/* Hour labels row */}
              <div className="timeline-hour-labels-row">
                <div className="timeline-hour-label-cell">Time</div>
                {days.map((day) => (
                  <div key={day.short} className="timeline-hour-markers-cell">
                    {hours.map(hour => (
                      <div key={hour} className="timeline-hour-label">
                        {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Employee rows */}
              {employees.map(emp => (
                <div key={emp.id} className="timeline-employee-section">
                  <div className="timeline-employee-name-cell">
                    {emp.name}
                  </div>
                  <div className="timeline-employee-days">
                    {days.map((day, dayIndex) => {
                      const shift = getShiftForEmployeeAndDay(emp.id, dayIndex);
                      return (
                        <div key={day.short} className="timeline-day-shift-cell">
                          {shift ? (() => {
                            const pos = getShiftPosition(shift.start_time, shift.end_time);
                            return (
                              <div
                                className="timeline-shift-bar"
                                style={{
                                  top: `${pos.top}px`,
                                  height: `${pos.height}px`
                                }}
                                title={`${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}
                              >
                                <span className="shift-bar-name">{emp.name}</span>
                              </div>
                            );
                          })() : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Gantt View - Single day view with navigation arrows */}
      {view === 'gantt' && (() => {
        // Get all unique employees from the schedule
        const employees = [...new Map(
          schedule.shifts?.map(shift => [
            shift.employee_id,
            { id: shift.employee_id, name: `${shift.first_name} ${shift.last_name}` }
          ])
        ).values()].sort((a, b) => a.name.localeCompare(b.name));

        // Time range: 6 AM to 10 PM (16 hours)
        const hours = Array.from({ length: 16 }, (_, i) => i + 6);
        const hourWidth = 80; // Width per hour in pixels (expanded)
        const dayWidth = hourWidth * 16; // Total width for one day

        const getShiftForEmployeeAndDay = (employeeId, dayIndex) => {
          const dayShifts = getShiftsForDay(dayIndex);
          return dayShifts.find(shift => shift.employee_id === employeeId);
        };

        const getShiftBarPosition = (startTime, endTime) => {
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          
          // Calculate left position (6 AM = 0)
          const startPosition = ((startHour - 6) + startMin / 60) * hourWidth;
          // Calculate width
          const width = ((endHour - startHour) + (endMin - startMin) / 60) * hourWidth;
          
          return { left: startPosition, width: Math.max(width, 30) }; // Min width 30px
        };

        // Generate distinct colors for each employee
        const getEmployeeColor = (index) => {
          const colors = [
            '#667eea', // Purple-blue
            '#f093fb', // Pink
            '#4facfe', // Blue
            '#43e97b', // Green
            '#fa709a', // Rose
            '#fee140', // Yellow
            '#30cfd0', // Cyan
            '#a8edea', // Light cyan
            '#ff9a9e', // Coral
            '#ffecd2', // Peach
            '#fcb69f', // Apricot
            '#ff6b6b', // Red
            '#4ecdc4', // Teal
            '#45b7d1', // Sky blue
            '#96ceb4', // Mint
            '#feca57', // Orange
            '#ff9ff3', // Magenta
            '#54a0ff', // Bright blue
          ];
          return colors[index % colors.length];
        };

        const currentDay = days[currentDayIndex];
        const currentDate = getDate(currentDayIndex);

        const goToPreviousDay = () => {
          setCurrentDayIndex(prev => Math.max(0, prev - 1));
        };

        const goToNextDay = () => {
          setCurrentDayIndex(prev => Math.min(days.length - 1, prev + 1));
        };

        return (
          <div className="schedule-gantt-view-single">
            {/* Navigation header */}
            <div className="gantt-navigation-header">
              <button 
                className="gantt-nav-button"
                onClick={goToPreviousDay}
                disabled={currentDayIndex === 0}
              >
                ← Previous Day
              </button>
              <div className="gantt-current-day-info">
                <div className="gantt-current-day-name">{currentDay.full}</div>
                <div className="gantt-current-day-date">
                  {currentDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <button 
                className="gantt-nav-button"
                onClick={goToNextDay}
                disabled={currentDayIndex === days.length - 1}
              >
                Next Day →
              </button>
            </div>

            <div className="gantt-container-single">
              {/* Header with hour labels */}
              <div className="gantt-header-single">
                <div className="gantt-employee-header-cell"></div>
                <div className="gantt-day-column-single">
                  {/* Hour labels */}
                  <div className="gantt-hours-row-single">
                    {hours.map(hour => (
                      <div key={hour} className="gantt-hour-label-expanded">
                        {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Employee rows */}
              <div className="gantt-body-single">
                {employees.map((emp, empIndex) => {
                  const shift = getShiftForEmployeeAndDay(emp.id, currentDayIndex);
                  const borderColor = getEmployeeColor(empIndex);
                  return (
                    <div key={emp.id} className="gantt-employee-row-single">
                      {/* Employee name */}
                      <div className="gantt-employee-name-cell">
                        {emp.name}
                      </div>
                      {/* Day column with shift bar */}
                      <div className="gantt-day-shift-column-single">
                        {shift ? (() => {
                          const pos = getShiftBarPosition(shift.start_time, shift.end_time);
                          return (
                            <div
                              className="gantt-shift-bar"
                              style={{
                                left: `${pos.left}px`,
                                width: `${pos.width}px`,
                                borderColor: borderColor,
                                borderWidth: '3px',
                                borderStyle: 'solid'
                              }}
                              title={`${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}
                            >
                              <span className="gantt-shift-bar-name">{emp.name}</span>
                              <span className="gantt-shift-bar-time">
                                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                              </span>
                            </div>
                          );
                        })() : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default SimpleScheduleView;

