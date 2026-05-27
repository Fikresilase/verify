# Payment Verification Platform — Complete Application Description

---

## What This Application Is

This is a mobile-first mini application that solves a very specific and painful problem in the Ethiopian digital payments landscape: **businesses cannot trust the payment receipts customers show them**.

When a customer claims to have paid via CBE, Telebirr, Awash Bank, or any other local bank, they show a screenshot on their phone. That screenshot could be real, edited, expired, or reused from a previous transaction. A busy waiter, cashier, or service worker has no reliable way to verify it on the spot. This application eliminates that uncertainty entirely.

The platform serves two types of people: **business owners** who pay for and manage verification credits, and **staff members** who use those credits to verify payments in real time. A restaurant owner pays once and their entire staff can verify transactions. A market vendor verifies their own payments. A hotel manager gives their front desk team access. The use cases are wide, but the core action is always the same — point a camera at a receipt, get an instant verified or rejected result.

---

## The Problem Being Solved

Ethiopian mobile banking apps produce receipts that look similar to each other but differ in layout, wording, and format depending on the bank and the version of their app. Traditional rule-based systems that check for specific text patterns break every time a bank updates their interface. This application uses an intelligent extraction layer instead — one that reads the meaning of a receipt rather than matching it against a fixed template. This means it works across all major Ethiopian banks and adapts automatically when their formats change.

The secondary problem is **double-spending**: a customer could show the same legitimate receipt to multiple merchants. The application remembers every verified transaction ID and flags any duplicate submission immediately, regardless of which staff member or group encounters it.

---

## User Roles and How They Relate

There is no rigid hierarchy of "owner" and "waiter" built into the system. Instead, the application uses a **group model**. Any registered user can create a group. That group has a credit balance. The person who created the group manages it — they add members, allocate credits, and monitor activity. Members of the group use the credits to perform verifications.

This design means a single user can be both a manager in one context and a member in another. A restaurant manager added to their employer's group might also run a small side business with their own separate group. The application serves both roles simultaneously without confusion.

---

## Registration and Identity

A new user provides their **phone number, first name, and father's name**. There is no email, no password, no social login. Identity is verified through a one-time code sent to the provided phone number via Telegram. Once the code is confirmed, the account is active and the user is inside the application.

Phone number is the identifier used throughout the system — to find users, to add members to groups, and to tie transactions to specific people.

---

## The Three Core Screens

### 1. Verify

This is the screen staff members use most. It is deliberately stripped down to a single action: open the camera, photograph the receipt, see the result.

The flow works like this:

The staff member opens the Verify screen. They tap the camera button and point their device at the customer's receipt — whether it is a printed paper receipt, a phone screen showing a bank app receipt, or a forwarded screenshot. The image is captured and immediately sent for processing.

Behind the scenes, an intelligent layer reads the image and extracts the key fields: the bank name, the transaction ID, the amount paid, and the name of the recipient. It then independently fetches the official receipt from the bank's own servers using the extracted transaction link or reference. The extracted details from the customer's image are compared against the official bank record. If they match, and if that transaction ID has never been verified before, the result comes back as **Verified**. If the amounts differ, the names don't match, or the transaction ID is already in the database, the result comes back as **Rejected**, with a reason.

The entire process takes under three seconds. The staff member sees a large clear result on screen — green for verified, red for rejected — and proceeds accordingly. One verification credit is deducted from the group's balance.

The screen also shows the most recent verification result at the bottom, so a staff member can glance back at what they just processed without navigating anywhere.

### 2. Pay

This screen is used by group managers or any member who wants to top up their group's credit balance.

The user uploads a receipt — an image or document — proving that they have made a payment to the application's designated account. The same intelligent extraction process reads this receipt, confirms it is a legitimate incoming payment, and if valid, credits the corresponding amount to the user's group balance. A confirmation modal appears showing the amount added and the new total balance.

Credits are denominated in Ethiopian Birr. The pricing is transparent: one verification costs one Birr. So uploading a receipt for 500 Birr adds 500 verifications to the group.

This screen also displays the group's current credit balance prominently, so the manager always knows where they stand before deciding to top up.

### 3. Manage

This screen is the control center for group managers. It has three functional areas:

**Group Overview.** The group name and current credit balance are shown at the top. Two buttons let the manager manually adjust the balance — useful for situations where they want to allocate a specific portion to a subset of the group, or correct an error.

**Member Management.** The manager sees a list of all people currently in the group, with their name and phone number. Each member can be removed with a single tap. Below the list is an "Add member" button — tapping it opens a field where the manager types a phone number. If that phone number belongs to a registered user, they are added to the group immediately. The newly added member can now use the Verify screen and their actions will deduct from this group's balance.

**Activity Dashboard (future).** The foundation is in place to show a log of recent verifications, who performed them, what the result was, and when. This gives managers visibility into how their credits are being used and whether any suspicious patterns exist.

