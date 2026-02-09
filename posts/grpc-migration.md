---
title: Migrating from REST to gRPC
date: Jul 22, 2025
tag: Architecture
---

Last year we migrated our core inter-service communication from REST to gRPC. It was the right call, but it was also six months of tedious, unglamorous work. Here's what happened.

## Why We Switched

Our platform had grown to about 30 microservices. REST with JSON serialization was becoming a bottleneck:

- **Payload size.** JSON is verbose. Our largest API responses were 2-3x larger than they needed to be.
- **Schema drift.** Without a contract, services would silently add or remove fields. Consumers would break in mysterious ways.
- **Performance.** For high-throughput internal calls, HTTP/1.1 + JSON parsing added measurable latency.

## The Migration Strategy

We couldn't do a big-bang migration. Services were too interdependent. Instead we went with a strangler fig approach:

1. Define `.proto` files for the most critical service interfaces
2. Generate server stubs and client libraries
3. Run both REST and gRPC endpoints in parallel
4. Migrate consumers one at a time
5. Decommission REST endpoints once all consumers moved

```protobuf
syntax = "proto3";

service WorkflowService {
  rpc ExecuteWorkflow(ExecuteRequest) returns (ExecuteResponse);
  rpc GetWorkflowStatus(StatusRequest) returns (stream StatusUpdate);
}

message ExecuteRequest {
  string workflow_id = 1;
  map<string, string> parameters = 2;
  int32 timeout_seconds = 3;
}
```

## What Went Well

- **Type safety.** Proto definitions became the source of truth. No more guessing at field types.
- **Streaming.** gRPC's server-side streaming was perfect for our workflow status updates.
- **Code generation.** Auto-generated clients in Python, Go, and TypeScript saved weeks of work.

## What Was Painful

- **Tooling.** REST has curl. gRPC has... grpcurl, which is fine but not as ubiquitous.
- **Browser support.** We still needed REST for our frontend, so we added a gRPC-gateway.
- **Debugging.** Binary protocols are harder to inspect in transit.
- **Team buy-in.** Some engineers saw it as unnecessary complexity. The benefits only became clear after the migration was mostly done.

## Was It Worth It?

Yes. P99 latency on internal calls dropped 40%. Schema-related bugs went from weekly to nearly zero. The proto files serve as living documentation of our service contracts.

But I wouldn't do it again for a team with fewer than 10 services. The overhead isn't worth it at small scale.
