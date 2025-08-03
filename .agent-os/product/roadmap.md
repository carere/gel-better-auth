# Product Roadmap

> Last Updated: 2025-08-02
> Version: 1.0.0
> Status: In Development

## Phase 0: Already Completed

**Goal:** Initial adapter structure and schema generation
**Status:** ✅ Completed

### Features

- [x] Project setup with TypeScript, Bun, and development tooling
- [x] Initial test setup with Better Auth test suite
- [x] Schema generation from Better Auth table definitions to Gel schema 
- [x] Basic type mapping between Better Auth and Gel field types

## Phase 1: Core Adapter Implementation (2-3 weeks)

**Goal:** Complete all essential CRUD operations and achieve Better Auth compatibility
**Success Criteria:** Pass Better Auth test suite, support all core authentication flows

### Features

- [x] Create operation for inserting new records `M`
- [x] FindOne operation for querying single records with where clauses `M`
- [x] FindMany operation for querying multiple records `S`
- [ ] Update/UpdateMany operations for record modification `L`
- [x] Delete/DeleteMany operations for record removal `S`
- [ ] Count operation for record counting `S`

### Dependencies

- Better Auth ^1.2.12 compatibility
- Gel ^2.1.1 stable API
- TypeScript strict mode support

## Phase 2: Developer Experience & Optimization (1-2 weeks)

**Goal:** Enhance developer experience and optimize performance
**Success Criteria:** Comprehensive documentation, optimized queries, error handling

### Features

- [x] Refactor type mapping into reusable function (reduce repetition) `L`
- [ ] Add indexes to schema generation `M`
- [ ] Performance benchmarking suite `L`

### Dependencies

- Phase 1 completion
- Better Auth test suite validation
- Performance baseline establishment

## Phase 3: Production Readiness (1 week)

**Goal:** Prepare for production use and community adoption
**Success Criteria:** Production-ready package, comprehensive documentation, community support

### Features

- [ ] Full validation against Better Auth test suite `L`
- [ ] Usage examples and tutorials `M`
- [ ] README documentation for basic usage
- [ ] npm package publication `S`
- [ ] Community contribution guidelines `S`

### Dependencies

- Phase 2 completion
- Documentation review
- Legal/licensing review