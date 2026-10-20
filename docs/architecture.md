# AQShield Architecture Blueprint

## 1. Product Positioning

AQShield is not a single protocol implementation and not only a website. It is a modular research platform for designing, simulating, evaluating, and presenting adaptive QSDC systems for defence communication environments.

## 2. Architecture Principles

- modular and replaceable subsystems
- protocol-first and experiment-first design
- clear separation between simulation, adaptation, and presentation
- reproducibility for research outputs
- easy benchmarking against baseline protocols
- backend-first implementation, frontend-second delivery

## 3. Logical Architecture

```text
                       AQShield Platform

                 Frontend Dashboard / Reports
                             |
                      FastAPI Control API
                             |
    -------------------------------------------------------------
    |            |              |            |          |         |
 Protocol   Simulation      Adaptive   Authentication  Attack   Metrics
  Engine      Engine          Engine        Engine      Engine    Engine
    |            |              |            |          |         |
    -------------------------------------------------------------
                             |
                     Experiment Orchestrator
                             |
                     Storage / Logs / Results
```

## 4. Core Modules

### Protocol Engine

Responsibilities:

- define protocol interfaces
- implement baseline protocols
- host AQShield adaptive protocol flow
- translate message inputs into protocol execution steps

Planned protocol families:

- BB84-inspired baseline
- Ping-Pong QSDC
- Deng-Long QSDC
- hybrid baseline stubs for comparison
- AQShield adaptive protocol

### Simulation Engine

Responsibilities:

- model sender, receiver, and channel behaviour
- simulate noise, basis choices, qubit flow, and measurement
- integrate with Qiskit first, with future multi-platform adapters

Simulation subdomains:

- quantum state preparation
- channel model
- receiver measurement
- decoding and recovery
- run trace generation

### Adaptive Engine

Responsibilities:

- inspect channel state and security indicators
- modify communication parameters dynamically
- produce adaptation decisions with traceable reasoning

Adaptive inputs:

- QBER
- photon loss
- estimated attack likelihood
- latency
- fidelity
- retransmission rate

Adaptive outputs:

- change basis policy
- increase decoy frequency
- switch error handling strategy
- throttle transmission
- trigger authentication escalation

### Authentication Engine

Responsibilities:

- validate communicating entities or sessions
- support hybrid quantum-classical authentication strategies
- expose authentication status to protocol control flow

### Attack Engine

Responsibilities:

- inject adversarial behaviours into runs
- support controlled benchmark scenarios
- record impact on security and performance metrics

Initial attack families:

- intercept-resend
- noise injection
- replay-style scenario stub
- denial and packet loss scenario stub

### Metrics Engine

Responsibilities:

- compute security and system metrics
- aggregate per-run and per-experiment summaries
- feed dashboard and reports

Core metrics:

- QBER
- throughput
- latency
- fidelity
- secure communication rate
- leakage probability estimate
- authentication accuracy
- detection rate

### Experiment Engine

Responsibilities:

- run repeatable batches of simulations
- sweep parameters such as noise and attack intensity
- store outputs for comparison and plotting

## 5. Data Flow

1. Client submits a simulation or experiment request.
2. API validates configuration and selects a protocol.
3. Protocol engine builds the execution plan.
4. Simulation engine models message transmission over a channel.
5. Attack engine modifies the channel or observation model if enabled.
6. Adaptive engine evaluates runtime conditions and adjusts protocol behaviour.
7. Authentication engine verifies communication continuation rules.
8. Metrics engine computes outputs and summaries.
9. Experiment orchestrator stores traces, metrics, and run metadata.
10. API returns structured results for dashboard and reporting layers.

