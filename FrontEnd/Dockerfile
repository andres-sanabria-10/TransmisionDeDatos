# Usa una imagen más reciente de Node.js como base
FROM node:18

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración
COPY package*.json ./

# Instala las dependencias
RUN npm install -g nodemon && npm install

# Copia el resto de los archivos de la aplicación
COPY . .

# Expone el puerto en el que correrá tu aplicación
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["nodemon", "App.js"]
