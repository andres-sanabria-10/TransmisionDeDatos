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
    frecuencia: 20,
    fase: Math.PI
  });

  // Estados para señal portadora
  const [portadoraParams, setPortadoraParams] = useState({
    voltaje: 5,
    frecuencia: 300,
    fase: Math.PI
  });

  // Estado para la señal modulada
  const [modulatedSignal, setModulatedSignal] = useState({
    t: [],
    señal: []
  });

  // Estado para el tipo de modulación
  const [modulationType, setModulationType] = useState('AM');

  // Títulos según el tipo de modulación
  const modulationTitles = {
    'AM': 'Modulación de Amplitud (AM)',
    'FM': 'Modulación de Frecuencia (FM)',
    'PM': 'Modulación de Fase (PM)'
  };

  // Función para generar la modulación
  const [modulationIndex, setModulationIndex] = useState(0); // Estado para el índice de modulación

  const generateModulation = async () => {
    try {
      // Usar el nuevo endpoint para todos los tipos
      const response = await axios.post('http://localhost:5000/modulacion', {
        Vp: portadoraParams.voltaje,
        fp: portadoraParams.frecuencia,
        Vm: moduladoraParams.voltaje,
        fm: moduladoraParams.frecuencia,
        Fasem: moduladoraParams.fase,
        Fasep: portadoraParams.fase,
        tipo: modulationType
      });
  
      setModulatedSignal(response.data);
      
      // Actualizar el estado del índice de modulación con el valor recibido del backend
      if (response.data.indice_modulacion !== undefined) {
        setModulationIndex(response.data.indice_modulacion);
      }
      
      console.log('Modulación generada:', response.data);
    } catch (error) {
      console.error('Error al generar modulación:', error);
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
  }, [moduladoraParams, portadoraParams]);

  return (
    <div className="container-fluid modulacion-container">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-center">{modulationTitles[modulationType] || 'Modulación'}</h2>
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
                <option value="AM">Modulación de Amplitud (AM)</option>
                <option value="FM">Modulación de Frecuencia (FM)</option>
                <option value="PM">Modulación de Fase (PM)</option>
              </select>
              {modulationType && (
                <div className="box">
                  <h5>Índice de Modulación ({modulationType === "AM" ? "m" : modulationType === "FM" ? "β" : "m"})</h5>
                  <input
                    type="text"
                    className="form-control"
                    value={modulationIndex !== null ? modulationIndex.toFixed(2) : "N/A"}
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>
        </div>

     
  );
};

export default ModulacionAM;
