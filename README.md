# Bulk Action Platform

A high-performance, scalable bulk action platform built with Node.js, MongoDB, BullMQ, Redis, and CSV stream processing. Supports importing millions of records using streaming + batch writes.

---

## 📦 Features

* Supports bulk update/import for multiple entities (e.g., contacts)
* Handles millions of records via streaming & batching
* Real-time job status updates (in-progress, completed, failed)
* Logs per job (with `requestId`, `accountId`)
* Queue-based processing using BullMQ + Redis
* CSV upload and filePath-based processing

---

## 🛠️ Setup Instructions

### 1. 📥 Clone the Repo

```bash
git clone https://github.com/yourname/CRMBulkAction.git
cd CRMBulkAction
```

### 2. 📦 Install Dependencies

```bash
npm install
```

### 3. 🚀 Start MongoDB & Redis

#### Mac (with Homebrew):

```bash
brew services start mongodb-community
brew services start redis
```

#### Linux/WSL:

```bash
sudo service mongod start
sudo service redis-server start
```

### 4. 📁 Ensure Folder Structure

```
project-root/
├── data/                      # CSV files
├── logs/                     # Auto-created, stores logs
├── models/                   # Mongoose schemas
├── jobs/                     # Processors per entity
├── utils/                    # Helpers (CSV stream, logger)
├── middleware/               # logger, rateLimiter, etc
├── routes/
│   └── bulkRoutes.js         # Bulk API routes
├── server.js                 # Main app entry
```

---

## 🚀 Start the App

```bash
npm run start
```

---

## 🌐 API Documentation

### 🔹 POST /bulk-actions

Queue a new bulk action job

#### Headers:

* `x-account-id`: Account ID (string)
* `x-request-id`: Optional request UUID

#### Body (JSON):

```json
{
  "entityType": "contacts",
  "filePath": "./data/contacts.csv"
}
```

#### ✅ Response:

```json
{
  "message": "Job queued",
  "actionId": "bulk_12345678"
}
```

---

### 🔹 GET /bulk-actions/\:actionId

Get status of a bulk action

#### ✅ Response:

```json
{
  "actionId": "bulk_12345678",
  "status": "completed",
  "stats": {
    "success": 1000,
    "failed": 0,
    "skipped": 12
  },
  "logs": ["Updated: user@example.com", ...]
}
```

---

## 📈 Load Testing

### 🔹 Install Artillery

```bash
npm install -g artillery
```

### 🔹 Run Load Test

```bash
artillery run test/contacts_load_test.yml
```

This sends \~10 requests/sec for 5 mins using a shared CSV file.

---

## 🪵 Logs

* All logs go to: `logs/app-YYYY-MM-DD-HH.log`
* Tagged with `requestId` and `accountId`
* Example log line:

```
[2025-06-12T14:07:03.123Z] [9d2c77a1] [12345] Incoming POST /bulk-actions
```

---

## 🧪 Test CSV Files

* `data/contacts_100.csv` – sample for quick testing
* `data/contacts_10M.csv` – full-scale performance test

---

## 🔐 Rate Limiting

* Configurable per endpoint
* Default: 10 requests per minute per IP/account

---

## 📬 Contact

Created by Shanmuk. For any issues or contributions, open a PR or contact directly.

---
