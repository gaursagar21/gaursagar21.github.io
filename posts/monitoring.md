---
title: The Art of Monitoring
date: Apr 10, 2025
tag: Infrastructure
---

Most monitoring setups I've seen fall into one of two traps: too many alerts (alert fatigue) or too few (flying blind). Here's how I think about building monitoring that actually helps.

## The Four Questions

Every dashboard should answer exactly four questions:

1. **Is anything broken right now?** (Real-time health)
2. **Is anything about to break?** (Capacity and trends)
3. **What changed recently?** (Deployments, config changes)
4. **Is the user experience degraded?** (SLIs/SLOs)

If your dashboard doesn't answer these, it's decoration.

## Alerts Should Be Actionable

An alert that fires but doesn't require action is worse than no alert at all. It trains your team to ignore alerts.

Every alert should have:
- A clear description of what's wrong
- The impact on users
- A link to a runbook with remediation steps
- An appropriate severity level

```yaml
# Good alert
- alert: CheckoutErrorRateHigh
  expr: rate(checkout_errors_total[5m]) > 0.05
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Checkout error rate above 5%"
    impact: "Users cannot complete purchases"
    runbook: "/runbooks/checkout-errors"
```

## The Metrics That Matter

After years of iteration, here's what I actually look at daily:

- **Error rate by endpoint** — not just 5xx, but business logic errors too
- **P50, P95, P99 latency** — P99 catches the long tail that averages hide
- **Queue depth and processing time** — leading indicators of problems
- **Database connection pool utilization** — the thing that's always the bottleneck

Everything else is nice to have but rarely actionable.

## Build Dashboards for Incidents

The best time to build a dashboard is right after an incident. You know exactly what data you wished you had. Don't wait — build it while the pain is fresh.

Our most useful dashboards were all born from post-mortems.
