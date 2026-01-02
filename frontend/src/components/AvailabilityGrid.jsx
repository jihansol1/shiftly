import { useState, useEffect, useRef } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const AvailabilityGrid = ({ availability, onChange, readOnly = false }) => {
  const [grid, setGrid] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [dragState, setDragState] = useState(null); // true = selecting, false = deselecting
  const gridRef = useRef(null);

  useEffect(() => {
    const newGrid = {};
    DAYS.forEach((_, dayIndex) => {
      HOURS.forEach((hour) => {
        newGrid[`${dayIndex}-${hour}`] = false;
      });
    });

    if (availability) {
      availability.forEach((block) => {
        const startHour = parseInt(block.start_time.split(':')[0]);
        const endHour = parseInt(block.end_time.split(':')[0]);
        for (let h = startHour; h < endHour; h++) {
          newGrid[`${block.day_of_week}-${h}`] = true;
        }
      });
    }

    setGrid(newGrid);
  }, [availability]);

  const toggleCell = (dayIndex, hour, newState = null) => {
    if (readOnly) return;

    const key = `${dayIndex}-${hour}`;
    const currentState = grid[key];
    const targetState = newState !== null ? newState : !currentState;
    
    const newGrid = { ...grid, [key]: targetState };
    setGrid(newGrid);

    if (onChange) {
      const availabilities = convertGridToAvailability(newGrid);
      onChange(availabilities);
    }
    
    return targetState;
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

  const fillRange = (start, end, targetState) => {
    const newGrid = { ...grid };
    const minDay = Math.min(start.dayIndex, end.dayIndex);
    const maxDay = Math.max(start.dayIndex, end.dayIndex);
    const minHour = Math.min(start.hour, end.hour);
    const maxHour = Math.max(start.hour, end.hour);

    for (let d = minDay; d <= maxDay; d++) {
      for (let h = minHour; h <= maxHour; h++) {
        newGrid[`${d}-${h}`] = targetState;
      }
    }

    setGrid(newGrid);
    if (onChange) {
      const availabilities = convertGridToAvailability(newGrid);
      onChange(availabilities);
    }
  };

  const handleMouseDown = (dayIndex, hour) => {
    if (readOnly) return;
    
    const key = `${dayIndex}-${hour}`;
    const currentState = grid[key];
    const startPos = { dayIndex, hour };
    
    setDragStart(startPos);
    setDragEnd(startPos);
    setIsDragging(true);
    setDragState(!currentState); // If currently false, we're selecting (true), else deselecting (false)
    
    toggleCell(dayIndex, hour);
  };

  const handleMouseEnter = (dayIndex, hour) => {
    if (readOnly || !isDragging || !dragStart) return;
    
    const endPos = { dayIndex, hour };
    setDragEnd(endPos);
    fillRange(dragStart, endPos, dragState);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setDragState(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      setDragState(null);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <div className="availability-grid" ref={gridRef}>
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
                className={`grid-cell ${grid[`${dayIndex}-${hour}`] ? 'selected' : ''} ${readOnly ? 'readonly' : ''} ${isDragging ? 'dragging' : ''}`}
                onMouseDown={() => handleMouseDown(dayIndex, hour)}
                onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                onMouseUp={handleMouseUp}
                style={{ cursor: readOnly ? 'default' : 'pointer' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailabilityGrid;