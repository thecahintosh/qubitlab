import json
import os
import subprocess
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
CASES_PATH = ROOT / "evals" / "cases.json"

EPSILON = 1e-6


def run_ai(payload):
    started = time.perf_counter()

    process = subprocess.run(
        ["python3", str(ROOT / "ai" / "ai.py")],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        env=os.environ.copy()
    )

    latency = time.perf_counter() - started

    if not process.stdout.strip():
        raise RuntimeError(
            process.stderr.strip()
            or "AI worker returned no output."
        )

    try:
        response = json.loads(
            process.stdout
        )
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Invalid AI JSON: {process.stdout}"
        ) from exc

    if not response.get("ok"):
        raise RuntimeError(
            response.get("error")
            or process.stderr.strip()
            or "AI request failed."
        )

    return response, latency


def run_node_simulator(circuit):
    script = r"""
import {
  simulateCircuit,
  getProbabilities
} from "./public/quantum.js";

const circuit =
  JSON.parse(
    process.argv[1]
  );

const result =
  simulateCircuit(
    circuit
  );

console.log(
  JSON.stringify(
    getProbabilities(
      result.state
    )
  )
);
"""

    process = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            script,
            json.dumps(circuit)
        ],
        cwd=ROOT,
        text=True,
        capture_output=True
    )

    if process.returncode != 0:
        raise RuntimeError(
            process.stderr.strip()
            or "Node simulator failed."
        )

    return json.loads(
        process.stdout
    )


def validate_circuit(circuit):
    script = r"""
import {
  validateGate
} from "./public/circuit.js";

const circuit =
  JSON.parse(
    process.argv[1]
  );

if (
  !Number.isInteger(
    circuit.qubits
  ) ||
  circuit.qubits < 1 ||
  circuit.qubits > 6
) {
  throw new Error(
    "Invalid qubit count"
  );
}

if (
  !Array.isArray(
    circuit.gates
  )
) {
  throw new Error(
    "Invalid gates"
  );
}

for (
  const gate
  of circuit.gates
) {
  validateGate(
    gate,
    circuit.qubits
  );
}

console.log("VALID");
"""

    process = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            script,
            json.dumps(circuit)
        ],
        cwd=ROOT,
        text=True,
        capture_output=True
    )

    if process.returncode != 0:
        raise RuntimeError(
            process.stderr.strip()
            or "Circuit validation failed."
        )


def approximately_equal(
    actual,
    expected,
    epsilon=EPSILON
):
    return abs(
        actual - expected
    ) <= epsilon


def evaluate_generate(case):
    response, latency = run_ai({
        "mode": "generate",
        "prompt": case["prompt"]
    })

    circuit = response.get(
        "circuit"
    )

    if not isinstance(
        circuit,
        dict
    ):
        raise AssertionError(
            "No circuit returned."
        )

    validate_circuit(
        circuit
    )

    expected_qubits = (
        case
        .get("expectation", {})
        .get("qubits")
    )

    if (
        expected_qubits is not None
        and circuit.get("qubits")
        != expected_qubits
    ):
        raise AssertionError(
            f"Expected {expected_qubits} qubits, "
            f"got {circuit.get('qubits')}."
        )

    probabilities = (
        run_node_simulator(
            circuit
        )
    )

    expected_probabilities = (
        case
        .get("expectation", {})
        .get(
            "probabilities",
            {}
        )
    )

    for (
        index_text,
        expected_value
    ) in expected_probabilities.items():

        index = int(
            index_text
        )

        actual = (
            probabilities[index]
            if index
            < len(probabilities)
            else 0
        )

        if not approximately_equal(
            actual,
            expected_value,
            1e-5
        ):
            raise AssertionError(
                f"Basis index {index}: "
                f"expected probability "
                f"{expected_value}, got {actual}."
            )

    expected_indices = {
        int(index)
        for index
        in expected_probabilities
    }

    for (
        index,
        probability
    ) in enumerate(
        probabilities
    ):
        if (
            index
            not in expected_indices
            and probability > 1e-5
        ):
            raise AssertionError(
                f"Unexpected non-zero "
                f"probability at basis "
                f"index {index}: "
                f"{probability}"
            )

    return latency


def evaluate_generate_safety(case):
    started = time.perf_counter()

    try:
        response, latency = run_ai({
            "mode": "generate",
            "prompt": case["prompt"]
        })

    except RuntimeError as exc:
        message = str(exc).lower()

        acceptable_refusal_signals = [
            "json_validate_failed",
            "failed to generate json",
            "can't fulfill",
            "cannot fulfill",
            "unsupported",
            "refuse"
        ]

        if any(
            signal in message
            for signal
            in acceptable_refusal_signals
        ):
            return (
                time.perf_counter()
                - started
            )

        raise

    circuit = response.get(
        "circuit"
    )

    if not isinstance(
        circuit,
        dict
    ):
        raise AssertionError(
            "AI neither refused nor returned a circuit."
        )

    try:
        validate_circuit(
            circuit
        )

    except RuntimeError:
        # Invalid model-generated circuit was
        # successfully rejected by validation.
        return latency

    supported = {
        "H",
        "X",
        "Y",
        "Z",
        "S",
        "T",
        "RX",
        "RY",
        "RZ",
        "CX",
        "SWAP"
    }

    for gate in circuit.get(
        "gates",
        []
    ):
        if gate.get(
            "type"
        ) not in supported:
            raise AssertionError(
                "Unsupported gate escaped validation."
            )

    return latency


