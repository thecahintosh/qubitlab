import {
  getSupabaseClient
} from "./auth.js";


function migrationKey(
  userId
) {
  return (
    `qubitlab-cloud-migrated-${userId}`
  );
}


function safeParse(
  raw,
  fallback
) {
  if (!raw) {
    return fallback;
  }


  try {
    return JSON.parse(
      raw
    );
  }

  catch {
    return fallback;
  }
}


async function migrateProjects(
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
        "qubitlab_projects"
      )
      .select(
        "id"
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
    data?.length
  ) {
    return;
  }


  const projects =
    safeParse(
      localStorage.getItem(
        `qubitlab-projects-${userId}`
      ),
      []
    );


  if (
    !Array.isArray(
      projects
    ) ||
    !projects.length
  ) {
    return;
  }


  const rows =
    projects.map(
      project => ({
        id:
          project.id ||
          crypto.randomUUID(),

        user_id:
          userId,

        name:
          project.name ||
          "Migrated Project",

        circuit:
          project.circuit,

        created_at:
          project.createdAt ||
          new Date()
            .toISOString(),

        updated_at:
          project.updatedAt ||
          new Date()
            .toISOString()
      })
    );


  const {
    error:
      insertError
  } =
    await supabase
      .from(
        "qubitlab_projects"
      )
      .upsert(
        rows,
        {
          onConflict:
            "id"
        }
      );


  if (
    insertError
  ) {
    throw insertError;
  }
}


async function migrateChat(
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
        "qubitlab_tutor_messages"
      )
      .select(
        "id"
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
    data?.length
  ) {
    return;
  }


  const messages =
    safeParse(
      localStorage.getItem(
        `qubitlab-chat-${userId}`
      ),
      []
    );


  if (
    !Array.isArray(
      messages
    ) ||
    !messages.length
  ) {
    return;
  }


  const rows =
    messages.map(
      message => ({
        id:
          message.id ||
          crypto.randomUUID(),

        user_id:
          userId,

        role:
          message.role,

        content:
          message.content,

        created_at:
          message.createdAt ||
          new Date()
            .toISOString()
      })
    );


  const {
    error:
      insertError
  } =
    await supabase
      .from(
        "qubitlab_tutor_messages"
      )
      .upsert(
        rows,
        {
          onConflict:
            "id"
        }
      );


  if (
    insertError
  ) {
    throw insertError;
  }
}


async function migrateLearning(
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
        "user_id"
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
    data?.length
  ) {
    return;
  }


  const modern =
    safeParse(
      localStorage.getItem(
        `qubitlab-learning-${userId}`
      ),
      null
    );


  const legacy =
    safeParse(
      localStorage.getItem(
        `qubitlab-progress-${userId}`
      ),
      null
    );


  let profile =
    modern;


  if (
    !profile &&
    legacy
  ) {
    profile = {
      mastery:
        legacy,

      assessments:
        {},

      completedLessons:
        [],

      totalAssessments:
        0
    };
  }


  if (
    !profile
  ) {
    return;
  }


  const {
    error:
      insertError
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
            profile.mastery ||
            {},

          assessment_summary:
            profile.assessments ||
            {},

          completed_lessons:
            profile.completedLessons ||
            [],

          total_assessments:
            profile.totalAssessments ||
            0,

          updated_at:
            new Date()
              .toISOString()
        },
        {
          onConflict:
            "user_id"
        }
      );


  if (
    insertError
  ) {
    throw insertError;
  }
}


export async function migrateLocalDataToCloud(
  userId
) {
  if (
    localStorage.getItem(
      migrationKey(
        userId
      )
    )
  ) {
    return;
  }


  await migrateProjects(
    userId
  );


  await migrateChat(
    userId
  );


  await migrateLearning(
    userId
  );


  localStorage.setItem(
    migrationKey(
      userId
    ),
    new Date()
      .toISOString()
  );
}