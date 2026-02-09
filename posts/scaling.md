---
title: From Hundreds to Hundreds of Thousands
date: Nov 18, 2024
tag: Scaling
---

When I joined MindTickle, we had a few hundred enterprise customers. When I left, we had over 100,000 users on the platform. Here's what scaling 1000x looks like in practice.

## The First Wall: Database

The first scaling wall is almost always the database. Ours was PostgreSQL, and it served us well — until it didn't.

The symptoms were textbook: slow queries during peak hours, connection pool exhaustion, replication lag on read replicas. The fix was a combination of:

- **Read replicas** for analytics and reporting queries
- **Connection pooling** with PgBouncer
- **Query optimization** — the usual suspects of missing indexes and N+1 queries
- **Selective denormalization** for the hottest read paths

```sql
-- Before: 3 joins, 800ms at scale
SELECT u.name, c.title, p.score
FROM users u
JOIN courses c ON c.id = u.current_course_id
JOIN progress p ON p.user_id = u.id AND p.course_id = c.id
WHERE u.org_id = $1;

-- After: denormalized view, 12ms
SELECT name, current_course_title, current_score
FROM user_dashboard_view
WHERE org_id = $1;
```

## The Second Wall: Caching

Once the database was under control, the next bottleneck was compute. We were recalculating things that rarely changed — leaderboards, org-level analytics, permission trees.

Redis became our best friend. But caching has its own complexity: invalidation strategies, thundering herds, cache warming on deploys.

## The Third Wall: Architecture

At a certain scale, the monolith can't keep up. Not because of performance, but because of team velocity. Too many engineers touching the same codebase, too many deployment conflicts, too much blast radius per change.

We split into services along domain boundaries. This was the right call for organizational scaling, even if the distributed systems complexity was sometimes painful.

## What I'd Do Differently

- **Instrument earlier.** We were flying blind for too long. Good observability from day one would have saved months.
- **Load test regularly.** We only load tested before big launches. It should have been continuous.
- **Invest in developer experience.** As the system grew, local development became painful. We should have fixed that sooner.

Scaling is less about clever architecture and more about systematic elimination of bottlenecks. The bottleneck is always moving — you just have to be disciplined about finding it.
