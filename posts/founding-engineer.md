---
title: Notes on Being a Founding Engineer
date: Aug 3, 2024
tag: Career
---

In 2021, I joined a startup as the first backend engineer. Here are some things I wish someone had told me.

## You Will Build Everything Twice

The first version of everything is a prototype. You just don't know it yet. The auth system I built in week two got rewritten in month six. The data pipeline from month one was scrapped by month four.

This isn't a failure — it's the natural result of building before you fully understand the problem. Accept it early and you'll make better "throwaway" decisions.

## Scope Is Your Enemy

At a startup, there's always more to build than people to build it. The temptation is to build everything, to handle every edge case, to make it "production-ready" from day one.

Don't. Ship the 80% solution. See if anyone uses it. Then decide if the remaining 20% matters.

## You're Not Just an Engineer

As a founding engineer, you'll be:
- Writing design docs at 9am
- Debugging production at 11am
- Interviewing candidates at 2pm
- Setting up CI/CD at 4pm
- Reviewing a security audit at 6pm

The context switching is brutal. Block your deep work time aggressively.

## Technical Decisions Have Long Shadows

The choices you make in the first six months — language, framework, database, cloud provider, deployment strategy — will live for years. Choose boring technology. Choose things your team knows well. Choose things with good documentation and active communities.

```javascript
// Month 1: "Let's use this cutting-edge framework!"
// Month 8: "Why is there no documentation for this error?"
// Month 14: "The maintainer abandoned the project."
```

## The Rewarding Part

Despite the chaos, being a founding engineer is one of the most rewarding roles in tech. You get to shape the technical culture. You see the direct impact of every line of code. And you learn more in one year than you would in five at a large company.

Just make sure you negotiate equity.
