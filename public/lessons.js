export const LESSONS = [
  {
    id: "superposition",

    title:
      "Create Superposition",

    level:
      "Beginner",

    description:
      "Use a Hadamard gate to transform |0⟩ into an equal superposition.",

    objectives: [
      "Understand the |0⟩ state",
      "Apply a Hadamard gate",
      "Observe 50/50 measurement probabilities"
    ],

    circuit: {
      qubits: 1,

      gates: [
        {
          type: "H",
          target: 0
        }
      ]
    }
  },


  {
    id: "pauli-x",

    title:
      "Quantum NOT Gate",

    level:
      "Beginner",

    description:
      "Apply the Pauli-X gate and observe how |0⟩ becomes |1⟩.",

    objectives: [
      "Understand the Pauli-X gate",
      "Compare it with a classical NOT gate",
      "Observe deterministic measurement"
    ],

    circuit: {
      qubits: 1,

      gates: [
        {
          type: "X",
          target: 0
        }
      ]
    }
  },


  {
    id: "phase",

    title:
      "Explore Quantum Phase",

    level:
      "Intermediate",

    description:
      "Create a superposition and then apply a phase gate.",

    objectives: [
      "Understand that amplitudes contain phase",
      "Observe why probabilities alone do not describe the full quantum state",
      "Prepare for interference experiments"
    ],

    circuit: {
      qubits: 1,

      gates: [
        {
          type: "H",
          target: 0
        },

        {
          type: "S",
          target: 0
        }
      ]
    }
  },


  {
    id: "bell",

    title:
      "Build a Bell State",

    level:
      "Intermediate",

    description:
      "Create one of the simplest entangled two-qubit states.",

    objectives: [
      "Create superposition",
      "Use a controlled-NOT gate",
      "Observe correlated measurements",
      "Introduce entanglement"
    ],

    circuit: {
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
    }
  },


  {
    id: "ghz",

    title:
      "Create a GHZ State",

    level:
      "Advanced",

    description:
      "Extend Bell-state reasoning to three entangled qubits.",

    objectives: [
      "Work with three qubits",
      "Chain controlled operations",
      "Observe multi-qubit correlation"
    ],

    circuit: {
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
    }
  }
];


export function getLesson(
  lessonId
) {
  return (
    LESSONS.find(
      lesson =>
        lesson.id === lessonId
    ) ?? null
  );
}