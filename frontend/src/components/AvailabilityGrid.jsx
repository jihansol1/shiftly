import { useState, useEffect } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Colors for different employees
const EMPLOYEE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

const AvailabilityGrid = ({ availability, onChange, readOnly = false, showLegend = false }) => {
  const [grid, setGrid] = useState({});
  const [employeeMap, setEmployeeMap] = useState({});

  useEffect(() => {
    const newGrid = {};
    const newEmployeeMap = {};
    
    DAYS.forEach((_, dayIndex) => {
      HOURS.forEach((hour) => {
        newGrid[`${dayIndex}-${hour}`] = readOnly ? [] : false;
      });
    });

    if (availability && availability.length > 0) {
      if (readOnly) {
        // For employer view: track multiple employees per cell
        const uniqueUsers = [...new Set(availability.map(a => a.user_id))];
        uniqueUsers.forEach((userId, index) => {
          const userAvail = availability.find(a => a.user_id === userId);
          newEmployeeMap[userId] = {
            name: `${userAvail.first_name} ${userAvail.last_name}`,
            color: EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length]
          };
        });
        
        availability.forEach((block) => {
          const startHour = parseInt(block.start_time.split(':')[0]);
          const endHour = parseInt(block.end_time.split(':')[0]);
          for (let h = startHour; h < endHour; h++) {
            const key = `${block.day_of_week}-${h}`;
            if (!newGrid[key].includes(block.user_id)) {
              newGrid[key].push(block.user_id);
            }
          }
        });
      } else {
        // For employee view: simple boolean
        availability.forEach((block) => {
          const startHour = parseInt(block.start_time.split(':')[0]);
          const endHour = parseInt(block.end_time.split(':')[0]);
          for (let h = startHour; h < endHour; h++) {
            newGrid[`${block.day_of_week}-${h}`] = true;
          }
        });
      }
    }

    setGrid(newGrid);
    setEmployeeMap(newEmployeeMap);
  }, [availability, readOnly]);

  const toggleCell = (dayIndex, hour) => {
    if (readOnly) return;

    const key = `${dayIndex}-${hour}`;
    const newGrid = { ...grid, [key]: !grid[key] };
    setGrid(newGrid);

    if (onChange) {
      const availabilities = convertGridToAvailability(newGrid);
      onChange(availabilities);
    }
  };

  const convertGridToAvailability = (gridData) => {
    const result = [];

    DAYS.forEach((_, dayIndex) => {
      let startHour = null;

      HOURS.forEach((hour) => {
        const isSelected = gridData[`${dayIndex}-${hour}`];

        if (isSelected && startHour === null) {
          startHour = hour;
        } else if (!isSelected && startHour !== null) {
          result.push({
            day_of_week: dayIndex,
            start_time: `${startHour.toString().padStart(2, '0')}:00`,
            end_time: `${hour.toString().padStart(2, '0')}:00`,
          });
          startHour = null;
        }
      });

      if (startHour !== null) {
        result.push({
          day_of_week: dayIndex,
          start_time: `${startHour.toString().padStart(2, '0')}:00`,
          end_time: '24:00',
        });
      }
    });

    return result;
  };

  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const getCellStyle = (dayIndex, hour) => {
    const key = `${dayIndex}-${hour}`;
    
    if (readOnly) {
      const users = grid[key] || [];
      if (users.length === 0) return {};
      
      if (users.length === 1) {
        return { backgroundColor: employeeMap[users[0]]?.color || '#3b82f6' };
      }
      
      // Multiple employees: create gradient
      const colors = users.map(uid => employeeMap[uid]?.color || '#3b82f6');
      const gradientStops = colors.map((color, i) => 
        `${color} ${(i / colors.length) * 100}%, ${color} ${((i + 1) / colors.length) * 100}%`
      ).join(', ');
      
      return { background: `linear-gradient(135deg, ${gradientStops})` };
    }
    
    return grid[key] ? { backgroundColor: '#3b82f6' } : {};
  };

  const isSelected = (dayIndex, hour) => {
    const key = `${dayIndex}-${hour}`;
    if (readOnly) {
      return (grid[key] || []).length > 0;
    }
    return grid[key];
  };

  return (
    <div className="availability-grid-container">
      {showLegend && Object.keys(employeeMap).length > 0 && (
        <div className="employee-legend">
          <h4>Team Members:</h4>
          <div className="legend-items">
            {Object.entries(employeeMap).map(([userId, data]) => (
              <div key={userId} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ backgroundColor: data.color }}
                />
                <span className="legend-name">{data.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="availability-grid">
        <div className="grid-header">
          <div className="grid-corner"></div>
          {DAYS.map((day) => (
            <div key={day} className="grid-day-header">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        <div className="grid-body">
          {HOURS.map((hour) => (
            <div key={hour} className="grid-row">
              <div className="grid-hour">{formatHour(hour)}</div>
              {DAYS.map((_, dayIndex) => (
                <div
                  key={`${dayIndex}-${hour}`}
                  className={`grid-cell ${isSelected(dayIndex, hour) ? 'selected' : ''} ${readOnly ? 'readonly' : ''}`}
                  style={getCellStyle(dayIndex, hour)}
                  onClick={() => toggleCell(dayIndex, hour)}
                  title={readOnly ? (grid[`${dayIndex}-${hour}`] || []).map(uid => employeeMap[uid]?.name).join(', ') : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityGrid;