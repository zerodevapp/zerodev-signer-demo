# Doorway Prototype

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Yarn](https://yarnpkg.com)
- [Docker](https://www.docker.com) & [Docker Compose](https://docs.docker.com/compose)

You will also need to have a [Turnkey](https://www.turnkey.com) account (which comes with an Organization Id) and a Turnkey API key (which comes with a public and private key pair). You'll need to add these to your `.env` later.

## Installation

1. Clone the repository and install dependencies:

```bash
yarn install
```

## Database Setup

1. Start PostgreSQL and pgAdmin containers:

```bash
cd packages/doorway
docker-compose up -d
```

2. Run database migrations:

```bash
cd packages/doorway
yarn db:migrate
```

## Environment Configuration

1. Copy the environment example file:

```bash
cd packages/doorway
cp .env.example .env
```

2. Edit `.env` and fill in the required Turnkey credentials:

```
NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID=your_org_id
TURNKEY_API_PRIVATE_KEY=your_private_key
TURNKEY_API_PUBLIC_KEY=your_public_key
```

## Running the Application

1. Start the development server:

```bash
cd packages/doorway
yarn dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. (Optional) If your application is running on a different URL, make sure to edit your `env.` accordingly:

```
NEXT_PUBLIC_APP_URL=
```

## Database Management (Optional)

Access pgAdmin at [http://localhost:5050](http://localhost:5050)

- Email: admin@doorway.com
- Password: admin
