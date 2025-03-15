import React, { useState, useEffect } from 'react';
import ControlPanel from './ControlPanel';
import OsciloscopioPortadora from './OsciloscopioPortadora';
import OsciloscopioModuladora from './OsciloscopioModuladora';
import SignalDisplay from './SignalDisplay';
import axios from 'axios';

const ModulacionAM = () => {
  // Asegurar que el body tenga fondo blanco cuando se muestra esta página
  React.useEffect(() => {
    document.body.style.backgroundColor = '#ffffff';
    
    return () => {
      // Restaurar cuando se desmonte
      document.body.style.backgroundColor = '';
    };
  }, []);

  // Estados para señal moduladora
  const [moduladoraParams, setModuladoraParams] = useState({
    voltaje: 3,
    frecuencia: 500,
    fase: Math.PI,
    isRunning: true
  });

  // Estados para señal portadora
  const [portadoraParams, setPortadoraParams] = useState({
    voltaje: 5,
    frecuencia: 2000,
    fase: Math.PI,
    isRunning: true
  });

  // Estado para la señal modulada
  const [modulatedSignal, setModulatedSignal] = useState({
    t: [],
    señal: []
  });

  // Estado para el tipo de modulación
  const [modulationType, setModulationType] = useState('AM');

  // Función para generar la modulación
  const generateModulation = async () => {
    try {
      // Calcular índice de modulación
      const m = moduladoraParams.voltaje / portadoraParams.voltaje;
      
      const response = await axios.post('http://localhost:5000/modulacion_amplitud', {
        Vp: portadoraParams.voltaje,
        fp: portadoraParams.frecuencia,
        fm: moduladoraParams.frecuencia,
        m: m
      });
      
      setModulatedSignal(response.data);
    } catch (error) {
      console.error('Error al generar modulación:', error);
      alert(error.response?.data?.error || 'Error al comunicarse con el backend');
    }
  };

  // Generar modulación automáticamente al cargar
  useEffect(() => {
    generateModulation();
  }, []);

  return (
    <div className="container-fluid modulacion-container">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-center">Modulación de Amplitud (AM)</h2>
        </div>
      </div>
      
      {/* Primera fila: Moduladora */}
      <div className="row mt-4">
        {/* Panel de control Moduladora */}
        <div className="col-md-3">
          <ControlPanel 
            title="Señal Moduladora"
            params={moduladoraParams}
            setParams={setModuladoraParams}
            type="moduladora"
          />
        </div>
        
        {/* Gráfica Moduladora */}
        <div className="col-md-9">
          <div className="box">
            <h5>Gráfica Moduladora</h5>
            <OsciloscopioModuladora 
              params={moduladoraParams}
            />
          </div>
        </div>
      </div>

      {/* Segunda fila: Portadora */}
      <div className="row mt-4">
        {/* Panel de control Portadora */}
        <div className="col-md-3">
          <ControlPanel 
            title="Señal Portadora"
            params={portadoraParams}
            setParams={setPortadoraParams}
            type="portadora"
          />
        </div>
        
        {/* Gráfica Portadora */}
        <div className="col-md-9">
          <div className="box">
            <h5>Gráfica Portadora</h5>
            <OsciloscopioPortadora 
              params={portadoraParams}
            />
          </div>
        </div>
      </div>

      {/* Tercera fila: Tipo de Modulación y Señal Modulada */}
      <div className="row mt-4">
        {/* Panel de Tipo de Modulación */}
        <div className="col-md-3">
          <div className="box">
            <h5>Tipo de modulación</h5>
            <div className="p-3 modulacion-panel">
              <select 
                className="form-select form-select-sm w-100 mb-3"
                value={modulationType}
                onChange={(e) => setModulationType(e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="AM">AM</option>
                <option value="EXPONENCIAL">EXPONENCIAL</option>
                <option value="FM">FM</option>
              </select>
              <button 
                className="btn btn-primary w-100"
                onClick={generateModulation}
              >
                Generar Gráfica
              </button>
            </div>
          </div>
        </div>
        
        {/* Gráfica Señal Modulada */}
        <div className="col-md-9">
          <div className="box">
            <h5>Señal Modulada</h5>
            <SignalDisplay 
              data={modulatedSignal}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulacionAM;