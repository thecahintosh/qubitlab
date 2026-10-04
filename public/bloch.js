export function getBlochVector(state) {
  if (
    !Array.isArray(state) ||
    state.length !== 2
  ) {
    return null;
  }

  const alpha = state[0];
  const beta = state[1];

  const x =
    2 *
    (
      alpha.re * beta.re +
      alpha.im * beta.im
    );

  const y =
    2 *
    (
      alpha.re * beta.im -
      alpha.im * beta.re
    );

  const alphaProbability =
    alpha.re ** 2 +
    alpha.im ** 2;

  const betaProbability =
    beta.re ** 2 +
    beta.im ** 2;

  const z =
    alphaProbability -
    betaProbability;

  return {
    x,
    y,
    z
  };
}


export function renderBlochSphere(
  state,
  container
) {
  container.innerHTML = "";

  const vector =
    getBlochVector(state);

  if (!vector) {
    container.innerHTML = `
      <div class="bloch-unavailable">
        Bloch sphere visualization is shown
        for one-qubit circuits.
      </div>
    `;

    return;
  }

  const {
    x,
    y,
    z
  } = vector;

  const centerX = 150;
  const centerY = 150;
  const radius = 105;

  /*
    Simple pseudo-3D projection.

    Horizontal axis combines X and Y.
    Vertical axis mostly represents Z.
  */

  const projectedX =
    centerX +
    radius *
    (
      x +
      0.35 * y
    ) *
    0.75;

  const projectedY =
    centerY -
    radius *
    (
      z +
      0.30 * y
    ) *
    0.75;

  container.innerHTML = `
    <div class="bloch-layout">

      <svg
        class="bloch-svg"
        viewBox="0 0 300 300"
        role="img"
        aria-label="Bloch sphere"
      >

        <circle
          cx="150"
          cy="150"
          r="105"
          class="bloch-sphere"
        />

        <ellipse
          cx="150"
          cy="150"
          rx="105"
          ry="34"
          class="bloch-guide"
        />

        <line
          x1="45"
          y1="150"
          x2="255"
          y2="150"
          class="bloch-axis"
        />

        <line
          x1="150"
          y1="45"
          x2="150"
          y2="255"
          class="bloch-axis"
        />

        <line
          x1="91"
          y1="209"
          x2="209"
          y2="91"
          class="bloch-axis faint"
        />

        <text
          x="263"
          y="154"
          class="bloch-label"
        >
          X
        </text>

        <text
          x="212"
          y="85"
          class="bloch-label"
        >
          Y
        </text>

        <text
          x="156"
          y="40"
          class="bloch-label"
        >
          |0⟩
        </text>

        <text
          x="156"
          y="275"
          class="bloch-label"
        >
          |1⟩
        </text>

        <line
          x1="${centerX}"
          y1="${centerY}"
          x2="${projectedX}"
          y2="${projectedY}"
          class="bloch-vector"
        />

        <circle
          cx="${projectedX}"
          cy="${projectedY}"
          r="6"
          class="bloch-point"
        />

      </svg>


      <div class="bloch-values">

        <div>
          <span>X</span>
          <strong>
            ${x.toFixed(3)}
          </strong>
        </div>

        <div>
          <span>Y</span>
          <strong>
            ${y.toFixed(3)}
          </strong>
        </div>

        <div>
          <span>Z</span>
          <strong>
            ${z.toFixed(3)}
          </strong>
        </div>

      </div>

    </div>
  `;
}