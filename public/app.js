import {
  initializeAuth,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getAccessToken,
  watchAuthState
} from "./auth.js";


import {
  createCircuit,
  addGate,
  removeLastGate,
  removeGateAt,
  clearCircuit,
  changeQubitCount,
  validateGate
} from "./circuit.js";


import {
  simulateCircuit,
  runShots,
  basisLabel
} from "./quantum.js";


import {
  renderCircuit,
  renderStatevector,
  renderProbabilityCards,
  renderHistogram,
  renderEvolutionTimeline
} from "./renderer.js";


import {
  generateQiskit,
  generateCirq,
  generatePennyLane,
  generateOpenQASM
} from "./generators.js";


import {
  hydrateProjects,
  loadProjects,
  createProject,
  updateProject,
  deleteProject
} from "./projects.js";


import {
  loadLearningProfile,
  hydrateLearningProfile,
  updateProgressFromCircuit,
  recordAssessment,
  markLessonCompleted,
  getOverallMastery,
  getWeakestTopics
} from "./learning.js";


import {
  renderBlochSphere
} from "./bloch.js";


import {
  LESSONS
} from "./lessons.js";


import {
  hydrateChat,
  loadChat,
  appendChat,
  clearChat
} from "./tutor-state.js";


import {
  ensurePedagogyUI,
  renderConversation,
  renderAssessmentQuestion,
  renderAssessmentFeedback,
  renderRecommendation
} from "./pedagogy.js";


import {
  migrateLocalDataToCloud
} from "./cloud-migration.js";



/* ======================================================
   DOM
====================================================== */

const authScreen =
  document.getElementById("authScreen");

const appShell =
  document.getElementById("appShell");

const authForm =
  document.getElementById("authForm");

const emailInput =
  document.getElementById("emailInput");

const passwordInput =
  document.getElementById("passwordInput");

const signUpButton =
  document.getElementById("signUpButton");

const signOutButton =
  document.getElementById("signOutButton");

const authMessage =
  document.getElementById("authMessage");

const userEmail =
  document.getElementById("userEmail");


const navButtons =
  document.querySelectorAll(
    ".nav-button"
  );


const views = {
  learn:
    document.getElementById(
      "learnView"
    ),

  build:
    document.getElementById(
      "buildView"
    ),

  tutor:
    document.getElementById(
      "tutorView"
    ),

  projects:
    document.getElementById(
      "projectsView"
    ),

  dashboard:
    document.getElementById(
      "dashboardView"
    )
};


const qubitCount =
  document.getElementById("qubitCount");

const gateType =
  document.getElementById("gateType");

const targetQubit =
  document.getElementById("targetQubit");

const controlQubit =
  document.getElementById("controlQubit");

const secondQubit =
  document.getElementById("secondQubit");

const gateAngle =
  document.getElementById("gateAngle");

const controlWrapper =
  document.getElementById("controlWrapper");

const secondWrapper =
  document.getElementById("secondWrapper");

const angleWrapper =
  document.getElementById("angleWrapper");


const addGateButton =
  document.getElementById("addGateButton");

const undoButton =
  document.getElementById("undoButton");

const resetButton =
  document.getElementById("resetButton");

const runButton =
  document.getElementById("runButton");

const saveButton =
  document.getElementById("saveButton");

const loadButton =
  document.getElementById("loadButton");

const copyButton =
  document.getElementById("copyButton");

const bellExample =
  document.getElementById("bellExample");

const superpositionExample =
  document.getElementById(
    "superpositionExample"
  );

const previousStepButton =
  document.getElementById(
    "previousStepButton"
  );

const nextStepButton =
  document.getElementById(
    "nextStepButton"
  );

const newProjectButton =
  document.getElementById(
    "newProjectButton"
  );


const circuitCanvas =
  document.getElementById(
    "circuitCanvas"
  );

const gateSequence =
  document.getElementById(
    "gateSequence"
  );

const statevector =
  document.getElementById(
    "statevector"
  );

const probabilityCards =
  document.getElementById(
    "probabilityCards"
  );

const histogram =
  document.getElementById(
    "histogram"
  );

const blochSphere =
  document.getElementById(
    "blochSphere"
  );

const generatedCode =
  document.getElementById(
    "generatedCode"
  );

const circuitJson =
  document.getElementById(
    "circuitJson"
  );

const framework =
  document.getElementById(
    "framework"
  );

const shots =
  document.getElementById(
    "shots"
  );

const stepLabel =
  document.getElementById(
    "stepLabel"
  );

const stepState =
  document.getElementById(
    "stepState"
  );

const timeline =
  document.getElementById(
    "timeline"
  );

const projectsList =
  document.getElementById(
    "projectsList"
  );

const progressGrid =
  document.getElementById(
    "progressGrid"
  );

const lessonGrid =
  document.getElementById(
    "lessonGrid"
  );


