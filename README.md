<br />
<div align="center">
  <a href="https://github.com/carere/gel-better-auth">
    <img src="images/gel-better-auth-banner.svg" alt="Gel + Better Auth" width="50%">
  </a>

  <h1 style="font-size: 3rem; font-weight: 600;">Gel Better Auth</h1>

  <p align="center">
    Gel adapter for Better Auth
    <br />
    <a href="https://github.com/carere/gel-better-auth/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/carere/gel-better-auth/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

## About The Project

### Why Gel Better Auth?

Gel (formerly EdgeDB) is a wonderful database that is a joy to work with. Better Auth is the best authentication framework for TypeScript.
Obviously, they both work great together, so I decided to create this adapter to make it even better :)

### Features

- **🚀 Schema Generation**: Work out of the box with any Better Auth plugins.
- **🔒 Cascading Delete**: Cascading delete is supported for all models.
- **⚡ Indexes Support**: Works out of the box, see examples for more details.
- **🛠 Constraints**: Unique flag are supported as native Gel's constraints.
- **🎯 Scalar Types**: Literals are represented as Scalar Type in the schema !!
- **🔥 Link instead of Id**: relations like `userId` are represented as computed property !!

Enjoy the power of Better Auth and Gel together!

## Getting Started

Get up and running in just a few minutes.

### Prerequisites

- **[Bun](https://bun.sh)** (recommended) or Node.js runtime
- **[Gel/EdgeDB](https://geldata.com)** instance (prefer local)
- **[Better Auth](https://better-auth.com)** configured in your project

### Installation

1. Install the package and peer dependencies

   ```sh
   # Using Bun (recommended)
   bun add @carere/gel-better-auth better-auth gel

   # Using npm
   npm install @carere/gel-better-auth better-auth gel

   # Using pnpm
   pnpm add @carere/gel-better-auth better-auth gel
   ```

2. Set up your Gel connection

   ```sh
   # Initialize Gel project (if not already done)
   gel project init
   ```

3. Generate the Gel schema

   ```sh
   bunx @better-auth/cli generate
   ```

4. Run the watcher for automatic migrations (in dev mode)

   ```sh
   gel watch -m
   ```

## Usage

Here's how to use the adapter with your Better Auth setup:

### Basic Setup

```typescript
// auth.ts
import { betterAuth } from "better-auth";
import { gelAdapter } from "@carere/gel-better-auth";
import createClient from "gel";

// Create your Gel client
const gelClient = createClient();

// Configure Better Auth with Gel adapter
export const auth = betterAuth({
  database: gelAdapter(gelClient, {
    // Optional: Specify module name (defaults to "default")
    moduleName: "auth",
    
    // Optional: Define indexes for better performance
    indexes: {
      user: [
        "email",                    // Single field index
        "createdAt",                // Another single field index
        ["name", "email"]           // Composite index
      ],
      session: [
        "token",
        ["userId", "expiresAt"]      // Composite index
      ]
    }
  }),
  
  // ... rest of your Better Auth config
});
```

## 🚀 Roadmap

- [ ] Performance benchmarking and optimization

See the [open issues](https://github.com/carere/gel-better-auth/issues) for a full list of proposed features (and known issues).

## Contributing

Contributions are more than welcome. If you have a suggestion that would make this project better, please fork the repo and create a pull request.
You can also simply open an issue with the tag "enhancement".

Don't forget to give the project a star!

### Top contributors:

<a href="https://github.com/carere/gel-better-auth/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=carere/gel-better-auth" alt="contrib.rocks image" />
</a>

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Kevin Abatan - abatan.k@gmail.com

Project Link: [https://github.com/carere/gel-better-auth](https://github.com/carere/gel-better-auth)

## Acknowledgments

* [Better Auth](https://better-auth.com) - The best authentication framework for TypeScript
* [Gel](https://geldata.com) - The best Type-Safe & Full-Featured Database