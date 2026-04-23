# Stage 2 — Insighta Labs Profiles API

A NestJS REST API for Insighta Labs, a demographic intelligence company. The system stores 2026 profiles and exposes endpoints for advanced filtering, sorting, pagination, and natural language querying.

## Live URL

```
https://brightstage1task-production.up.railway.app
```

## GitHub Repository

```
https://github.com/bright5455/brightstage1task
```

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **HTTP Client:** Axios (`@nestjs/axios`)
- **Package Manager:** pnpm
- **Deployment:** Railway

---

## Database Schema

| Field | Type | Notes |
|-------|------|-------|
| id | UUID v7 | Primary key |
| name | VARCHAR UNIQUE | Person's full name |
| gender | VARCHAR | "male" or "female" |
| gender_probability | FLOAT | Confidence score |
| age | INT | Exact age |
| age_group | VARCHAR | child, teenager, adult, senior |
| country_id | VARCHAR(2) | ISO country code (NG, KE, etc.) |
| country_name | VARCHAR | Full country name |
| country_probability | FLOAT | Confidence score |
| created_at | TIMESTAMP | Auto-generated UTC |

---

## Endpoints

### 1. Create Profile

```
POST /api/profiles
```

**Request body:**
```json
{ "name": "ella" }
```

**Success — 201 Created:**
```json
{
  "status": "success",
  "data": {
    "id": "019d9b17-b5c8-7f39-bd93-0b0ad44ce94f",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "age": 46,
    "age_group": "adult",
    "country_id": "NG",
    "country_name": "Nigeria",
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

Supports filtering, sorting, and pagination in a single request.

**Supported filters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| gender | string | "male" or "female" (case-insensitive) |
| age_group | string | child, teenager, adult, senior (case-insensitive) |
| country_id | string | ISO code e.g. NG, KE (case-insensitive) |
| min_age | number | Minimum age (inclusive) |
| max_age | number | Maximum age (inclusive) |
| min_gender_probability | float | Minimum gender confidence score |
| min_country_probability | float | Minimum country confidence score |

**Sorting:**

| Parameter | Values |
|-----------|--------|
| sort_by | age, created_at, gender_probability |
| order | asc, desc |

**Pagination:**

| Parameter | Default | Max |
|-----------|---------|-----|
| page | 1 | — |
| limit | 10 | 50 |

**Example — combined request:**
```
GET /api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10
```

**Success — 200:**
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 2026,
  "data": [
    {
      "id": "019d9b17-b5c8-7f39-bd93-0b0ad44ce94f",
      "name": "emmanuel",
      "gender": "male",
      "gender_probability": 0.99,
      "age": 34,
      "age_group": "adult",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.85,
      "created_at": "2026-04-01T12:00:00Z"
    }
  ]
}
```

**Invalid sort_by value:**
```json
{ "status": "error", "message": "Invalid query parameters" }
```

---

### 3. Natural Language Search

```
GET /api/profiles/search?q={query}
```

Parses plain English queries and converts them into filters. Pagination (`page`, `limit`) applies here too.

**Example queries:**
```
GET /api/profiles/search?q=young males from nigeria
GET /api/profiles/search?q=females above 30
GET /api/profiles/search?q=adult males from kenya
GET /api/profiles/search?q=people from angola
GET /api/profiles/search?q=seniors from ghana
GET /api/profiles/search?q=teenagers below 18
GET /api/profiles/search?q=females between 20 and 40
GET /api/profiles/search?q=young males from nigeria&page=1&limit=5
```

