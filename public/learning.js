import {
  getSupabaseClient
} from "./auth.js";


export const TOPICS = [
  "qubits",
  "superposition",
  "gates",
  "measurement",
  "entanglement"
];


const DEFAULT_MASTERY = {
  qubits: 0,
  superposition: 0,
  gates: 0,
  measurement: 0,
  entanglement: 0
};


const profileCache =
  new Map();


const saveTimers =
  new Map();


function createDefaultProfile() {
  return {
    version: 3,

    mastery: {
      ...DEFAULT_MASTERY
    },

    assessments: {},

    completedLessons: [],

    totalAssessments: 0,

    updatedAt:
      new Date()
        .toISOString()
  };
}


function clamp(
  value
) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        value
      )
    )
  );
}


function normalizeProfile(
  profile
) {
  return {
    ...createDefaultProfile(),

    ...profile,

    mastery: {
      ...DEFAULT_MASTERY,
      ...(profile?.mastery || {})
    },

    assessments: {
      ...(profile?.assessments || {})
    },

    completedLessons:
      Array.isArray(
        profile?.completedLessons
      )
        ? profile.completedLessons
        : []
  };
}


async function persistProfile(
  userId,
  profile
) {
  const supabase =
    getSupabaseClient();


  const normalized =
    normalizeProfile(
      profile
    );


  normalized.updatedAt =
    new Date()
      .toISOString();


  const {
    error
  } =
    await supabase
      .from(
        "qubitlab_learning_profiles"
      )
      .upsert(
        {
          user_id:
            userId,

          mastery:
            normalized.mastery,

          assessment_summary:
            normalized.assessments,

          completed_lessons:
            normalized.completedLessons,

          total_assessments:
            normalized.totalAssessments,

          updated_at:
            normalized.updatedAt
        },
        {
          onConflict:
            "user_id"
        }
      );


  if (error) {
    throw error;
  }


  profileCache.set(
    userId,
    normalized
  );


  return normalized;
}


function scheduleProfileSave(
  userId
) {
  const existing =
    saveTimers.get(
      userId
    );


  if (existing) {
    clearTimeout(
      existing
    );
  }


  const timer =
    setTimeout(
      async () => {
        saveTimers.delete(
          userId
        );


        try {
          const profile =
            profileCache.get(
              userId
            );


          if (profile) {
            await persistProfile(
              userId,
              profile
            );
          }
        }

        catch (error) {
          console.error(
            "Unable to persist learning profile:",
            error
          );
        }
      },
      500
    );


  saveTimers.set(
    userId,
    timer
  );
}


export async function hydrateLearningProfile(
  userId
) {
  const supabase =
    getSupabaseClient();


  const {
    data,
    error
  } =
    await supabase
      .from(
        "qubitlab_learning_profiles"
      )
      .select(
        `
          mastery,
          assessment_summary,
          completed_lessons,
          total_assessments,
          updated_at
        `
      )
      .eq(
        "user_id",
        userId
      )
      .limit(
        1
      );


  if (error) {
    throw error;
  }


  if (
    !data ||
    data.length === 0
  ) {
    const profile =
      createDefaultProfile();


    await persistProfile(
      userId,
      profile
    );


    return profile;
  }


  const row =
    data[0];


  const profile =
    normalizeProfile({
      mastery:
        row.mastery,

      assessments:
        row.assessment_summary,

      completedLessons:
        row.completed_lessons,

      totalAssessments:
        row.total_assessments,

      updatedAt:
        row.updated_at
    });


  profileCache.set(
    userId,
    profile
  );


  return profile;
}


export function loadLearningProfile(
  userId
) {
  return (
    profileCache.get(
      userId
    ) ||
    createDefaultProfile()
  );
}


export function loadProgress(
  userId
) {
  return {
    ...loadLearningProfile(
      userId
    ).mastery
  };
}


