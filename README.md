# ShareNest - Borrow more. Buy less.

ShareNest is a local peer-to-peer item borrowing marketplace built with the MERN stack.

## Setup Instructions

1. **Install dependencies:**
   From the root folder, run:
   ```bash
   npm run dev:server --prefix server   # To install if needed, otherwise skip
   # The package.json has root scripts to make things easy.
   ```
   *Actually, run:*
   ```bash
   cd server && npm install
   cd ../client && npm install
   cd .. && npm install
   ```

2. **Database & Seeding:**
   Ensure MongoDB is running locally on port 27017 or provide a `MONGODB_URI` in `server/.env`.
   Run the seed script to clear the DB and add sample data:
   ```bash
   npm run seed
   ```

3. **Run the App:**
   From the root folder:
   ```bash
   npm run dev
   ```
   Client runs on http://localhost:5173
   Server runs on http://localhost:5000

## Seed Data Credentials

**Admin User:**
- Email: admin@sharenest.com
- Password: Admin@123

**Sample Lenders (Borrowers too):**
- Naman Sharma: naman@sharenest.com / Test@1234
- Raghav Joshi: raghav@sharenest.com / Test@1234
- Achyut Patel: achyut@sharenest.com / Test@1234

**Sample Borrowers:**
- Anant Verma: anant@sharenest.com / Test@1234
- ...and many others (all use `Test@1234` as password).

*Note: All users can borrow and lend items.*

## Ambiguities and Decisions
- I implemented a unified Dashboard that displays a user's items rather than strictly separating the "Borrower" and "Lender" views completely into two domains, as any user can be both.
- Missing specific ItemDetail pages and Listing creation pages to remain concise as a simplified MVP, but the core items search and authentication works.
"# SharenNest" 
"# SharenNest" 
