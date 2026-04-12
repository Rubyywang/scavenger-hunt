// Hand-written types derived from schema.sql.
// After connecting a Supabase project, replace with:
//   npx supabase gen types typescript --project-id <id> --schema public > types/db.ts

export type HuntStatus       = 'draft' | 'active' | 'ended'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'failed'
export type AiSuggestedStatus = 'approved' | 'rejected'

export interface Hunt {
  id:         string
  title:      string
  status:     HuntStatus
  created_at: string
  started_at: string | null
  ended_at:   string | null
}

export interface Clue {
  id:                  string
  hunt_id:             string
  unlocked_by_clue_id: string | null  // null = free hanging (always visible)
  body:                string
  hint:                string | null
  location_name:       string | null
  points_value:        number
}

export interface Team {
  id:          string
  hunt_id:     string
  name:        string | null
  pin:         string
  total_score: number
}

export interface Player {
  id:        string
  team_id:   string
  name:      string
  joined_at: string
}

export interface Submission {
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

export interface Announcement {
  id:         string
  hunt_id:    string
  body:       string
  created_at: string
}

export interface AiReview {
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
        Row:    Hunt
        Insert: Omit<Hunt, 'id' | 'created_at'>
        Update: Partial<Omit<Hunt, 'id'>>
      }
      clue: {
        Row:    Clue
        Insert: Omit<Clue, 'id'>
        Update: Partial<Omit<Clue, 'id'>>
      }
      team: {
        Row:    Team
        Insert: Omit<Team, 'id'>
        Update: Partial<Omit<Team, 'id'>>
      }
      player: {
        Row:    Player
        Insert: Omit<Player, 'id' | 'joined_at'>
        Update: Partial<Omit<Player, 'id'>>
      }
      submission: {
        Row:    Submission
        Insert: Omit<Submission, 'id' | 'submitted_at'>
        Update: Partial<Omit<Submission, 'id'>>
      }
      announcement: {
        Row:    Announcement
        Insert: Omit<Announcement, 'id' | 'created_at'>
        Update: Partial<Omit<Announcement, 'id'>>
      }
      ai_review: {
        Row:    AiReview
        Insert: Omit<AiReview, 'id' | 'reviewed_at'>
        Update: Partial<Omit<AiReview, 'id'>>
      }
    }
  }
}
