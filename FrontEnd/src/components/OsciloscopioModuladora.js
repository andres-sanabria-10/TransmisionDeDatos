import React, { useEffect, useRef } from 'react';

const OsciloscopioModuladora = ({ params }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const dataSeriesRef = useRef(null);
  const xAxisRef = useRef(null);
  const tiempoRef = useRef(0);
  const intervalIdRef = useRef(null);
  const maxPoints = 600;
  const isInitializedRef = useRef(false);
  
  // Referencia a los parámetros actuales para usarlos en el intervalo
  const paramsRef = useRef(params);
  
  // Actualizar la referencia cuando cambien los parámetros
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // Efecto para inicializar el gráfico
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
        const { sciChartSurface, wasmContext } = await SciChartSurface.create("osciloscopio-moduladora");
        
        if (!isComponentMounted) {
          sciChartSurface.delete();
          return;
        }
        
        // Configurar ejes
        const xAxis = new NumericAxis(wasmContext, { 
          axisTitle: "Tiempo (s)",
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          majorGridLineStyle: { color: "#333", strokeThickness: 1 },
          tickLabelStyle: { color: "#e0e0e0" }
        });
        
        const yAxis = new NumericAxis(wasmContext, { 
          axisTitle: "Voltaje (V)", 
          visibleRange: new NumberRange(-5, 5),
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          majorGridLineStyle: { color: "#333", strokeThickness: 1 },
          tickLabelStyle: { color: "#e0e0e0" }
        });
        
        sciChartSurface.xAxes.add(xAxis);
        sciChartSurface.yAxes.add(yAxis);
        
        // Series de datos
        const signalData = new XyDataSeries(wasmContext);
        const lineSeries = new FastLineRenderableSeries(wasmContext, { 
          stroke: "#2196F3", // Azul para la moduladora
          dataSeries: signalData,
          strokeThickness: 2.5
        });
        
        sciChartSurface.renderableSeries.add(lineSeries);
        
        // Guardar referencias
        chartRef.current = sciChartSurface;
        dataSeriesRef.current = signalData;
        xAxisRef.current = xAxis;
        
        // Marcar como inicializado
        isInitializedRef.current = true;
        
        // Iniciar actualización automáticamente
        startUpdating();
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
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (chartRef.current) {
        chartRef.current.delete();
      }
    };
  }, []); // Solo se ejecuta una vez al montar
  
  // Efecto para manejar el estado de ejecución
  useEffect(() => {
    if (isInitializedRef.current) {
      if (params.isRunning) {
        startUpdating();
      } else {
        stopUpdating();
      }
    }
  }, [params.isRunning]);
  
  const startUpdating = () => {
    // Evitar múltiples intervalos
    stopUpdating();
    
    // Usar una función que siempre acceda a los parámetros actualizados
    intervalIdRef.current = setInterval(() => {
      updateOscilloscope();
    }, 30);
  };
  
  const stopUpdating = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };
  
  const updateOscilloscope = () => {
    if (!dataSeriesRef.current || !xAxisRef.current || !window.SciChart) return;
    
    // Usar los parámetros actualizados desde la referencia
    const currentParams = paramsRef.current;
    
    if (!currentParams.isRunning) return;
    
    const duracion = 2 * Math.PI;
    const sampleRate = 200;
    
    tiempoRef.current += duracion / sampleRate;
    
    // Usar los valores actuales de los parámetros
    const y = currentParams.voltaje * 
              Math.sin(2 * Math.PI * currentParams.frecuencia * tiempoRef.current / 10000 + currentParams.fase);
    
    dataSeriesRef.current.append(tiempoRef.current, y);
    
    if (dataSeriesRef.current.count() > maxPoints) {
      dataSeriesRef.current.removeAt(0);
    }
    
    if (window.SciChart && window.SciChart.NumberRange) {
      xAxisRef.current.visibleRange = new window.SciChart.NumberRange(tiempoRef.current - 6, tiempoRef.current);
    }
  };
  
  return (
    <div id="osciloscopio-moduladora" ref={containerRef} style={{ width: '100%', height: '350px', backgroundColor: 'black' }}></div>
  );
};

export default OsciloscopioModuladora;