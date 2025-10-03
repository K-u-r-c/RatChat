RatChat — Learning-First Chat App

Overview

- Purpose: A learning-first, full-stack chat application focused on clean code, maintainability, and modern practices over raw feature velocity.
- Audience: Collaborators and friends exploring solid engineering habits together.
- Guiding Principle: Code quality over speed to maximize learning.

Project Goals & Mission

- Learning-first: Favor clarity, tests, and refactoring opportunities even when it’s slower.
- High standards: Keep a professional bar for readability, consistency, and correctness.
- Intentional architecture: Practice Clean Architecture and CQRS/Mediator patterns.
- Friendly collaboration: Keep PRs reviewable and educational; explain trade-offs.

Getting Started
Prerequisites

- .NET 9 SDK (`dotnet --version` should report 9.x)
- Node.js 20+ and npm
- Docker (for SQL Server + MinIO via docker-compose)

Quick Start (Development)

1. Start infrastructure services

- `docker-compose up -d`
  - SQL Server: localhost:1433, SA/Password@1
  - MinIO: Console http://localhost:9001 (minioadmin / minioadmin123), S3 API http://localhost:9000

2. Backend API (ASP.NET Core)

- Config: `API/appsettings.Development.json` includes default SQL + MinIO settings
- Run: `dotnet run --project API`
- Identity endpoints are mapped under `api/`. Dev seeding runs automatically.

3. Frontend (React + Vite)

- `cd client && npm install`
- Set API URL: create `client/.env.local` with `VITE_API_URL=https://localhost:5001`
  - Adjust to match the ASP.NET launch URL shown in the console