const aiPromptInput =
  document.getElementById(
    "aiPromptInput"
  );

const aiResponse =
  document.getElementById(
    "aiResponse"
  );

const aiStatus =
  document.getElementById(
    "aiStatus"
  );

const aiCircuitSummary =
  document.getElementById(
    "aiCircuitSummary"
  );

const askTutorButton =
  document.getElementById(
    "askTutorButton"
  );

const explainCircuitButton =
  document.getElementById(
    "explainCircuitButton"
  );

const debugCircuitButton =
  document.getElementById(
    "debugCircuitButton"
  );

const generateCircuitButton =
  document.getElementById(
    "generateCircuitButton"
  );

const clearAiButton =
  document.getElementById(
    "clearAiButton"
  );


const pedagogy =
  ensurePedagogyUI();



/* ======================================================
   STATE
====================================================== */

let circuit =
  createCircuit(2);

let currentUser =
  null;

let currentProjectId =
  null;

let simulationHistory =
  [];

let currentStep =
  0;

let latestState =
  [];

let activeView =
  "build";

let aiBusy =
  false;

let activeLessonId =
  null;

let currentAssessment =
  null;

let currentRecommendation =
  null;

let workspaceLoading =
  false;



/* ======================================================
   LESSON HELPERS
====================================================== */

function getActiveLesson() {
  if (!activeLessonId) {
    return null;
  }


  return (
    LESSONS.find(
      lesson =>
        lesson.id ===
        activeLessonId
    ) || null
  );
}


function lessonCatalog() {
  return LESSONS.map(
    lesson => ({
      id:
        lesson.id,

      title:
        lesson.title,

      level:
        lesson.level,

      objectives:
        lesson.objectives
    })
  );
}



/* ======================================================
   NAVIGATION
====================================================== */

function showView(
  viewName
) {
  if (!views[viewName]) {
    return;
  }


  activeView =
    viewName;


  for (
    const [
      name,
      element
    ]
    of Object.entries(views)
  ) {
    element.classList.toggle(
      "hidden",
      name !== viewName
    );
  }


  navButtons.forEach(
    button => {
      button.classList.toggle(
        "active",
        button.dataset.view ===
          viewName
      );
    }
  );


  if (
    viewName === "projects"
  ) {
    renderProjects();
  }


  if (
    viewName === "dashboard"
  ) {
    renderProgressDashboard();
  }


  if (
    viewName === "tutor"
  ) {
    renderAIContext();
    renderStoredConversation();
  }
}


navButtons.forEach(
  button => {
    button.addEventListener(
      "click",
      () => {
        showView(
          button.dataset.view
        );
      }
    );
  }
);



/* ======================================================
   CLOUD HYDRATION
====================================================== */

async function hydrateUserData(
  user
) {
  await migrateLocalDataToCloud(
    user.id
  );


  await Promise.all([
    hydrateProjects(
      user.id
    ),

    hydrateChat(
      user.id
    ),

    hydrateLearningProfile(
      user.id
    )
  ]);
}



/* ======================================================
   AUTH UI
====================================================== */

async function showWorkspace(
  user
) {
  if (
    workspaceLoading
  ) {
    return;
  }


  workspaceLoading =
    true;


  try {
    currentUser =
      user;


    authScreen.classList.add(
      "hidden"
    );


    appShell.classList.remove(
      "hidden"
    );


    userEmail.textContent =
      user.email ??
      "User";


    await hydrateUserData(
      user
    );


    renderLessons();

    renderProjects();

    renderProgressDashboard();

    renderAIContext();

    renderStoredConversation();


    showView(
      activeView
    );
  }

  catch (error) {
    console.error(
      "Unable to load cloud data:",
      error
    );


    alert(
      `Unable to load QubitLab cloud data: ${error.message}`
    );
  }

  finally {
    workspaceLoading =
      false;
  }
}


function showAuthScreen() {
  currentUser =
    null;

  currentProjectId =
    null;


  appShell.classList.add(
    "hidden"
  );


  authScreen.classList.remove(
    "hidden"
  );


  userEmail.textContent =
    "";
}



/* ======================================================
   QUICK SAVE
====================================================== */

function getCircuitStorageKey() {
  if (!currentUser) {
    throw new Error(
      "You must be signed in."
    );
  }


  /*
    Quick Save stays local intentionally.

    Projects are the durable cloud mechanism.
  */

  return (
    `qubitlab-circuit-${currentUser.id}`
  );
}



/* ======================================================
   CIRCUIT CONTROLS
====================================================== */

