function formatComplex(
  value
) {
  const real =
    value.re.toFixed(4);

  const imag =
    Math.abs(
      value.im
    ).toFixed(4);

  const sign =
    value.im >= 0
      ? "+"
      : "-";

  return (
    `${real} ${sign} ${imag}i`
  );
}


function createWireCell() {
  const cell =
    document.createElement(
      "div"
    );

  cell.className =
    "circuit-wire-cell";

  const wire =
    document.createElement(
      "div"
    );

  wire.className =
    "circuit-wire";

  cell.appendChild(
    wire
  );

  return cell;
}


function createGateMarker(
  text,
  className = "gate-node"
) {
  const node =
    document.createElement(
      "div"
    );

  node.className =
    className;

  node.textContent =
    text;

  return node;
}


export function renderCircuit(
  circuit,
  container
) {
  container.innerHTML =
    "";

  const circuitView =
    document.createElement(
      "div"
    );

  circuitView.className =
    "visual-circuit";


  /*
    Qubit labels
  */

  const labels =
    document.createElement(
      "div"
    );

  labels.className =
    "circuit-label-column";


  for (
    let qubit = 0;
    qubit < circuit.qubits;
    qubit++
  ) {
    const label =
      document.createElement(
        "div"
      );

    label.className =
      "visual-qubit-label";

    label.textContent =
      `q${qubit}`;

    labels.appendChild(
      label
    );
  }


  circuitView.appendChild(
    labels
  );


  /*
    Empty circuit still needs wires.
  */

  if (
    circuit.gates.length === 0
  ) {
    const emptyColumn =
      document.createElement(
        "div"
      );

    emptyColumn.className =
      "circuit-gate-column empty-column";


    for (
      let qubit = 0;
      qubit < circuit.qubits;
      qubit++
    ) {
      emptyColumn.appendChild(
        createWireCell()
      );
    }


    circuitView.appendChild(
      emptyColumn
    );


    container.appendChild(
      circuitView
    );


    const message =
      document.createElement(
        "p"
      );

    message.className =
      "empty-circuit-message";

    message.textContent =
      "Add a gate to begin building.";

    container.appendChild(
      message
    );

    return;
  }


  /*
    Each gate becomes one visual column.
  */

  circuit.gates.forEach(
    (
      gate,
      gateIndex
    ) => {
      const column =
        document.createElement(
          "div"
        );

      column.className =
        "circuit-gate-column";

      column.dataset.gateIndex =
        String(gateIndex);


      for (
        let qubit = 0;
        qubit < circuit.qubits;
        qubit++
      ) {
        const cell =
          createWireCell();

        cell.dataset.qubit =
          String(qubit);


        /*
          Normal single-qubit gate
        */

        if (
          gate.target === qubit &&
          gate.type !== "CX"
        ) {
          cell.appendChild(
            createGateMarker(
              gate.type
            )
          );
        }


        /*
          CNOT
        */

        if (
          gate.type === "CX"
        ) {
          if (
            gate.control === qubit
          ) {
            cell.appendChild(
              createGateMarker(
                "●",
                "control-node"
              )
            );
          }


          if (
            gate.target === qubit
          ) {
            cell.appendChild(
              createGateMarker(
                "⊕",
                "target-node"
              )
            );
          }
        }


        /*
          SWAP
        */

        if (
          gate.type === "SWAP" &&
          (
            gate.first === qubit ||
            gate.second === qubit
          )
        ) {
          cell.appendChild(
            createGateMarker(
              "×",
              "swap-node"
            )
          );
        }


        column.appendChild(
          cell
        );
      }


      /*
        Vertical connector for CNOT/SWAP.
      */

      if (
        gate.type === "CX" ||
        gate.type === "SWAP"
      ) {
        const first =
          gate.type === "CX"
            ? gate.control
            : gate.first;

        const second =
          gate.type === "CX"
            ? gate.target
            : gate.second;

        const minimum =
          Math.min(
            first,
            second
          );

        const maximum =
          Math.max(
            first,
            second
          );

        const connector =
          document.createElement(
            "div"
          );

        connector.className =
          "gate-connector";

        connector.style.top =
          `${minimum * 58 + 29}px`;

        connector.style.height =
          `${(maximum - minimum) * 58}px`;

        column.appendChild(
          connector
        );
      }


      circuitView.appendChild(
        column
      );
    }
  );


  container.appendChild(
    circuitView
  );
}