- Run dev server: `npm run dev` (Vite listens on https://localhost:3000)
  - On first run, Vite may prompt to trust a dev certificate (via mkcert)


4. Build for production (optional)

- `cd client && npm run build` outputs to `API/wwwroot`
- Serve SPA from the API: `dotnet run --project API`

Desktop App (Electron)

- `cd client`
- Install dependencies if you haven’t already: `npm install`
- Launch the desktop shell with live reload: `npm run electron:dev`
  - Starts Vite and spins up Electron once the dev server is responding.
  - Screen sharing defaults to include system audio on desktop; adjust under the screen share settings dialog.
- Build native installers after bundling the renderer: `npm run electron:package`
  - Outputs are written to `client/release/` for macOS (DMG/ZIP), Windows (NSIS/ZIP), and Linux (AppImage/DEB).
  - Use `npm run electron:build` to generate unpacked artifacts when iterating on distribution.

Usage Examples

- Create an account / login via the UI at https://localhost:3000
- Create or join chat rooms; send messages (text + media); Manage roles and permissions
- Direct chats between users
- Update profile and status; emoji preferences
- Real-time updates via SignalR hubs (`/messages`, `/friends`, `/direct-messages`, `/status`)

Project Structure

- `API/`: ASP.NET Core Web API + SPA hosting
  - Middleware, Controllers, SignalR hubs, Identity endpoints
- `Application/`: CQRS handlers, DTOs, validators, behaviors (MediatR + FluentValidation)
- `Domain/`: Entities, enums, domain events, core logic
- `Infrastructure/`: Services (e.g., storage, email, notifications, user accessor)
- `Persistance/`: EF Core DbContext, migrations, seeding
- `client/`: React 19 + Vite + TypeScript + MUI + React Query

Architecture Overview

- Clean Architecture layering
  - Domain: Enterprise logic and types
  - Application: Use cases (commands/queries), DTOs, validators, mapping
  - Infrastructure: Adapters (storage, email, notifications, security)
  - API: Web layer (controllers, SignalR, pipeline)
- MediatR for CQRS
  - Commands: state changes (e.g., SendMessage, JoinChatRoom)
  - Queries: read models (e.g., GetChatRoomList, GetDirectMessages)
- FluentValidation for input validation at the use-case boundary
- EF Core + SQL Server for persistence; MinIO (dev) / Azure Blob (prod) for media
- React + Vite frontend
  - React Query for server-state
  - MUI for UI components
  - Strict TypeScript config and ESLint rules

Contributing Guidelines

- Branching
  - Use feature branches: `feat/short-description`, `fix/area-bug`, `chore/tooling`
  - Keep PRs small and focused (ideally < 300 lines changed)
- Reviews
  - Explain rationale, alternatives considered, and trade-offs in PR description
  - Prefer comments that teach: link to docs or patterns when useful
- Commits
  - Meaningful messages; Conventional Commits encouraged (feat, fix, refactor, docs, chore)
- Tests
  - Add unit tests around business logic and validators when feasible
  - Prefer testing at the Application layer for use-cases
- Documentation
  - Update README and in-repo docs when behavior or workflows change

Code Standards & Best Practices
General

- Prefer clarity over cleverness; optimize for readers
- Keep functions small, with single responsibilities
- Fail fast; validate at edges using FluentValidation
- Add comments only for intent/trade-offs, not obvious code

Backend (C# / .NET)

- Language
  - Nullable enabled; avoid `!` unless justified
  - Naming: PascalCase for types/methods; camelCase for locals/fields (private fields `_camelCase`)
- Architecture
  - Put domain rules in Domain; avoid leaking infrastructure concerns upward
  - Use MediatR for commands/queries; keep handlers slim and focused
  - Validate DTOs with FluentValidation validators in Application layer
  - Map with AutoMapper profiles in `Application/Core/MappingProfiles.cs`
- Data
  - Use EF Core with clear configurations; keep migrations small and frequent
  - Avoid chatty queries; prefer projections to DTOs
- Observability & errors
  - Use centralized exception middleware; return meaningful problem details
  - Log at appropriate levels; avoid swallowing exceptions

Frontend (React / TypeScript)

- TypeScript
  - Keep `strict` true; prefer explicit types on public boundaries
  - Use Zod or typed DTOs for runtime/compile-time alignment when needed
- State & Data
  - React Query for server state; prefer optimistic updates when safe
  - Co-locate component state; avoid global state unless necessary
- Components
  - Keep components small and accessible (a11y via MUI where possible)
  - Reuse shared UI from `client/src/app/shared/components`
- Networking
  - All HTTP via `client/src/lib/api/agent.ts`
  - Handle errors consistently; show user-friendly toasts/navigation on 4xx/5xx

Configuration

- Development
  - API: `API/appsettings.Development.json` controls DB and MinIO
  - Client: `VITE_API_URL` must match API base (e.g., https://localhost:5001)
- Production
  - Storage: Azure Blob via `AzureStorage` connection string
  - Build SPA into `API/wwwroot` and serve from API
  - Set `Resend:ApiToken` for email features if used

Learning Resources

- Clean Architecture (concept): https://8thlight.com/insights/clean-architecture
- MediatR (CQRS for .NET): https://github.com/jbogard/MediatR
- FluentValidation: https://docs.fluentvalidation.net/
- EF Core: https://learn.microsoft.com/ef/core/
- ASP.NET Core: https://learn.microsoft.com/aspnet/core
- SignalR: https://learn.microsoft.com/aspnet/core/signalr
- React + Vite: https://vitejs.dev/guide/ and https://react.dev/
- React Query: https://tanstack.com/query/latest
- MUI: https://mui.com/

License

- This is a learning-first project for collaborators and friends. Unless a license is added, all rights are reserved. If you want to reuse code, please contact the maintainers first.

Contact / Maintainers

- Please open an issue or discussion in the repository to reach the maintainers.
- Add maintainer details here (name, preferred contact) as collaborators join.

Notes

- Prioritize code quality and learning over speed
- Small, reviewable changes win
- Prefer refactoring and tests to keep the codebase welcoming

Message Encryption (at rest)

- Messages are encrypted at rest using AES-256-GCM via an EF Core value converter.
- Encrypted fields:
  - `Domain/Message.cs: Body`
  - `Domain/DirectMessage.cs: Body`
- Configure a 256-bit key via environment variable before starting the API:
  - Variable: `MESSAGE_ENCRYPTION_KEY`
  - Provide 32 bytes as Base64 or Hex (e.g., `0x...`).
- Generate a random key (PowerShell):
  - `$bytes = New-Object 'Byte[]' 32; [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes); [Convert]::ToBase64String($bytes)`
  - Persist for your user session: `setx MESSAGE_ENCRYPTION_KEY <Base64Key>` (restart shell)
- Behavior & migration notes:
  - New/updated records are stored encrypted with prefix `enc:v1:`.
  - Existing plaintext rows are read as-is and remain until modified.
  - For backfill, run a one-time job that reads and re-saves messages to trigger encryption.
