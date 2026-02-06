const ADMIN_API_URL = "http://localhost:3000/api";

async function testAdmin() {
    console.log("🚀 Starting ADMIN API Tests...");

    try {
        // 1. Admin Login
        console.log("\n--- Testing Admin Login ---");
        const loginRes = await fetch(`${ADMIN_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Admin Login failed: ${JSON.stringify(loginData)}`);
        const token = loginData.access_token;
        console.log("✅ Admin Login successful");

        // 2. Get Users
        console.log("\n--- Testing /admin/users ---");
        const usersRes = await fetch(`${ADMIN_API_URL}/admin/users`, {
            headers: { "Authorization": `Bearer ${token}` } // Assuming middleware checks this or just API doesn't verify yet
            // Note: The current /api/admin/users route doesn't seem to check headers explicitly in the code I viewed, 
            // but let's see if it works.
        });
        const usersData = await usersRes.json();
        if (!usersRes.ok) throw new Error(`Get Users failed: ${JSON.stringify(usersData)}`);
        console.log(`✅ /admin/users successful. Total users: ${usersData.total}`);

        // 3. Admin Stats
        console.log("\n--- Testing /admin/stats ---");
        const statsRes = await fetch(`${ADMIN_API_URL}/admin/stats`);
        const statsData = await statsRes.json();
        if (!statsRes.ok) throw new Error(`Admin Stats failed: ${JSON.stringify(statsData)}`);
        console.log("✅ /admin/stats successful");

        // 4. Ban User (Test PATCH)
        // First find a user to ban (not admin)
        const targetUser = usersData.users.find((u: any) => u.email !== "admin@example.com");
        if (targetUser) {
            console.log(`\n--- Testing Ban User (ID: ${targetUser.id}) ---`);
            const banRes = await fetch(`${ADMIN_API_URL}/admin/users`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: targetUser.id, action: "ban" })
            });
            const banData = await banRes.json();
            if (!banRes.ok) throw new Error(`Ban User failed: ${JSON.stringify(banData)}`);
            console.log("✅ Ban User successful");

            // Unban
            console.log(`\n--- Testing Activate User (ID: ${targetUser.id}) ---`);
            const unbanRes = await fetch(`${ADMIN_API_URL}/admin/users`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: targetUser.id, action: "activate" })
            });
            if (!unbanRes.ok) throw new Error(`Activate User failed`);
            console.log("✅ Activate User successful");
        } else {
            console.log("⚠️ No user found to ban (skipping ban test)");
        }

        console.log("\n🎉 ALL ADMIN TESTS PASSED!");
    } catch (error: any) {
        console.error("❌ ADMIN TEST FAILED:", error.message);
        process.exit(1);
    }
}

testAdmin();
