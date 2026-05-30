export type VerifyResult = {
  amount?: number;
  error?: string;
  payer?: string;
  payerAccount?: string;
  reason?: string | null;
  receiver?: string;
  receiverAccount?: string;
  reference?: string;
  success: boolean;
  time?: string;
};
