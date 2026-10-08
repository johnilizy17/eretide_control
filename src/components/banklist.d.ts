export interface Bank {
  code: string;
  name: string;
  bank_code?: string;
  bank_name?: string;
}

declare const BANK_LIST: Bank[];

export default BANK_LIST;
