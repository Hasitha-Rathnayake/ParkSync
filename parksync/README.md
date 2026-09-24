# ParkSync

Web-Based Automated Parking Reservation and Management System
SE2030 – Software Engineering | BSc (Hons) in Information Technology

## What's in this folder

```
parksync/
├── backend/     Spring Boot REST API (Java 17, Maven)
└── frontend/    React app (Vite)
```

Each of the 6 major functions lives in its own backend package and has a
matching frontend page + API file:

| Member | Function | Backend package | Frontend page |
|---|---|---|---|
| 1 | Slot Search & Reservation | `com.parksync.reservation` | `ReservationPage.jsx` |
| 2 | Parking Lot & Slot Management | `com.parksync.parkinglot` | `ParkingLotAdminPage.jsx` |
| 3 | Vehicle Check-in / Check-out | `com.parksync.ticket` | `TicketPage.jsx` |
| 4 | Billing & Payment | `com.parksync.payment` | `PaymentPage.jsx` |
| 5 | Dynamic Pricing & Discounts | `com.parksync.pricing` | `PricingPage.jsx` |
| 6 | Notifications & Reviews | `com.parksync.notification` | `NotificationReviewPage.jsx` |
| — | User accounts (minor function) | `com.parksync.common` | `LoginPage.jsx`, `RegisterPage.jsx`, `ManageStaffPage.jsx` |
| — | Saved vehicles (profile feature) | `com.parksync.vehicle` | `MyVehiclesPage.jsx` |

## Prerequisites