**Success — 200:**
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 45,
  "data": [...]
}
```

**Uninterpretable query:**
```json
{ "status": "error", "message": "Unable to interpret query" }
```

**Missing query — 400:**
```json
{ "status": "error", "message": "Missing or empty query" }
```

---

### 4. Get Single Profile

```
GET /api/profiles/:id
```

**Success — 200:**
```json
{
  "status": "success",
  "data": {
    "id": "019d9b17-b5c8-7f39-bd93-0b0ad44ce94f",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.99,
    "age": 46,
    "age_group": "adult",
    "country_id": "NG",
    "country_name": "Nigeria",
    "country_probability": 0.85,
    "created_at": "2026-04-17T10:43:32.511Z"
  }
}
```

**Not found — 404:**
```json
{ "status": "error", "message": "Profile not found" }
```

---

### 5. Delete Profile

```
DELETE /api/profiles/:id
```

**Success — 204 No Content**

**Not found — 404:**
```json
{ "status": "error", "message": "Profile not found" }
```

---

## Error Responses

All errors follow this structure:

```json
{ "status": "error", "message": "<error message>" }
```

| Status | Reason |
|--------|--------|
| 400 | Missing or empty parameter |
| 422 | Invalid parameter type |
| 404 | Profile not found |
| 502 | External API returned an invalid response |

---

## Natural Language Parsing Approach

The `/api/profiles/search` endpoint uses a **rule-based parser** — no AI, no LLMs. It works by running a series of regex patterns against the lowercased query string and mapping matched keywords to database filters.

### How it works

1. The query string is lowercased and trimmed
2. Each regex pattern is tested against the string independently
3. Matched patterns populate a filters object
4. The filters object is passed directly to the same `findAll` logic used by `GET /api/profiles`
5. If no patterns match at all, the endpoint returns `"Unable to interpret query"`

### Supported keywords and their mappings

**Gender:**

| Keyword | Maps to |
|---------|---------|
| male, males | gender=male |
| female, females, women, woman, girls | gender=female |

**Age groups:**

| Keyword | Maps to |
|---------|---------|
| child, children, kids | age_group=child |
| teenager, teenagers, teen, teens | age_group=teenager |
| adult, adults | age_group=adult |
| senior, seniors, elderly, old | age_group=senior |

**Special age mapping:**

| Keyword | Maps to |
|---------|---------|
| young | min_age=16 + max_age=24 |

> Note: "young" is a parsing-only concept. It is not a stored age group in the database.

**Age range patterns:**

| Pattern | Example | Maps to |
|---------|---------|---------|
| above/over/older than N | above 30 | min_age=30 |
| below/under/younger than N | below 20 | max_age=20 |
| between N and M | between 20 and 40 | min_age=20 + max_age=40 |

**Country patterns:**

Detected via `from {country}`, `in {country}`, or `of {country}` followed by a supported country name.

| Country name | Maps to |
|-------------|---------|
| nigeria | NG |
| kenya | KE |
| ghana | GH |
| south africa | ZA |
| tanzania | TZ |
| ethiopia | ET |
| uganda | UG |
| rwanda | RW |
| cameroon | CM |
| senegal | SN |
| ivory coast / côte d'ivoire | CI |
| mali | ML |
| benin | BJ |
| dr congo | CD |
| angola | AO |
| mozambique | MZ |
| zambia | ZM |
| zimbabwe | ZW |
| sudan | SD |
| morocco | MA |
| tunisia | TN |
| egypt | EG |
| india | IN |
| brazil | BR |
| france | FR |
| australia | AU |
| japan | JP |
| germany | DE |
| canada | CA |
| united states / usa | US |
| united kingdom / uk | GB |
| gabon | GA |
| namibia | NA |
| malawi | MW |
| somalia | SO |
| eritrea | ER |
| gambia | GM |
| niger | NE |
| madagascar | MG |

### Example mappings

| Query | Parsed filters |
|-------|---------------|
| young males from nigeria | gender=male, min_age=16, max_age=24, country_id=NG |
| females above 30 | gender=female, min_age=30 |
| people from angola | country_id=AO |
| adult males from kenya | gender=male, age_group=adult, country_id=KE |
| male and female teenagers above 17 | age_group=teenager, min_age=17 |
| seniors from ghana | age_group=senior, country_id=GH |
| teenagers below 18 | age_group=teenager, max_age=18 |
| females between 20 and 40 | gender=female, min_age=20, max_age=40 |

---

## Limitations

**Country detection requires a preposition.** The parser looks for `from {country}`, `in {country}`, or `of {country}`. A query like `"nigeria males"` without a preposition will not detect the country — only the gender will be extracted.

**Only one gender at a time.** The parser detects the first gender keyword it finds. A query like `"males and females"` will only match `male`. Use `GET /api/profiles` directly for unfiltered gender results.

**"young" and age_group conflict.** If a query contains both `young` and an age group keyword (e.g. `"young adults"`), both filters are applied — `age_group=adult` and `min_age=16 + max_age=24` — which may return an empty result since "adult" starts at age 20 but "young" caps at 24.

**No support for bare country names.** `"nigeria"` alone without `from/in/of` will not be detected as a country filter.

**No support for age group + numeric age combinations as synonyms.** `"people aged 25"` is not supported — only `"above 25"`, `"below 25"`, or `"between 20 and 40"` patterns work.

**No fuzzy matching.** Typos like `"nigera"` or `"femal"` will not be matched. Queries must use correct spelling.

**Country names only in English.** Local language names like `"Naijeria"` or `"Ниге́рия"` are not supported.

**No support for compound nationality queries.** `"people from nigeria or kenya"` is not supported — only single country filtering per query.

---

## Data Seeding

The database is pre-seeded with 2026 profiles from a provided JSON file.

To re-run the seed (safe to run multiple times — skips existing records):

```bash
pnpm run seed
```

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
  seed/
    seed.ts
    profiles.json
  data-source.ts
  app.module.ts
  main.ts
```

---

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

# seed database
pnpm run seed

# production build
pnpm run build
pnpm run start:prod
```

---

## Deployment

Deployed on **Railway** with a managed PostgreSQL database.

Environment variables required:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (provided by Railway Postgres service) |
| `PORT` | Injected automatically by Railway | 