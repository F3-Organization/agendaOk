export interface Company {
  id: string;
  name: string;
  slug: string;
  subscription?: { plan: string; status: string };
}
