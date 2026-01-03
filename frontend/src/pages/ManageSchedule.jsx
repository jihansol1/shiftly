import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAllAvailability,
  getOfficeMembers,
  generateSchedule,
  getSchedule,
} from '../services/api';
import AvailabilityGrid from '../components/AvailabilityGrid';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ManageSchedule = () => {
  const [members, setMembers] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedView, setSelectedView] = useState('availability');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [shiftsNeeded, setShiftsNeeded] = useState([
    { day_of_week: 0, start_time: '09:00', end_time: '17:00', min_workers: 1 },
  ]);
  const [weekStartDate, setWeekStartDate] = useState(getNextMonday());

  const { officeId } = useParams();
  const navigate = useNavigate();

  function getNextMonday() {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchData();
  }, [officeId]);

  const fetchData = async () => {
    try {
      const [membersRes, availRes, scheduleRes] = await Promise.all([
        getOfficeMembers(officeId),
        getAllAvailability(officeId),
        getSchedule(officeId, weekStartDate).catch(() => ({ data: [] })),
      ]);
      setMembers(membersRes.data);
      setAvailability(availRes.data);
      setSchedule(scheduleRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addShiftRequirement = () => {
    setShiftsNeeded([
      ...shiftsNeeded,
      { day_of_week: 0, start_time: '09:00', end_time: '17:00', min_workers: 1 },
    ]);
  };

  const updateShiftRequirement = (index, field, value) => {
    const updated = [...shiftsNeeded];
    updated[index][field] = field === 'day_of_week' || field === 'min_workers' 
      ? parseInt(value) 
      : value;
    setShiftsNeeded(updated);
  };

  const removeShiftRequirement = (index) => {
    setShiftsNeeded(shiftsNeeded.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await generateSchedule(officeId, weekStartDate, shiftsNeeded);
      setSchedule(response.data.shifts);
      setSuccess(`Generated ${response.data.shifts.length} shifts!`);
      setSelectedView('schedule');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="manage-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back
        </button>
        <h1>Manage Schedule</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="view-tabs">
        <button
          className={selectedView === 'availability' ? 'active' : ''}
          onClick={() => setSelectedView('availability')}
        >
          Team Availability
        </button>
        <button
          className={selectedView === 'generate' ? 'active' : ''}
          onClick={() => setSelectedView('generate')}
        >
          Generate Schedule
        </button>
        <button
          className={selectedView === 'schedule' ? 'active' : ''}
          onClick={() => setSelectedView('schedule')}
        >
          View Schedule
        </button>
      </div>

      {selectedView === 'availability' && (
        <div className="availability-view">
          <h2>Team Availability</h2>
          <div className="members-list">
            <h3>Members ({members.length})</h3>
            {members.map((member) => (
              <div key={member.id} className="member-item">
                {member.first_name} {member.last_name} ({member.role})
              </div>
            ))}
          </div>
          <AvailabilityGrid availability={availability} readOnly />
          <div className="availability-legend">
            {availability.length > 0 && (
              <div className="legend-items">
                {[...new Set(availability.map((a) => a.user_id))].map((userId) => {
                  const user = availability.find((a) => a.user_id === userId);
                  return (
                    <span key={userId} className="legend-item">
                      {user?.first_name} {user?.last_name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedView === 'generate' && (
        <div className="generate-view">
          <h2>Generate Schedule with AI</h2>
          
          <div className="form-group">
            <label>Week Starting</label>
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
            />
          </div>

          <h3>Shifts Needed</h3>
          {shiftsNeeded.map((shift, index) => (
            <div key={index} className="shift-requirement">
              <select
                value={shift.day_of_week}
                onChange={(e) => updateShiftRequirement(index, 'day_of_week', e.target.value)}
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
              <input
                type="time"
                value={shift.start_time}
                onChange={(e) => updateShiftRequirement(index, 'start_time', e.target.value)}
              />
              <span>to</span>
              <input
                type="time"
                value={shift.end_time}
                onChange={(e) => updateShiftRequirement(index, 'end_time', e.target.value)}
              />
              <input
                type="number"
                min="1"
                value={shift.min_workers}
                onChange={(e) => updateShiftRequirement(index, 'min_workers', e.target.value)}
                className="workers-input"
              />
              <span>workers</span>
              <button onClick={() => removeShiftRequirement(index)} className="btn-remove">
                ×
              </button>
            </div>
          ))}

          <button onClick={addShiftRequirement} className="btn-secondary">
            + Add Shift
          </button>

          <div className="generate-action">
            <button onClick={handleGenerate} disabled={generating} className="btn-primary">
              {generating ? 'Generating...' : '🤖 Generate Schedule with AI'}
            </button>
          </div>
        </div>
      )}

      {selectedView === 'schedule' && (
        <div className="schedule-view">
          <h2>Generated Schedule</h2>
          <p className="schedule-week">Week of: {weekStartDate}</p>
          
          {schedule.length === 0 ? (
            <p>No schedule generated yet. Go to "Generate Schedule" tab to create one.</p>
          ) : (
            <div className="schedule-list">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, dayIndex) => {
                // Calculate the date for this day
                const dayDate = new Date(weekStartDate);
                dayDate.setDate(dayDate.getDate() + dayIndex);
                const dayDateStr = dayDate.toISOString().split('T')[0];
                
                // Filter shifts for this day
                const dayShifts = schedule.filter((s) => s.shift_date === dayDateStr);
                
                return (
                  <div key={dayIndex} className="schedule-day">
                    <h3>{day}</h3>
                    <p className="schedule-date">{dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    {dayShifts.length === 0 ? (
                      <p className="no-shifts">No shifts</p>
                    ) : (
                      dayShifts.map((shift, idx) => (
                        <div key={shift.id || idx} className="shift-item">
                          <span className="shift-time">
                            {shift.start_time} - {shift.end_time}
                          </span>
                          <span className="shift-employee">
                            {shift.first_name} {shift.last_name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Debug: Show raw schedule data */}
          <details className="debug-section">
            <summary>Debug: Raw Schedule Data</summary>
            <pre>{JSON.stringify(schedule, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ManageSchedule;