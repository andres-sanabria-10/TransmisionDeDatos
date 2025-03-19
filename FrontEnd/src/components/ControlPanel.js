import React from 'react';

const ControlPanel = ({ title, params, setParams, type }) => {
  const handleVoltajeChange = (e) => {
    setParams({
      ...params,
      voltaje: parseFloat(e.target.value)
    });
  };

  const handleFrecuenciaChange = (e) => {
    setParams({
      ...params,
      frecuencia: parseFloat(e.target.value)
    });
  };

  const handleFaseChange = (e) => {
    setParams({
      ...params,
      fase: parseFloat(e.target.value)
    });
  };

  return (
    <div className="box control-panel">
      <h5>{title}</h5>
      <label>Voltaje: <span>{params.voltaje.toFixed(1)}V</span></label>
      <input 
        type="range" 
        className="form-range" 
        min="1" 
        max="5" 
        step="0.1" 
        value={params.voltaje}
        onChange={handleVoltajeChange}
      />

      <label>Frecuencia: <span>{params.frecuencia}Hz</span></label>
      <input 
        type="range" 
        className="form-range" 
        min="20" 
        max="5000" 
        step="1" 
        value={params.frecuencia}
        onChange={handleFrecuenciaChange}
      />

      <label>Fase: <span>{(params.fase / Math.PI).toFixed(2)}π</span></label>
      <input 
        type="range" 
        className="form-range" 
        min="0" 
        max="6.28" 
        step="0.01" 
        value={params.fase}
        onChange={handleFaseChange}
      />
    </div>
  );
};

export default ControlPanel;