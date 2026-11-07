# Invitation-Based Membership & Waiting List Management — Backend

A secure REST API built to manage invitation-based membership registration, application reviews, waiting lists, and member access.

## Features

* JWT-based authentication.
* Role-based authorization (Admin and Member).
* Invitation code validation and redemption.
* Invitation usage limits and expiry management.
* Membership application submission.
* Admin approval and rejection workflow.
* Applicant privacy and access control.
* Member suspension and reactivation.
* Notification management.
* Administrative audit logs.
* Protected API routes.
* Secure password hashing using bcrypt.
* MongoDB database integration.

## Technology Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Token (JWT)
* bcryptjs
* dotenv

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Kumkum5575/Membership-Backend.git
```

### 2. Navigate to the Project Directory

```bash
cd Membership-Backend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the backend root directory.

Add the following variables:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/invitationDB
JWT_SECRET=your_secure_secret

SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your_admin_password
SEED_INVITATION_CODE=your_invitation_code
```

Replace the placeholder values with your own configuration.

### 5. Start the Backend Server

```bash
npm start
```

## Database Seeding

To create the initial administrator account and invitation, run:

```bash
node seed.js
```

The seed script checks for existing records before creating new ones.

## API Base URL

Local development:

```text
http://localhost:5000/api
```

## Security

* Passwords are hashed before storage.
* JWT authentication protects private routes.
* Admin APIs require administrator authorization.
* Invitation codes are validated before registration.
* Suspended accounts cannot access protected resources.
* Sensitive environment variables are excluded from version control.

## Project Status

Developed as part of a technical assessment.
