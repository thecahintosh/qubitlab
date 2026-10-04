import {
  validateGate
} from "./circuit.js";


function complex(re = 0, im = 0) {
  return {
    re,
    im
  };
}


function add(a, b) {
  return complex(
    a.re + b.re,
    a.im + b.im
  );
}


function multiply(a, b) {
  return complex(
    a.re * b.re - a.im * b.im,
    a.re * b.im + a.im * b.re
  );
}


function cloneState(state) {
  return state.map(
    amplitude => complex(
      amplitude.re,
      amplitude.im
    )
  );
}


export function createZeroState(qubits) {
  const size = 2 ** qubits;

  return Array.from(
    {
      length: size
    },
    (_, index) => (
      index === 0
        ? complex(1, 0)
        : complex(0, 0)
    )
  );
}


function rotationX(theta) {
  const c =
    Math.cos(theta / 2);

  const s =
    Math.sin(theta / 2);

  return [
    [
      complex(c),
      complex(0, -s)
    ],
    [
      complex(0, -s),
      complex(c)
    ]
  ];
}


function rotationY(theta) {
  const c =
    Math.cos(theta / 2);

  const s =
    Math.sin(theta / 2);

  return [
    [
      complex(c),
      complex(-s)
    ],
    [
      complex(s),
      complex(c)
    ]
  ];
}


function rotationZ(theta) {
  return [
    [
      complex(
        Math.cos(-theta / 2),
        Math.sin(-theta / 2)
      ),
      complex(0)
    ],
    [
      complex(0),
      complex(
        Math.cos(theta / 2),
        Math.sin(theta / 2)
      )
    ]
  ];
}


function getGateMatrix(type, angle = 0) {
  const SQRT_HALF =
    1 / Math.sqrt(2);

  switch (type) {
    case "H":
      return [
        [
          complex(SQRT_HALF),
          complex(SQRT_HALF)
        ],
        [
          complex(SQRT_HALF),
          complex(-SQRT_HALF)
        ]
      ];

    case "X":
      return [
        [
          complex(0),
          complex(1)
        ],
        [
          complex(1),
          complex(0)
        ]
      ];

    case "Y":
      return [
        [
          complex(0),
          complex(0, -1)
        ],
        [
          complex(0, 1),
          complex(0)
        ]
      ];

    case "Z":
      return [
        [
          complex(1),
          complex(0)
        ],
        [
          complex(0),
          complex(-1)
        ]
      ];

    case "S":
      return [
        [
          complex(1),
          complex(0)
        ],
        [
          complex(0),
          complex(0, 1)
        ]
      ];

    case "T": {
      const phase =
        Math.PI / 4;

      return [
        [
          complex(1),
          complex(0)
        ],
        [
          complex(0),
          complex(
            Math.cos(phase),
            Math.sin(phase)
          )
        ]
      ];
    }

    case "RX":
      return rotationX(angle);

    case "RY":
      return rotationY(angle);

    case "RZ":
      return rotationZ(angle);

    default:
      throw new Error(
        `No matrix for gate ${type}`
      );
  }
}


function applySingleQubitMatrix(
  state,
  target,
  matrix
) {
  const result =
    cloneState(state);

  const mask =
    1 << target;

  for (
    let index = 0;
    index < state.length;
    index++
  ) {
    if ((index & mask) !== 0) {
      continue;
    }

    const index0 =
      index;

    const index1 =
      index | mask;

    const a =
      state[index0];

    const b =
      state[index1];

    result[index0] =
      add(
        multiply(
          matrix[0][0],
          a
        ),
        multiply(
          matrix[0][1],
          b
        )
      );

    result[index1] =
      add(
        multiply(
          matrix[1][0],
          a
        ),
        multiply(
          matrix[1][1],
          b
        )
      );
  }

  return result;
}


function applyCNOT(
  state,
  control,
  target
) {
  const result =
    cloneState(state);

  const controlMask =
    1 << control;

  const targetMask =
    1 << target;

  for (
    let index = 0;
    index < state.length;
    index++
  ) {
    const controlIsOne =
      (index & controlMask) !== 0;

    const targetIsZero =
      (index & targetMask) === 0;

    if (
      controlIsOne &&
      targetIsZero
    ) {
      const partner =
        index | targetMask;

      result[index] = {
        ...state[partner]
      };

      result[partner] = {
        ...state[index]
      };
    }
  }

  return result;
}


function applySwap(
  state,
  first,
  second
) {
  if (first === second) {
    return cloneState(state);
  }

  const result =
    cloneState(state);

  const firstMask =
    1 << first;

  const secondMask =
    1 << second;

  for (
    let index = 0;
    index < state.length;
    index++
  ) {
    const bitA =
      (index & firstMask) !== 0;

    const bitB =
      (index & secondMask) !== 0;

    if (bitA === bitB) {
      continue;
    }

    const partner =
      index ^
      firstMask ^
      secondMask;

    if (index < partner) {
      result[index] = {
        ...state[partner]
      };

      result[partner] = {
        ...state[index]
      };
    }
  }

  return result;
}


export function applyGate(
  state,
  gate,
  qubits
) {
  validateGate(
    gate,
    qubits
  );

  if (gate.type === "CX") {
    return applyCNOT(
      state,
      gate.control,
      gate.target
    );
  }

  if (gate.type === "SWAP") {
    return applySwap(
      state,
      gate.first,
      gate.second
    );
  }

  const matrix =
    getGateMatrix(
      gate.type,
      gate.angle ?? 0
    );

  return applySingleQubitMatrix(
    state,
    gate.target,
    matrix
  );
}


export function simulateCircuit(circuit) {
  let state =
    createZeroState(
      circuit.qubits
    );

  const history = [
    {
      step: 0,
      gate: null,
      state: cloneState(state)
    }
  ];

  circuit.gates.forEach(
    (gate, index) => {
      state =
        applyGate(
          state,
          gate,
          circuit.qubits
        );

      history.push({
        step: index + 1,
        gate,
        state: cloneState(state)
      });
    }
  );

  return {
    state,
    history
  };
}


export function probability(amplitude) {
  return (
    amplitude.re ** 2 +
    amplitude.im ** 2
  );
}


export function getProbabilities(state) {
  return state.map(
    probability
  );
}


export function basisLabel(
  index,
  qubits
) {
  return index
    .toString(2)
    .padStart(
      qubits,
      "0"
    );
}


export function runShots(
  state,
  qubits,
  shots = 1024
) {
  const probabilities =
    getProbabilities(state);

  const cumulative = [];

  let total = 0;

  probabilities.forEach(
    probability => {
      total += probability;

      cumulative.push(total);
    }
  );

  const counts = {};

  for (
    let shot = 0;
    shot < shots;
    shot++
  ) {
    const random =
      Math.random();

    let selected =
      cumulative.length - 1;

    for (
      let i = 0;
      i < cumulative.length;
      i++
    ) {
      if (
        random <=
        cumulative[i]
      ) {
        selected = i;
        break;
      }
    }

    const label =
      basisLabel(
        selected,
        qubits
      );

    counts[label] =
      (counts[label] || 0) + 1;
  }

  return counts;
}