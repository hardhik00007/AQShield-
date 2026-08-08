"""Genuine gate-level BB84 simulation using Qiskit + Aer.

Unlike simulation/channel.py (which derives QBER from calibrated formulas
for fast multi-run benchmarking), this module builds and executes actual
single-qubit circuits for each transmitted qubit, including an optional
intercept-resend eavesdropper implemented as a real mid-transit measurement
and re-preparation. QBER here is *measured* from circuit outcomes, not
asserted.

Scope, by design:
- Only BB84's basis-encoding/measurement semantics are modeled (the
  best-defined textbook case for a circuit-level demonstration).
- Only intercept-resend is modeled as a physical mechanism (measure in a
  guessed basis, then re-transmit a freshly prepared qubit) — the other
  attack families remain in attacks/catalog.py's behavioral model.
- Intended for small, on-demand "preview" runs (a handful to a few dozen
  qubits), not for the fast repeated sweeps used in Benchmark Laboratory.
"""

from __future__ import annotations

import random
from dataclasses import dataclass

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

_SIMULATOR = AerSimulator()
MAX_QUBITS = 48


def _prepare_and_measure(bit: int, prep_basis: str, measure_basis: str) -> int:
    """Build and run a single-qubit circuit: encode `bit` in `prep_basis`,
    then measure in `measure_basis`. Returns the measured classical bit.

    When prep_basis == measure_basis, this is deterministic (the qubit is
    an eigenstate of the measurement operator). When they differ, the
    outcome is genuinely probabilistic — sampled via the Born rule by the
    Aer simulator — exactly as real BB84 physics predicts.
    """
    circuit = QuantumCircuit(1, 1)
    if bit == 1:
        circuit.x(0)
    if prep_basis == "X":
        circuit.h(0)
    if measure_basis == "X":
        circuit.h(0)
    circuit.measure(0, 0)

    result = _SIMULATOR.run(circuit, shots=1, memory=True).result()
    return int(result.get_memory()[0])


@dataclass(slots=True)
class QubitTrace:
    index: int
    alice_bit: int
    alice_basis: str
    eve_basis: str | None
    eve_bit: int | None
    bob_basis: str
    bob_bit: int
    bases_match: bool
    kept: bool
    error: bool


@dataclass(slots=True)
class Bb84Result:
    num_qubits: int
    eavesdrop: bool
    trace: list[QubitTrace]
    sifted_key_length: int
    matching_basis_rate: float
    qber: float


def simulate_bb84(
    num_qubits: int = 24,
    eavesdrop: bool = False,
    seed: int | None = None,
) -> Bb84Result:
    num_qubits = max(4, min(MAX_QUBITS, num_qubits))
    rng = random.Random(seed)

    trace: list[QubitTrace] = []
    errors = 0
    kept_count = 0

    for index in range(num_qubits):
        alice_bit = rng.randint(0, 1)
        alice_basis = rng.choice(("Z", "X"))
        bob_basis = rng.choice(("Z", "X"))

        eve_basis: str | None = None
        eve_bit: int | None = None
        carrier_bit = alice_bit
        carrier_basis = alice_basis

        if eavesdrop:
            # Eve does not know Alice's basis: she guesses randomly, measures
            # (collapsing the state), and re-prepares a fresh qubit in her own
            # basis using what she observed. This is the actual physical
            # mechanism by which intercept-resend introduces errors.
            eve_basis = rng.choice(("Z", "X"))
            eve_bit = _prepare_and_measure(alice_bit, alice_basis, eve_basis)
            carrier_bit = eve_bit
            carrier_basis = eve_basis

        bob_bit = _prepare_and_measure(carrier_bit, carrier_basis, bob_basis)

        bases_match = alice_basis == bob_basis
        kept = bases_match
        error = bool(kept and alice_bit != bob_bit)

        if kept:
            kept_count += 1
            if error:
                errors += 1

        trace.append(
            QubitTrace(
                index=index,
                alice_bit=alice_bit,
                alice_basis=alice_basis,
                eve_basis=eve_basis,
                eve_bit=eve_bit,
                bob_basis=bob_basis,
                bob_bit=bob_bit,
                bases_match=bases_match,
                kept=kept,
                error=error,
            )
        )

    qber = errors / kept_count if kept_count else 0.0

    return Bb84Result(
        num_qubits=num_qubits,
        eavesdrop=eavesdrop,
        trace=trace,
        sifted_key_length=kept_count,
        matching_basis_rate=(kept_count / num_qubits) if num_qubits else 0.0,
        qber=round(qber, 4),
    )
