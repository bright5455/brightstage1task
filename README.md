# Stage 1 — Profiles API

A NestJS REST API that accepts a name, calls three external APIs (Genderize, Agify, Nationalize), applies classification logic, stores the result in a PostgreSQL database, and exposes endpoints to manage that data.

## Live URL

```
https://brightstage1task-production.up.railway.app
```

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **HTTP Client:** Axios (`@nestjs/axios`)
- **Package Manager:** pnpm
- **Deployment:** Railway

## External APIs Used

| API | URL | Purpose |
|-----|-----|---------|
| Genderize | https://api.genderize.io | Gender prediction |
| Agify | https://api.agify.io | Age prediction |
| Nationalize | https://api.nationalize.io | Nationality prediction |

## Classification Logic

**Age group** (from Agify):
| Age Range | Group |
|-----------|-------|
| 0 – 12 | child |
| 13 – 19 | teenager |
| 20 – 59 | adult |
| 60+ | senior |

**Nationality** — the country with the highest probability from the Nationalize response is selected.

## Endpoints

### 1. Create Profile

```
POST /api/profiles
```

**Request body:**
```json
{ "name": "ella" }
```

**Success Response — 201 Created:**
```json
{
  "status": "success",
  "data": {
    "id": "019d9b17-b5c8-7f39-bd93-0b0ad44ce94f",
    "name": "emem",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.085,
    "created_at": "2026-04-17T10:43:32.511Z"
  }
}
```

**If name already exists — 200:**
```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { ...existing profile... }
}
```

---

### 2. Get All Profiles

```
GET /api/profiles
```

**Optional query parameters** (all case-insensitive):

| Parameter | Example |
|-----------|---------|
| gender | ?gender=male |
| country_id | ?country_id=NG |
| age_group | ?age_group=adult |

**Example:**
```
GET /api/profiles?gender=male&country_id=NG
```

**Success Response — 200:**
```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": "id-1",
      "name": "christian",
      "gender": "male",
      "age": 46,
      "age_group": "adult",
      "country_id": "NG"
    }
  ]
}
```

---

### 3. Get Single Profile

```
GET /api/profiles/:id
```

**Success Response — 200:**
```json
{
  "status": "success",
  "data": {
    "id": "019d9b17-b5c8-7f39-bd93-0b0ad44ce94f",
    "name": "christian",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "NG",
    "country_probability": 0.85,
    "created_at": "2026-04-17T10:43:32.511Z"
  }
}
```

---

### 4. Delete Profile

```
DELETE /api/profiles/:id
```

**Success Response — 204 No Content**

---

## Error Responses

All errors follow this structure:

```json
{ "status": "error", "message": "<error message>" }
```

| Status | Reason |
|--------|--------|
| 400 | Missing or empty name |
| 422 | name is not a string |
| 404 | Profile not found |
| 502 | External API returned an invalid response |

**502 edge cases:**

| Condition | Message |
|-----------|---------|
| Genderize returns gender: null or count: 0 | `Genderize returned an invalid response` |
| Agify returns age: null | `Agify returned an invalid response` |
| Nationalize returns no country data | `Nationalize returned an invalid response` |

---

## Project Structure

```
src/
  profiles/
    dto/
      create-profile.dto.ts
    entity/
      profile.entity.ts
    profiles.controller.ts
    profiles.service.ts
    profiles.module.ts
  app.module.ts
  main.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/brightstage1task"
```

### Running Locally

```bash
# development
pnpm run start:dev

# production
pnpm run build
pnpm run start:prod
```

### Testing Endpoints

```bash
# Create profile
curl -X POST https://brightstage1task-production.up.railway.app/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "christian"}'

# Get all profiles
curl https://brightstage1task-production.up.railway.app/api/profiles

# Get with filters
curl "https://brightstage1task-production.up.railway.app/api/profiles?gender=male"

# Get single profile
curl https://brightstage1task-production.up.railway.app/api/profiles/{id}

# Delete profile
curl -X DELETE https://brightstage1task-production.up.railway.app/api/profiles/{id}
```

## Deployment

Deployed on **Railway** with a managed PostgreSQL database.

Environment variables required on Railway:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (provided by Railway Postgres service) |
| `PORT` | Injected automatically by Railway |