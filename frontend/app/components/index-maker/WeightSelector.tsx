'use client';

import React from 'react';

interface WeightSelectorProps {
  weight: 'cap' | 'equal';
  setWeight: (weight: 'cap' | 'equal') => void;
}

const WeightSelector: React.FC<WeightSelectorProps> = ({ weight, setWeight }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '16px', 
        fontWeight: '600', 
        color: '#111827', 
        marginBottom: '12px' 
      }}>
        Index Weighting
      </label>
      <div style={{ display: 'flex', gap: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="radio"
            name="weight"
            value="cap"
            checked={weight === 'cap'}
            onChange={(e) => setWeight(e.target.value as 'cap' | 'equal')}
            style={{ margin: 0 }}
          />
          <span style={{ fontSize: '13px', color: '#374151' }}>Market Cap</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="radio"
            name="weight"
            value="equal"
            checked={weight === 'equal'}
            onChange={(e) => setWeight(e.target.value as 'cap' | 'equal')}
            style={{ margin: 0 }}
          />
          <span style={{ fontSize: '13px', color: '#374151' }}>Equal</span>
        </label>
      </div>
    </div>
  );
};

export default WeightSelector;
