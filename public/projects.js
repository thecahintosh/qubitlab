import {
  getSupabaseClient
} from "./auth.js";


const projectCache =
  new Map();


export async function hydrateProjects(
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
        "id, name, circuit, created_at, updated_at"
      )
      .eq(
        "user_id",
        userId
      )
      .order(
        "updated_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  const projects =
    (data || [])
      .map(
        row => ({
          id:
            row.id,

          name:
            row.name,

          circuit:
            row.circuit,

          createdAt:
            row.created_at,

          updatedAt:
            row.updated_at
        })
      );


  projectCache.set(
    userId,
    projects
  );


  return projects;
}


export function loadProjects(
  userId
) {
  return (
    projectCache.get(
      userId
    ) || []
  );
}


export async function createProject(
  userId,
  name,
  circuit
) {
  const supabase =
    getSupabaseClient();


  const project = {
    id:
      crypto.randomUUID(),

    user_id:
      userId,

    name,

    circuit,

    created_at:
      new Date()
        .toISOString(),

    updated_at:
      new Date()
        .toISOString()
  };


  const {
    data,
    error
  } =
    await supabase
      .from(
        "qubitlab_projects"
      )
      .insert(
        project
      )
      .select()
      .single();


  if (error) {
    throw error;
  }


  await hydrateProjects(
    userId
  );


  return {
    id:
      data.id,

    name:
      data.name,

    circuit:
      data.circuit,

    createdAt:
      data.created_at,

    updatedAt:
      data.updated_at
  };
}


export async function updateProject(
  userId,
  projectId,
  circuit
) {
  const supabase =
    getSupabaseClient();


  const {
    error
  } =
    await supabase
      .from(
        "qubitlab_projects"
      )
      .update({
        circuit,

        updated_at:
          new Date()
            .toISOString()
      })
      .eq(
        "id",
        projectId
      )
      .eq(
        "user_id",
        userId
      );


  if (error) {
    throw error;
  }


  await hydrateProjects(
    userId
  );
}


export async function deleteProject(
  userId,
  projectId
) {
  const supabase =
    getSupabaseClient();


  const {
    error
  } =
    await supabase
      .from(
        "qubitlab_projects"
      )
      .delete()
      .eq(
        "id",
        projectId
      )
      .eq(
        "user_id",
        userId
      );


  if (error) {
    throw error;
  }


  await hydrateProjects(
    userId
  );
}