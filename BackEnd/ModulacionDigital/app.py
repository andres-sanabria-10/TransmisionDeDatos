from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/modulacion_digital', methods=['POST'])
def modulacion_digital():
    try:
        # Obtener datos desde el frontend
        data = request.json

        # Parámetros comunes
        Vp = float(data.get('Vp', 1))  # Amplitud de la portadora
        fp = float(data.get('fp', 1000))  # Frecuencia de la portadora
        tipo = data.get('tipo', 'ASK')  # Tipo de modulación: ASK, FSK, PSK

        # Obtener la secuencia de bits ingresada por el usuario
        bit_sequence_str = data.get('bit_sequence', '10110010')
        # Convertir la cadena de bits a un array de numpy
        bit_sequence = np.array([int(bit) for bit in bit_sequence_str if bit in ['0', '1']])

        if len(bit_sequence) == 0:
            bit_sequence = np.array([1, 0, 1, 1, 0, 0, 1, 0])  # Secuencia por defecto

        # Parámetros específicos para FSK
        fp_low = float(data.get('fp_low', fp * 0.8))  # Frecuencia baja para FSK
        fp_high = float(data.get('fp_high', fp * 1.2))  # Frecuencia alta para FSK

        # Parámetros de la señal
        fs = 10000  # Aumentar la frecuencia de muestreo para mejor resolución
        duration = 0.2  # Duración total en segundos
        t = np.arange(0, duration, 1/fs)  # Vector de tiempo

        # Calcular la duración de cada bit
        bit_duration = duration / len(bit_sequence)

        # Generar señal digital con transiciones perfectamente rectangulares
        digital_signal = np.zeros(len(t))

        for i, bit in enumerate(bit_sequence):
            # Calcular los índices de inicio y fin para este bit
            start_time = i * bit_duration
            end_time = (i + 1) * bit_duration

            # Encontrar los índices correspondientes en el vector de tiempo
            start_idx = np.where(t >= start_time)[0][0]
            end_idx = np.where(t >= end_time)[0][0] if end_time < duration else len(t)

            # Establecer el valor del bit en este intervalo
            digital_signal[start_idx:end_idx] = bit

        # Señal portadora
        carrier = Vp * np.sin(2 * np.pi * fp * t)

        # Generar la señal modulada según el tipo
        if tipo == 'ASK':
            # ASK (Amplitude Shift Keying)
            señal_modulada = carrier * digital_signal
        elif tipo == 'FSK':
            # FSK (Frequency Shift Keying)
            carrier_low = Vp * np.sin(2 * np.pi * fp_low * t)
            carrier_high = Vp * np.sin(2 * np.pi * fp_high * t)
            señal_modulada = carrier_low * (1 - digital_signal) + carrier_high * digital_signal
        elif tipo == 'PSK':
            # PSK (Phase Shift Keying)
            señal_modulada = Vp * np.sin(2 * np.pi * fp * t + np.pi * digital_signal)
        else:
            return jsonify({"error": "Tipo de modulación digital no soportado"}), 400

        # Devolver todas las señales necesarias
        return jsonify({
            "t": t.tolist(),
            "portadora": carrier.tolist(),
            "moduladora": digital_signal.tolist(),
            "modulada": señal_modulada.tolist(),
            "bit_sequence": bit_sequence.tolist()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)