function populateQubitSelectors() {
  const selectors = [
    targetQubit,
    controlQubit,
    secondQubit
  ];


  for (
    const selector
    of selectors
  ) {
    selector.innerHTML =
      "";


    for (
      let index = 0;
      index < circuit.qubits;
      index++
    ) {
      const option =
        document.createElement(
          "option"
        );


      option.value =
        String(index);


      option.textContent =
        `q${index}`;


      selector.appendChild(
        option
      );
    }
  }


  if (
    circuit.qubits > 1
  ) {
    controlQubit.value =
      "0";

    targetQubit.value =
      "1";

    secondQubit.value =
      "1";
  }

  else {
    controlQubit.value =
      "0";

    targetQubit.value =
      "0";

    secondQubit.value =
      "0";
  }
}


function updateGateControls() {
  const type =
    gateType.value;


  controlWrapper.classList.toggle(
    "hidden",
    type !== "CX"
  );


  secondWrapper.classList.toggle(
    "hidden",
    type !== "SWAP"
  );


  angleWrapper.classList.toggle(
    "hidden",
    ![
      "RX",
      "RY",
      "RZ"
    ].includes(type)
  );
}


function buildGateFromControls() {
  const type =
    gateType.value;


  if (
    type === "CX"
  ) {
    return {
      type,

      control:
        Number(
          controlQubit.value
        ),

      target:
        Number(
          targetQubit.value
        )
    };
  }


  if (
    type === "SWAP"
  ) {
    return {
      type,

      first:
        Number(
          targetQubit.value
        ),

      second:
        Number(
          secondQubit.value
        )
    };
  }


  if (
    [
      "RX",
      "RY",
      "RZ"
    ].includes(type)
  ) {
    return {
      type,

      target:
        Number(
          targetQubit.value
        ),

      angle:
        Number(
          gateAngle.value
        )
    };
  }


  return {
    type,

    target:
      Number(
        targetQubit.value
      )
  };
}



/* ======================================================
   EXPORT CODE
====================================================== */

function generateCode() {
  switch (
    framework.value
  ) {
    case "cirq":
      return generateCirq(
        circuit
      );


    case "pennylane":
      return generatePennyLane(
        circuit
      );


    case "qasm":
      return generateOpenQASM(
        circuit
      );


    default:
      return generateQiskit(
        circuit
      );
  }
}



/* ======================================================
   GATES
====================================================== */

function describeGate(
  gate
) {
  if (!gate) {
    return "Initial State";
  }


  if (
    gate.type === "CX"
  ) {
    return (
      `CNOT q${gate.control} → q${gate.target}`
    );
  }


  if (
    gate.type === "SWAP"
  ) {
    return (
      `SWAP q${gate.first} ↔ q${gate.second}`
    );
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
    return (
      `${gate.type}(${Number(gate.angle).toFixed(3)}) on q${gate.target}`
    );
  }


  return (
    `${gate.type} on q${gate.target}`
  );
}



/* ======================================================
   SIMULATION
====================================================== */

function simulate() {
  try {
    const result =
      simulateCircuit(
        circuit
      );


    latestState =
      result.state;


    simulationHistory =
      result.history;


    if (
      currentStep >=
      simulationHistory.length
    ) {
      currentStep =
        simulationHistory.length -
        1;
    }


    renderStatevector(
      latestState,
      circuit.qubits,
      statevector,
      basisLabel
    );


    renderProbabilityCards(
      latestState,
      circuit.qubits,
      probabilityCards,
      basisLabel
    );


    renderBlochSphere(
      latestState,
      blochSphere
    );


    const shotCount =
      Number(
        shots.value
      );


    renderHistogram(
      runShots(
        latestState,
        circuit.qubits,
        shotCount
      ),
      shotCount,
      histogram
    );


    renderEvolutionTimeline(
      simulationHistory,
      timeline
    );


    renderStepper();


    if (
      currentUser
    ) {
      updateProgressFromCircuit(
        currentUser.id,
        circuit
      );
    }


    renderAIContext();
  }

  catch (error) {
    alert(
      error.message
    );
  }
}


function renderStepper() {
  if (
    !simulationHistory.length
  ) {
    return;
  }


  const step =
    simulationHistory[
      currentStep
    ];


  stepLabel.textContent =
    currentStep === 0
      ? "Initial State"
      : (
        `Step ${currentStep}: ${describeGate(step.gate)}`
      );


  renderStatevector(
    step.state,
    circuit.qubits,
    stepState,
    basisLabel
  );


  previousStepButton.disabled =
    currentStep === 0;


  nextStepButton.disabled =
    currentStep >=
    simulationHistory.length - 1;
}


function renderGateSequence() {
  gateSequence.innerHTML =
    "";


  if (
    !circuit.gates.length
  ) {
    gateSequence.innerHTML = `
      <p class="project-meta">
        No gates in this circuit.
      </p>
    `;

    return;
  }


  circuit.gates.forEach(
    (
      gate,
      index
    ) => {
      const item =
        document.createElement(
          "div"
        );


      item.className =
        "gate-list-item";


      const description =
        document.createElement(
          "span"
        );


      description.textContent =
        `${index + 1}. ${describeGate(gate)}`;


      const deleteButton =
        document.createElement(
          "button"
        );


      deleteButton.textContent =
        "Delete";


      deleteButton.addEventListener(
        "click",
        () => {
          circuit =
            removeGateAt(
              circuit,
              index
            );


          activeLessonId =
            null;


          currentStep =
            0;


          renderEverything();
        }
      );


      item.append(
        description,
        deleteButton
      );


      gateSequence.appendChild(
        item
      );
    }
  );
}



