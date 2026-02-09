---
title: Postgres Things I Wish I Knew Sooner
date: May 14, 2024
tag: Databases
---

I've been using PostgreSQL for most of my career. Here are patterns and tricks that took me too long to discover.

## EXPLAIN ANALYZE Is Your Best Friend

Don't guess at query performance. Always check.

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders
WHERE customer_id = 42
AND created_at > '2024-01-01';
```

The `BUFFERS` option tells you about I/O, which is often more useful than timing alone.

## Partial Indexes Save Disk and Speed

If you only query a subset of rows, don't index all of them:

```sql
-- Only active users need fast lookups
CREATE INDEX idx_users_active_email
ON users (email)
WHERE deleted_at IS NULL;
```

This index is smaller, faster to update, and faster to scan.

## Use CTEs for Readability, Not Performance

Before Postgres 12, CTEs were optimization fences — the planner couldn't inline them. Since Postgres 12, simple CTEs are inlined automatically. But if you need to force materialization:

```sql
WITH recent_orders AS MATERIALIZED (
    SELECT * FROM orders
    WHERE created_at > now() - interval '7 days'
)
SELECT customer_id, count(*)
FROM recent_orders
GROUP BY customer_id;
```

## Advisory Locks for Distributed Coordination

When you need lightweight distributed locking without the overhead of `SELECT ... FOR UPDATE`:

```sql
-- Try to acquire lock (non-blocking)
SELECT pg_try_advisory_lock(hashtext('process-payments'));

-- Do work...

-- Release
SELECT pg_advisory_unlock(hashtext('process-payments'));
```

## LISTEN/NOTIFY for Simple Pub/Sub

You don't always need Kafka. For simple event notification between services:

```sql
-- Publisher
NOTIFY order_created, '{"order_id": 123}';

-- Subscriber (in application code)
LISTEN order_created;
```

## Connection Pooling Is Not Optional

At any real scale, you need PgBouncer or pgpool. Postgres forks a process per connection — 200 connections means 200 processes. PgBouncer multiplexes thousands of application connections into a small pool of database connections.

The difference between "works in development" and "works in production" is often just connection pooling.
