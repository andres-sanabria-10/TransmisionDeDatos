import React, { useEffect, useRef } from 'react';

const SignalDisplay = ({ data, xRange = [0, 0.2], yRange = [-8, 8], id, showPoints = false }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const dataSeriesRef = useRef(null);
  const pointsSeriesRef = useRef(null);
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
          NumberRange,
          XyScatterRenderableSeries,
          EllipsePointMarker
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
          stroke: "#4CAF50", 
          strokeThickness: 2
        });
        
        sciChartSurface.renderableSeries.add(lineSeries);
        
        // Si se solicitan puntos, crear serie de puntos
        if (showPoints) {
          const pointsDataSeries = new XyDataSeries(wasmContext);
          const pointMarker = new EllipsePointMarker(wasmContext, {
            width: 7,
            height: 7,
            fill: "#E73831",
            stroke: "#FFFFFF",
            strokeThickness: 1
          });
          
          const pointsSeries = new XyScatterRenderableSeries(wasmContext, {
            dataSeries: pointsDataSeries,
            pointMarker
          });
          
          sciChartSurface.renderableSeries.add(pointsSeries);
          pointsSeriesRef.current = pointsDataSeries;
        }
        
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
      dataSeriesRef.current.appendRange(data.t, data.señal);
      
      // Si hay serie de puntos, actualizarla
      if (showPoints && pointsSeriesRef.current) {
        pointsSeriesRef.current.clear();
        
        // Si hay datos de tiempos de muestreo, usarlos
        if (data.sampling_times && data.sampled_values) {
          pointsSeriesRef.current.appendRange(data.sampling_times, data.sampled_values);
        } else {
          // Si no, tomar puntos equidistantes (aproximación)
          const step = Math.max(1, Math.floor(data.t.length / 20));
          const xPoints = [];
          const yPoints = [];
          
          for (let i = 0; i < data.t.length; i += step) {
            xPoints.push(data.t[i]);
            yPoints.push(data.señal[i]);
          }
          
          pointsSeriesRef.current.appendRange(xPoints, yPoints);
        }
      }
    }
  }, [data, showPoints]);
  
  return (
    <div id={chartIdRef.current} ref={containerRef} style={{ width: '100%', height: '300px', backgroundColor: '#121212' }}></div>
  );
};

export default SignalDisplay;