import {
  getSupabaseClient
} from "./auth.js";


const chatCache =
  new Map();


export async function hydrateChat(
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
        "id, role, content, created_at"
      )
      .eq(
        "user_id",
        userId
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(
        40
      );


  if (error) {
    throw error;
  }


  const messages =
    (data || [])
      .reverse()
      .map(
        row => ({
          id:
            row.id,

          role:
            row.role,

          content:
            row.content,

          createdAt:
            row.created_at
        })
      );


  chatCache.set(
    userId,
    messages
  );


  return messages;
}


export function loadChat(
  userId
) {
  return (
    chatCache.get(
      userId
    ) || []
  );
}


export async function appendChat(
  userId,
  role,
  content
) {
  const supabase =
    getSupabaseClient();


  const message = {
    id:
      crypto.randomUUID(),

    user_id:
      userId,

    role,

    content,

    created_at:
      new Date()
        .toISOString()
  };


  const {
    error
  } =
    await supabase
      .from(
        "qubitlab_tutor_messages"
      )
      .insert(
        message
      );


  if (error) {
    throw error;
  }


  const messages = [
    ...loadChat(
      userId
    ),

    {
      id:
        message.id,

      role:
        message.role,

      content:
        message.content,

      createdAt:
        message.created_at
    }
  ].slice(
    -40
  );


  chatCache.set(
    userId,
    messages
  );


  return messages;
}


export async function clearChat(
  userId
) {
  const supabase =
    getSupabaseClient();


  const {
    error
  } =
    await supabase
      .from(
        "qubitlab_tutor_messages"
      )
      .delete()
      .eq(
        "user_id",
        userId
      );


  if (error) {
    throw error;
  }


  chatCache.set(
    userId,
    []
  );
}