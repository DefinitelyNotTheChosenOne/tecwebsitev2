# 🏛️ TutorMatch: Feature Audit & Roadmap

This document serves as the "High Command" audit of the platform's features, cross-referenced against the core UVP.

---

## 🟢 COMPLETED (Production Ready)
- [x] **Cinematic Design System**: Premium, high-density dark mode UI with glassmorphic elements.
- [x] **Identity & Auth**: Next.js App Router auth with `full_name` metadata and Role-Based access control (`seller`, `admin`, `user`).
- [x] **Role-Aware Dashboards**:
  - **Admin**: Moderation Queue, Escrow Action Center, User Registry.
  - **Tutor (Seller)**: Revenue Intel, Portfolio Controller, Available Bids feed.
  - **Student (User)**: Mentor tracking, Study history portal.
- [x] **Public Portfolio View**: Cinematic specialist dossiers for tutors to audit their brand.
- [x] **Live Marketplace Feed**: Real-time `/help-wanted` feed synchronized with the database.
- [x] **PHP Localization**: System-wide use of the Philippine Peso (₱) symbol.
- [x] **Moderation Intelligence**: PII scanning (WhatsApp/PayPal) on profile bios.

## 🟡 IN PROGRESS (Technical Active)
- [ ] **Bidding Terminal (`/help-wanted/[id]`)**: Detailed view for requests where sellers can submit their ₱ proposal.
- [ ] **Profile Controller**: Tutor editor for updating bio, skills, and PHP rates.
- [ ] **Bidding & Offers**: The active negotiation loop between student and tutor.

## 🔴 PENDING (Future Deployment)
- [ ] **P2P Chat Tunnel**: Real-time messaging between matched users before payment.
- [ ] **Escrow Payment Trigger**: student-side "Hire" button that locks funds in the Admin action center.
- [ ] **Educational Blog (Mini-lessons)**: CMS for tutors to publish knowledge and attract clients.
- [ ] **Rating System**: Post-session feedback loop to calculate average tutor ratings.
- [ ] **Priority/Verified Badges**: Premium monetization features.

---

## 🚀 Priority Sequence
1. **The Bid Proposal**: Building the interface for tutors to reply to a help request.
2. **The Chat Bridge**: Enabling direct communication.
3. **The Escrow Acceptance**: Finishing the financial loop.

> [!NOTE]
> Database has been purged of redundant tables. Adhere strictly to the `chat_rooms`, `bids`, and `moderation_queue` architecture.
