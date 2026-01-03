import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyAvailability, submitAvailability } from '../services/api';
import AvailabilityGrid from '../components/AvailabilityGrid';

const SubmitAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(getNextMonday());

  const { officeId } = useParams();
  const navigate = useNavigate();

  function getNextMonday() {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toISOString().split('T')[0];
  }

  function getWeekDates(startDate) {
    const dates = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  useEffect(() => {
    fetchAvailability();
  }, [officeId]);

  const fetchAvailability = async () => {
    try {
      const response = await getMyAvailability(officeId);
      setAvailability(response.data);
    } catch (err) {
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleGridChange = (newAvailability) => {
    setAvailability(newAvailability);
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await submitAvailability(officeId, availability);
      setSuccess('Availability saved successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const weekDates = getWeekDates(weekStartDate);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="availability-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back
        </button>
        <h1>My Availability</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="week-selector">
        <label>Week of:</label>
        <input
          type="date"
          value={weekStartDate}
          onChange={(e) => setWeekStartDate(e.target.value)}
        />
        <span className="week-range">
          {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
        </span>
      </div>

      <p className="instructions">
        Click on the time slots when you are available to work. 
        This is your recurring weekly availability.
      </p>

      <div className="availability-grid-wrapper">
        <div className="day-dates-header">
          <div className="date-corner"></div>
          {weekDates.map((date, index) => (
            <div key={index} className="date-header">
              {formatDate(date)}
            </div>
          ))}
        </div>
        <AvailabilityGrid
          availability={availability}
          onChange={handleGridChange}
        />
      </div>

      <div className="page-actions">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </div>
  );
};

export default SubmitAvailability;