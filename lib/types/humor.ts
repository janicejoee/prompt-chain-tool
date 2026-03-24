export type HumorFlavor = {
  id: number;
  slug: string;
  description: string | null;
  created_datetime_utc: string;
};

export type HumorFlavorStep = {
  id: number;
  humor_flavor_id: number;
  order_by: number;
  description: string | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  llm_temperature: number | null;
  llm_model_id: number | null;
  llm_input_type_id: number | null;
  llm_output_type_id: number | null;
  humor_flavor_step_type_id: number | null;
};

export type CaptionRow = {
  id: string;
  content: string;
  image_id: string;
  humor_flavor_id: number | null;
  caption_request_id: number | null;
  created_datetime_utc: string;
  is_public: boolean | null;
};
