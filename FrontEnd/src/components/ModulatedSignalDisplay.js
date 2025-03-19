import React, { useEffect, useRef } from 'react';

const ModulatedSignalDisplay = ({ data }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const dataSeriesRef = useRef(null);

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
        const { sciChartSurface, wasmContext } = await SciChartSurface.create("modulated-signal-chart");
        
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
          visibleRange: new NumberRange(0, 0.1) // Mostrar solo 0.1 segundos
        });
        
        const yAxis = new NumericAxis(wasmContext, { 
          axisTitle: "Amplitud",
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          majorGridLineStyle: { color: "#333", strokeThickness: 1 },
          tickLabelStyle: { color: "#e0e0e0" },
          visibleRange: new NumberRange(-8, 8) // Rango para señal modulada
        });
        
        sciChartSurface.xAxes.add(xAxis);
        sciChartSurface.yAxes.add(yAxis);
        
        const dataSeries = new XyDataSeries(wasmContext);
        
        const lineSeries = new FastLineRenderableSeries(wasmContext, { 
          dataSeries, 
          stroke: "#4CAF50",  // Verde para la señal modulada
          strokeThickness: 2.5
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
    // Actualizar datos cuando cambie la señal modulada
    if (dataSeriesRef.current && data.t && data.señal && data.t.length > 0) {
      dataSeriesRef.current.clear();
      
      // Mostrar solo los primeros 0.1 segundos
      const maxIndex = data.t.findIndex(t => t >= 0.1);
      const endIndex = maxIndex > 0 ? maxIndex : data.t.length;
      
      const tSlice = data.t.slice(0, endIndex);
      const señalSlice = data.señal.slice(0, endIndex);
      
      dataSeriesRef.current.appendRange(tSlice, señalSlice);
    }
  }, [data]);
  
  return (
    <div id="modulated-signal-chart" ref={containerRef} style={{ width: '100%', height: '250px', backgroundColor: '#121212' }}></div>
  );
};

export default ModulatedSignalDisplay;