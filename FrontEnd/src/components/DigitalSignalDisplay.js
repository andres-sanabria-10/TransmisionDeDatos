import React, { useEffect, useRef } from 'react';

const DigitalSignalDisplay = ({ data, xRange = [0, 0.2], yRange = [-0.1, 1.1], id }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const dataSeriesRef = useRef(null);
  const chartIdRef = useRef(id || `digital-chart-${Math.random().toString(36).substring(7)}`);

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
        
        // Usar un grosor mayor para la línea digital
        const lineSeries = new FastLineRenderableSeries(wasmContext, { 
          dataSeries, 
          stroke: "#F44336",  // Rojo para la señal digital
          strokeThickness: 3.5 // Línea más gruesa para mejor visibilidad
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
    // Actualizar datos cuando cambie la señal digital
    if (dataSeriesRef.current && data.t && data.señal && data.t.length > 0) {
      dataSeriesRef.current.clear();
      
      // Crear puntos adicionales para las transiciones verticales
      const xValues = [];
      const yValues = [];
      
      for (let i = 0; i < data.t.length; i++) {
        if (i > 0) {
          // Si hay un cambio de valor, agregar un punto adicional para la transición vertical
          if (data.señal[i] !== data.señal[i-1]) {
            // Punto justo antes de la transición (mismo tiempo, valor anterior)
            xValues.push(data.t[i] - 0.000001);
            yValues.push(data.señal[i-1]);
            
            // Punto justo después de la transición (mismo tiempo, nuevo valor)
            xValues.push(data.t[i]);
            yValues.push(data.señal[i]);
          } else {
            // Si no hay cambio, agregar el punto normal
            xValues.push(data.t[i]);
            yValues.push(data.señal[i]);
          }
        } else {
          // Primer punto
          xValues.push(data.t[i]);
          yValues.push(data.señal[i]);
        }
      }
      
      dataSeriesRef.current.appendRange(xValues, yValues);
    }
  }, [data]);
  
  return (
    <div id={chartIdRef.current} ref={containerRef} style={{ width: '100%', height: '300px', backgroundColor: '#121212' }}></div>
  );
};

export default DigitalSignalDisplay;