/* ======================================================
   AI CONTEXT
====================================================== */

function renderAIContext() {
  if (!aiCircuitSummary) {
    return;
  }


  const lesson =
    getActiveLesson();


  const overall =
    currentUser
      ? getOverallMastery(
          currentUser.id
        )
      : 0;


  const weak =
    currentUser
      ? getWeakestTopics(
          currentUser.id
        ).join(", ")
      : "";


  aiCircuitSummary.innerHTML = `
    <div class="ai-circuit-stat">
      <span>Qubits</span>
      <strong>${circuit.qubits}</strong>
    </div>

    <div class="ai-circuit-stat">
      <span>Gates</span>
      <strong>${circuit.gates.length}</strong>
    </div>

    <div class="ai-circuit-stat">
      <span>Lesson</span>
      <strong>
        ${lesson?.title ?? "Free Build"}
      </strong>
    </div>

    <div class="ai-circuit-stat">
      <span>Overall Mastery</span>
      <strong>${overall}%</strong>
    </div>

    <div class="ai-circuit-stat">
      <span>Weakest Topics</span>
      <strong>${weak || "—"}</strong>
    </div>
  `;
}


function renderStoredConversation() {
  if (!currentUser) {
    return;
  }


  renderConversation(
    aiResponse,
    loadChat(
      currentUser.id
    )
  );
}


function setAIStatus(
  message,
  type = ""
) {
  aiStatus.textContent =
    message;


  aiStatus.className =
    "ai-status";


  if (type) {
    aiStatus.classList.add(
      type
    );
  }
}


function setAIBusy(
  busy
) {
  aiBusy =
    busy;


  const buttons = [
    askTutorButton,
    explainCircuitButton,
    debugCircuitButton,
    generateCircuitButton,
    pedagogy.quickCheckButton,
    pedagogy.recommendButton,
    pedagogy.submitAssessmentButton
  ];


  buttons.forEach(
    button => {
      if (button) {
        button.disabled =
          busy;
      }
    }
  );


  if (busy) {
    setAIStatus(
      "QubitLab Tutor is thinking..."
    );
  }
}


function getAIContextPayload() {
  return {
    circuit:
      structuredClone(
        circuit
      ),

    statevector:
      structuredClone(
        latestState
      ),

    currentStep,

    activeLesson:
      getActiveLesson(),

    learningProfile:
      currentUser
        ? loadLearningProfile(
            currentUser.id
          )
        : {}
  };
}


