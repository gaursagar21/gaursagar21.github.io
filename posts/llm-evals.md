---
title: LLM Evals Are Harder Than You Think
date: Dec 20, 2025
tag: AI/ML
---

Everyone building with LLMs eventually hits the same wall: how do you know if your model is actually getting better?

## The Illusion of Vibes-Based Evaluation

When you first start building with LLMs, evaluation feels easy. You try a few prompts, the outputs look good, you ship it. This is what I call vibes-based evaluation, and it works right up until it doesn't.

The problem is that LLMs fail in ways that are subtle and inconsistent. A prompt that works 95% of the time will silently fail on edge cases you never thought to test.

## What We Tried

At Markov, we went through several phases of evaluation:

### Phase 1: Manual Review

We'd generate outputs and have engineers review them. This was slow, expensive, and didn't scale. But it gave us good intuitions about failure modes.

### Phase 2: LLM-as-Judge

We used GPT-4 to evaluate GPT-3.5 outputs. This was faster but introduced its own biases. LLMs tend to prefer longer, more verbose outputs regardless of correctness.

```python
def evaluate_with_llm(prompt, response, criteria):
    eval_prompt = f"""
    Rate the following response on a scale of 1-5 for {criteria}:
    
    Prompt: {prompt}
    Response: {response}
    
    Score:
    """
    score = call_llm(eval_prompt)
    return parse_score(score)
```

### Phase 3: Task-Specific Metrics

Eventually we built custom evaluation pipelines for each use case. Extraction tasks got precision/recall metrics. Classification tasks got accuracy scores. Generation tasks got a combination of automated checks and sampled human review.

## Lessons Learned

1. **Start with failure cases, not success cases.** Collect the prompts where your model fails and build your eval set from those.
2. **Automated evals are necessary but not sufficient.** You still need human review, just less of it.
3. **Version your eval sets.** When you change your eval criteria, you lose the ability to compare with previous results.
4. **Eval drift is real.** Your eval set needs to evolve as your product evolves.

The uncomfortable truth is that evaluation is never "done." It's an ongoing practice, like testing in traditional software engineering — except the failure modes are weirder.
