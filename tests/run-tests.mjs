import {
  runCircuitTests
} from "./circuit-tests.mjs";


import {
  runQuantumTests
} from "./quantum-tests.mjs";


const suites = [
  {
    name:
      "Circuit IR",

    results:
      runCircuitTests()
  },

  {
    name:
      "Quantum Simulator",

    results:
      runQuantumTests()
  }
];


let passed =
  0;


let failed =
  0;


console.log(
  "\nQubitLab deterministic test suite\n"
);


for (
  const suite
  of suites
) {
  console.log(
    `\n${suite.name}`
  );


  console.log(
    "─".repeat(
      suite.name.length
    )
  );


  for (
    const result
    of suite.results
  ) {
    if (
      result.passed
    ) {
      passed++;

      console.log(
        `✓ ${result.name}`
      );
    }

    else {
      failed++;

      console.log(
        `✗ ${result.name}`
      );


      console.log(
        `  ${result.error?.message || result.error}`
      );
    }
  }
}


const total =
  passed + failed;


console.log(
  "\n=============================="
);


console.log(
  `Total:  ${total}`
);


console.log(
  `Passed: ${passed}`
);


console.log(
  `Failed: ${failed}`
);


console.log(
  "==============================\n"
);


if (
  failed > 0
) {
  process.exitCode =
    1;
}

else {
  console.log(
    "All deterministic tests passed.\n"
  );
}