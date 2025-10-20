export type ISODate = string;
export interface Card {
  id: string;
  front: string; // English
  back: string; // Portuguese (EU)
  imageUrl?: string;
  deck: number; // 1..5
  nextReview: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}
