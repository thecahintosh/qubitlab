import assert from "node:assert/strict";

import {
  createZeroState,
  simulateCircuit,
  getProbabilities,
  runShots
} from "../public/quantum.js";


const EPSILON =
  1e-9;


function approximatelyEqual(
  actual,
  expected,
  epsilon = EPSILON
) {
  assert.ok(
    Math.abs(
      actual - expected
    ) <= epsilon,
    `Expected ${actual} ≈ ${expected}`
  );
}


function probabilityAt(
  state,
  index
) {
  const amplitude =
    state[index];


  return (
    amplitude.re ** 2 +
    amplitude.im ** 2
  );
}


export function runQuantumTests() {
  const results = [];


  function test(
    name,
    fn
  ) {
    try {
      fn();

      results.push({
        name,
        passed: true
      });
    }

    catch (error) {
      results.push({
        name,
        passed: false,
        error
      });
    }
  }


  test(
    "zero state for one qubit is |0>",
    () => {
      const state =
        createZeroState(1);


      assert.equal(
        state.length,
        2
      );


      approximatelyEqual(
        state[0].re,
        1
      );


      approximatelyEqual(
        state[0].im,
        0
      );


      approximatelyEqual(
        state[1].re,
        0
      );


      approximatelyEqual(
        state[1].im,
        0
      );
    }
  );


  test(
    "X transforms |0> into |1>",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 1,

          gates: [
            {
              type: "X",
              target: 0
            }
          ]
        });


      approximatelyEqual(
        probabilityAt(
          state,
          0
        ),
        0
      );


      approximatelyEqual(
        probabilityAt(
          state,
          1
        ),
        1
      );
    }
  );


  test(
    "H on |0> creates equal probabilities",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 1,

          gates: [
            {
              type: "H",
              target: 0
            }
          ]
        });


      approximatelyEqual(
        probabilityAt(
          state,
          0
        ),
        0.5
      );


      approximatelyEqual(
        probabilityAt(
          state,
          1
        ),
        0.5
      );
    }
  );


  test(
    "H followed by H returns |0>",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 1,

          gates: [
            {
              type: "H",
              target: 0
            },

            {
              type: "H",
              target: 0
            }
          ]
        });


      approximatelyEqual(
        probabilityAt(
          state,
          0
        ),
        1
      );


      approximatelyEqual(
        probabilityAt(
          state,
          1
        ),
        0
      );
    }
  );


  test(
    "Bell circuit creates 50% |00> and 50% |11>",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 2,

          gates: [
            {
              type: "H",
              target: 0
            },

            {
              type: "CX",
              control: 0,
              target: 1
            }
          ]
        });


      approximatelyEqual(
        probabilityAt(
          state,
          0
        ),
        0.5
      );


      approximatelyEqual(
        probabilityAt(
          state,
          1
        ),
        0
      );


      approximatelyEqual(
        probabilityAt(
          state,
          2
        ),
        0
      );


      approximatelyEqual(
        probabilityAt(
          state,
          3
        ),
        0.5
      );
    }
  );


  test(
    "GHZ circuit creates |000> and |111>",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 3,

          gates: [
            {
              type: "H",
              target: 0
            },

            {
              type: "CX",
              control: 0,
              target: 1
            },

            {
              type: "CX",
              control: 1,
              target: 2
            }
          ]
        });


      approximatelyEqual(
        probabilityAt(
          state,
          0
        ),
        0.5
      );


      approximatelyEqual(
        probabilityAt(
          state,
          7
        ),
        0.5
      );


      for (
        let index = 1;
        index < 7;
        index++
      ) {
        approximatelyEqual(
          probabilityAt(
            state,
            index
          ),
          0
        );
      }
    }
  );


  test(
    "CNOT flips target when control is 1",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 2,

          gates: [
            {
              type: "X",
              target: 0
            },

            {
              type: "CX",
              control: 0,
              target: 1
            }
          ]
        });


      approximatelyEqual(
        probabilityAt(
          state,
          3
        ),
        1
      );
    }
  );


  test(
    "CNOT does nothing when control is 0",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 2,

          gates: [
            {
              type: "X",
              target: 1
            },

            {
              type: "CX",
              control: 0,
              target: 1
            }
          ]
        });


      /*
        q0 is LSB.

        q1 = 1
        q0 = 0

        => |10>
        index 2
      */

      approximatelyEqual(
        probabilityAt(
          state,
          2
        ),
        1
      );
    }
  );


  test(
    "SWAP exchanges q0 and q1",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 2,

          gates: [
            {
              type: "X",
              target: 0
            },

            {
              type: "SWAP",
              first: 0,
              second: 1
            }
          ]
        });


      /*
        Initial after X(q0):

        |01>

        After swap:

        |10>
      */

      approximatelyEqual(
        probabilityAt(
          state,
          2
        ),
        1
      );
    }
  );


  test(
    "RX(pi) maps |0> to |1> up to phase",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 1,

          gates: [
            {
              type: "RX",
              target: 0,
              angle: Math.PI
            }
          ]
        });


      approximatelyEqual(
        probabilityAt(
          state,
          1
        ),
        1
      );
    }
  );


  test(
    "RY(pi) maps |0> to |1>",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 1,

          gates: [
            {
              type: "RY",
              target: 0,
              angle: Math.PI
            }
          ]
        });


      approximatelyEqual(
        probabilityAt(
          state,
          1
        ),
        1
      );
    }
  );


  test(
    "RZ does not change |0> measurement probability",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 1,

          gates: [
            {
              type: "RZ",
              target: 0,
              angle: Math.PI / 3
            }
          ]
        });


      approximatelyEqual(
        probabilityAt(
          state,
          0
        ),
        1
      );


      approximatelyEqual(
        probabilityAt(
          state,
          1
        ),
        0
      );
    }
  );


  test(
    "probabilities always sum to 1",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 3,

          gates: [
            {
              type: "H",
              target: 0
            },

            {
              type: "RY",
              target: 1,
              angle: 0.73
            },

            {
              type: "CX",
              control: 1,
              target: 2
            },

            {
              type: "T",
              target: 0
            }
          ]
        });


      const probabilities =
        getProbabilities(
          state
        );


      const total =
        probabilities.reduce(
          (
            sum,
            value
          ) =>
            sum + value,
          0
        );


      approximatelyEqual(
        total,
        1,
        1e-8
      );
    }
  );


  test(
    "shot counts sum to requested number of shots",
    () => {
      const {
        state
      } =
        simulateCircuit({
          qubits: 1,

          gates: [
            {
              type: "H",
              target: 0
            }
          ]
        });


      const requestedShots =
        1000;


      const counts =
        runShots(
          state,
          1,
          requestedShots
        );


      const total =
        Object.values(
          counts
        ).reduce(
          (
            sum,
            count
          ) =>
            sum + count,
          0
        );


      assert.equal(
        total,
        requestedShots
      );
    }
  );


  return results;
}