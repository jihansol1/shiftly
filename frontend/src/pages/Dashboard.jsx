import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOffices, createOffice, joinOffice } from '../services/api';

const Dashboard = () => {
  const [offices, setOffices] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [officeName, setOfficeName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    try {
      const response = await getMyOffices();
      setOffices(response.data);
    } catch (err) {
      setError('Failed to load offices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffice = async (e) => {
    e.preventDefault();
    try {
      await createOffice(officeName);
      setShowCreateModal(false);
      setOfficeName('');
      fetchOffices();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create office');
    }
  };

  const handleJoinOffice = async (e) => {
    e.preventDefault();
    try {
      await joinOffice(inviteCode);
      setShowJoinModal(false);
      setInviteCode('');
      fetchOffices();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to join office');
    }
  };

  const goToOffice = (office) => {
    if (office.owner_id === user.id) {
      navigate(`/office/${office.id}/manage`);
    } else {
      navigate(`/office/${office.id}/availability`);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Offices</h1>
        <div className="dashboard-actions">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Office
          </button>
          <button onClick={() => setShowJoinModal(true)} className="btn-secondary">
            Join Office
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="offices-grid">
        {offices.length === 0 ? (
          <p className="no-offices">No offices yet. Create or join one!</p>
        ) : (
          offices.map((office) => (
            <div key={office.id} className="office-card" onClick={() => goToOffice(office)}>
              <h3>{office.name}</h3>
              <p className="office-role">
                {office.owner_id === user.id ? '👑 Owner' : '👤 Member'}
              </p>
              {office.owner_id === user.id && (
                <p className="invite-code">Invite Code: {office.invite_code}</p>
              )}
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Office</h2>
            <form onSubmit={handleCreateOffice}>
              <div className="form-group">
                <label>Office Name</label>
                <input
                  type="text"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Join Office</h2>
            <form onSubmit={handleJoinOffice}>
              <div className="form-group">
                <label>Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;