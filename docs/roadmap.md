# AQShield Step-by-Step Build Roadmap

## Chunk 1: Foundation

- create repository structure
- define architecture and implementation roadmap
- establish module boundaries

## Chunk 2: Backend Skeleton

- create FastAPI application
- add health, protocols, runs, metrics, and experiments endpoints
- add config and shared response models

## Chunk 3: Shared Domain Contracts

- define protocol interfaces
- define simulation request and result schemas
- define experiment configuration models
- define metrics and attack data models

## Chunk 4: Baseline Simulation Flow

- implement a simple end-to-end simulation stub
- support message input, protocol selection, and channel parameters
- return structured placeholder metrics and traces

## Chunk 5: Protocol Layer

- add BB84 baseline adapter
- add Ping-Pong QSDC adapter
- add Deng-Long QSDC adapter
- add AQShield protocol shell

## Chunk 6: Adaptive Engine

- model channel state input
- implement rule-based adaptation first
- create future hook for AI-assisted decisioning

## Chunk 7: Attack and Authentication

- add attack injectors
- add authentication strategy abstractions
- connect both to run execution flow

## Chunk 8: Metrics and Storage

- compute benchmark metrics
- store runs and experiments
- expose history and reporting data

## Chunk 9: Frontend Dashboard

- build the control dashboard
- create simulation runner page
- create attack centre and metrics views

## Chunk 10: Research Deliverables

- experiment templates
- comparison reports
- plots and export flow
- documentation for review meetings and demos