async function callAI(
  payload
) {
  const token =
    await getAccessToken();


  if (!token) {
    throw new Error(
      "Your login session has expired."
    );
  }


  const response =
    await fetch(
      "/api/ai",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`
        },

        body:
          JSON.stringify(
            payload
          )
      }
    );


  const data =
    await response.json();


  if (
    !response.ok ||
    !data.ok
  ) {
    throw new Error(
      data.error ||
      "AI request failed."
    );
  }


  return data;
}


function validateGeneratedCircuit(
  candidate
) {
  if (
    !candidate ||
    typeof candidate !==
      "object"
  ) {
    throw new Error(
      "AI did not return a circuit."
    );
  }


  if (
    !Number.isInteger(
      candidate.qubits
    ) ||
    candidate.qubits < 1 ||
    candidate.qubits > 6
  ) {
    throw new Error(
      "Invalid qubit count."
    );
  }


  if (
    !Array.isArray(
      candidate.gates
    )
  ) {
    throw new Error(
      "Invalid gate list."
    );
  }


  if (
    candidate.gates.length >
    100
  ) {
    throw new Error(
      "Generated circuit is too large."
    );
  }


  candidate.gates.forEach(
    gate => {
      validateGate(
        gate,
        candidate.qubits
      );
    }
  );
}



/* ======================================================
   AI ACTIONS
====================================================== */

async function askTutor() {
  const question =
    aiPromptInput.value.trim();


  if (
    !question ||
    aiBusy
  ) {
    return;
  }


  const history =
    loadChat(
      currentUser.id
    );


  try {
    await appendChat(
      currentUser.id,
      "user",
      question
    );


    renderStoredConversation();


    aiPromptInput.value =
      "";


    setAIBusy(
      true
    );


    const response =
      await callAI({
        mode:
          "tutor",

        question,

        history:
          history.map(
            message => ({
              role:
                message.role,

              content:
                message.content
            })
          ),

        ...getAIContextPayload()
      });


    await appendChat(
      currentUser.id,
      "assistant",
      response.answer
    );


    renderStoredConversation();


    setAIStatus(
      "Tutor response received.",
      "success"
    );
  }

  catch (error) {
    setAIStatus(
      error.message,
      "error"
    );
  }

  finally {
    setAIBusy(
      false
    );
  }
}


async function explainCircuit() {
  if (aiBusy) {
    return;
  }


  setAIBusy(
    true
  );


  try {
    const response =
      await callAI({
        mode:
          "explain",

        ...getAIContextPayload()
      });


    await appendChat(
      currentUser.id,
      "assistant",
      response.answer
    );


    renderStoredConversation();


    setAIStatus(
      "Circuit explanation added to chat.",
      "success"
    );
  }

  catch (error) {
    setAIStatus(
      error.message,
      "error"
    );
  }

  finally {
    setAIBusy(
      false
    );
  }
}


async function debugCircuit() {
  if (aiBusy) {
    return;
  }


  const goal =
    aiPromptInput.value.trim() ||
    "Determine whether this circuit is logically correct.";


  setAIBusy(
    true
  );


  try {
    const response =
      await callAI({
        mode:
          "debug",

        goal,

        ...getAIContextPayload()
      });


    await appendChat(
      currentUser.id,
      "assistant",
      response.answer
    );


    renderStoredConversation();


    setAIStatus(
      "Circuit analysis complete.",
      "success"
    );
  }

  catch (error) {
    setAIStatus(
      error.message,
      "error"
    );
  }

  finally {
    setAIBusy(
      false
    );
  }
}


async function generateCircuitFromAI() {
  const prompt =
    aiPromptInput.value.trim();


  if (
    !prompt ||
    aiBusy
  ) {
    return;
  }


  setAIBusy(
    true
  );


  try {
    const response =
      await callAI({
        mode:
          "generate",

        prompt
      });


    validateGeneratedCircuit(
      response.circuit
    );


    circuit =
      structuredClone(
        response.circuit
      );


    activeLessonId =
      null;

    currentProjectId =
      null;

    currentStep =
      0;


    qubitCount.value =
      String(
        circuit.qubits
      );


    populateQubitSelectors();

    renderEverything();


    await appendChat(
      currentUser.id,
      "assistant",
      `## Circuit generated

The requested circuit passed QubitLab's deterministic validation and has been loaded into the **Build** workspace.`
    );


    renderStoredConversation();


    setAIStatus(
      "Valid circuit loaded.",
      "success"
    );


    showView(
      "build"
    );
  }

  catch (error) {
    setAIStatus(
      `Circuit rejected: ${error.message}`,
      "error"
    );
  }

  finally {
    setAIBusy(
      false
    );
  }
}



/* ======================================================
   ASSESSMENTS
====================================================== */

async function startQuickCheck() {
  if (aiBusy) {
    return;
  }


  setAIBusy(
    true
  );


  try {
    const response =
      await callAI({
        mode:
          "assess",

        stage:
          "question",

        ...getAIContextPayload()
      });


    currentAssessment =
      response.assessment;


    pedagogy.assessmentPanel
      .classList.remove(
        "hidden"
      );


    pedagogy.assessmentAnswer.value =
      "";


    pedagogy.assessmentFeedback.innerHTML =
      "";


    renderAssessmentQuestion(
      pedagogy.assessmentQuestion,
      currentAssessment
    );


    setAIStatus(
      "Knowledge check ready.",
      "success"
    );
  }

  catch (error) {
    setAIStatus(
      error.message,
      "error"
    );
  }

  finally {
    setAIBusy(
      false
    );
  }
}


async function submitAssessment() {
  if (
    !currentAssessment ||
    aiBusy
  ) {
    return;
  }


  const answer =
    pedagogy.assessmentAnswer
      .value
      .trim();


  if (!answer) {
    setAIStatus(
      "Write your answer first.",
      "error"
    );

    return;
  }


  setAIBusy(
    true
  );


  try {
    const response =
      await callAI({
        mode:
          "assess",

        stage:
          "grade",

        question:
          currentAssessment.question,

        topic:
          currentAssessment.topic,

        expectedConcepts:
          currentAssessment
            .expectedConcepts,

        answer,

        ...getAIContextPayload()
      });


    const result =
      response.assessment;


    await recordAssessment(
      currentUser.id,
      result,
      {
        question:
          currentAssessment.question,

        answer
      }
    );


    if (
      result.passed &&
      activeLessonId
    ) {
      await markLessonCompleted(
        currentUser.id,
        activeLessonId
      );
    }


    renderAssessmentFeedback(
      pedagogy.assessmentFeedback,
      result
    );


    renderProgressDashboard();

    renderAIContext();


    setAIStatus(
      result.passed
        ? "Assessment passed. Mastery saved to cloud."
        : "Assessment saved. Review the feedback and try again.",
      result.passed
        ? "success"
        : ""
    );
  }

  catch (error) {
    setAIStatus(
      error.message,
      "error"
    );
  }

  finally {
    setAIBusy(
      false
    );
  }
}