export function updateProgressFromCircuit(
  userId,
  circuit
) {
  const profile =
    normalizeProfile(
      loadLearningProfile(
        userId
      )
    );


  const mastery =
    profile.mastery;


  if (
    circuit.qubits >= 1
  ) {
    mastery.qubits =
      Math.max(
        mastery.qubits,
        30
      );
  }


  if (
    circuit.gates.length > 0
  ) {
    mastery.gates =
      Math.max(
        mastery.gates,
        25
      );


    mastery.measurement =
      Math.max(
        mastery.measurement,
        15
      );
  }


  if (
    circuit.gates.some(
      gate =>
        gate.type === "H"
    )
  ) {
    mastery.superposition =
      Math.max(
        mastery.superposition,
        35
      );


    mastery.gates =
      Math.max(
        mastery.gates,
        35
      );
  }


  if (
    circuit.gates.some(
      gate =>
        gate.type === "CX"
    )
  ) {
    mastery.gates =
      Math.max(
        mastery.gates,
        45
      );
  }


  if (
    circuit.gates.some(
      gate =>
        gate.type === "H"
    ) &&
    circuit.gates.some(
      gate =>
        gate.type === "CX"
    )
  ) {
    mastery.entanglement =
      Math.max(
        mastery.entanglement,
        25
      );
  }


  profile.updatedAt =
    new Date()
      .toISOString();


  profileCache.set(
    userId,
    profile
  );


  scheduleProfileSave(
    userId
  );


  return {
    ...mastery
  };
}


export async function recordAssessment(
  userId,
  result,
  {
    question,
    answer
  }
) {
  const topic =
    result.topic;


  if (
    !TOPICS.includes(
      topic
    )
  ) {
    throw new Error(
      `Unknown learning topic: ${topic}`
    );
  }


  const score =
    clamp(
      result.score
    );


  const profile =
    normalizeProfile(
      loadLearningProfile(
        userId
      )
    );


  const previous =
    profile.assessments[
      topic
    ] || {
      attempts: 0,
      bestScore: 0,
      lastScore: 0
    };


  const currentMastery =
    profile.mastery[
      topic
    ];


  const updatedMastery =
    clamp(
      currentMastery *
        0.65 +
      score *
        0.35
    );


  profile.mastery[
    topic
  ] =
    updatedMastery;


  profile.assessments[
    topic
  ] = {
    attempts:
      previous.attempts + 1,

    bestScore:
      Math.max(
        previous.bestScore,
        score
      ),

    lastScore:
      score,

    updatedAt:
      new Date()
        .toISOString()
  };


  profile.totalAssessments =
    (
      profile.totalAssessments ||
      0
    ) + 1;


  const supabase =
    getSupabaseClient();


  const assessmentId =
    crypto.randomUUID();


  const {
    error
  } =
    await supabase
      .from(
        "qubitlab_assessments"
      )
      .insert({
        id:
          assessmentId,

        user_id:
          userId,

        topic,

        score,

        passed:
          Boolean(
            result.passed
          ),

        question,

        answer,

        feedback:
          result.feedback ||
          "",

        correct_points:
          result.correctPoints ||
          [],

        missing_points:
          result.missingPoints ||
          [],

        created_at:
          new Date()
            .toISOString()
      });


  if (error) {
    throw error;
  }


  await persistProfile(
    userId,
    profile
  );


  return profile;
}


export async function markLessonCompleted(
  userId,
  lessonId
) {
  const profile =
    normalizeProfile(
      loadLearningProfile(
        userId
      )
    );


  if (
    !profile.completedLessons
      .includes(
        lessonId
      )
  ) {
    profile.completedLessons.push(
      lessonId
    );
  }


  return await persistProfile(
    userId,
    profile
  );
}


export function getOverallMastery(
  userId
) {
  const mastery =
    loadLearningProfile(
      userId
    ).mastery;


  const values =
    Object.values(
      mastery
    );


  return Math.round(
    values.reduce(
      (
        total,
        value
      ) =>
        total + value,
      0
    ) /
    values.length
  );
}


export function getWeakestTopics(
  userId,
  limit = 2
) {
  const mastery =
    loadLearningProfile(
      userId
    ).mastery;


  return Object.entries(
    mastery
  )
    .sort(
      (
        [, first],
        [, second]
      ) =>
        first - second
    )
    .slice(
      0,
      limit
    )
    .map(
      ([topic]) =>
        topic
    );
}