---

## Data Architecture

The application stores six categories of information:

**Users.** Every registered person has a unique internal identifier, their phone number (which is unique across the system), their full name, their Telegram identifier for authentication, and the date they joined.

**Groups.** Every group has a name, an owner (linked to a user), a cached current credit balance, and a creation date. A user can own multiple groups. A user can be a member of multiple groups.

**Group Memberships.** This is the link between users and groups. Each membership record stores which group, which user, who added them, and when they joined. Removing someone from a group deletes this record.

**Transactions.** Every verification attempt creates a transaction record. It stores which group's credits were used, which staff member performed the verification, the image they submitted, the extracted bank name and transaction ID and amount, the final status (verified, rejected, duplicate, or failed), and a timestamp. The transaction ID extracted from the receipt is stored with a uniqueness constraint — the same transaction ID can never be verified as legitimate twice, across any group or user in the entire system.

**Credit Ledger.** Every change to a group's balance — whether from a top-up payment or a verification deduction — creates an entry in a running ledger. Each entry records the group, who triggered the change, the amount (positive for additions, negative for deductions), a human-readable note, and the timestamp. The group's displayed balance is always derived from the sum of all ledger entries. This means the full history of every credit movement is always recoverable, and the balance can never silently go wrong.

**Incoming Payments.** When a user submits a payment receipt on the Pay screen, a record is kept of that submission — the uploaded file, the extracted amount, the extracted transaction details, the verification status, and which group received the credit. This creates an audit trail of how credits entered the system.

---

## Fraud Prevention and Edge Cases

**Duplicate transaction blocking.** The transaction ID uniqueness constraint is system-wide and enforced at the database level, not just in application logic. If two people in two completely different groups try to verify the same transaction, the second one is rejected automatically.

**Amount and recipient matching.** For a verification to pass, the amount in the customer's receipt image must match the amount in the official bank record, and the recipient name must match the business's registered name. A receipt for the right amount paid to a different business is rejected.

**Balance gating.** If a group's credit balance reaches zero, the Verify screen shows a message and blocks new verifications until the balance is topped up. Staff members cannot accidentally run a group into negative credits.

**Image quality handling.** If the intelligent extraction layer cannot read the receipt clearly — due to blur, glare, or a partial image — it returns an "Unable to read" result rather than guessing. The staff member is prompted to try again with a clearer photo.

---

## Growth and Expansion Path

The flat group model means the application grows virally. A waiter who uses this application at their employer's restaurant understands exactly how it works. When they start their own business, they know instinctively to create a group and add their own staff. No tutorial needed.

Because every verification is logged with the group, user, bank, amount, and timestamp, the data layer also supports future analytics — most common banks used, peak verification hours, rejection rates by bank, low-balance alerts. These can be layered onto the Manage screen without any structural changes to the database.

The credit model is also flexible. A future iteration could introduce tiered pricing, credit expiry, automatic top-up thresholds, or invoiced billing for high-volume business accounts — all without changing the core verification flow.

---

## Summary

This application turns a three-second camera interaction into a trusted financial verification. It abstracts away the complexity of dealing with multiple Ethiopian banks, protects businesses from fraudulent or reused receipts, and gives business owners a clean tool to manage staff access and credit usage. It is designed to be fast enough to use at a busy checkout counter, simple enough that a new staff member needs no training, and robust enough that every transaction it handles leaves a permanent, auditable trace.


Here is a complete, detailed description of your application—covering its purpose, features, user interface, user flow, and underlying data structure—without mentioning a single piece of underlying technology.

---

### **1. Executive Summary & Core Concept**
The application is a seamless, embedded mini-app living inside a popular messaging platform. It is designed to solve two major problems for businesses (like restaurants and cafes) that accept digital money:
1. **Fraud Prevention:** Instantly verifying digital payment receipts to ensure they are real, not edited screenshots, and haven't been used before.
2. **Automated Accounting:** Tracking exactly how much money each staff member collected digitally during their shift, eliminating manual calculations at closing time.

The app operates on a **Prepaid Credit System** (1 verification = 1 credit). It uses a "flat hierarchy" workspace model where any user can top up their account, create a workspace, and invite others to share their credits.

---

### **2. Core Features & System Logic**

* **Intelligent Data Extraction:** When a user uploads a text message or a photo of a receipt, the system reads the content and identifies the Paid To Name, Total Amount, Transaction ID, and the official bank receipt link.
* **Background Source Verification:** The system automatically follows the extracted link, retrieves the official digital receipt directly from the bank's system, and reads the information there.
* **Cross-Matching & Fraud Check:** The system compares the customer's receipt against the official bank receipt. Most importantly, it checks the unique Transaction ID against the system's history to guarantee the receipt hasn't been scanned previously (preventing double-spending). 
* **Shared Wallet System:** Users can invite others to their "workspace." The person who created the workspace acts as the funder, buying credits and allocating a specific number of those credits to each invited member.
* **Automated Bookkeeping:** The system logs every verified transaction under the specific person who scanned it, providing real-time income summaries.

