#!/usr/bin/env python3
"""
Automated Schedule Generator with AI-powered scheduling
Adapted for SQLite database
"""

import sqlite3
from datetime import datetime, timedelta, time
from collections import defaultdict
import json
from typing import List, Dict, Tuple, Optional

DB_NAME = 'inventory.db'

class AutomatedScheduleGenerator:
    
    def __init__(self):
        self.db_name = DB_NAME
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn
    
    def generate_schedule(self, week_start_date, settings=None, created_by=1):
        """
        Main function to generate automated schedule
        
        Settings can include:
        - algorithm: 'balanced', 'cost_optimized', 'preference_prioritized'
        - max_consecutive_days: int
        - min_time_between_shifts: hours
        - distribute_hours_evenly: bool
        """
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Default settings
        default_settings = {
            'algorithm': 'balanced',
            'max_consecutive_days': 6,
            'min_time_between_shifts': 10,  # hours
            'distribute_hours_evenly': True,
            'prioritize_seniority': False,
            'avoid_clopening': True  # Closing then opening next day
        }
        
        settings = {**default_settings, **(settings or {})}
        
        # Calculate week end date
        if isinstance(week_start_date, str):
            week_start_date = datetime.strptime(week_start_date, '%Y-%m-%d').date()
        
        # Use custom end date from settings if provided, otherwise default to 6 days later
        if settings.get('week_end_date'):
            if isinstance(settings['week_end_date'], str):
                week_end_date = datetime.strptime(settings['week_end_date'], '%Y-%m-%d').date()
            else:
                week_end_date = settings['week_end_date']
        else:
            week_end_date = week_start_date + timedelta(days=6)
        
        # Check if a period already exists for this week_start_date
        cursor.execute("""
            SELECT period_id, status FROM Schedule_Periods
            WHERE week_start_date = ?
        """, (week_start_date,))
        
        existing_period = cursor.fetchone()
        
        if existing_period:
            existing_period_dict = dict(existing_period)
            # If it's a published schedule, we shouldn't overwrite it
            if existing_period_dict.get('status') == 'published':
                conn.rollback()
                cursor.close()
                conn.close()
                raise ValueError(f"A published schedule already exists for week starting {week_start_date}. Please use a different date or archive the existing schedule first.")
            
            # Delete existing draft/archived period and its shifts
            period_id = existing_period_dict['period_id']
            
            # Delete all shifts for this period
            cursor.execute("""
                DELETE FROM Scheduled_Shifts WHERE period_id = ?
            """, (period_id,))
            
            # Delete the period
            cursor.execute("""
                DELETE FROM Schedule_Periods WHERE period_id = ?
            """, (period_id,))
            
            conn.commit()
        
        # Create new schedule period
        cursor.execute("""
            INSERT INTO Schedule_Periods 
            (week_start_date, week_end_date, status, created_by, 
             generation_method, generation_settings)
            VALUES (?, ?, 'draft', ?, 'auto', ?)
        """, (week_start_date, week_end_date, created_by,
              json.dumps(settings)))
        
        period_id = cursor.lastrowid
        conn.commit()
        
        # Get all necessary data
        employees = self._get_available_employees(cursor, week_start_date, week_end_date)
        
        # Filter by selected employees if provided
        selected_employee_ids = settings.get('selected_employees')
        if selected_employee_ids:
            employees = [e for e in employees if e['employee_id'] in selected_employee_ids]
        
        # Exclude employees if provided
        excluded_employee_ids = settings.get('excluded_employees', [])
        if excluded_employee_ids:
            employees = [e for e in employees if e['employee_id'] not in excluded_employee_ids]
        
        if not employees:
            conn.rollback()
            cursor.close()
            conn.close()
            raise ValueError("No employees available for scheduling")
        
        requirements = self._get_schedule_requirements(cursor)
        time_off = self._get_time_off_requests(cursor, week_start_date, week_end_date)
        
        # Generate shifts for each day
        all_shifts = []
        employee_hours = defaultdict(float)
        employee_shifts = defaultdict(list)
        
        # Calculate number of days in the period
        num_days = (week_end_date - week_start_date).days + 1
        
        for day_offset in range(num_days):
            current_date = week_start_date + timedelta(days=day_offset)
            day_name = current_date.strftime('%A').lower()
            
            # Get requirements for this day
            day_requirements = [r for r in requirements if r['day_of_week'] == day_name]
            
            # Get available employees for this day
            available_today = self._get_employees_available_on_day(
                employees, day_name, current_date, time_off, employee_shifts
            )
            
            # Generate shifts for this day
            day_shifts = self._generate_day_shifts(
                current_date, day_name, day_requirements, 
                available_today, employee_hours, employee_shifts, settings
            )
            
            all_shifts.extend(day_shifts)
        
        # Insert all shifts
        for shift in all_shifts:
            cursor.execute("""
                INSERT INTO Scheduled_Shifts
                (period_id, employee_id, shift_date, start_time, end_time,
                 break_duration, position, conflicts, is_draft)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (period_id, shift['employee_id'], shift['shift_date'],
                  shift['start_time'], shift['end_time'], shift['break_duration'],
                  shift['position'], json.dumps(shift.get('conflicts', []))))
        
        # Calculate totals
        cursor.execute("""
            SELECT 
                SUM((julianday(end_time) - julianday(start_time)) * 24 - (break_duration/60.0)) as total_hours,
                SUM(((julianday(end_time) - julianday(start_time)) * 24 - (break_duration/60.0)) * 
                    COALESCE(ep.hourly_rate, 15)) as estimated_cost
            FROM Scheduled_Shifts ss
            LEFT JOIN Employee_Positions ep ON ss.employee_id = ep.employee_id 
                AND ss.position = ep.position_name
            WHERE ss.period_id = ?
        """, (period_id,))
        
        totals = cursor.fetchone()
        
        cursor.execute("""
            UPDATE Schedule_Periods
            SET total_labor_hours = ?,
                estimated_labor_cost = ?
            WHERE period_id = ?
        """, (totals['total_hours'] or 0, totals['estimated_cost'] or 0, period_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'period_id': period_id,
            'total_hours': float(totals['total_hours'] or 0),
            'estimated_cost': float(totals['estimated_cost'] or 0),
            'shifts_generated': len(all_shifts)
        }
    
    def _get_available_employees(self, cursor, start_date, end_date):
        """Get all active employees with their availability"""
        
        cursor.execute("""
            SELECT 
                e.*,
                COALESCE(e.max_hours_per_week, 40) as max_hours_per_week,
                COALESCE(e.min_hours_per_week, 0) as min_hours_per_week,
                COALESCE(e.employment_type, 'full_time') as employment_type
            FROM employees e
            WHERE e.active = 1
        """)
        
        employees = [dict(row) for row in cursor.fetchall()]
        
        # Get availability for each employee
        for emp in employees:
            # Check if Employee_Availability table exists (new structure)
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='Employee_Availability'
            """)
            has_new_table = cursor.fetchone()
            
            if has_new_table:
                # Use new structure with day_of_week
                cursor.execute("""
                    SELECT * FROM Employee_Availability
                    WHERE employee_id = ?
                    AND is_recurring = 1
                    AND (effective_date IS NULL OR effective_date <= ?)
                    AND (end_date IS NULL OR end_date >= ?)
                """, (emp['employee_id'], end_date, start_date))
                emp['availability'] = [dict(row) for row in cursor.fetchall()]
            else:
                # Use old structure with JSON strings per day
                cursor.execute("""
                    SELECT * FROM employee_availability
                    WHERE employee_id = ?
                """, (emp['employee_id'],))
                row = cursor.fetchone()
                if row:
                    avail_row = dict(row)
                    # Convert JSON structure to day_of_week structure
                    emp['availability'] = []
                    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                    for day in days:
                        day_json = avail_row.get(day)
                        if day_json:
                            try:
                                day_data = json.loads(day_json)
                                if day_data.get('available', False):
                                    emp['availability'].append({
                                        'day_of_week': day,
                                        'start_time': day_data.get('start', '09:00'),
                                        'end_time': day_data.get('end', '17:00'),
                                        'availability_type': 'available'
                                    })
                            except:
                                pass
                else:
                    emp['availability'] = []
            
            # Get positions
            cursor.execute("""
                SELECT position_name FROM Employee_Positions
                WHERE employee_id = ?
            """, (emp['employee_id'],))
            
            positions = [row[0] for row in cursor.fetchall()]
            emp['positions'] = positions if positions else [emp.get('position', 'general')]
        
        return employees
    
    def _get_schedule_requirements(self, cursor):
        """Get business requirements for scheduling"""
        
        cursor.execute("""
            SELECT * FROM Schedule_Requirements
            WHERE is_active = 1
            ORDER BY day_of_week, time_block_start
        """)
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _get_time_off_requests(self, cursor, start_date, end_date):
        """Get approved time off requests"""
        
        cursor.execute("""
            SELECT * FROM Time_Off_Requests
            WHERE status = 'approved'
            AND ((start_date BETWEEN ? AND ?)
                 OR (end_date BETWEEN ? AND ?)
                 OR (start_date <= ? AND end_date >= ?))
        """, (start_date, end_date, start_date, end_date, 
              start_date, end_date))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _get_employees_available_on_day(self, employees, day_name, date, 
                                       time_off_requests, employee_shifts):
        """Filter employees available on specific day"""
        
        available = []
        
        # Normalize date to date object if it's a string
        if isinstance(date, str):
            date = datetime.strptime(date, '%Y-%m-%d').date()
        
        for emp in employees:
            # Check if on time off
            on_time_off = False
            for req in time_off_requests:
                if req['employee_id'] == emp['employee_id']:
                    # Normalize request dates
                    req_start = req['start_date']
                    req_end = req['end_date']
                    if isinstance(req_start, str):
                        req_start = datetime.strptime(req_start, '%Y-%m-%d').date()
                    if isinstance(req_end, str):
                        req_end = datetime.strptime(req_end, '%Y-%m-%d').date()
                    
                    if req_start <= date <= req_end:
                        on_time_off = True
                        break
            
            if on_time_off:
                continue
            
            # Check availability for this day
            day_availability = [
                a for a in emp.get('availability', [])
                if a.get('day_of_week') == day_name and 
                   a.get('availability_type') != 'unavailable'
            ]
            
            # If employee has no availability restrictions OR has availability for this day, include them
            has_availability_records = len(emp.get('availability', [])) > 0
            
            if day_availability:
                # Employee has explicit availability for this day
                emp['day_availability'] = day_availability
                available.append(emp)
            elif not has_availability_records:
                # Employee has no availability records - consider them available (default behavior)
                emp['day_availability'] = [{
                    'day_of_week': day_name,
                    'start_time': '09:00',
                    'end_time': '17:00',
                    'availability_type': 'available'
                }]
                available.append(emp)
            # If has_availability_records but no match for this day, skip (employee has restrictions but not for this day)
        
        return available
    
    def _generate_day_shifts(self, date, day_name, requirements, 
                            available_employees, employee_hours, 
                            employee_shifts, settings):
        """Generate shifts for a specific day"""
        
        shifts = []
        
        # Group requirements by time blocks
        time_blocks = self._create_time_blocks(requirements)
        
        # If no requirements, create default time blocks based on availability
        if not time_blocks and available_employees:
            # Create default shifts for available employees
            min_employees = settings.get('min_employees_per_shift', 1)
            max_employees = settings.get('max_employees_per_shift', len(available_employees))
            default_shift_length = settings.get('default_shift_length', 8)
            
            # Group employees by their preferred start times from availability
            employees_by_time = defaultdict(list)
            for emp in available_employees:
                if emp.get('day_availability'):
                    # Use the first available time slot
                    avail = emp['day_availability'][0]
                    start_time = avail.get('start_time', '09:00')
                    end_time = avail.get('end_time')
                    if not end_time:
                        # Calculate end time from start time + shift length
                        start_hour, start_min = map(int, start_time.split(':'))
                        end_hour = start_hour + default_shift_length
                        if end_hour >= 24:
                            end_hour = end_hour % 24
                        end_time = f"{end_hour:02d}:{start_min:02d}"
                    
                    key = f"{start_time}-{end_time}"
                    employees_by_time[key].append({
                        'employee': emp,
                        'start_time': start_time,
                        'end_time': end_time
                    })
            
            # If no specific times, use default
            if not employees_by_time:
                employees_by_time['09:00-17:00'] = [{
                    'employee': emp,
                    'start_time': '09:00',
                    'end_time': '17:00'
                } for emp in available_employees[:max_employees]]
            
            # Create shifts for each time block
            for time_key, emp_list in employees_by_time.items():
                start_time = emp_list[0]['start_time']
                end_time = emp_list[0]['end_time']
                
                # Select employees for this shift
                num_employees = min(max(min_employees, len(emp_list)), max_employees)
                selected_employees = emp_list[:num_employees]
                
                for emp_data in selected_employees:
                    emp = emp_data['employee']
                    # Ensure date is a date object
                    shift_date = date
                    if isinstance(date, str):
                        shift_date = datetime.strptime(date, '%Y-%m-%d').date()
                    
                    shift = {
                        'employee_id': emp['employee_id'],
                        'shift_date': shift_date,
                        'start_time': start_time,
                        'end_time': end_time,
                        'break_duration': self._calculate_break(start_time, end_time),
                        'position': self._select_position(emp, {'positions': []}),
                        'conflicts': []
                    }
                    
                    # Calculate hours
                    shift_hours = self._calculate_shift_hours(
                        shift['start_time'], 
                        shift['end_time'], 
                        shift['break_duration']
                    )
                    
                    # Update tracking
                    employee_hours[emp['employee_id']] += shift_hours
                    employee_shifts[emp['employee_id']].append({
                        'date': date,
                        'start': start_time,
                        'end': end_time
                    })
                    
                    shifts.append(shift)
            
            return shifts
        
        for block in time_blocks:
            # Determine how many employees needed
            employees_needed = block['min_employees']
            
            # Select best employees for this block
            candidates = self._score_employees_for_block(
                available_employees, block, date, 
                employee_hours, employee_shifts, settings
            )
            
            # Assign top candidates
            assigned_count = 0
            for candidate in candidates:
                if assigned_count >= employees_needed:
                    break
                
                emp = candidate['employee']
                
                # Check constraints
                if self._check_shift_constraints(
                    emp, date, block, employee_shifts, settings
                ):
                    # Create shift
                    shift = {
                        'employee_id': emp['employee_id'],
                        'shift_date': date,
                        'start_time': block['start_time'],
                        'end_time': block['end_time'],
                        'break_duration': self._calculate_break(
                            block['start_time'], block['end_time']
                        ),
                        'position': self._select_position(emp, block),
                        'conflicts': []
                    }
                    
                    # Calculate hours
                    shift_hours = self._calculate_shift_hours(
                        shift['start_time'], 
                        shift['end_time'], 
                        shift['break_duration']
                    )
                    
                    # Update tracking
                    employee_hours[emp['employee_id']] += shift_hours
                    employee_shifts[emp['employee_id']].append({
                        'date': date,
                        'start': block['start_time'],
                        'end': block['end_time']
                    })
                    
                    shifts.append(shift)
                    assigned_count += 1
            
            # Log if understaffed
            if assigned_count < employees_needed:
                print(f"Warning: Only assigned {assigned_count}/{employees_needed} for {date} {block['start_time']}")
        
        return shifts
    
    def _create_time_blocks(self, requirements):
        """Create scheduling blocks from requirements"""
        
        blocks = []
        
        for req in requirements:
            preferred_positions = []
            if req.get('preferred_positions'):
                try:
                    preferred_positions = json.loads(req['preferred_positions'])
                except:
                    preferred_positions = []
            
            blocks.append({
                'start_time': req['time_block_start'],
                'end_time': req['time_block_end'],
                'min_employees': req['min_employees'],
                'max_employees': req.get('max_employees'),
                'positions': preferred_positions,
                'priority': req.get('priority', 'medium')
            })
        
        return blocks
    
    def _score_employees_for_block(self, employees, block, date, 
                                   employee_hours, employee_shifts, settings):
        """Score and rank employees for a time block"""
        
        scored = []
        
        for emp in employees:
            score = 0
            
            # Check if available during this time
            available = False
            for avail in emp.get('day_availability', []):
                if (avail['start_time'] <= block['start_time'] and
                    avail['end_time'] >= block['end_time']):
                    available = True
                    if avail['availability_type'] == 'preferred':
                        score += 10
                    break
            
            if not available:
                continue
            
            # Hours distribution - prefer employees with fewer hours
            if settings['distribute_hours_evenly']:
                current_hours = employee_hours[emp['employee_id']]
                max_hours = emp.get('max_hours_per_week', 40)
                if max_hours > 0:
                    hours_ratio = current_hours / max_hours
                    score += (1 - hours_ratio) * 20
            
            # Position match
            emp_positions = emp.get('positions', [])
            if any(pos in emp_positions for pos in block['positions']):
                score += 15
            
            # Avoid consecutive days if needed
            recent_shifts = [s for s in employee_shifts[emp['employee_id']] 
                           if (date - s['date']).days <= 1]
            if len(recent_shifts) < settings['max_consecutive_days']:
                score += 5
            
            # Employment type preference
            if emp.get('employment_type') == 'full_time':
                score += 5
            
            scored.append({
                'employee': emp,
                'score': score
            })
        
        # Sort by score descending
        scored.sort(key=lambda x: x['score'], reverse=True)
        
        return scored
    
    def _check_shift_constraints(self, employee, date, block, 
                                employee_shifts, settings):
        """Check if shift violates any constraints"""
        
        emp_id = employee['employee_id']
        
        # Check max consecutive days
        consecutive = 0
        check_date = date - timedelta(days=1)
        while check_date >= date - timedelta(days=7):
            if any(s['date'] == check_date for s in employee_shifts[emp_id]):
                consecutive += 1
                check_date -= timedelta(days=1)
            else:
                break
        
        if consecutive >= settings['max_consecutive_days']:
            return False
        
        # Check time between shifts (avoid clopening)
        if settings['avoid_clopening']:
            yesterday = date - timedelta(days=1)
            yesterday_shifts = [s for s in employee_shifts[emp_id] 
                              if s['date'] == yesterday]
            
            if yesterday_shifts:
                last_shift = max(yesterday_shifts, key=lambda s: s['end'])
                # Convert to datetime for comparison
                end_time_str = last_shift['end']
                if isinstance(end_time_str, str):
                    if len(end_time_str) == 5:  # HH:MM format
                        end_time_str += ':00'
                    last_end_time = datetime.strptime(end_time_str, '%H:%M:%S').time()
                else:
                    last_end_time = end_time_str
                
                start_time_str = block['start_time']
                if isinstance(start_time_str, str):
                    if len(start_time_str) == 5:  # HH:MM format
                        start_time_str += ':00'
                    current_start_time = datetime.strptime(start_time_str, '%H:%M:%S').time()
                else:
                    current_start_time = start_time_str
                
                last_end = datetime.combine(yesterday, last_end_time)
                current_start = datetime.combine(date, current_start_time)
                hours_between = (current_start - last_end).total_seconds() / 3600
                
                if hours_between < settings['min_time_between_shifts']:
                    return False
        
        # Check weekly hour limits
        current_hours = sum(
            self._calculate_shift_hours(s['start'], s['end'], 30)
            for s in employee_shifts[emp_id]
        )
        shift_hours = self._calculate_shift_hours(
            block['start_time'], block['end_time'], 30
        )
        
        max_hours = employee.get('max_hours_per_week', 40)
        if current_hours + shift_hours > max_hours:
            return False
        
        return True
    
    def _calculate_break(self, start_time, end_time):
        """Calculate break duration based on shift length"""
        
        # Convert to datetime for calculation
        if isinstance(start_time, str):
            if len(start_time) == 5:  # HH:MM format
                start = datetime.strptime(start_time, '%H:%M').time()
            else:
                start = datetime.strptime(start_time, '%H:%M:%S').time()
        else:
            start = start_time
        
        if isinstance(end_time, str):
            if len(end_time) == 5:  # HH:MM format
                end = datetime.strptime(end_time, '%H:%M').time()
            else:
                end = datetime.strptime(end_time, '%H:%M:%S').time()
        else:
            end = end_time
        
        start_dt = datetime.combine(datetime.today(), start)
        end_dt = datetime.combine(datetime.today(), end)
        hours = (end_dt - start_dt).total_seconds() / 3600
        
        if hours >= 8:
            return 60  # 1 hour break
        elif hours >= 6:
            return 30  # 30 min break
        elif hours >= 4:
            return 15  # 15 min break
        else:
            return 0
    
    def _calculate_shift_hours(self, start_time, end_time, break_minutes):
        """Calculate actual working hours"""
        
        if isinstance(start_time, str):
            if len(start_time) == 5:  # HH:MM format
                start = datetime.strptime(start_time, '%H:%M').time()
            else:
                start = datetime.strptime(start_time, '%H:%M:%S').time()
        else:
            start = start_time
        
        if isinstance(end_time, str):
            if len(end_time) == 5:  # HH:MM format
                end = datetime.strptime(end_time, '%H:%M').time()
            else:
                end = datetime.strptime(end_time, '%H:%M:%S').time()
        else:
            end = end_time
        
        start_dt = datetime.combine(datetime.today(), start)
        end_dt = datetime.combine(datetime.today(), end)
        total_minutes = (end_dt - start_dt).total_seconds() / 60
        working_minutes = total_minutes - break_minutes
        
        return working_minutes / 60
    
    def _select_position(self, employee, block):
        """Select best position for employee in this block"""
        
        emp_positions = employee.get('positions', [])
        block_positions = block['positions']
        
        # Find matching position
        for pos in block_positions:
            if pos in emp_positions:
                return pos
        
        # Return first position if no match
        return emp_positions[0] if emp_positions else 'general'
    
    def copy_schedule_from_template(self, template_id, week_start_date, created_by):
        """Copy schedule from existing template"""
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if isinstance(week_start_date, str):
            week_start_date = datetime.strptime(week_start_date, '%Y-%m-%d').date()
        week_end_date = week_start_date + timedelta(days=6)
        
        # Get template's original period
        cursor.execute("""
            SELECT * FROM Schedule_Periods WHERE template_id = ?
        """, (template_id,))
        
        template_period = cursor.fetchone()
        
        if not template_period:
            cursor.close()
            conn.close()
            return None
        
        template_period = dict(template_period)
        
        # Create new period
        cursor.execute("""
            INSERT INTO Schedule_Periods 
            (week_start_date, week_end_date, status, created_by, 
             generation_method, template_id)
            VALUES (?, ?, 'draft', ?, 'template', ?)
        """, (week_start_date, week_end_date, created_by, template_id))
        
        new_period_id = cursor.lastrowid
        
        # Get all shifts from template period
        cursor.execute("""
            SELECT * FROM Scheduled_Shifts 
            WHERE period_id = ?
        """, (template_period['period_id'],))
        
        template_shifts = cursor.fetchall()
        
        # Calculate day offset
        template_start = datetime.strptime(template_period['week_start_date'], '%Y-%m-%d').date()
        day_offset = (week_start_date - template_start).days
        
        # Copy shifts with date adjustment
        for shift_row in template_shifts:
            shift = dict(shift_row)
            shift_date = datetime.strptime(shift['shift_date'], '%Y-%m-%d').date()
            new_date = shift_date + timedelta(days=day_offset)
            
            cursor.execute("""
                INSERT INTO Scheduled_Shifts
                (period_id, employee_id, shift_date, start_time, end_time,
                 break_duration, position, notes, is_draft)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (new_period_id, shift['employee_id'], new_date,
                  shift['start_time'], shift['end_time'], 
                  shift['break_duration'], shift.get('position'), 
                  shift.get('notes')))
        
        # Update template use count
        cursor.execute("""
            UPDATE Schedule_Templates
            SET use_count = use_count + 1,
                last_used = CURRENT_TIMESTAMP
            WHERE template_id = ?
        """, (template_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return new_period_id
    
    def save_as_template(self, period_id, template_name, description, created_by):
        """Save current schedule as template"""
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO Schedule_Templates
            (template_name, description, created_by)
            VALUES (?, ?, ?)
        """, (template_name, description, created_by))
        
        template_id = cursor.lastrowid
        
        # Link the period to template
        cursor.execute("""
            UPDATE Schedule_Periods
            SET template_id = ?
            WHERE period_id = ?
        """, (template_id, period_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return template_id
    
    def publish_schedule(self, period_id, published_by):
        """Publish schedule and notify employees"""
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Update status
        cursor.execute("""
            UPDATE Schedule_Periods
            SET status = 'published',
                published_by = ?,
                published_at = CURRENT_TIMESTAMP
            WHERE period_id = ?
        """, (published_by, period_id))
        
        # Mark all shifts as not draft
        cursor.execute("""
            UPDATE Scheduled_Shifts
            SET is_draft = 0
            WHERE period_id = ?
        """, (period_id,))
        
        # Get all employees in this schedule
        cursor.execute("""
            SELECT DISTINCT employee_id FROM Scheduled_Shifts
            WHERE period_id = ?
        """, (period_id,))
        
        employees = cursor.fetchall()
        
        # Create notifications
        for emp in employees:
            cursor.execute("""
                INSERT INTO Schedule_Notifications
                (period_id, employee_id, notification_type, sent_via)
                VALUES (?, ?, 'new_schedule', 'all')
            """, (period_id, emp[0]))
        
        # Log change
        cursor.execute("""
            INSERT INTO Schedule_Changes
            (period_id, change_type, changed_by, reason)
            VALUES (?, 'published', ?, 'Schedule published to all employees')
        """, (period_id, published_by))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return True
    
    def get_schedule_summary(self, period_id):
        """Get schedule summary with stats"""
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get period info
        cursor.execute("""
            SELECT * FROM Schedule_Periods WHERE period_id = ?
        """, (period_id,))
        
        period_row = cursor.fetchone()
        if not period_row:
            cursor.close()
            conn.close()
            return None
        
        period = dict(period_row)
        
        # Get all shifts
        cursor.execute("""
            SELECT ss.*, e.first_name, e.last_name, e.employee_code as username
            FROM Scheduled_Shifts ss
            JOIN employees e ON ss.employee_id = e.employee_id
            WHERE ss.period_id = ?
            ORDER BY ss.shift_date, ss.start_time
        """, (period_id,))
        
        shifts = [dict(row) for row in cursor.fetchall()]
        
        # Calculate stats by employee
        cursor.execute("""
            SELECT 
                e.employee_id,
                e.first_name,
                e.last_name,
                COUNT(ss.scheduled_shift_id) as shift_count,
                SUM((julianday(ss.end_time) - julianday(ss.start_time)) * 24 - 
                    (ss.break_duration/60.0)) as total_hours
            FROM employees e
            JOIN Scheduled_Shifts ss ON e.employee_id = ss.employee_id
            WHERE ss.period_id = ?
            GROUP BY e.employee_id
        """, (period_id,))
        
        employee_stats = [dict(row) for row in cursor.fetchall()]
        
        # Check for conflicts
        conflicts = self._detect_schedule_conflicts(cursor, period_id)
        
        cursor.close()
        conn.close()
        
        return {
            'period': period,
            'shifts': shifts,
            'employee_stats': employee_stats,
            'conflicts': conflicts
        }
    
    def _detect_schedule_conflicts(self, cursor, period_id):
        """Detect scheduling conflicts"""
        
        conflicts = []
        
        # Double bookings
        cursor.execute("""
            SELECT 
                ss1.employee_id,
                e.first_name,
                e.last_name,
                ss1.shift_date,
                ss1.start_time as start1,
                ss1.end_time as end1,
                ss2.start_time as start2,
                ss2.end_time as end2
            FROM Scheduled_Shifts ss1
            JOIN Scheduled_Shifts ss2 ON ss1.employee_id = ss2.employee_id
                AND ss1.shift_date = ss2.shift_date
                AND ss1.scheduled_shift_id < ss2.scheduled_shift_id
            JOIN employees e ON ss1.employee_id = e.employee_id
            WHERE ss1.period_id = ?
            AND (
                (ss1.start_time < ss2.end_time AND ss1.end_time > ss2.start_time)
            )
        """, (period_id,))
        
        double_bookings = [dict(row) for row in cursor.fetchall()]
        
        for db in double_bookings:
            conflicts.append({
                'type': 'double_booking',
                'severity': 'critical',
                'employee': f"{db['first_name']} {db['last_name']}",
                'date': db['shift_date'],
                'message': f"Overlapping shifts: {db['start1']}-{db['end1']} and {db['start2']}-{db['end2']}"
            })
        
        # Over max hours
        cursor.execute("""
            SELECT 
                e.employee_id,
                e.first_name,
                e.last_name,
                COALESCE(e.max_hours_per_week, 40) as max_hours_per_week,
                SUM((julianday(ss.end_time) - julianday(ss.start_time)) * 24 - 
                    (ss.break_duration/60.0)) as scheduled_hours
            FROM employees e
            JOIN Scheduled_Shifts ss ON e.employee_id = ss.employee_id
            WHERE ss.period_id = ?
            GROUP BY e.employee_id
            HAVING scheduled_hours > COALESCE(e.max_hours_per_week, 40)
        """, (period_id,))
        
        over_hours = [dict(row) for row in cursor.fetchall()]
        
        for oh in over_hours:
            conflicts.append({
                'type': 'over_max_hours',
                'severity': 'high',
                'employee': f"{oh['first_name']} {oh['last_name']}",
                'message': f"Scheduled {oh['scheduled_hours']:.1f} hours (max: {oh['max_hours_per_week']})"
            })
        
        return conflicts