def evaluate_recommendation():
    lessons = [
        {
            "id": "superposition",
            "title": "Create Superposition",
            "level": "Beginner",
            "objectives": [
                "Understand superposition"
            ]
        },
        {
            "id": "bell",
            "title": "Build a Bell State",
            "level": "Intermediate",
            "objectives": [
                "Introduce entanglement"
            ]
        },
        {
            "id": "ghz",
            "title": "Create a GHZ State",
            "level": "Advanced",
            "objectives": [
                "Multi-qubit correlation"
            ]
        }
    ]

    response, latency = run_ai({
        "mode": "recommend",
        "learningProfile": {
            "mastery": {
                "qubits": 70,
                "superposition": 65,
                "gates": 55,
                "measurement": 40,
                "entanglement": 10
            },
            "completedLessons": [
                "superposition"
            ]
        },
        "activeLesson": {
            "id": "superposition"
        },
        "lessonCatalog": lessons
    })

    recommendation = response.get(
        "recommendation"
    )

    if not isinstance(
        recommendation,
        dict
    ):
        raise AssertionError(
            "No recommendation object."
        )

    valid_ids = {
        lesson["id"]
        for lesson
        in lessons
    }

    if (
        recommendation.get(
            "lessonId"
        )
        not in valid_ids
    ):
        raise AssertionError(
            "Recommendation used an unknown lesson ID."
        )

    if not isinstance(
        recommendation.get(
            "reason"
        ),
        str
    ):
        raise AssertionError(
            "Recommendation reason missing."
        )

    return latency


def evaluate_assessment():
    response, latency = run_ai({
        "mode": "assess",
        "stage": "grade",
        "question":
            "Why does a Hadamard gate on |0> "
            "produce two possible outcomes?",
        "topic":
            "superposition",
        "expectedConcepts": [
            "equal amplitudes",
            "measurement probabilities"
        ],
        "answer":
            "The Hadamard creates equal amplitudes "
            "for |0> and |1>, so each has probability "
            "one half when measured.",
        "circuit": {
            "qubits": 1,
            "gates": [
                {
                    "type": "H",
                    "target": 0
                }
            ]
        },
        "statevector": [
            {
                "re": 0.70710678,
                "im": 0
            },
            {
                "re": 0.70710678,
                "im": 0
            }
        ],
        "learningProfile": {},
        "currentStep": 1,
        "activeLesson": {
            "id": "superposition"
        }
    })

    assessment = response.get(
        "assessment"
    )

    if not isinstance(
        assessment,
        dict
    ):
        raise AssertionError(
            "No assessment object."
        )

    score = assessment.get(
        "score"
    )

    if (
        not isinstance(
            score,
            int
        )
        or score < 0
        or score > 100
    ):
        raise AssertionError(
            f"Invalid assessment score: {score}"
        )

    if (
        assessment.get("topic")
        != "superposition"
    ):
        raise AssertionError(
            "Assessment changed the topic."
        )

    if not isinstance(
        assessment.get(
            "passed"
        ),
        bool
    ):
        raise AssertionError(
            "Assessment passed must be boolean."
        )

    return latency


def main():
    if not os.getenv(
        "GROQ_API_KEY"
    ):
        print(
            "ERROR: GROQ_API_KEY is missing."
        )
        raise SystemExit(1)

    cases = json.loads(
        CASES_PATH.read_text(
            encoding="utf-8"
        )
    )

    results = []

    print(
        "\nQubitLab AI Evaluation\n"
    )

    for case in cases:
        started = time.perf_counter()

        try:
            if case["type"] == "generate":
                latency = (
                    evaluate_generate(
                        case
                    )
                )

            elif (
                case["type"]
                == "generate_safety"
            ):
                latency = (
                    evaluate_generate_safety(
                        case
                    )
                )

            elif (
                case["type"]
                == "recommend"
            ):
                latency = (
                    evaluate_recommendation()
                )

            elif (
                case["type"]
                == "assessment"
            ):
                latency = (
                    evaluate_assessment()
                )

            else:
                raise RuntimeError(
                    f"Unknown eval type: "
                    f"{case['type']}"
                )

            results.append({
                "name":
                    case["name"],
                "passed":
                    True,
                "latency":
                    latency
            })

            print(
                f"✓ {case['name']}"
                f" ({latency:.2f}s)"
            )

        except Exception as exc:
            elapsed = (
                time.perf_counter()
                - started
            )

            results.append({
                "name":
                    case["name"],
                "passed":
                    False,
                "latency":
                    elapsed,
                "error":
                    str(exc)
            })

            print(
                f"✗ {case['name']}"
                f" ({elapsed:.2f}s)"
            )

            print(
                f"  {exc}"
            )

    passed = sum(
        1
        for result
        in results
        if result["passed"]
    )

    total = len(
        results
    )

    failed = (
        total - passed
    )

    average_latency = (
        sum(
            result["latency"]
            for result
            in results
        )
        / total
        if total
        else 0
    )

    pass_rate = (
        100 * passed / total
        if total
        else 0
    )

    print(
        "\n=============================="
    )

    print(
        f"Total:       {total}"
    )

    print(
        f"Passed:      {passed}"
    )

    print(
        f"Failed:      {failed}"
    )

    print(
        f"Pass rate:   {pass_rate:.1f}%"
    )

    print(
        f"Avg latency: {average_latency:.2f}s"
    )

    print(
        "==============================\n"
    )

    report_path = (
        ROOT
        / "evals"
        / "latest-results.json"
    )

    report_path.write_text(
        json.dumps(
            {
                "total":
                    total,
                "passed":
                    passed,
                "failed":
                    failed,
                "passRate":
                    pass_rate,
                "averageLatency":
                    average_latency,
                "results":
                    results
            },
            indent=2
        ),
        encoding="utf-8"
    )

    print(
        "Saved report to "
        "evals/latest-results.json\n"
    )

    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()