---

### **3. User Interface (UI) Design**
The visual design is ultra-minimalist, fast, and native to the messaging environment. It automatically adapts to the user's preferred light or dark mode settings. Navigation is anchored by a persistent **Bottom Tab Bar** featuring three main sections:

#### **Tab 1: Verify (The Default Screen)**
* **Layout:** Designed for instant action. The top displays the user's remaining available credits. The center is a large camera viewfinder. The bottom has a large "Capture" button and a smaller "Gallery" icon to upload forwarded receipts.
* **Interaction:** Upon taking a photo or selecting an image, a brief scanning animation occurs. 
* **Result Pop-up:** A smooth panel slides up showing the result:
  * **Success:** A massive Green Checkmark. Bold text showing the amount (e.g., **500 ETB**), the recipient's name, and the transaction number.
  * **Failure:** A massive Red Cross. A clear reason is provided (e.g., "Fake Receipt," "Amount Mismatch," or "Duplicate: Already Used Today at 12:30 PM").

#### **Tab 2: Pay (Top-Up Screen)**
* **Layout:** A trustworthy, financial dashboard feel. It boldly displays the workspace's master credit balance.
* **Interaction:** It provides clear instructions (e.g., "Send funds to phone number XXX"). Users enter the amount they paid and upload their proof of payment.
* **Result:** The screen shows a "Pending Approval" state. Once the administrator approves the payment, the user receives a success notification, and the master balance updates instantly.

#### **Tab 3: Manage (Dashboard & Team Settings)**
* **Layout:** Divided into two sections—Analytics and Team Management.
* **Analytics Section:** Features summary cards showing "Today's Verified Income" and "Total Scans." A dropdown allows the user to filter these stats by Today, This Week, or This Month.
* **Team Section:** A clean list of invited members. Each row shows the member's name, phone number, and their personal allocated credit limit.
* **Interaction:** Swiping or tapping on a member allows the workspace owner to increase their credit limit, decrease it, or remove them entirely. A persistent "Invite Member" button allows adding new staff via their phone number.

---

### **4. Step-by-Step User Flow**

**Phase 1: Onboarding & Account Creation**
1. A user opens the app inside the messaging platform.
2. The system securely requests their phone number for authentication.
3. The user enters their First Name and Father's Name.
4. Registration is complete, and they land on the "Verify" screen. By default, they have their own personal workspace with zero credits.

**Phase 2: Funding & Team Building**
1. The user goes to the "Pay" tab, sends actual money to the app provider, and uploads the proof.
2. Once approved, the user's master credit balance increases (e.g., 1000 credits).
3. The user goes to the "Manage" tab, enters their staff members' phone numbers, and allocates a portion of their master credits to each person (e.g., 100 credits per waiter).

**Phase 3: The Daily Work (Scanning)**
1. A customer pays for a meal.
2. The waiter opens the app, points the camera at the customer's phone screen, and taps capture.
3. The system processes the image, checks the bank's official record, ensures it is not a duplicate, and deducts 1 credit from the waiter's allocated limit (which also deducts from the master balance).
4. The waiter instantly sees the green success screen and lets the customer leave.

**Phase 4: End of Shift (Reconciliation)**
1. The business owner opens the "Manage" tab.
2. They view the dashboard and immediately see: Total Collected = 5,000 ETB. Waiter A collected 2,000 ETB, and Waiter B collected 3,000 ETB. No manual math or cross-checking is required.

---

### **5. Conceptual Data Structure**
To make all of these features work, the system organizes data into five interconnected categories:

**1. The User Profiles Table**
Stores individual information. Every person using the app—whether they are a business owner, a manager, or a waiter—has a profile here. It records their unique messaging app ID, phone number, full name, and the date they joined.

**2. The Workspaces Table**
The central hub for financial limits. Every workspace is created by a user. It tracks the name of the business or team and holds the absolute "Master Credit Balance" for that team.

**3. The Workspace Memberships Table**
The bridge between Users and Workspaces. If a user is invited to a workspace, a record is created here. It tracks who they were invited by and, most importantly, their individual "Allocated Credit Limit."

**4. The Verifications Table (The Core Ledger)**
This is where every scan is permanently recorded. It tracks which specific user made the scan, which workspace the scan belongs to, the total amount of the transaction, the recipient's name, and the status (Verified, Duplicate, or Failed). Crucially, it records the exact **Transaction ID** of the payment, which the system checks every single time a new scan happens to prevent fraud.

**5. The Top-Ups Table**
Tracks the money flowing into the application. It records which user requested a top-up, how much they paid, how many credits they asked for, and the status of the request (Pending, Approved, Rejected).