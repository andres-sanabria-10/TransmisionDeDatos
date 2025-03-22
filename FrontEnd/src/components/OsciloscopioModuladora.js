import React, { useEffect, useRef, useState } from 'react';

const OsciloscopioModuladora = ({ params }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const dataSeriesRef = useRef(null);
  const xAxisRef = useRef(null);
  const intervalRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const timeOffsetRef = useRef(0);
  
  const defaultParams = {
    voltaje: 3,
    frecuencia: 30,
    fase: 0
  };

  const actualParams = {
    voltaje: params?.voltaje !== undefined ? params.voltaje : defaultParams.voltaje,
    frecuencia: params?.frecuencia !== undefined ? params.frecuencia : defaultParams.frecuencia,
    fase: params?.fase !== undefined ? params.fase : defaultParams.fase
  };

  useEffect(() => {
    const checkReadiness = () => {
      if (document.getElementById("osciloscopio-moduladora") && window.SciChart) {
        setIsReady(true);
      } else {
        setTimeout(checkReadiness, 100);
      }
    };

    checkReadiness();

    return () => {
      if (chartRef.current) {
        chartRef.current.delete();
        chartRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let isComponentMounted = true;

    const initSciChart = async () => {
      try {
        const { SciChartSurface, NumericAxis, FastLineRenderableSeries, XyDataSeries, NumberRange } = window.SciChart;

        const { sciChartSurface, wasmContext } = await SciChartSurface.create("osciloscopio-moduladora");

        if (!isComponentMounted) {
          sciChartSurface.delete();
          return;
        }

        sciChartSurface.background = "#121212";

        const xAxis = new NumericAxis(wasmContext, {
          axisTitle: "Tiempo (s)",
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          visibleRange: new NumberRange(0, 0.1),
          autoRange: false
        });

        const yAxis = new NumericAxis(wasmContext, {
          axisTitle: "Voltaje (V)",
          visibleRange: new NumberRange(-6, 6),
          labelStyle: { color: "#e0e0e0" },
          titleStyle: { color: "#e0e0e0" },
          autoRange: false
        });

        sciChartSurface.xAxes.add(xAxis);
        sciChartSurface.yAxes.add(yAxis);

        const signalData = new XyDataSeries(wasmContext);

        const lineSeries = new FastLineRenderableSeries(wasmContext, {
          stroke: "#2196F3",
          dataSeries: signalData,
          strokeThickness: 1.5,
        });

        sciChartSurface.renderableSeries.add(lineSeries);

        chartRef.current = sciChartSurface;
        dataSeriesRef.current = signalData;
        xAxisRef.current = xAxis;

        console.log("SciChart Moduladora inicializado correctamente");

        startRealTimeAnimation();
      } catch (error) {
        console.error("Error inicializando SciChart Moduladora:", error);
      }
    };

    initSciChart();
    return () => {
      isComponentMounted = false;
    };
  }, [isReady]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (isReady && dataSeriesRef.current) {
      startRealTimeAnimation();
    }
  }, [actualParams.voltaje, actualParams.frecuencia, actualParams.fase, isReady]);

  const startRealTimeAnimation = () => {
    if (!dataSeriesRef.current || !xAxisRef.current) return;

    dataSeriesRef.current.clear();
    timeOffsetRef.current = 0;

    generateStaticData();

    intervalRef.current = setInterval(() => {
      timeOffsetRef.current += 0.001;
      const currentTime = timeOffsetRef.current;

      xAxisRef.current.visibleRange = new window.SciChart.NumberRange(
        currentTime,
        currentTime + 0.1
      );

      generateWaveformData(currentTime, currentTime + 0.1);
    }, 50);
  };

  const generateWaveformData = (startTime, endTime) => {
    if (!dataSeriesRef.current) return;

    dataSeriesRef.current.clear();

    const minPointsPerCycle = 20;
    const cyclesInWindow = actualParams.frecuencia * (endTime - startTime);
    const totalPoints = Math.max(1000, Math.ceil(minPointsPerCycle * cyclesInWindow));

    const timeStep = (endTime - startTime) / totalPoints;

    for (let i = 0; i <= totalPoints; i++) {
      const time = startTime + (i * timeStep);
      const angularFreq = 2 * Math.PI * actualParams.frecuencia;
      const y = actualParams.voltaje * Math.sin(angularFreq * time + actualParams.fase);
      dataSeriesRef.current.append(time, y);
    }
  };
  
  const generateStaticData = () => {
    if (!dataSeriesRef.current) return;
    const currentTime = timeOffsetRef.current;
    generateWaveformData(currentTime, currentTime + 0.1);
  };

  return (
    <div id="osciloscopio-moduladora" ref={containerRef} style={{ width: '100%', height: '350px', backgroundColor: '#121212' }}></div>
  );
};

export default OsciloscopioModuladora;
