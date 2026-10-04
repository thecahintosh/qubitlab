import assert from "node:assert/strict";

import {
  createCircuit,
  addGate,
  validateGate,
  changeQubitCount
} from "../public/circuit.js";


export function runCircuitTests() {
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
    "createCircuit creates requested qubits",
    () => {
      const circuit =
        createCircuit(3);

      assert.equal(
        circuit.qubits,
        3
      );

      assert.deepEqual(
        circuit.gates,
        []
      );
    }
  );


  test(
    "addGate adds a valid H gate",
    () => {
      const circuit =
        createCircuit(1);

      const updated =
        addGate(
          circuit,
          {
            type: "H",
            target: 0
          }
        );

      assert.equal(
        updated.gates.length,
        1
      );

      assert.equal(
        updated.gates[0].type,
        "H"
      );
    }
  );


  test(
    "invalid gate type is rejected",
    () => {
      assert.throws(
        () => {
          validateGate(
            {
              type: "FAKE",
              target: 0
            },
            1
          );
        },
        /Unsupported gate/
      );
    }
  );


  test(
    "invalid target qubit is rejected",
    () => {
      assert.throws(
        () => {
          validateGate(
            {
              type: "X",
              target: 2
            },
            2
          );
        },
        /Invalid target qubit/
      );
    }
  );


  test(
    "CNOT cannot use same control and target",
    () => {
      assert.throws(
        () => {
          validateGate(
            {
              type: "CX",
              control: 0,
              target: 0
            },
            2
          );
        },
        /must be different/
      );
    }
  );


  test(
    "SWAP cannot use same qubit twice",
    () => {
      assert.throws(
        () => {
          validateGate(
            {
              type: "SWAP",
              first: 1,
              second: 1
            },
            2
          );
        },
        /two different qubits/
      );
    }
  );


  test(
    "rotation gates require numeric angle",
    () => {
      assert.throws(
        () => {
          validateGate(
            {
              type: "RX",
              target: 0,
              angle: "pi"
            },
            1
          );
        },
        /valid numeric angle/
      );
    }
  );


  test(
    "changeQubitCount resets circuit",
    () => {
      const circuit = {
        qubits: 2,

        gates: [
          {
            type: "H",
            target: 0
          }
        ]
      };


      const updated =
        changeQubitCount(
          circuit,
          4
        );


      assert.equal(
        updated.qubits,
        4
      );

      assert.deepEqual(
        updated.gates,
        []
      );
    }
  );


  test(
    "invalid qubit count is rejected",
    () => {
      assert.throws(
        () => {
          changeQubitCount(
            createCircuit(2),
            7
          );
        },
        /between 1 and 6/
      );
    }
  );


  return results;
}