export function renderStatevector(
  state,
  qubits,
  container,
  basisLabel
) {
  container.innerHTML =
    "";

  let visibleStates = 0;


  state.forEach(
    (
      amplitude,
      index
    ) => {
      const probability =
        amplitude.re ** 2 +
        amplitude.im ** 2;


      if (
        probability <
        0.000001
      ) {
        return;
      }


      visibleStates++;


      const row =
        document.createElement(
          "div"
        );

      row.className =
        "state-row";


      row.innerHTML = `
        <span class="basis-state">
          |${basisLabel(index, qubits)}⟩
        </span>

        <span class="complex-value">
          ${formatComplex(amplitude)}
        </span>

        <span class="state-probability">
          ${(probability * 100).toFixed(2)}%
        </span>
      `;


      container.appendChild(
        row
      );
    }
  );


  if (
    visibleStates === 0
  ) {
    container.textContent =
      "No visible amplitudes.";
  }
}


export function renderProbabilityCards(
  state,
  qubits,
  container,
  basisLabel
) {
  container.innerHTML =
    "";


  state.forEach(
    (
      amplitude,
      index
    ) => {
      const probability =
        amplitude.re ** 2 +
        amplitude.im ** 2;


      if (
        probability <
        0.000001
      ) {
        return;
      }


      const card =
        document.createElement(
          "div"
        );

      card.className =
        "probability-card";


      card.innerHTML = `
        <strong>
          |${basisLabel(index, qubits)}⟩
        </strong>

        <span>
          ${(probability * 100).toFixed(2)}%
        </span>

        <div class="probability-card-track">

          <div
            class="probability-card-fill"
            style="width:${probability * 100}%"
          ></div>

        </div>
      `;


      container.appendChild(
        card
      );
    }
  );
}


export function renderHistogram(
  counts,
  shots,
  container
) {
  container.innerHTML =
    "";


  const entries =
    Object.entries(
      counts
    ).sort(
      ([a], [b]) =>
        a.localeCompare(b)
    );


  for (
    const [
      state,
      count
    ]
    of entries
  ) {
    const percentage =
      count /
      shots *
      100;


    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "histogram-row";


    wrapper.innerHTML = `
      <div class="histogram-header">

        <span>
          |${state}⟩
        </span>

        <span>
          ${count}
          (${percentage.toFixed(1)}%)
        </span>

      </div>

      <div class="histogram-track">

        <div
          class="histogram-bar"
          style="width:${percentage}%"
        ></div>

      </div>
    `;


    container.appendChild(
      wrapper
    );
  }
}


export function renderEvolutionTimeline(
  history,
  container
) {
  container.innerHTML =
    "";


  history.forEach(
    (
      step,
      index
    ) => {
      const item =
        document.createElement(
          "div"
        );


      item.className =
        "timeline-item";


      let title =
        "Initial state";


      if (
        step.gate
      ) {
        const gate =
          step.gate;


        if (
          gate.type === "CX"
        ) {
          title =
            `CNOT q${gate.control} → q${gate.target}`;
        }

        else if (
          gate.type === "SWAP"
        ) {
          title =
            `SWAP q${gate.first} ↔ q${gate.second}`;
        }

        else {
          title =
            `${gate.type} on q${gate.target}`;
        }
      }


      item.innerHTML = `
        <div class="timeline-index">
          ${index}
        </div>

        <div>
          <strong>
            ${title}
          </strong>

          <p>
            State after step ${index}
          </p>
        </div>
      `;


      container.appendChild(
        item
      );
    }
  );
}