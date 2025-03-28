import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SignalDisplay from './SignalDisplay';
import DigitalSignalDisplay from './DigitalSignalDisplay';

const ModulacionDigital = () => {
  // Asegurar que el body tenga fondo blanco cuando se muestra esta página
  React.useEffect(() => {
    document.body.style.backgroundColor = '#ffffff';
    
    return () => {
      // Restaurar cuando se desmonte
      document.body.style.backgroundColor = '';
    };
  }, []);

  // Estados para los parámetros de la portadora
  const [portadoraParams, setPortadoraParams] = useState({
    voltaje: 5,
    frecuencia: 300

  });

  // Estado para la secuencia de bits (moduladora)
  const [bitSequence, setBitSequence] = useState('10110010');

  // Estado para el tipo de modulación
  const [modulationType, setModulationType] = useState('ASK');
  
  // Estado para las señales
  const [signals, setSignals] = useState({
    t: [],
    portadora: [],
    moduladora: [],
    modulada: [],
    bit_sequence: []
  });

  // Parámetros específicos para FSK
  const [fskParams, setFskParams] = useState({
    fp_low: 800,
    fp_high: 1200
  });

  // Títulos según el tipo de modulación
  const modulationTitles = {
    'ASK': 'Modulación por Desplazamiento de Amplitud (ASK)',
    'FSK': 'Modulación por Desplazamiento de Frecuencia (FSK)',
    'PSK': 'Modulación por Desplazamiento de Fase (PSK)'
  };

  // Función para manejar cambios en los parámetros de la portadora
  const handlePortadoraChange = (e) => {
    const { name, value } = e.target;
    setPortadoraParams({
      ...portadoraParams,
      [name]: parseFloat(value)
    });
  };

  // Función para manejar cambios en los parámetros de FSK
  const handleFskChange = (e) => {
    const { name, value } = e.target;
    setFskParams({
      ...fskParams,
      [name]: parseFloat(value)
    });
  };

  // Función para manejar cambios en la secuencia de bits
  const handleBitSequenceChange = (e) => {
    // Filtrar para asegurar que solo se ingresen 0s y 1s
    const filteredValue = e.target.value.replace(/[^01]/g, '');
    setBitSequence(filteredValue);
  };

  // Función para generar la modulación
  const generateModulation = async () => {
    try {
      const response = await axios.post('http://localhost:5001/modulacion_digital', {
        Vp: portadoraParams.voltaje,
        fp: portadoraParams.frecuencia,
        tipo: modulationType,
        bit_sequence: bitSequence,
        fp_low: fskParams.fp_low,
        fp_high: fskParams.fp_high
      });
      
      setSignals(response.data);
    } catch (error) {
      console.error('Error al generar modulación digital:', error);
      alert(error.response?.data?.error || 'Error al comunicarse con el backend');
    }
  };

  // Generar modulación automáticamente al cargar o cambiar el tipo
  useEffect(() => {
    generateModulation();
  }, [modulationType]);

  // También regenerar cuando cambien los parámetros
  useEffect(() => {
    const timer = setTimeout(() => {
      generateModulation();
    }, 500); // Pequeño retraso para evitar demasiadas solicitudes
    
    return () => clearTimeout(timer);
  }, [portadoraParams, bitSequence, fskParams]);

  return (
    <div className="container-fluid modulacion-container">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-center">{modulationTitles[modulationType] || 'Modulación Digital'}</h2>
        </div>
      </div>
      
      {/* Primera fila: Portadora */}
      <div className="row mt-4">
        {/* Panel de control Portadora */}
        <div className="col-md-3">
          <div className="box">
            <h5>Señal Portadora</h5>
            <div className="mb-3">
              <label>Amplitud: <span>{portadoraParams.voltaje.toFixed(1)}V</span></label>
              <input 
                type="range" 
                className="form-range" 
                min="1" 
                max="5" 
                step="0.1" 
                name="voltaje"
                value={portadoraParams.voltaje}
                onChange={handlePortadoraChange}
              />
            </div>
            
            <div className="mb-3">
              <label>Frecuencia: <span>{portadoraParams.frecuencia}Hz</span></label>
              <input 
                type="range" 
                className="form-range" 
                min="300" 
                max="1000" 
                step="50" 
                name="frecuencia"
                value={portadoraParams.frecuencia}
                onChange={handlePortadoraChange}
              />
            </div>
            
            {/* Parámetros específicos para FSK */}
            {modulationType === 'FSK' && (
              <>
                <div className="mb-3">
                  <label>Frecuencia baja: <span>{fskParams.fp_low}Hz</span></label>
                  <input 
                    type="range" 
                    className="form-range" 
                    min="400" 
                    max={portadoraParams.frecuencia - 100} 
                    step="50" 
                    name="fp_low"
                    value={fskParams.fp_low}
                    onChange={handleFskChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label>Frecuencia alta: <span>{fskParams.fp_high}Hz</span></label>
                  <input 
                    type="range" 
                    className="form-range" 
                    min={portadoraParams.frecuencia + 100} 
                    max="2500" 
                    step="50" 
                    name="fp_high"
                    value={fskParams.fp_high}
                    onChange={handleFskChange}
                  />
                </div>
              </>
            )}
            
            <button 
              className="btn btn-primary w-100"
              onClick={generateModulation}
            >
              Generar Gráfica
            </button>
          </div>
        </div>
        
        {/* Gráfica Portadora */}
        <div className="col-md-9">
          <div className="box">
            <h5>Gráfica Portadora</h5>
            <SignalDisplay 
              data={{
                t: signals.t,
                señal: signals.portadora
              }}
              yRange={[-6, 6]}
              xRange={[0, 0.2]}
            />
          </div>
        </div>
      </div>

      {/* Segunda fila: Moduladora (Señal Digital) */}
      <div className="row mt-4">
        {/* Panel de control Moduladora */}
        <div className="col-md-3">
          <div className="box">
            <h5>Señal Moduladora (Digital)</h5>
            <div className="mb-3">
              <label>Secuencia de bits:</label>
              <input 
                type="text" 
                className="form-control mt-2" 
                value={bitSequence}
                onChange={handleBitSequenceChange}
                placeholder="Ingrese secuencia de bits (0s y 1s)"
                maxLength="16"
              />
              <small className="text-muted">Máximo 16 bits</small>
            </div>
            
            <div className="bit-sequence-container p-3">
              {bitSequence.split('').map((bit, index) => (
                <span 
                  key={index} 
                  className={`bit-box ${bit === '1' ? 'bit-one' : 'bit-zero'}`}
                  style={{
                    display: 'inline-block',
                    width: '30px',
                    height: '30px',
                    margin: '5px',
                    textAlign: 'center',
                    lineHeight: '30px',
                    backgroundColor: bit === '1' ? '#4CAF50' : '#F44336',
                    color: 'white',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  {bit}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Gráfica Moduladora */}
        <div className="col-md-9">
          <div className="box">
            <h5>Gráfica Moduladora</h5>
            <DigitalSignalDisplay 
              data={{
                t: signals.t,
                señal: signals.moduladora
              }}
              yRange={[-0.1, 1.1]}
              xRange={[0, 0.2]}
            />
          </div>
        </div>
      </div>

      {/* Tercera fila: Señal Modulada */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="box">
            <h5>Información de Modulación</h5>
            <div className="p-3">
              {/* Selector de tipo de modulación movido aquí */}
              <div className="mb-3">
                <label><strong>Tipo de modulación:</strong></label>
                <select 
                  className="form-select form-select-sm w-100 mt-2"
                  value={modulationType}
                  onChange={(e) => setModulationType(e.target.value)}
                >
                  <option value="ASK">Modulación ASK</option>
                  <option value="FSK">Modulación FSK</option>
                  <option value="PSK">Modulación PSK</option>
                </select>
              </div>
              
              <p><strong>Bits:</strong> {bitSequence.length}</p>
              <p><strong>Amplitud portadora:</strong> {portadoraParams.voltaje}V</p>
              <p><strong>Frecuencia portadora:</strong> {portadoraParams.frecuencia}Hz</p>
              {modulationType === 'FSK' && (
                <>
                  <p><strong>Frecuencia baja:</strong> {fskParams.fp_low}Hz</p>
                  <p><strong>Frecuencia alta:</strong> {fskParams.fp_high}Hz</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Gráfica Señal Modulada */}
        <div className="col-md-9">
          <div className="box">
            <h5>Señal Modulada</h5>
            <SignalDisplay 
              data={{
                t: signals.t,
                señal: signals.modulada
              }}
              yRange={[-6, 6]}
              xRange={[0, 0.2]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulacionDigital;