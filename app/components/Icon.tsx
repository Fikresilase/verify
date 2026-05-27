type IconName =
  | "account_balance"
  | "account_balance_wallet"
  | "camera"
  | "check_circle"
  | "group"
  | "lock"
  | "payments"
  | "person_add"
  | "person_remove"
  | "phone_iphone"
  | "photo_library"
  | "receipt_long"
  | "security"
  | "settings"
  | "storefront"
  | "trending_up"
  | "upload_file"
  | "verified_user";

const paths: Record<IconName, string[]> = {
  account_balance: [
    "M3 10h18L12 4 3 10Z",
    "M5 11h2v7H5v-7Zm4 0h2v7H9v-7Zm4 0h2v7h-2v-7Zm4 0h2v7h-2v-7ZM4 20h16",
  ],
  account_balance_wallet: [
    "M4 7h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h13",
    "M16 13h6v4h-6a2 2 0 0 1 0-4Z",
  ],
  camera: [
    "M4 8h3l2-3h6l2 3h3v11H4V8Z",
    "M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  ],
  check_circle: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "m8 12 3 3 5-6"],
  group: [
    "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M17 11a3 3 0 1 0 0-6",
    "M2 20a7 7 0 0 1 14 0",
    "M15 14a6 6 0 0 1 7 6",
  ],
  lock: ["M7 11V8a5 5 0 0 1 10 0v3", "M5 11h14v10H5V11Z"],
  payments: [
    "M3 7h18v10H3V7Z",
    "M7 11h.01",
    "M17 13h.01",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  ],
  person_add: ["M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M3 21a6 6 0 0 1 12 0", "M19 8v6", "M16 11h6"],
  person_remove: ["M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M3 21a6 6 0 0 1 12 0", "M16 11h6"],
  phone_iphone: ["M8 2h8v20H8V2Z", "M11 18h2"],
  photo_library: ["M4 6h14v14H4V6Z", "M8 4h12v12", "m7 16 3-4 2 2 3-5 3 7"],
  receipt_long: ["M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z", "M9 8h6", "M9 12h6", "M9 16h4"],
  security: ["M12 3 5 6v5c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z", "m9 12 2 2 4-5"],
  settings: [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    "M19 12a7.7 7.7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8.8 8.8 0 0 0-1.7-1L14.5 3h-5l-.4 3.1a8.8 8.8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8.8 8.8 0 0 0 1.7 1l.4 3.1h5l.4-3.1a8.8 8.8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z",
  ],
  storefront: ["M4 10h16l-1-5H5l-1 5Z", "M5 10v10h14V10", "M9 20v-6h6v6"],
  trending_up: ["M4 17 10 11l4 4 6-8", "M15 7h5v5"],
  upload_file: ["M12 16V4", "m7 9 5-5 5 5", "M5 20h14"],
  verified_user: ["M12 3 5 6v5c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z", "m9 12 2 2 4-5"],
};

export function Icon({
  name,
  className = "",
  size = 24,
}: {
  name: IconName;
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}
