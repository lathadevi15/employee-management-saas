
import "dotenv/config";
import { sendTestEmail } from "./modules/emails/email.test.js";
import app from "./app.js";
import { db } from "./config/database.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const connection = await db.getConnection();

    console.log("Database connected successfully");

    connection.release();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  sendTestEmail("lathadevi0007@gmail.com")
    .catch((error) => console.error("Test email failed:", error));
});
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();
