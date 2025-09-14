# Copilot Instructions for RatChat

## Project Overview
- **RatChat** is a full-stack chat app built for learning, with a focus on clean code, maintainability, and modern engineering practices.
- Architecture follows **Clean Architecture** and **CQRS/Mediator** patterns.
- Backend: ASP.NET Core (API/), Application (CQRS, MediatR, FluentValidation), Domain (entities/events), Infrastructure (services), Persistance (EF Core, migrations).
- Frontend: React 19 + Vite + TypeScript + MUI + React Query (client/).

## Key Workflows
- **Start Dev Environment:**
  - `docker-compose up -d` (SQL Server, MinIO)
  - `dotnet run --project API` (backend)
  - `cd client && npm install && npm run dev` (frontend)
- **Build for Production:**
  - `cd client && npm run build` (outputs to API/wwwroot)
  - Serve SPA: `dotnet run --project API`
- **Config:**
  - API: `API/appsettings.Development.json` (DB, MinIO)
  - Client: `.env.local` with `VITE_API_URL`

## Architectural Patterns
- **CQRS via MediatR:**
  - Commands = state changes (e.g., SendMessage)
  - Queries = read models (e.g., GetChatRoomList)
  - Handlers in `Application/`
- **Validation:**
  - Use FluentValidation for DTOs in Application layer
- **Mapping:**
  - Use AutoMapper profiles in `Application/Core/MappingProfiles.cs`
- **SignalR:**
  - Real-time updates via hubs in `API/SignalR/`
- **Error Handling:**
  - Centralized in `API/Middleware/ExceptionMiddleware.cs`

## Conventions & Patterns
- **Branching:** `feat/`, `fix/`, `chore/` prefixes
- **Commits:** Conventional Commits encouraged
- **Testing:**
  - Unit tests around business logic/validators (Application layer preferred)
- **Naming:**
  - PascalCase for types/methods, camelCase for locals/fields, private fields `_camelCase`
- **Frontend:**
  - All HTTP via `client/src/lib/api/agent.ts`
  - Shared UI in `client/src/app/shared/components`
  - Strict TypeScript config

## Integration Points
- **SQL Server:** via EF Core (Persistance/)
- **MinIO/Azure Blob:** for media storage
- **Email:** via Resend API (optional)

## Examples
- Add a CQRS handler: place in `Application/ChatRooms/Commands/` or `Queries/`, validate with FluentValidation, map with AutoMapper.
- Add a SignalR hub: place in `API/SignalR/`, register routes in API startup.
- Add a React component: place in `client/src/app/shared/components` if reusable.

## References
- See `README.md` for full setup, architecture, and conventions.
- Key files: `API/Program.cs`, `API/Middleware/ExceptionMiddleware.cs`, `Application/Core/MappingProfiles.cs`, `client/src/lib/api/agent.ts`

---

**If any section is unclear or missing, please provide feedback to improve these instructions.**
