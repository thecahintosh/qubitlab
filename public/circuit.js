export const SINGLE_QUBIT_GATES = [
  "H",
  "X",
  "Y",
  "Z",
  "S",
  "T",
  "RX",
  "RY",
  "RZ"
];

export const MULTI_QUBIT_GATES = [
  "CX",
  "SWAP"
];

export const ALL_GATES = [
  ...SINGLE_QUBIT_GATES,
  ...MULTI_QUBIT_GATES
];


export function createCircuit(
  qubits = 2
) {
  return {
    qubits,
    gates: []
  };
}


export function addGate(
  circuit,
  gate
) {
  validateGate(
    gate,
    circuit.qubits
  );

  return {
    ...circuit,

    gates: [
      ...circuit.gates,
      gate
    ]
  };
}


export function removeLastGate(
  circuit
) {
  return {
    ...circuit,

    gates:
      circuit.gates.slice(
        0,
        -1
      )
  };
}


export function removeGateAt(
  circuit,
  index
) {
  return {
    ...circuit,

    gates:
      circuit.gates.filter(
        (_, gateIndex) =>
          gateIndex !== index
      )
  };
}


export function replaceGateAt(
  circuit,
  index,
  gate
) {
  validateGate(
    gate,
    circuit.qubits
  );

  return {
    ...circuit,

    gates:
      circuit.gates.map(
        (
          existingGate,
          gateIndex
        ) =>
          gateIndex === index
            ? gate
            : existingGate
      )
  };
}


export function clearCircuit(
  circuit
) {
  return {
    ...circuit,
    gates: []
  };
}


export function changeQubitCount(
  circuit,
  qubits
) {
  if (
    !Number.isInteger(qubits) ||
    qubits < 1 ||
    qubits > 6
  ) {
    throw new Error(
      "Qubit count must be between 1 and 6."
    );
  }

  return {
    qubits,
    gates: []
  };
}


export function validateGate(
  gate,
  qubitCount
) {
  if (
    !gate ||
    typeof gate !== "object"
  ) {
    throw new Error(
      "Invalid gate."
    );
  }


  if (
    !ALL_GATES.includes(
      gate.type
    )
  ) {
    throw new Error(
      `Unsupported gate: ${gate.type}`
    );
  }


  if (
    SINGLE_QUBIT_GATES.includes(
      gate.type
    )
  ) {
    validateQubitIndex(
      gate.target,
      qubitCount,
      "target"
    );
  }


  if (
    gate.type === "CX"
  ) {
    validateQubitIndex(
      gate.control,
      qubitCount,
      "control"
    );

    validateQubitIndex(
      gate.target,
      qubitCount,
      "target"
    );


    if (
      gate.control ===
      gate.target
    ) {
      throw new Error(
        "CNOT control and target must be different."
      );
    }
  }


  if (
    gate.type === "SWAP"
  ) {
    validateQubitIndex(
      gate.first,
      qubitCount,
      "first"
    );

    validateQubitIndex(
      gate.second,
      qubitCount,
      "second"
    );


    if (
      gate.first ===
      gate.second
    ) {
      throw new Error(
        "SWAP requires two different qubits."
      );
    }
  }


  if (
    [
      "RX",
      "RY",
      "RZ"
    ].includes(
      gate.type
    )
  ) {
    if (
      typeof gate.angle !==
        "number" ||
      !Number.isFinite(
        gate.angle
      )
    ) {
      throw new Error(
        `${gate.type} requires a valid numeric angle.`
      );
    }
  }


  return true;
}


function validateQubitIndex(
  value,
  qubitCount,
  label
) {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value >= qubitCount
  ) {
    throw new Error(
      `Invalid ${label} qubit: q${value}`
    );
  }
}