/* ======================================================
   RECOMMENDATIONS
====================================================== */

async function recommendNextLesson() {
  if (aiBusy) {
    return;
  }


  setAIBusy(
    true
  );


  try {
    const response =
      await callAI({
        mode:
          "recommend",

        learningProfile:
          loadLearningProfile(
            currentUser.id
          ),

        activeLesson:
          getActiveLesson(),

        lessonCatalog:
          lessonCatalog()
      });


    const recommendation =
      response.recommendation;


    const lesson =
      LESSONS.find(
        item =>
          item.id ===
          recommendation.lessonId
      );


    if (!lesson) {
      throw new Error(
        "AI recommended an unknown lesson."
      );
    }


    currentRecommendation = {
      lesson,
      recommendation
    };


    pedagogy.recommendationPanel
      .classList.remove(
        "hidden"
      );


    renderRecommendation(
      pedagogy.recommendationContent,
      lesson,
      recommendation
    );


    setAIStatus(
      "Personalized recommendation ready.",
      "success"
    );
  }

  catch (error) {
    setAIStatus(
      error.message,
      "error"
    );
  }

  finally {
    setAIBusy(
      false
    );
  }
}


function openRecommendedLesson() {
  if (!currentRecommendation) {
    return;
  }


  openLesson(
    currentRecommendation.lesson
  );


  pedagogy.recommendationPanel
    .classList.add(
      "hidden"
    );
}



/* ======================================================
   MAIN RENDER
====================================================== */

function renderEverything() {
  renderCircuit(
    circuit,
    circuitCanvas
  );


  renderGateSequence();


  circuitJson.textContent =
    JSON.stringify(
      circuit,
      null,
      2
    );


  generatedCode.textContent =
    generateCode();


  simulate();

  renderProjects();

  renderProgressDashboard();

  renderAIContext();
}



/* ======================================================
   LESSONS
====================================================== */

function openLesson(
  lesson
) {
  activeLessonId =
    lesson.id;


  circuit =
    structuredClone(
      lesson.circuit
    );


  currentStep =
    0;


  qubitCount.value =
    String(
      circuit.qubits
    );


  populateQubitSelectors();

  renderEverything();

  showView(
    "build"
  );
}


function renderLessons() {
  lessonGrid.innerHTML =
    "";


  for (
    const lesson
    of LESSONS
  ) {
    const card =
      document.createElement(
        "article"
      );


    card.className =
      "lesson-card";


    const objectives =
      lesson.objectives
        .map(
          objective =>
            `<li>${objective}</li>`
        )
        .join("");


    card.innerHTML = `
      <span class="lesson-level">
        ${lesson.level}
      </span>

      <h3>${lesson.title}</h3>

      <p>
        ${lesson.description}
      </p>

      <ul class="lesson-objectives">
        ${objectives}
      </ul>

      <button
        type="button"
        class="start-lesson-button"
      >
        Open Experiment
      </button>
    `;


    card
      .querySelector(
        ".start-lesson-button"
      )
      .addEventListener(
        "click",
        () => {
          openLesson(
            lesson
          );
        }
      );


    lessonGrid.appendChild(
      card
    );
  }
}



/* ======================================================
   PROJECTS
====================================================== */

function renderProjects() {
  projectsList.innerHTML =
    "";


  if (!currentUser) {
    return;
  }


  const projects =
    loadProjects(
      currentUser.id
    );


  if (!projects.length) {
    projectsList.innerHTML = `
      <p class="project-meta">
        No saved cloud projects yet.
      </p>
    `;

    return;
  }


  for (
    const project
    of projects
  ) {
    const card =
      document.createElement(
        "div"
      );


    card.className =
      "project-card";


    const information =
      document.createElement(
        "div"
      );


    const title =
      document.createElement(
        "strong"
      );


    title.textContent =
      project.name;


    const meta =
      document.createElement(
        "div"
      );


    meta.className =
      "project-meta";


    meta.textContent =
      `${project.circuit.qubits} qubits · ${project.circuit.gates.length} gates`;


    information.append(
      title,
      meta
    );


    const actions =
      document.createElement(
        "div"
      );


    actions.className =
      "project-actions";


    const openButton =
      document.createElement(
        "button"
      );


    openButton.className =
      "secondary";

    openButton.textContent =
      "Open";


    openButton.addEventListener(
      "click",
      () => {
        currentProjectId =
          project.id;


        activeLessonId =
          null;


        circuit =
          structuredClone(
            project.circuit
          );


        qubitCount.value =
          String(
            circuit.qubits
          );


        currentStep =
          0;


        populateQubitSelectors();

        renderEverything();

        showView(
          "build"
        );
      }
    );


    const updateButton =
      document.createElement(
        "button"
      );


    updateButton.className =
      "secondary";

    updateButton.textContent =
      "Update";


    updateButton.addEventListener(
      "click",
      async () => {
        try {
          updateButton.disabled =
            true;


          await updateProject(
            currentUser.id,
            project.id,
            structuredClone(
              circuit
            )
          );


          renderProjects();
        }

        catch (error) {
          alert(
            `Unable to update project: ${error.message}`
          );
        }

        finally {
          updateButton.disabled =
            false;
        }
      }
    );


    const deleteButton =
      document.createElement(
        "button"
      );


    deleteButton.className =
      "danger";

    deleteButton.textContent =
      "Delete";


    deleteButton.addEventListener(
      "click",
      async () => {
        if (
          !confirm(
            `Delete "${project.name}"?`
          )
        ) {
          return;
        }


        try {
          deleteButton.disabled =
            true;


          await deleteProject(
            currentUser.id,
            project.id
          );


          renderProjects();
        }

        catch (error) {
          alert(
            `Unable to delete project: ${error.message}`
          );
        }

        finally {
          deleteButton.disabled =
            false;
        }
      }
    );


    actions.append(
      openButton,
      updateButton,
      deleteButton
    );


    card.append(
      information,
      actions
    );


    projectsList.appendChild(
      card
    );
  }
}



