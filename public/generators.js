function formatAngle(gate) {
  return Number(
    gate.angle ?? 0
  ).toFixed(6);
}


export function generateQiskit(
  circuit
) {
  const lines = [
    "from qiskit import QuantumCircuit",
    "",
    `qc = QuantumCircuit(${circuit.qubits})`,
    ""
  ];

  for (
    const gate
    of circuit.gates
  ) {
    switch (
      gate.type
    ) {
      case "H":
        lines.push(
          `qc.h(${gate.target})`
        );
        break;

      case "X":
        lines.push(
          `qc.x(${gate.target})`
        );
        break;

      case "Y":
        lines.push(
          `qc.y(${gate.target})`
        );
        break;

      case "Z":
        lines.push(
          `qc.z(${gate.target})`
        );
        break;

      case "S":
        lines.push(
          `qc.s(${gate.target})`
        );
        break;

      case "T":
        lines.push(
          `qc.t(${gate.target})`
        );
        break;

      case "RX":
        lines.push(
          `qc.rx(${formatAngle(gate)}, ${gate.target})`
        );
        break;

      case "RY":
        lines.push(
          `qc.ry(${formatAngle(gate)}, ${gate.target})`
        );
        break;

      case "RZ":
        lines.push(
          `qc.rz(${formatAngle(gate)}, ${gate.target})`
        );
        break;

      case "CX":
        lines.push(
          `qc.cx(${gate.control}, ${gate.target})`
        );
        break;

      case "SWAP":
        lines.push(
          `qc.swap(${gate.first}, ${gate.second})`
        );
        break;
    }
  }

  lines.push("");
  lines.push("qc.measure_all()");
  lines.push("");
  lines.push("print(qc)");

  return lines.join("\n");
}


export function generateCirq(
  circuit
) {
  const qubitNames =
    Array.from(
      {
        length:
          circuit.qubits
      },
      (_, index) =>
        `q${index}`
    );

  const lines = [
    "import cirq",
    "",
    `${qubitNames.join(", ")} = cirq.LineQubit.range(${circuit.qubits})`,
    "",
    "circuit = cirq.Circuit("
  ];

  const operations = [];

  for (
    const gate
    of circuit.gates
  ) {
    switch (
      gate.type
    ) {
      case "H":
        operations.push(
          `    cirq.H(q${gate.target})`
        );
        break;

      case "X":
        operations.push(
          `    cirq.X(q${gate.target})`
        );
        break;

      case "Y":
        operations.push(
          `    cirq.Y(q${gate.target})`
        );
        break;

      case "Z":
        operations.push(
          `    cirq.Z(q${gate.target})`
        );
        break;

      case "S":
        operations.push(
          `    cirq.S(q${gate.target})`
        );
        break;

      case "T":
        operations.push(
          `    cirq.T(q${gate.target})`
        );
        break;

      case "RX":
        operations.push(
          `    cirq.rx(${formatAngle(gate)})(q${gate.target})`
        );
        break;

      case "RY":
        operations.push(
          `    cirq.ry(${formatAngle(gate)})(q${gate.target})`
        );
        break;

      case "RZ":
        operations.push(
          `    cirq.rz(${formatAngle(gate)})(q${gate.target})`
        );
        break;

      case "CX":
        operations.push(
          `    cirq.CNOT(q${gate.control}, q${gate.target})`
        );
        break;

      case "SWAP":
        operations.push(
          `    cirq.SWAP(q${gate.first}, q${gate.second})`
        );
        break;
    }
  }

  operations.push(
    `    cirq.measure(${qubitNames.join(", ")}, key="result")`
  );

  lines.push(
    operations.join(",\n")
  );

  lines.push(")");
  lines.push("");
  lines.push("print(circuit)");

  return lines.join("\n");
}


export function generatePennyLane(
  circuit
) {
  const lines = [
    "import pennylane as qml",
    "",
    `dev = qml.device("default.qubit", wires=${circuit.qubits}, shots=1024)`,
    "",
    "@qml.qnode(dev)",
    "def circuit():"
  ];

  if (
    circuit.gates.length === 0
  ) {
    lines.push(
      "    pass"
    );
  }

  for (
    const gate
    of circuit.gates
  ) {
    switch (
      gate.type
    ) {
      case "H":
        lines.push(
          `    qml.Hadamard(wires=${gate.target})`
        );
        break;

      case "X":
        lines.push(
          `    qml.PauliX(wires=${gate.target})`
        );
        break;

      case "Y":
        lines.push(
          `    qml.PauliY(wires=${gate.target})`
        );
        break;

      case "Z":
        lines.push(
          `    qml.PauliZ(wires=${gate.target})`
        );
        break;

      case "S":
        lines.push(
          `    qml.S(wires=${gate.target})`
        );
        break;

      case "T":
        lines.push(
          `    qml.T(wires=${gate.target})`
        );
        break;

      case "RX":
        lines.push(
          `    qml.RX(${formatAngle(gate)}, wires=${gate.target})`
        );
        break;

      case "RY":
        lines.push(
          `    qml.RY(${formatAngle(gate)}, wires=${gate.target})`
        );
        break;

      case "RZ":
        lines.push(
          `    qml.RZ(${formatAngle(gate)}, wires=${gate.target})`
        );
        break;

      case "CX":
        lines.push(
          `    qml.CNOT(wires=[${gate.control}, ${gate.target}])`
        );
        break;

      case "SWAP":
        lines.push(
          `    qml.SWAP(wires=[${gate.first}, ${gate.second}])`
        );
        break;
    }
  }

  lines.push(
    `    return qml.probs(wires=range(${circuit.qubits}))`
  );

  lines.push("");
  lines.push("print(circuit())");

  return lines.join("\n");
}


export function generateOpenQASM(
  circuit
) {
  const lines = [
    "OPENQASM 3.0;",
    `qubit[${circuit.qubits}] q;`,
    `bit[${circuit.qubits}] c;`,
    ""
  ];

  for (
    const gate
    of circuit.gates
  ) {
    switch (
      gate.type
    ) {
      case "H":
        lines.push(
          `h q[${gate.target}];`
        );
        break;

      case "X":
        lines.push(
          `x q[${gate.target}];`
        );
        break;

      case "Y":
        lines.push(
          `y q[${gate.target}];`
        );
        break;

      case "Z":
        lines.push(
          `z q[${gate.target}];`
        );
        break;

      case "S":
        lines.push(
          `s q[${gate.target}];`
        );
        break;

      case "T":
        lines.push(
          `t q[${gate.target}];`
        );
        break;

      case "RX":
        lines.push(
          `rx(${gate.angle ?? 0}) q[${gate.target}];`
        );
        break;

      case "RY":
        lines.push(
          `ry(${gate.angle ?? 0}) q[${gate.target}];`
        );
        break;

      case "RZ":
        lines.push(
          `rz(${gate.angle ?? 0}) q[${gate.target}];`
        );
        break;

      case "CX":
        lines.push(
          `cx q[${gate.control}], q[${gate.target}];`
        );
        break;

      case "SWAP":
        lines.push(
          `swap q[${gate.first}], q[${gate.second}];`
        );
        break;
    }
  }

  lines.push("");

  for (
    let index = 0;
    index < circuit.qubits;
    index++
  ) {
    lines.push(
      `c[${index}] = measure q[${index}];`
    );
  }

  return lines.join("\n");
}