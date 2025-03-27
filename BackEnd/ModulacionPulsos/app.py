from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/modulacion_pcm', methods=['POST'])
def modulacion_pcm():
    try:
        # Obtener datos desde el frontend
        data = request.json

        # Parámetros de la señal analógica de entrada
        signal_type = data.get('signal_type', 'sine')  # Tipo de señal: sine, triangle, sawtooth
        amplitude = float(data.get('amplitude', 1.0))  # Amplitud de la señal
        frequency = float(data.get('frequency', 100.0))  # Frecuencia de la señal en Hz

        # Parámetros de PCM
        sampling_rate = int(data.get('sampling_rate', 1000))  # Frecuencia de muestreo en Hz
        bits = int(data.get('bits', 8))  # Bits de resolución
        pcm_type = data.get('pcm_type', 'linear')  # Tipo de PCM: linear, mu-law, a-law

        # Parámetros de tiempo
        duration = 0.1  # Duración en segundos
        t = np.linspace(0, duration, int(duration * 50000))  # Vector de tiempo de alta resolución

        # Generar señal analógica de entrada
        if signal_type == 'sine':
            analog_signal = amplitude * np.sin(2 * np.pi * frequency * t)
        elif signal_type == 'triangle':
            analog_signal = amplitude * 2 * np.abs(2 * (t * frequency - np.floor(t * frequency + 0.5))) - amplitude
        elif signal_type == 'sawtooth':
            analog_signal = amplitude * 2 * (t * frequency - np.floor(t * frequency + 0.5))
        else:
            return jsonify({"error": "Tipo de señal no soportado"}), 400

        # Generar tiempos de muestreo
        sampling_interval = 1.0 / sampling_rate
        sampling_times = np.arange(0, duration, sampling_interval)

        # Muestrear la señal analógica
        sampled_indices = [np.abs(t - st).argmin() for st in sampling_times]
        sampled_signal = analog_signal[sampled_indices]

        # Normalizar la señal para cuantización
        max_val = np.max(np.abs(sampled_signal))
        if max_val > 0:
            normalized_signal = sampled_signal / max_val
        else:
            normalized_signal = sampled_signal

        # Aplicar compresión si es necesario
        if pcm_type == 'mu-law':
            # Ley μ (mu-law)
            mu = 255
            compressed_signal = np.sign(normalized_signal) * np.log(1 + mu * np.abs(normalized_signal)) / np.log(1 + mu)
        elif pcm_type == 'a-law':
            # Ley A (A-law)
            A = 87.6
            compressed_signal = np.zeros_like(normalized_signal)
            for i, x in enumerate(normalized_signal):
                if np.abs(x) < 1/A:
                    compressed_signal[i] = np.sign(x) * (A * np.abs(x)) / (1 + np.log(A))
                else:
                    compressed_signal[i] = np.sign(x) * (1 + np.log(A * np.abs(x))) / (1 + np.log(A))
        else:
            # PCM lineal
            compressed_signal = normalized_signal

        # Cuantización
        levels = 2**bits
        step = 2.0 / levels
        quantized_signal = np.round((compressed_signal + 1) / step) * step - 1
        quantized_signal = np.clip(quantized_signal, -1, 1 - step)

        # Codificación (convertir a valores enteros)
        encoded_signal = ((quantized_signal + 1) / step).astype(int)
        encoded_signal = np.clip(encoded_signal, 0, levels - 1)

        # Convertir a representación binaria
        binary_codes = []
        for value in encoded_signal:
            binary = bin(value)[2:].zfill(bits)  # Convertir a binario y rellenar con ceros
            binary_codes.append(binary)

        # Reconstruir la señal (decodificación)
        reconstructed_normalized = encoded_signal * step - 1

        # Descomprimir si es necesario
        if pcm_type == 'mu-law':
            # Inversa de Ley μ
            mu = 255
            reconstructed_signal = np.sign(reconstructed_normalized) * (
                (1 + mu)**np.abs(reconstructed_normalized) - 1) / mu
        elif pcm_type == 'a-law':
            # Inversa de Ley A
            A = 87.6
            reconstructed_signal = np.zeros_like(reconstructed_normalized)
            for i, x in enumerate(reconstructed_normalized):
                x_abs = np.abs(x)
                if x_abs < 1 / (1 + np.log(A)):
                    reconstructed_signal[i] = np.sign(x) * x_abs * (1 + np.log(A)) / A
                else:
                    reconstructed_signal[i] = np.sign(x) * np.exp(x_abs * (1 + np.log(A)) - 1) / A
        else:
            # PCM lineal
            reconstructed_signal = reconstructed_normalized

        # Desnormalizar
        reconstructed_signal = reconstructed_signal * max_val

        # Crear señal de pulsos para visualización
        pulse_signal = np.zeros_like(t)
        for i, st in enumerate(sampling_times):
            idx = np.abs(t - st).argmin()
            pulse_signal[idx] = sampled_signal[i]

        # Crear señal escalonada para visualización
        staircase_signal = np.zeros_like(t)
        for i in range(len(sampling_times)):
            start_idx = np.abs(t - sampling_times[i]).argmin()
            end_idx = np.abs(t - sampling_times[i+1]).argmin() if i < len(sampling_times) - 1 else len(t)
            staircase_signal[start_idx:end_idx] = reconstructed_signal[i]

        # Calcular error de cuantización
        error_signal = np.zeros_like(t)
        for i in range(len(sampling_times)):
            start_idx = np.abs(t - sampling_times[i]).argmin()
            end_idx = np.abs(t - sampling_times[i+1]).argmin() if i < len(sampling_times) - 1 else len(t)
            # Usar la señal analógica original en los puntos de muestreo
            error_signal[start_idx:end_idx] = analog_signal[start_idx] - reconstructed_signal[i]

        # Calcular SNR (Signal-to-Noise Ratio)
        signal_power = np.mean(np.square(analog_signal))
        noise_power = np.mean(np.square(error_signal))
        snr = 10 * np.log10(signal_power / noise_power) if noise_power > 0 else float('inf')

        # Devolver todas las señales necesarias
        return jsonify({
            "t": t.tolist(),
            "analog_signal": analog_signal.tolist(),
            "pulse_signal": pulse_signal.tolist(),
            "staircase_signal": staircase_signal.tolist(),
            "error_signal": error_signal.tolist(),
            "sampling_times": sampling_times.tolist(),
            "sampled_values": sampled_signal.tolist(),
            "quantized_values": quantized_signal.tolist(),
            "binary_codes": binary_codes,
            "snr": snr
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)