export type LearningDay = {
  id: string;
  date: string;
  week_number: number;
  day_number: number;
  topic: string;
  objective: string;
  difficulty: string;
  status: string;
};

export type DailyCompletion = {
  learning_day_id: string;
  anki_done: boolean;
  first_listen_done: boolean;
  transcript_done: boolean;
  final_listen_done: boolean;
  chunks_done: boolean;
  speaking_done: boolean;
  completed: boolean;
};

export type ContentItem = {
  id: string;
  learning_day_id: string;
  title: string;
  source: string | null;
  source_url: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  content_type: string | null;
  is_active: boolean;
};