/* ======================================================
   DASHBOARD
====================================================== */

function renderProgressDashboard() {
  progressGrid.innerHTML =
    "";


  if (!currentUser) {
    return;
  }


  const profile =
    loadLearningProfile(
      currentUser.id
    );


  const labels = {
    qubits:
      "Qubits",

    superposition:
      "Superposition",

    gates:
      "Quantum Gates",

    measurement:
      "Measurement",

    entanglement:
      "Entanglement"
  };


  for (
    const [
      key,
      value
    ]
    of Object.entries(
      profile.mastery
    )
  ) {
    const assessment =
      profile.assessments[
        key
      ];


    const card =
      document.createElement(
        "div"
      );


    card.className =
      "progress-card";


    card.innerHTML = `
      <h3>
        ${labels[key] ?? key}
      </h3>

      <div class="progress-track">

        <div
          class="progress-fill"
          style="width:${value}%"
        ></div>

      </div>

      <p>
        ${value}% mastery
      </p>

      ${
        assessment
          ? `
            <p>
              Last check:
              ${assessment.lastScore}%
              ·
              ${assessment.attempts}
              attempt${assessment.attempts === 1 ? "" : "s"}
            </p>
          `
          : ""
      }
    `;


    progressGrid.appendChild(
      card
    );
  }
}



/* ======================================================
   AUTH EVENTS
====================================================== */

authForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();


    authMessage.textContent =
      "Signing in...";


    try {
      await signIn(
        emailInput.value.trim(),
        passwordInput.value
      );


      authMessage.textContent =
        "";
    }

    catch (error) {
      authMessage.textContent =
        error.message;
    }
  }
);


signUpButton.addEventListener(
  "click",
  async () => {
    try {
      const data =
        await signUp(
          emailInput.value.trim(),
          passwordInput.value
        );


      authMessage.textContent =
        data.session
          ? "Account created."
          : "Account created. Check your email.";
    }

    catch (error) {
      authMessage.textContent =
        error.message;
    }
  }
);


signOutButton.addEventListener(
  "click",
  async () => {
    await signOut();
  }
);



/* ======================================================
   CIRCUIT EVENTS
====================================================== */

addGateButton.addEventListener(
  "click",
  () => {
    try {
      circuit =
        addGate(
          circuit,
          buildGateFromControls()
        );


      currentStep =
        0;


      renderEverything();
    }

    catch (error) {
      alert(
        error.message
      );
    }
  }
);


undoButton.addEventListener(
  "click",
  () => {
    circuit =
      removeLastGate(
        circuit
      );


    currentStep =
      0;


    renderEverything();
  }
);


resetButton.addEventListener(
  "click",
  () => {
    circuit =
      clearCircuit(
        circuit
      );


    activeLessonId =
      null;


    currentStep =
      0;


    renderEverything();
  }
);


runButton.addEventListener(
  "click",
  () => {
    currentStep =
      circuit.gates.length;


    simulate();
  }
);


qubitCount.addEventListener(
  "change",
  () => {
    circuit =
      changeQubitCount(
        circuit,
        Number(
          qubitCount.value
        )
      );


    activeLessonId =
      null;

    currentStep =
      0;


    populateQubitSelectors();

    renderEverything();
  }
);


gateType.addEventListener(
  "change",
  updateGateControls
);


shots.addEventListener(
  "change",
  simulate
);


framework.addEventListener(
  "change",
  () => {
    generatedCode.textContent =
      generateCode();
  }
);


previousStepButton.addEventListener(
  "click",
  () => {
    if (
      currentStep > 0
    ) {
      currentStep--;

      renderStepper();

      renderAIContext();
    }
  }
);


