# ParkSync

![Java](https://img.shields.io/badge/Java-17-orange)
![React](https://img.shields.io/badge/React-Vite-61DAFB)
![MySQL](https://img.shields.io/badge/MySQL-8-blue)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-black)
![Railway](https://img.shields.io/badge/Backend-Railway-purple)

**Web-Based Automated Parking Reservation and Management System**  
SE2030 Group Project · **26-MTR-SE2030-08**

ParkSync lets drivers search parking lots, reserve slots, pay online, and check in digitally.  
Lot admins manage slots, pricing rules, special packages, and day-to-day operations.

---

## Live demo

| Layer | URL |
|--------|-----|
| Frontend | https://park-sync-gold.vercel.app |
| Backend API | https://parksync-production.up.railway.app/api |

### Demo accounts

| Role | Email | Password |
|------|--------|----------|
| Lot Admin | `lotadmin@parksync.demo` | `ParkSync123` |
| Attendant | `attendant@parksync.demo` | `ParkSync123` |
| Customer | Register on the site | your password |

*(Update emails/passwords if your seeder uses different values.)*

---

## Features

- Role-based access: Customer, Lot Admin, Attendant, System Admin
- Parking lots and auto-named slots (`LOTNAME-01` pattern)
- Search, reserve, and change time/slot
- Dynamic pricing (normal / peak) and special packages
- Demo card payment flow (no real payment gateway)
- Digital tickets with check-in / check-out
- Lot photos and package images
- Notifications (unread count, delete, newest first)
- Public Offers page for active packages
- Live public stats on the landing page

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | React + Vite |
| Backend | Spring Boot 3, Java 17, JPA/Hibernate |
| Database | MySQL 8 |
| Deploy | Vercel (frontend), Railway (backend) |

---

## Project structure

```text
parksync/
  frontend/     # React (Vite)
  backend/      # Spring Boot API
docs/
  screenshots/  # README images
