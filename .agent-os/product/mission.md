# Product Mission

> Last Updated: 2025-08-02
> Version: 1.0.0

## Pitch

Gel Better Auth is a database adapter library that allows developers to use Gel/EdgeDB as the database backend for Better Auth authentication systems by providing seamless type-safe integration and full access to Better Auth's feature set.

## Users

### Primary Customers

- **TypeScript Developers**: Full-stack developers building modern web applications who prefer type safety and developer experience
- **Gel Enthusiasts**: Developers who want to leverage Gel's powerful features while using full-featured authentication libraries

### User Personas

**Full-Stack TypeScript Developer**
- **Role:** Junior/Senior/Lead Developer
- **Context:** Building modern web applications with strong type safety requirements
- **Pain Points:** Limited authentication features from Gel Auth, have to implement authentication's internal manually
- **Goals:** Rapid development with type safety, seamless integration between better-auth and Gel, reduced boilerplate code

**Gel Early Adopter**
- **Role:** Technical Lead/Architect
- **Context:** Teams exploring Gel for new projects but need mature authentication solutions in Typescript
- **Pain Points:** Better Auth doesn't natively support Gel, Gel Auth is not full-featured, risk of waste of time while implementing the solution
- **Goals:** Leverage Gel's advanced features while using battle-tested authentication system, maintain code quality and developer productivity

## The Problem

### Limited Database Adapter Ecosystem

Better Auth provides excellent authentication functionality but has limited support for modern databases like Gel. Developers who want to use Gel must either build custom adapters from scratch or use suboptimal database choices.

**Our Solution:** A production-ready adapter that bridges Better Auth and Gel with full type safety and automatic schema generation.

### Complex Manual Integration

Setting up authentication with EdgeDB requires implementing well-known authentication's patterns. This increases development time and introduces potential for errors.

**Our Solution:** Automated schema generation and type-safe operations that eliminate manual mapping and reduce integration time from days to minutes.

## Differentiators

### Gel Schema features

Unlike other Gel adapters, we provide automatic schema generation with supports for indexes, constraints, and ScalarTypes from Better Auth table definitions to Gel schema.

## Key Features

### Core Features

- **Automatic Schema Generation:** Converts Better Auth table definitions to Gel schema automatically with supports for indexes, constraints, and ScalarTypes.
- **CRUD Operations:** Full support for create, read, update, delete, findOne, findMany and count operations.

### Developer Experience Features

- **Zero Configuration:** Works out of the box with sensible defaults
- **Comprehensive Type Mapping:** Handles all Better Auth field types with proper Gel equivalents
- **Intelligent Error Handling:** Clear error messages with actionable debugging information
- **Development Tooling:** Built-in test suite with Better Auth test suite

### Performance Features

- **Optimized Queries:** Leverages Gel's query optimization capabilities
- **Batch Operations:** Efficient bulk operations for user management
- **Connection Pooling:** Leverage Gel's connection pooling capabilities
- **Metadata Generation:** Generate metadata from Better Auth schema definitions to improve query construction.