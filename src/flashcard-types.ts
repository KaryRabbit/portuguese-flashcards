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

export type ConjugationGroup = {
  eu: string;
  tu: string;
  eleElaVoce: string;
  nos: string;
  vos: string;
  elesElasVoces: string;
};

export type Conjugations = {
  present?: ConjugationGroup;
  past?: {
    perfeito?: ConjugationGroup;
    imperfeito?: ConjugationGroup;
  };
  future?: ConjugationGroup;
};

export interface ConjugationForms {
  eu?: string;
  tu?: string;
  eleElaVoce?: string;
  nos?: string;
  vos?: string;
  elesElasVoces?: string;
}
