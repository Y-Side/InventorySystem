# 1. Usar una imagen de Python oficial
FROM python:3.11-slim

# 2. Instalar dependencias del sistema y el Driver de Microsoft SQL Server
# Esto es lo que permite que pyodbc funcione en Linux (Render)
RUN apt-get update && apt-get install -y \
    curl \
    apt-utils \
    gnupg2 \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql17 \
    && apt-get install -y unixodbc-dev \
    && apt-get clean

# 3. Establecer el directorio de trabajo
WORKDIR /app

# 4. Copiar los archivos de tu proyecto al contenedor
COPY . .

# 5. Instalar las librerías de Python
RUN pip install --no-cache-dir -r requirements.txt

# 6. Exponer el puerto que usa Render
EXPOSE 10000

# 7. Comando para arrancar la app con Gunicorn
# Nota: Usamos InventorySystem:app porque ese es el nombre de tu archivo
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "InventorySystem:app"]