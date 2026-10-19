# ParkSync

**Web-Based Automated Parking Reservation and Management System**  
SE2030 Group Project · `26-MTR-SE2030-08`

ParkSync lets drivers search lots, reserve slots, pay online, and check in digitally.  
Lot admins manage slots, pricing, special packages, and staff operations.

---

## Live demo

| Layer | URL |
|--------|-----|
| **Frontend** | https://park-sync-gold.vercel.app |
| **Backend API** | https://parksync-production.up.railway.app/api |

> If URLs change, update this table.

### Demo accounts

| Role | Email | Password |
|------|--------|----------|
| Customer | *(register a new account)* | — |
| Lot Admin | `lotadmin@parksync.demo` | `ParkSync123` |
| Attendant | `attendant@parksync.demo` | `ParkSync123` |
| System Admin | *(as seeded in your DB)* | — |

*(Adjust emails/passwords to match your seeder.)*

---

## Features

- Role-based access: **Customer**, **Lot Admin**, **Attendant**, **System Admin**
- Parking lots & auto-named slots (`LOTNAME-01` pattern)
- Slot search, reservation, change time/slot
- Dynamic pricing (normal / peak) + special packages (festival, weekend, seasonal)
- Online payment flow (demo card validation, no real gateway)
- Digital tickets / check-in & check-out
- Lot photos (up to 5) and package promo images
- Notifications (unread badge, delete, latest first)
- Public **Offers** page for active packages
- Live public stats on the landing page

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | React + Vite |
| Backend | Spring Boot 3 (Java 17), JPA/Hibernate |
| Database | MySQL 8 |
| Auth (demo) | Session-style `X-User-Id` header after login |
| Deploy | **Vercel** (frontend) · **Railway** (backend) |

---

## Project structure

```text
parksync/
  frontend/     # React (Vite)
  backend/      # Spring Boot
uploads/        # Local/dev uploaded images (optional in repo)
