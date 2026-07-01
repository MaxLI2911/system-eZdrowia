# eHealth System (eZdrowie)

A comprehensive web application integrated with a relational database designed to handle core administrative and medical processes within a clinic or a network of healthcare facilities.

## Project Overview

The main objective of this project is the design and implementation of a robust relational database coupled with a modern web platform to streamline daily medical operations, improve patient management, and digitize clinical workflows.

### Key Features

- **User Management:** Registration and comprehensive data management for both patients and doctors.
- **Appointment Scheduling:** Booking and managing both in-person (stationary) visits and remote consultations (telehealth).
- **Electronic Health Records (EHR):** Digital maintenance of medical documentation, including e-prescriptions, e-referrals, and detailed patient treatment histories.
- **Billing & Payments:** Secure processing and management of payments for medical appointments and consultations.
- **Services Management:** Administration of various medical services provided during healthcare visits.

## Tech Stack & Architecture

- **Frontend & Backend Framework:** Next.js (React, Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM & Database Tooling:** Drizzle ORM
- **Mock Data Generation:** Faker.js & `drizzle-seed` for seeding development data
- **Containerization & Deployment:** Docker & [Docker Compose (PostgreSQL running as a Docker Compose service)
- **Configuration:** Environment variables managed via a `.env` file
- **Geting started** `cd app; docker compose up -d; npm i; cp .env.example .env; npm run db:setup; npm run seed; npm run dev`
