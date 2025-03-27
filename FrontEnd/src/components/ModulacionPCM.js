import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SignalDisplay from './SignalDisplay';

const ModulacionPCM = () => {
  // Asegurar que el body tenga fondo oscuro cuando se muestra esta página
  React.useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    
    return () => {
      // Restaurar cuando se desmonte
      document.body.style.backgroundColor = '';
    };
  }, []);

  // Estados para los parámetros
  const [analogParams, setAnalogParams] = useState({
    signal_type: 'sine',
    amplitude: 1.0,
    frequency: 100
  });

  const [pcmParams, setPcmParams] = useState({
    sampling_rate: 1000,
    bits: 8,
    pcm_type: 'linear'
  });

  // Estado para las señales
  const [signals, setSignals] = useState({
    t: [],
    analog_signal: [],
    pulse_signal: [],
    staircase_signal: [],
    error_signal: [],
    sampling_times: [],
    sampled_values: [],
    quantized_values: [],
    binary_codes: [],
    snr: 0
  });

  // Función para manejar cambios en los parámetros de la señal analógica
  const handleAnalogChange = (e) => {
    const { name, value } = e.target;
    setAnalogParams({
      ...analogParams,
      [name]: name === 'signal_type' ? value : parseFloat(value)
    });
  };

  // Función para manejar cambios en los parámetros de PCM
  const handlePcmChange = (e) => {
    const { name, value } = e.target;
    setPcmParams({
      ...pcmParams,
      [name]: name === 'pcm_type' ? value : parseInt(value)
    });
  };

  // Función para generar la modulación PCM
  const generatePCM = async () => {
    try {
      const response = await axios.post('http://localhost:5002/modulacion_pcm', {
        ...analogParams,
        ...pcmParams
      });
      
      setSignals(response.data);
    } catch (error) {
      console.error('Error al generar modulación PCM:', error);
      alert(error.response?.data?.error || 'Error al comunicarse con el backend');
    }
  };

  // Generar modulación automáticamente al cargar o cambiar parámetros
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePCM();
    }, 500); // Pequeño retraso para evitar demasiadas solicitudes
    
    return () => clearTimeout(timer);
  }, [analogParams, pcmParams]);

  // Función para renderizar los códigos binarios
  const renderBinaryCodes = () => {
    if (!signals.binary_codes || signals.binary_codes.length === 0) return null;
    
    // Mostrar solo los primeros 20 códigos para no sobrecargar la UI
    const displayCodes = signals.binary_codes.slice(0, 20);
    
    return (
      <div className="binary-codes-container mt-3">
        <h6 className="text-light">Códigos Binarios (primeras 20 muestras):</h6>
        <div className="d-flex flex-wrap">
          {displayCodes.map((code, index) => (
            <div 
              key={index} 
              className="binary-code-box m-1 p-1"
              style={{
                border: '1px solid #444',
                borderRadius: '4px',
                fontSize: '0.8rem',
                backgroundColor: '#2a2a2a',
                color: '#4CAF50'
              }}
            >
              <small>{index}: {code}</small>
            </div>
          ))}
        </div>
        {signals.binary_codes.length > 20 && (
          <small className="text-light">
            Mostrando 20 de {signals.binary_codes.length} códigos...
          </small>
        )}
      </div>
    );
  };

  // Función para crear datos para la gráfica comparativa
  const getComparisonData = () => {
    if (!signals.t || !signals.analog_signal || !signals.staircase_signal) {
      return {
        t: [],
        señal: [],
        señal2: []
      };
    }
    
    return {
      t: signals.t,
      señal: signals.analog_signal,
      señal2: signals.staircase_signal
    };
  };

  return (
    <div className="container-fluid modulacion-container">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-center text-light">Modulación por Impulsos Codificados (PCM)</h2>
        </div>
      </div>
      
      {/* Primera fila: Señal Analógica */}
      <div className="row mt-4">
        {/* Panel de control Señal Analógica */}
        <div className="col-md-3">
          <div className="box">
            <h5 className="text-light">Señal Analógica de Entrada</h5>
            <div className="mb-3">
              <label className="text-light">Tipo de Señal:</label>
              <select 
                className="form-select form-select-sm w-100 mt-2 bg-dark text-light"
                name="signal_type"
                value={analogParams.signal_type}
                onChange={handleAnalogChange}
              >
                <option value="sine">Senoidal</option>
                <option value="triangle">Triangular</option>
                <option value="sawtooth">Diente de Sierra</option>
              </select>
            </div>
            
            <div className="mb-3">
              <label className="text-light">Amplitud: <span>{analogParams.amplitude.toFixed(1)}V</span></label>
              <input 
                type="range" 
                className="form-range" 
                min="0.1" 
                max="5" 
                step="0.1" 
                name="amplitude"
                value={analogParams.amplitude}
                onChange={handleAnalogChange}
              />
            </div>
            
            <div className="mb-3">
              <label className="text-light">Frecuencia: <span>{analogParams.frequency}Hz</span></label>
              <input 
                type="range" 
                className="form-range" 
                min="10" 
                max="500" 
                step="10" 
                name="frequency"
                value={analogParams.frequency}
                onChange={handleAnalogChange}
              />
            </div>
            
            <button 
              className="btn btn-primary w-100"
              onClick={generatePCM}
            >
              Generar PCM
            </button>
          </div>
        </div>
        
        {/* Gráfica Señal Analógica */}
        <div className="col-md-9">
          <div className="box">
            <h5 className="text-light">Señal Analógica Original</h5>
            <SignalDisplay 
              data={{
                t: signals.t,
                señal: signals.analog_signal
              }}
              yRange={[-6, 6]}
              xRange={[0, 0.1]}
              id="analog-signal-chart"
            />
          </div>
        </div>
      </div>

      {/* Segunda fila: Muestreo */}
      <div className="row mt-4">
        {/* Panel de control PCM */}
        <div className="col-md-3">
          <div className="box">
            <h5 className="text-light">Parámetros de PCM</h5>
            <div className="mb-3">
              <label className="text-light">Frecuencia de Muestreo: <span>{pcmParams.sampling_rate}Hz</span></label>
              <input 
                type="range" 
                className="form-range" 
                min="200" 
                max="2000" 
                step="100" 
                name="sampling_rate"
                value={pcmParams.sampling_rate}
                onChange={handlePcmChange}
              />
              <small className="text-light">
                Teorema de Nyquist: fs &gt; 2 * fmax ({2 * analogParams.frequency}Hz)
              </small>
            </div>
            
            <div className="mb-3">
              <label className="text-light">Bits de Resolución: <span>{pcmParams.bits} bits</span></label>
              <input 
                type="range" 
                className="form-range" 
                min="2" 
                max="16" 
                step="1" 
                name="bits"
                value={pcmParams.bits}
                onChange={handlePcmChange}
              />
              <small className="text-light">
                Niveles de cuantización: {Math.pow(2, pcmParams.bits)}
              </small>
            </div>
            
            <div className="mb-3">
              <label className="text-light">Tipo de PCM:</label>
              <select 
                className="form-select form-select-sm w-100 mt-2 bg-dark text-light"
                name="pcm_type"
                value={pcmParams.pcm_type}
                onChange={handlePcmChange}
              >
                <option value="linear">PCM Lineal</option>
                <option value="mu-law">Ley μ (mu-law)</option>
                <option value="a-law">Ley A (A-law)</option>
              </select>
            </div>
            
            <div className="mt-4">
              <h6 className="text-light">Información:</h6>
              <p className="text-light"><strong>SNR:</strong> {signals.snr ? signals.snr.toFixed(2) : 0} dB</p>
              <p className="text-light"><strong>Tasa de bits:</strong> {pcmParams.sampling_rate * pcmParams.bits} bps</p>
            </div>
          </div>
        </div>
        
        {/* Gráfica Señal Muestreada */}
        <div className="col-md-9">
          <div className="box">
            <h5 className="text-light">Señal Muestreada (PAM)</h5>
            <SignalDisplay 
              data={{
                t: signals.t,
                señal: signals.pulse_signal,
                sampling_times: signals.sampling_times,
                sampled_values: signals.sampled_values
              }}
              yRange={[-6, 6]}
              xRange={[0, 0.1]}
              showPoints={true}
              id="sampled-signal-chart"
            />
          </div>
        </div>
      </div>

      {/* Tercera fila: Cuantización y Codificación */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="box">
            <h5 className="text-light">Codificación Digital</h5>
            {renderBinaryCodes()}
            
            <div className="mt-3">
              <h6 className="text-light">Explicación:</h6>
              <p className="small text-light">
                PCM convierte una señal analógica en digital mediante tres pasos:
              </p>
              <ol className="small text-light">
                <li><strong>Muestreo:</strong> Tomar muestras a intervalos regulares</li>
                <li><strong>Cuantización:</strong> Asignar valores discretos a las muestras</li>
                <li><strong>Codificación:</strong> Convertir a código binario</li>
              </ol>
              <p className="small text-light">
                {pcmParams.pcm_type === 'linear' ? (
                  "PCM Lineal utiliza niveles de cuantización uniformes."
                ) : pcmParams.pcm_type === 'mu-law' ? (
                  "Ley μ comprime la señal para mejorar la SNR en señales de baja amplitud."
                ) : (
                  "Ley A comprime la señal de manera similar a la Ley μ, pero con diferente fórmula."
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Gráfica Señal Reconstruida */}
        <div className="col-md-9">
          <div className="box">
            <h5 className="text-light">Señal Reconstruida</h5>
            <SignalDisplay 
              data={{
                t: signals.t,
                señal: signals.staircase_signal
              }}
              yRange={[-6, 6]}
              xRange={[0, 0.1]}
              id="reconstructed-signal-chart"
            />
          </div>
        </div>
      </div>

      {/* Cuarta fila: Comparación de señales */}
      <div className="row mt-4">
        <div className="col-md-12">
          <div className="box">
            <h5 className="text-light">Comparación: Original vs. Reconstruida</h5>
            <ComparisonSignalDisplay 
              data={getComparisonData()}
              yRange={[-6, 6]}
              xRange={[0, 0.1]}
              id="comparison-chart"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar dos señales superpuestas
const ComparisonSignalDisplay = ({ data, xRange = [0, 0.2], yRange = [-8, 8], id }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const dataSeriesRef = useRef(null);
  const dataSeriesRef2 = useRef(null);
  const chartIdRef = useRef(id || `chart-${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    let isComponentMounted = true;
    
    const initSciChart = async () => {
      try {
        // Acceder a SciChart desde el objeto global window
        const {
          SciChartSurface,
          NumericAxis,
          FastLineRenderableSeries,
          XyDataSeries,
          NumberRange
        } = window.SciChart;
        
        // Inicializar SciChart
        const { sciChartSurface, wasmContext } = await SciChartSurface.create(chartIdRef.current);
        
        if (!isComponentMounted) {
          sciChartSurface.delete();
          return;
        }
        
        sciChartSurface.background = "#121212"; // Fondo oscuro
        
        const xAxis = new NumericAxis(wasmContext, { 
          axisTitle: "Tiempo (s)",
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          majorGridLineStyle: { color: "#333", strokeThickness: 1 },
          tickLabelStyle: { color: "#e0e0e0" },
          visibleRange: new NumberRange(xRange[0], xRange[1])
        });
        
        const yAxis = new NumericAxis(wasmContext, { 
          axisTitle: "Amplitud",
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          majorGridLineStyle: { color: "#333", strokeThickness: 1 },
          tickLabelStyle: { color: "#e0e0e0" },
          visibleRange: new NumberRange(yRange[0], yRange[1])
        });
        
        sciChartSurface.xAxes.add(xAxis);
        sciChartSurface.yAxes.add(yAxis);
        
        // Serie para la señal original
        const dataSeries = new XyDataSeries(wasmContext);
        const lineSeries = new FastLineRenderableSeries(wasmContext, { 
          dataSeries, 
          stroke: "#4CAF50", // Verde para la señal original
          strokeThickness: 2
        });
        
        // Serie para la señal reconstruida
        const dataSeries2 = new XyDataSeries(wasmContext);
        const lineSeries2 = new FastLineRenderableSeries(wasmContext, { 
          dataSeries: dataSeries2, 
          stroke: "#FF5722", // Naranja para la señal reconstruida
          strokeThickness: 2
        });
        
        sciChartSurface.renderableSeries.add(lineSeries);
        sciChartSurface.renderableSeries.add(lineSeries2);
        
        // Añadir leyenda
        sciChartSurface.chartModifiers.add(new window.SciChart.LegendModifier({
          showCheckboxes: false,
          orientation: "horizontal",
          position: "bottom",
          entryHeight: 30,
          entryWidth: 150,
          fontFamily: "Arial",
          fontSize: 14
        }));
        
        // Establecer nombres para la leyenda
        lineSeries.name = "Señal Original";
        lineSeries2.name = "Señal Reconstruida";
        
        // Guardar referencias
        chartRef.current = sciChartSurface;
        dataSeriesRef.current = dataSeries;
        dataSeriesRef2.current = dataSeries2;
      } catch (error) {
        console.error("Error inicializando SciChart:", error);
      }
    };
    
    // Esperar a que SciChart esté disponible en window
    if (window.SciChart) {
      initSciChart();
    } else {
      const checkSciChart = setInterval(() => {
        if (window.SciChart) {
          clearInterval(checkSciChart);
          initSciChart();
        }
      }, 100);
    }
    
    return () => {
      isComponentMounted = false;
      // Limpiar al desmontar
      if (chartRef.current) {
        chartRef.current.delete();
      }
    };
  }, []);
  
  useEffect(() => {
    // Actualizar datos cuando cambien las señales
    if (dataSeriesRef.current && dataSeriesRef2.current && 
        data.t && data.señal && data.señal2 && 
        data.t.length > 0) {
      dataSeriesRef.current.clear();
      dataSeriesRef.current.appendRange(data.t, data.señal);
      
      dataSeriesRef2.current.clear();
      dataSeriesRef2.current.appendRange(data.t, data.señal2);
    }
  }, [data]);
  
  return (
    <div id={chartIdRef.current} ref={containerRef} style={{ width: '100%', height: '300px', backgroundColor: '#121212' }}></div>
  );
};

export default ModulacionPCM;