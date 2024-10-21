# Petastic Auth

## Overview

This monorepo consists of a test application and two third-party submodules:

- **pagoda-relayer-rs** (develop branch)
- **fast-auth-signer** (main branch)

## Directory Structure

- `config/`: Contains configuration files for the third-party apps.
- `test-app/`: simple test app.
- `pagoda-relayer-rs/`: Contains the Pagoda Relayer application.
- `fast-auth-signer/`: Contains the Fast Auth Signer application.

## Architecture

In order to abstract away any notion of blockchain from users and to avoid forcing new users to "fund" their wallets
a relay service is required to be the middle-man which can allow us to

## Syncing Submodules

1. From the root of the repository, initialize and update the submodules:

   ```bash
   git submodule update --init --recursive

## Running the Applications Individually

### Test App

1. Navigate to the `test-app` directory.
2. Build Deps:
   ```bash
   yarn install
   ```
3. Run the application:
   ```bash
   yarn start
   ```

### Fast Auth Signer

1. Navigate to the `near-fast-auth-signer` directory.
   ```bash
   cd fast-auth-signer/packages/near-fast-auth-signer
   ```
2. Build the app:
   ```bash
   yarn install
   ```
3. Run the application on testnet:
   ```bash
   NETWORK_ID=testnet yarn start
   ```

## Running All Applications with Docker Compose

1. Make sure you have Docker and Docker Compose installed.
2. From the root of the repository, run:
   ```bash
   docker-compose up --build
   ```
3. The services will start, and you can access them based on the port mappings defined in the `docker-compose.yml` file.

## Configuration

- All configuration files for the third-party applications are located in the `config/` directory.
- Ensure that you customize the configuration files as needed for your environment.
