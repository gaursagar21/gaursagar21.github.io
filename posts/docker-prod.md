---
title: "Docker in Production: Lessons Learned"
date: Feb 28, 2024
tag: Infrastructure
---

We've been running Docker containers in production for three years now. Here's what we learned the hard way.

## Image Size Matters

Our first Docker images were 1.2GB. Build times were painful, deploys were slow, and registry costs were high. We got them down to under 200MB with multi-stage builds:

```dockerfile
# Build stage
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/deps -r requirements.txt

# Runtime stage
FROM python:3.11-slim
COPY --from=builder /deps /usr/local/lib/python3.11/site-packages
COPY . /app
WORKDIR /app
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"]
```

## Health Checks Are Non-Negotiable

Without proper health checks, your orchestrator can't tell if your container is actually working. A running process isn't the same as a healthy service.

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

## Log to stdout

Don't write logs to files inside the container. Log to stdout/stderr and let the platform handle collection. This seems obvious, but I've seen production containers silently filling up their filesystems with log files.

## Resource Limits Are Your Safety Net

Always set memory and CPU limits. A container without limits is a container that can take down the host.

The tricky part is setting them correctly. Too low and you get OOM kills. Too high and you're wasting resources. Start with observed usage + 50% headroom, then adjust.

## Secrets Management

Don't bake secrets into images. Don't pass them as build args. Use runtime injection through environment variables or mounted secret volumes. 

And for the love of everything, add `.env` to your `.dockerignore`.

## The Debugging Tax

Containers add a layer of indirection that makes debugging harder. `docker exec -it` is your friend, but in production you often can't shell into containers. Invest in good logging and tracing from the start — you'll need it.
