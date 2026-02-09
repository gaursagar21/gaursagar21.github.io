---
title: What On-Call Taught Me About Software
date: Oct 5, 2025
tag: Engineering
---

I've been on-call for production systems for the better part of six years. Here's what it taught me that no textbook ever could.

## 3am Is a Truth Serum for Architecture

There's nothing quite like being jolted awake at 3am by PagerDuty to clarify your thinking about system design. Every shortcut, every "we'll fix it later," every "it probably won't happen" — they all come due at 3am.

The systems that let me sleep through the night had a few things in common:

- **Clear failure boundaries.** When service A fails, service B degrades gracefully instead of cascading.
- **Meaningful alerts.** Not "CPU is at 80%" but "users are experiencing errors on checkout."
- **Runbooks that actually work.** Written by the person who last got paged, not by someone guessing at what might go wrong.

## The Best Code Is Boring Code

After enough incidents, you develop a deep appreciation for boring, predictable code. The clever one-liner that saves three lines? It's the one that breaks at 3am and takes an hour to debug because nobody remembers what it does.

```go
// This is what I want to see at 3am
if err != nil {
    log.Error("failed to process payment",
        "user_id", userID,
        "amount", amount,
        "error", err,
    )
    return fmt.Errorf("process payment for user %s: %w", userID, err)
}
```

## Incidents Teach You What Metrics Don't

Metrics tell you what happened. Incidents teach you why. Every post-mortem I've been part of revealed something about the system that monitoring couldn't capture — a race condition that only happens under specific load patterns, a dependency that fails silently, a timeout that's too aggressive.

## The Human Side

The hardest part of on-call isn't the technical problem-solving. It's the sustained alertness, the disrupted sleep, the background anxiety of knowing your phone might buzz at any moment. Good on-call culture acknowledges this and compensates for it — with reasonable rotation schedules, blameless post-mortems, and actual follow-through on action items.

If your on-call is miserable, that's a signal about your system's health, not about your team's resilience.
