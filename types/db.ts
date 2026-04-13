// Hand-written types derived from schema.sql.
// After connecting a Supabase project, replace with:
//   npx supabase gen types typescript --project-id <id> --schema public > types/db.ts

export type HuntStatus       = 'draft' | 'active' | 'ended'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'failed'
export type AiSuggestedStatus = 'approved' | 'rejected'

export type Hunt = {
  id:         string
  title:      string
  status:     HuntStatus
  created_at: string
  started_at: string | null
  ended_at:   string | null
}

export type Clue = {
  id:                  string
  hunt_id:             string
  unlocked_by_clue_id: string | null  // null = free hanging (always visible)
  body:                string | null   // null when image_url is set instead
  image_url:           string | null   // storage path in clue-images bucket
  hint:                string | null
  location_name:       string | null
  points_value:        number
}

export type Team = {
  id:          string
  hunt_id:     string
  name:        string | null
  pin:         string
  total_score: number
}

export type Player = {
  id:        string
  team_id:   string
  name:      string
  joined_at: string
}

export type Submission = {
  id:             string
  team_id:        string
  clue_id:        string
  player_id:      string
  photo_url:      string
  submitted_at:   string
  reviewed_at:    string | null
  status:         SubmissionStatus
  points_awarded: number
}

export type Announcement = {
  id:         string
  hunt_id:    string
  body:       string
  created_at: string
}

export type AiReview = {
  id:               string
  submission_id:    string
  model:            string
  confidence:       number
  suggested_status: AiSuggestedStatus
  reviewed_at:      string
}

// Supabase client generic — matches the shape createClient<Database> expects
export interface Database {
  public: {
    Tables: {
      hunt: {
        Row:           Hunt
        Insert:        Omit<Hunt, 'id' | 'created_at' | 'started_at' | 'ended_at'> & { started_at?: string | null; ended_at?: string | null }
        Update:        Partial<Omit<Hunt, 'id'>>
        Relationships: []
      }
      clue: {
        Row:           Clue
        Insert:        Omit<Clue, 'id'> & { body?: string | null; image_url?: string | null }
        Update:        Partial<Omit<Clue, 'id'>>
        Relationships: []
      }
      team: {
        Row:           Team
        Insert:        Omit<Team, 'id'>
        Update:        Partial<Omit<Team, 'id'>>
        Relationships: []
      }
      player: {
        Row:           Player
        Insert:        Omit<Player, 'id' | 'joined_at'>
        Update:        Partial<Omit<Player, 'id'>>
        Relationships: []
      }
      submission: {
        Row:           Submission
        Insert:        Omit<Submission, 'id' | 'submitted_at'>
        Update:        Partial<Omit<Submission, 'id'>>
        Relationships: []
      }
      announcement: {
        Row:           Announcement
        Insert:        Omit<Announcement, 'id' | 'created_at'>
        Update:        Partial<Omit<Announcement, 'id'>>
        Relationships: []
      }
      ai_review: {
        Row:           AiReview
        Insert:        Omit<AiReview, 'id' | 'reviewed_at'>
        Update:        Partial<Omit<AiReview, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      start_hunt:        { Args: { p_hunt_id: string };                                                                                         Returns: Hunt }
      end_hunt:          { Args: { p_hunt_id: string };                                                                                         Returns: Hunt }
      approve_submission:{ Args: { p_submission_id: string };                                                                                   Returns: Submission }
      reject_submission: { Args: { p_submission_id: string };                                                                                   Returns: Submission }
      generate_pin:      { Args: { p_hunt_id: string };                                                                                         Returns: string }
      submit_clue:       { Args: { p_team_id: string; p_player_id: string; p_clue_id: string; p_photo_url: string };                            Returns: Submission }
      join_team:         { Args: { p_pin: string; p_player_name: string; p_team_name: string | null };                                          Returns: { player: { id: string; name: string }; team: { id: string } } }
      update_team_name:  { Args: { p_team_id: string; p_name: string };                                                                         Returns: Team }
    }
  }
}
