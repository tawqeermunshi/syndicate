export type UserRole = 'founder' | 'vc' | 'operator' | 'angel'
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted'
export type PostCategory = 'building' | 'raising' | 'hiring' | 'feedback_wanted'
export type IntroStatus = 'pending' | 'accepted' | 'declined'
export type EventType = 'dinner' | 'meetup' | 'conference' | 'workshop' | 'demo_day'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type AttendeeStatus = 'going' | 'waitlist' | 'declined'

export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  role: UserRole
  status: UserStatus
  headline?: string
  bio?: string
  company?: string
  company_url?: string
  company_stage?: string
  metrics?: string
  past_work?: string
  open_to?: string[]
  fund_name?: string
  fund_stage?: string[]
  check_size?: string
  sectors?: string[]
  linkedin_url?: string
  twitter_url?: string
  github_url?: string
  website_url?: string
  location?: string
  invited_by?: string
  invite_slots: number
  last_active_at?: string
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  user_id?: string
  email: string
  full_name: string
  role: UserRole
  what_built: string
  why_join: string
  what_want: string
  links?: string
  vouched_by?: string
  status: UserStatus
  reviewer_note?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export interface Invite {
  id: string
  code: string
  created_by: string
  used_by?: string
  used_at?: string
  expires_at?: string
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  category: PostCategory
  content: string
  image_url?: string
  video_url?: string
  title?: string
  link_url?: string
  is_published: boolean
  created_at: string
  updated_at: string
  author?: Profile
  comment_count?: number
  reaction_count?: number
  user_reaction?: string
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  parent_id?: string
  created_at: string
  author?: Profile
}

export interface IntroRequest {
  id: string
  from_user_id: string
  to_user_id: string
  purpose: string
  context: string
  proposed_duration: number
  status: IntroStatus
  declined_reason?: string
  accepted_at?: string
  declined_at?: string
  created_at: string
  from_user?: Profile
  to_user?: Profile
}

export interface Event {
  id: string
  organiser_id: string
  title: string
  description?: string
  event_type: EventType
  status: EventStatus
  location_name?: string
  location_address?: string
  city?: string
  is_online: boolean
  online_link?: string
  starts_at: string
  ends_at?: string
  capacity?: number
  cover_image_url?: string
  tags?: string[]
  created_at: string
  updated_at: string
  organiser?: Profile
  attendee_count?: number
  user_attendee_status?: AttendeeStatus
}

export interface EventAttendee {
  id: string
  event_id: string
  user_id: string
  status: AttendeeStatus
  joined_at: string
  user?: Profile
}
