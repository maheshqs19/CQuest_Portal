# Same image runs on Railway, Azure Container Apps and Azure App Service (Linux containers)
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8000
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -r -u 10001 portal && chown -R portal /app
USER portal
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request,os;urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",\"8000\")}/healthz')"
CMD gunicorn --preload --workers ${WEB_CONCURRENCY:-2} --threads 4 --timeout 60 --bind 0.0.0.0:${PORT} --access-logfile - wsgi:app
