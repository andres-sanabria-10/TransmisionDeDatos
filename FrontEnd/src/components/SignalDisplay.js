import React, { useEffect, useRef } from 'react';

const SignalDisplay = ({ data, xRange = [0, 0.2], yRange = [-8, 8], id }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const dataSeriesRef = useRef(null);
  const chartIdRef = useRef(id || `scichart-${Math.random().toString(36).substring(7)}`);

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
        
        const dataSeries = new XyDataSeries(wasmContext);
        
        const lineSeries = new FastLineRenderableSeries(wasmContext, { 
          dataSeries, 
          stroke: "#4CAF50",  // Verde más vibrante
          strokeThickness: 2.5 // Aumentar grosor de la línea
        });
        
        sciChartSurface.renderableSeries.add(lineSeries);
        
        // Guardar referencias
        chartRef.current = sciChartSurface;
        dataSeriesRef.current = dataSeries;
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
    // Actualizar datos cuando cambie la señal
    if (dataSeriesRef.current && data.t && data.señal && data.t.length > 0) {
      dataSeriesRef.current.clear();
      
      // Encontrar el índice correspondiente al rango X
      const maxIndex = data.t.findIndex(t => t >= xRange[1]);
      const endIndex = maxIndex > 0 ? maxIndex : data.t.length;
      
      const tSlice = data.t.slice(0, endIndex);
      const señalSlice = data.señal.slice(0, endIndex);
      
      dataSeriesRef.current.appendRange(tSlice, señalSlice);
    }
  }, [data, xRange]);
  
  return (
    <div id={chartIdRef.current} ref={containerRef} style={{ width: '100%', height: '250px', backgroundColor: '#121212' }}></div>
  );
};

export default SignalDisplay;