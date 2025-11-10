export interface ExamplePair {
  en: string;
  pt: string;
}

export type WordType =
  | 'noun'
  | 'verb-regular'
  | 'verb-irregular'
  | 'adjective'
  | 'adverb'
  | 'expression'
  | 'phrase'
  | 'other';

export interface Card {
  id: string;
  front: string;
  back: string;
  type?: WordType;
  examples?: ExamplePair[];
  createdAt?: number;
  conjugations?: Conjugations;
}

export interface Conjugations {
  present?: ConjugationForms;
  past?:
    | ConjugationForms
    | { perfeito?: ConjugationForms; imperfeito?: ConjugationForms };
  future?: ConjugationForms;
}

export interface ConjugationForms {
  eu?: string;
  tu?: string;
  eleElaVoce?: string;
  nos?: string;
  vos?: string;
  elesElasVoces?: string;
}