nextStepButton.addEventListener(
  "click",
  () => {
    if (
      currentStep <
      simulationHistory.length - 1
    ) {
      currentStep++;

      renderStepper();

      renderAIContext();
    }
  }
);



/* ======================================================
   QUICK SAVE / LOAD
====================================================== */

saveButton.addEventListener(
  "click",
  () => {
    localStorage.setItem(
      getCircuitStorageKey(),
      JSON.stringify(
        circuit
      )
    );


    alert(
      "Quick Save complete. Use Projects for cloud persistence."
    );
  }
);


loadButton.addEventListener(
  "click",
  () => {
    const saved =
      localStorage.getItem(
        getCircuitStorageKey()
      );


    if (!saved) {
      alert(
        "No Quick Save found."
      );

      return;
    }


    circuit =
      JSON.parse(
        saved
      );


    activeLessonId =
      null;


    qubitCount.value =
      String(
        circuit.qubits
      );


    currentStep =
      0;


    populateQubitSelectors();

    renderEverything();

    showView(
      "build"
    );
  }
);



/* ======================================================
   CLOUD PROJECT CREATE
====================================================== */

newProjectButton.addEventListener(
  "click",
  async () => {
    const name =
      prompt(
        "Project name:"
      );


    if (!name?.trim()) {
      return;
    }


    try {
      newProjectButton.disabled =
        true;


      const project =
        await createProject(
          currentUser.id,
          name.trim(),
          structuredClone(
            circuit
          )
        );


      currentProjectId =
        project.id;


      renderProjects();
    }

    catch (error) {
      alert(
        `Unable to save project: ${error.message}`
      );
    }

    finally {
      newProjectButton.disabled =
        false;
    }
  }
);



/* ======================================================
   COPY + EXAMPLES
====================================================== */

copyButton.addEventListener(
  "click",
  async () => {
    await navigator.clipboard
      .writeText(
        generatedCode.textContent
      );


    copyButton.textContent =
      "Copied";


    setTimeout(
      () => {
        copyButton.textContent =
          "Copy Code";
      },
      1000
    );
  }
);


superpositionExample.addEventListener(
  "click",
  () => {
    const lesson =
      LESSONS.find(
        item =>
          item.id ===
          "superposition"
      );


    if (lesson) {
      openLesson(
        lesson
      );
    }
  }
);


bellExample.addEventListener(
  "click",
  () => {
    const lesson =
      LESSONS.find(
        item =>
          item.id ===
          "bell"
      );


    if (lesson) {
      openLesson(
        lesson
      );
    }
  }
);



/* ======================================================
   AI EVENTS
====================================================== */

askTutorButton.addEventListener(
  "click",
  askTutor
);


explainCircuitButton.addEventListener(
  "click",
  explainCircuit
);


debugCircuitButton.addEventListener(
  "click",
  debugCircuit
);


generateCircuitButton.addEventListener(
  "click",
  generateCircuitFromAI
);


clearAiButton.addEventListener(
  "click",
  async () => {
    try {
      await clearChat(
        currentUser.id
      );


      renderStoredConversation();


      aiPromptInput.value =
        "";


      setAIStatus(
        "Cloud conversation cleared."
      );
    }

    catch (error) {
      setAIStatus(
        error.message,
        "error"
      );
    }
  }
);


pedagogy.quickCheckButton
  .addEventListener(
    "click",
    startQuickCheck
  );


pedagogy.submitAssessmentButton
  .addEventListener(
    "click",
    submitAssessment
  );


pedagogy.closeAssessmentButton
  .addEventListener(
    "click",
    () => {
      pedagogy.assessmentPanel
        .classList.add(
          "hidden"
        );
    }
  );


pedagogy.recommendButton
  .addEventListener(
    "click",
    recommendNextLesson
  );


pedagogy.openRecommendationButton
  .addEventListener(
    "click",
    openRecommendedLesson
  );


pedagogy.closeRecommendationButton
  .addEventListener(
    "click",
    () => {
      pedagogy.recommendationPanel
        .classList.add(
          "hidden"
        );
    }
  );



/* ======================================================
   INITIALIZATION
====================================================== */

async function initializeApplication() {
  try {
    await initializeAuth();


    const user =
      await getCurrentUser();


    if (user) {
      await showWorkspace(
        user
      );
    }

    else {
      showAuthScreen();
    }


    watchAuthState(
      async user => {
        if (user) {
          await showWorkspace(
            user
          );
        }

        else {
          showAuthScreen();
        }
      }
    );


    populateQubitSelectors();

    updateGateControls();

    renderLessons();

    renderEverything();

    showView(
      "build"
    );
  }

  catch (error) {
    showAuthScreen();


    authMessage.textContent =
      `Initialization error: ${error.message}`;
  }
}


initializeApplication();