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

  const { officeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailability();
  }, [officeId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMyAvailability(officeId);
      setAvailability(response.data || []);
    } catch (err) {
      console.error('Error fetching availability:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to load availability. Please refresh the page.';
      setError(errorMessage);
      setAvailability([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleGridChange = (newAvailability) => {
    setAvailability(newAvailability);
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await submitAvailability(officeId, availability);
      setSuccess('Availability saved successfully!');
    } catch (err) {
      console.error('Error saving availability:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to save availability. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

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

      <p className="instructions">
        Click or drag on the time slots when you are available to work.
      </p>

      <AvailabilityGrid
        availability={availability}
        onChange={handleGridChange}
      />

      <div className="page-actions">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </div>
  );
};

export default SubmitAvailability;