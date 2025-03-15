import React, { useEffect, useRef } from 'react';

const SignalDisplay = ({ data }) => {
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
        const { sciChartSurface, wasmContext } = await SciChartSurface.create("scichart-root");
        
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
          tickLabelStyle: { color: "#e0e0e0" }
        });
        
        const yAxis = new NumericAxis(wasmContext, { 
          axisTitle: "Amplitud",
          visibleRange: new NumberRange(-10, 10), // Escala fija
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          majorGridLineStyle: { color: "#333", strokeThickness: 1 },
          tickLabelStyle: { color: "#e0e0e0" }
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
    // Actualizar datos cuando cambie la señal modulada
    if (dataSeriesRef.current && data.t && data.señal && data.t.length > 0) {
      dataSeriesRef.current.clear();
      dataSeriesRef.current.appendRange(data.t, data.señal);
    }
  }, [data]);
  
  return (
    <div id="scichart-root" ref={containerRef} style={{ width: '100%', height: '350px', backgroundColor: '#121212' }}></div>
  );
};

export default SignalDisplay;