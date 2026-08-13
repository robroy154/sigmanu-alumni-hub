export interface FamilyTreeMember {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  pledge_class: string | null;
  pin_number: string | null;
  photo_url: string | null;
  big_id: string | null;
  is_stub: boolean;
  status: "member" | "admin" | "stub";
}
