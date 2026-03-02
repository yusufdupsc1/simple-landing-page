export type GovtFeePreset = {
  key: string;
  titleBn: string;
  titleEn: string;
  feeType:
    | "TUITION"
    | "EXAMINATION"
    | "MISC"
    | "SPORTS"
    | "LIBRARY"
    | "TRANSPORT"
    | "LABORATORY"
    | "UNIFORM";
};

export const GOVT_PRIMARY_FEE_PRESETS: GovtFeePreset[] = [
  {
    key: "MONTHLY_FEE",
    titleBn: "মাসিক ফি",
    titleEn: "Monthly Fee",
    feeType: "TUITION",
  },
  {
    key: "ADMISSION_FEE",
    titleBn: "ভর্তি ফি",
    titleEn: "Admission Fee",
    feeType: "MISC",
  },
  {
    key: "EXAM_FEE",
    titleBn: "পরীক্ষা ফি",
    titleEn: "Exam Fee",
    feeType: "EXAMINATION",
  },
  {
    key: "SESSION_CHARGE",
    titleBn: "সেশন চার্জ",
    titleEn: "Session Charge",
    feeType: "MISC",
  },
];