- JDK 17+
- Node.js 18+
- MySQL (via XAMPP or MySQL Workbench)
- Maven (or just use your IDE's built-in Maven support)

## Running the backend

1. Create a MySQL database — the app will auto-create it on first run
   because of `createDatabaseIfNotExist=true` in `application.properties`,
   but MySQL itself must already be running.
2. Open `backend/` in IntelliJ IDEA (or any IDE with Maven support). It
   will download dependencies from Maven Central automatically.
3. Check `src/main/resources/application.properties` — update the
   username/password if your local MySQL isn't the default `root` / blank.
4. Run `ParkSyncApplication.java`. The API starts on `http://localhost:8080`.
5. Tables are created automatically from the entity classes
   (`spring.jpa.hibernate.ddl-auto=update`).

## Running the frontend

```
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. It's already configured (via CORS on the
backend) to talk to `http://localhost:8080`.

## What's implemented vs. what's left

**Already working (real logic, not just stubs):**
- Full CRUD for all 6 modules, plus a Member for the User module (registration/login/profile — minor function)
- Buffer-time double-booking prevention (Member 1)
- Overstay detection on checkout (Member 3)
- Pay-at-booking, tiered cancellation refund, overstay penalty billing (Member 4)
- Peak/base rate resolution, discount codes, cancellation/overstay rules (Member 5)
- Scheduled reminder notification ~15 min before booking end (Member 6, via `@Scheduled`)
- Average rating calculation, spam-flagging for reviews (Member 6)
- **Input validation on every entity** (`jakarta.validation` annotations — required fields,
  email format, min/max ranges, string length limits) enforced automatically via `@Valid`
  on every controller endpoint that accepts a request body
- **Business-rule validation** beyond what annotations can check — e.g. start time before
  end time, no booking in the past, no double-charging a reservation, no duplicate active
  ticket per vehicle, peak start hour before peak end hour, no duplicate review per booking
- **Global exception handler** (`GlobalExceptionHandler.java`) — turns every validation
  failure or business-rule violation into a clean JSON error response (with field-level
  messages) instead of a raw stack trace
- **Password hashing** via BCrypt for the User module (Spring Security is included only
  for this — the API itself is left open/`permitAll` since full session/JWT auth wasn't
  in scope for this phase)
- **Login and Register pages** on the frontend, fully wired to the backend. **Public
  registration only creates Customer accounts** (by design — see below); the navbar
  adapts based on the logged-in user's role.
- **Seeded demo accounts** for Attendant / Lot Admin / System Admin — these roles are
  intentionally NOT self-registerable through the public sign-up form (a real system
  wouldn't let anyone sign up as an admin). On first backend startup, one demo account
  per privileged role is auto-created:

  | Role | Email | Password |
  |---|---|---|
  | Attendant | `attendant@parksync.demo` | `ParkSync123` |
  | Lot Admin | `lotadmin@parksync.demo` | `ParkSync123` |
  | System Admin | `sysadmin@parksync.demo` | `ParkSync123` |

  These also print to the backend console on every startup as a reminder. Log in with
  these to test/demo the admin-only views (Lots, Pricing, Tickets).
- **Manage Staff page** (System Admin only, `/staff`) — lets a logged-in System Admin
  create new Attendant or Lot Admin accounts, and remove existing ones. System Admin
  accounts themselves can't be created or removed here (only via the seeder), to avoid
  accidentally locking everyone out.
- **Reservations now require a real payment window, not instant confirmation.**
  A new booking starts as `PENDING_PAYMENT` (not `CONFIRMED`) with a 15-minute
  deadline — the same "temporary hold" pattern flight/event-ticket sites use.
  A new scheduled job (`ReservationExpiryScheduler`, same `@Scheduled` pattern as
  the reminder notification) checks every minute for bookings still unpaid past
  their deadline and auto-cancels them, freeing the slot. The overlap/buffer check
  now also blocks against other still-pending bookings, so two people can't both
  "hold" the same slot while one is mid-payment. Paying successfully flips the
  reservation to `CONFIRMED`; the booking form now hands off straight to the
  Payments page instead of leaving that as a disconnected manual step.
- **Vehicle selection is now part of booking.** A reservation requires picking one
  of your saved vehicles (`My Vehicles` module) — ownership is verified server-side,
  so you can't book using someone else's vehicle. Closes the gap where Vehicle
  existed as an entity but was never actually connected to a booking.
- **Pending-payment reminders on the Payments page** — a customer sees any
  reservations still awaiting payment with a live countdown and a one-click
  "Pay Now" button that pre-fills the payment form.
- **Redesigned landing page** with real photography, live platform stats, and a
  services section:
  - **Real photos** (hero + 3 service images) sourced from Pexels — free to use
    commercially, no attribution required. Hotlinked directly, so nothing needed
    to be bundled into the project.
  - **Live stats bar** — Total Lots, Total Slots, Reservations Made, and
    Registered Drivers are pulled live from the database via a new
    `GET /api/stats/public` endpoint (`PublicStatsController`), not hardcoded
    numbers. Genuinely reflects your data every time the page loads.
  - **"Our Services" section** — three image + text panels explaining the core
    value proposition, sitting between the hero and the functional feature grid.
  - **Visual polish pass** — added a consistent shadow/elevation system
    (`--shadow-xs/sm/md/lg` in `index.css`) used across cards, buttons, and the
    nav instead of one-off shadow values, plus tighter letter-spacing on
    headings and a small accent tick mark on section labels. Same color palette
    as before, just more refined.
- **Reservation editing and cancellation, fully wired up.** A customer can now
  edit or cancel their own reservation from the "Your Reservations" list:
  - **Edit** is allowed both before and after payment. It re-runs the same
    overlap/buffer check used at booking (you can't edit into a collision with
    someone else's reservation), and if the booking was already paid, the price
    is **automatically recalculated** — the difference is charged or refunded.
  - **Cancel before payment** is free and instant (no money changed hands yet).
  - **Cancel after payment** automatically triggers the tiered refund logic that
    already existed in `PricingRule` but was never wired to anything: full refund
    if cancelled well ahead of the start time, a percentage fee deducted if
    cancelled close to it.
- **Pricing Rule ID removed from the customer entirely.** Payment now resolves
  the correct pricing rule automatically from the reservation's parking lot —
  a customer never sees or enters a "Pricing Rule ID". `Payment` now remembers
  which rule and discount code were used, so later edits/cancellations reuse it
  automatically too. The System Admin's Pricing page also switched from a raw
  Lot ID field to the same searchable lot picker used elsewhere.
- **Search-as-you-type lookups** — Reservation Oversight (search by lot name or
  customer name/email) and Review Moderation (search by lot name) now use a
  reusable `SearchableSelect` component instead of raw numeric ID fields. Type a
  few letters, click a match — no more memorizing database IDs. Filtering happens
  client-side against the already-fetched lot/customer lists, so it's instant with
  no extra network calls per keystroke.
- **Fixed a real bug: infinite JSON loop crashing Reservation lookups.** `ParkingSlot`
  pointed back to its `ParkingLot`, which held the full list of slots — including
  that same slot again — creating an endless loop every time a `Reservation` (which
  embeds a `ParkingSlot`) was converted to JSON. This silently broke Reservation
  Oversight (and technically every reservation-returning endpoint) with a server
  error. Fixed with `@JsonIgnore` on `ParkingSlot.parkingLot`, since the frontend
  never actually needed that field directly.
- **Full slot management UI** (Lots page) — a Lot Admin can now actually add lots by
  location/size, add slots with a unique slot ID per lot (duplicate codes rejected),
  change a slot's status (Available / Occupied / Maintenance) with one click, remove
  individual slots, remove a whole lot, and see live occupancy % per lot — all from
  the UI, not just the backend.
- **Slot status now syncs automatically with real usage** — checking a vehicle in
  marks its slot OCCUPIED, checking out (or voiding a ticket) marks it AVAILABLE
  again (unless an admin has since flagged it under MAINTENANCE). Previously slot
  status only changed if an admin manually edited it, so "booked or free" didn't
  reflect what was actually happening at the gate. Every check-in (walk-in or
  reservation-based) now requires picking a real slot for exactly this reason.
- **Payments and Pricing are now System Admin only** — Lot Admin no longer sees
  either in the nav, home page, or has any billing/rate-setting access. A Lot
  Admin's scope is the physical lot: slots, occupancy, and (still) reservation
  oversight and review moderation for their lot.
- **Reservation Oversight** (`/reservations`, Lot Admin / System Admin) — same route
  as the customer booking page, but shows a completely different view: look up all
  bookings for a specific lot, or all bookings for a specific customer (support/dispute
  lookups). Closes the same kind of gap the Payments admin lookup closed earlier.
- **Saved vehicles** (`/vehicles`, Customer accounts only) — a customer can add, view,
  and remove their own vehicles from their profile.
- **Visual theme** — a light, warm design inspired by Airbnb: coral/rausch (#FF385C)
  accent, pill-shaped buttons, rounded 16-18px cards with soft shadows, and the
  Poppins/Nunito Sans font pairing. Update `src/index.css` (CSS variables) and
  `src/App.css` if you want to adjust colors or spacing further — every page uses
  the same shared classes, so a change there applies everywhere at once.
- **Landing page now splits consumer vs. operator features**, matching how sites
  like Airbnb keep "guest" and "host" content separate. The main feature grid only
  shows customer-facing things (Find & Reserve, My Vehicles, Billing, Reviews); a
  visually distinct "For Parking Operators & Staff" banner further down links out
  to Lots / Pricing / Tickets instead of mixing them into the primary grid.
  page's feature cards read from the same set of role-check functions, so what a role
  can see stays consistent everywhere in the UI rather than being redefined in multiple
  places and drifting out of sync.
- **A proper self-service vs. admin split**, matching how real platforms (Amazon,
  Uber, Airbnb) separate "my own data" from "admin oversight tools":
  - **Reservations** — booking a slot is Customer-only now (staff don't book for
    themselves through the same form); the user ID field was removed and replaced
    with the logged-in user's own ID, closing a spot where anyone could book under
    any arbitrary user ID.
  - **Payments** — this was a real privacy gap before: any logged-in user could type
    a different User ID and view a stranger's payment history. Now a Customer
    automatically sees only their own history (no free-text ID field); Lot Admin /
    System Admin get a separate lookup tool to check any customer's history for
    support/oversight purposes.
  - **Notifications & Reviews** — split into two different views on the same route:
    a Customer sees their own notifications and a "submit a review" form; a Lot
    Admin / System Admin instead see a review-moderation tool (aggregated rating,
    respond to reviews) for a given lot. Attendants don't need this page at all.

**Left as a TODO for your team to build out further:**
- **Real backend-enforced authorization** — Login/Register pages now exist and work
  (calling the real, validated backend endpoints, with hashed passwords), and the
  navbar hides irrelevant links based on the logged-in user's role. **This role-based
  hiding is UI-only** — every backend endpoint is still open (`permitAll`), so a
  determined user could still call `/api/lots` directly without being a Lot Admin.
  Real protection needs JWT or session-based auth on the backend, which was
  intentionally scoped out as a "harder" stretch feature (see Section 8.1 discussion).
  Worth mentioning honestly in your viva if asked.
- Polished UI/styling — current pages are functional but plain; add your
  own CSS or a component library (MUI, Tailwind, etc.)
- Frontend-side validation error display (backend already returns clean field
  errors — the frontend just needs to show them nicely)
- QR code generation for tickets (optional polish idea)
- **Saved vehicles aren't yet linked to check-in** — "My Vehicles" (profile feature)
  and Ticket check-in (Member 3) are both built, but the check-in form still takes
  a typed plate number rather than letting the attendant pick from the customer's
  saved vehicles. A natural next step, not yet wired up.
- Deployment config (not needed for local demo/viva)

## Git workflow suggestion

- One repo, `main` branch stays stable
- Each member works on their own branch: `feature/reservation`,
  `feature/parkinglot`, `feature/ticket`, `feature/payment`,
  `feature/pricing`, `feature/notification`
- Merge via pull requests once a module's basic CRUD works end-to-end
- Since each module is in its own package/file, merge conflicts should be rare

## Test the connection

With both servers running, visit `http://localhost:5173` — you should see
the nav bar with all 6 module links. Try adding a parking lot on the
"Lots (M2)" page first — most other modules need at least one lot/slot to
reference.
