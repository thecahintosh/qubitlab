import {
  renderRichAIText
} from "./ai-renderer.js";


let initialized =
  false;


export function ensurePedagogyUI() {
  if (
    initialized
  ) {
    return getElements();
  }


  const actionGrid =
    document.querySelector(
      ".ai-action-grid"
    );


  const chatPanel =
    document.querySelector(
      ".tutor-chat-panel"
    );


  if (
    !actionGrid ||
    !chatPanel
  ) {
    throw new Error(
      "Tutor UI could not be initialized."
    );
  }


  const quickCheckButton =
    document.createElement(
      "button"
    );


  quickCheckButton.id =
    "quickCheckButton";

  quickCheckButton.type =
    "button";

  quickCheckButton.className =
    "secondary";

  quickCheckButton.textContent =
    "Quick Knowledge Check";


  const recommendButton =
    document.createElement(
      "button"
    );


  recommendButton.id =
    "recommendButton";

  recommendButton.type =
    "button";

  recommendButton.className =
    "secondary";

  recommendButton.textContent =
    "What Should I Learn Next?";


  actionGrid.append(
    quickCheckButton,
    recommendButton
  );


  const assessmentPanel =
    document.createElement(
      "section"
    );


  assessmentPanel.id =
    "assessmentPanel";

  assessmentPanel.className =
    "pedagogy-card hidden";


  assessmentPanel.innerHTML = `
    <p class="eyebrow">
      KNOWLEDGE CHECK
    </p>

    <h3>
      Check Your Understanding
    </h3>

    <div
      id="assessmentQuestion"
      class="assessment-question"
    ></div>

    <textarea
      id="assessmentAnswer"
      rows="4"
      placeholder="Explain your answer in your own words..."
    ></textarea>

    <div class="pedagogy-actions">

      <button
        id="submitAssessmentButton"
        type="button"
      >
        Check Answer
      </button>

      <button
        id="closeAssessmentButton"
        type="button"
        class="secondary"
      >
        Close
      </button>

    </div>

    <div
      id="assessmentFeedback"
      class="assessment-feedback"
    ></div>
  `;


  const recommendationPanel =
    document.createElement(
      "section"
    );


  recommendationPanel.id =
    "recommendationPanel";

  recommendationPanel.className =
    "pedagogy-card hidden";


  recommendationPanel.innerHTML = `
    <p class="eyebrow">
      PERSONALIZED PATH
    </p>

    <h3>
      Recommended Next Experiment
    </h3>

    <div id="recommendationContent">
    </div>

    <div class="pedagogy-actions">

      <button
        id="openRecommendationButton"
        type="button"
      >
        Open Lesson
      </button>

      <button
        id="closeRecommendationButton"
        type="button"
        class="secondary"
      >
        Close
      </button>

    </div>
  `;


  chatPanel.append(
    assessmentPanel,
    recommendationPanel
  );


  injectStyles();


  initialized =
    true;


  return getElements();
}


function getElements() {
  return {
    quickCheckButton:
      document.getElementById(
        "quickCheckButton"
      ),

    recommendButton:
      document.getElementById(
        "recommendButton"
      ),

    assessmentPanel:
      document.getElementById(
        "assessmentPanel"
      ),

    assessmentQuestion:
      document.getElementById(
        "assessmentQuestion"
      ),

    assessmentAnswer:
      document.getElementById(
        "assessmentAnswer"
      ),

    submitAssessmentButton:
      document.getElementById(
        "submitAssessmentButton"
      ),

    closeAssessmentButton:
      document.getElementById(
        "closeAssessmentButton"
      ),

    assessmentFeedback:
      document.getElementById(
        "assessmentFeedback"
      ),

    recommendationPanel:
      document.getElementById(
        "recommendationPanel"
      ),

    recommendationContent:
      document.getElementById(
        "recommendationContent"
      ),

    openRecommendationButton:
      document.getElementById(
        "openRecommendationButton"
      ),

    closeRecommendationButton:
      document.getElementById(
        "closeRecommendationButton"
      )
  };
}


export function renderConversation(
  container,
  messages
) {
  container.innerHTML =
    "";


  if (
    messages.length === 0
  ) {
    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "ai-placeholder";


    empty.textContent =
      "Ask QubitLab anything about your quantum experiment.";


    container.appendChild(
      empty
    );


    return;
  }


  for (
    const message
    of messages
  ) {
    const bubble =
      document.createElement(
        "article"
      );


    bubble.className =
      `chat-message ${message.role}`;


    const role =
      document.createElement(
        "div"
      );


    role.className =
      "chat-role";


    role.textContent =
      message.role ===
        "user"
        ? "You"
        : "QubitLab";


    const body =
      document.createElement(
        "div"
      );


    body.className =
      "chat-body";


    bubble.append(
      role,
      body
    );


    container.appendChild(
      bubble
    );


    if (
      message.role ===
      "assistant"
    ) {
      renderRichAIText(
        body,
        message.content
      );
    }

    else {
      body.textContent =
        message.content;
    }
  }


  container.scrollTop =
    container.scrollHeight;
}


export function renderAssessmentQuestion(
  element,
  assessment
) {
  element.textContent =
    assessment.question;
}


export function renderAssessmentFeedback(
  element,
  assessment
) {
  renderRichAIText(
    element,
    `### Score: ${assessment.score}/100

${assessment.feedback}

${
  assessment.correctPoints?.length
    ? `**You understood:** ${assessment.correctPoints.join(", ")}`
    : ""
}

${
  assessment.missingPoints?.length
    ? `**Review:** ${assessment.missingPoints.join(", ")}`
    : ""
}`
  );
}


export function renderRecommendation(
  element,
  lesson,
  recommendation
) {
  renderRichAIText(
    element,
    `## ${lesson.title}

**Level:** ${lesson.level}

${recommendation.reason}

**Focus:** ${
  (
    recommendation.focusTopics ||
    []
  ).join(", ")
}`
  );
}


function injectStyles() {
  if (
    document.getElementById(
      "pedagogyStyles"
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "pedagogyStyles";


  style.textContent = `
    .chat-message {
      margin: 0 0 18px;
    }

    .chat-role {
      margin-bottom: 6px;
      color: #8f9cff;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .chat-message.user {
      margin-left: 12%;
    }

    .chat-message.user .chat-role {
      color: #91d6b0;
    }

    .chat-body {
      padding: 14px 16px;
      background: #10151f;
      border: 1px solid #252e3d;
      border-radius: 10px;
      line-height: 1.65;
    }

    .chat-message.user .chat-body {
      background: #111b19;
      border-color: #263b35;
      white-space: pre-wrap;
    }

    .pedagogy-card {
      margin-top: 18px;
      padding: 18px;
      background: #0b0f16;
      border: 1px solid #293244;
      border-radius: 11px;
    }

    .pedagogy-card h3 {
      margin: 7px 0 16px;
    }

    .assessment-question {
      margin-bottom: 14px;
      padding: 13px;
      background: #111722;
      border-radius: 8px;
      line-height: 1.6;
    }

    #assessmentAnswer {
      width: 100%;
      resize: vertical;
    }

    .pedagogy-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 11px;
    }

    .assessment-feedback {
      margin-top: 15px;
    }
  `;


  document.head.appendChild(
    style
  );
}