const BASE_URL = "http://localhost:3000/api";

async function testAll() {
    const timestamp = Date.now();
    const testEmail = `tester_${timestamp}@example.com`;
    const testPassword = "password123";

    console.log(`🚀 Starting API Tests with fresh user: ${testEmail}...`);

    try {
        // 1. Register
        console.log("\n--- Testing Register ---");
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, password: testPassword, username: `tester_${timestamp}` })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(`Register failed: ${JSON.stringify(regData)}`);
        console.log("✅ Register successful");

        // 2. Login
        console.log("\n--- Testing Login ---");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, password: testPassword })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        const token = loginData.access_token;
        console.log("✅ Login successful");

        // 3. Me
        console.log("\n--- Testing /auth/me ---");
        const meRes = await fetch(`${BASE_URL}/auth/me`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
        });
        const meData = await meRes.json();
        if (!meRes.ok) throw new Error(`Me failed: ${JSON.stringify(meData)}`);
        const userId = meData.user.id;
        console.log(`✅ /me successful. User ID: ${userId} (type: ${typeof userId})`);

        // 4. Search
        console.log("\n--- Testing /search ---");
        const searchRes = await fetch(`${BASE_URL}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, imageUrl: "https://example.com/test.jpg" })
        });
        const searchData = await searchRes.json();
        if (!searchRes.ok) throw new Error(`Search failed: ${JSON.stringify(searchData)}`);
        console.log("✅ /search successful");

        // 5. Dashboard Stats
        console.log("\n--- Testing /dashboard/stats ---");
        const statsRes = await fetch(`${BASE_URL}/dashboard/stats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });
        const statsData = await statsRes.json();
        if (!statsRes.ok) throw new Error(`Stats failed: ${JSON.stringify(statsData)}`);
        console.log("✅ /dashboard/stats successful");

        console.log("\n🎉 ALL CORE API TESTS PASSED!");
    } catch (error: any) {
        console.error("❌ TEST FAILED:", error.message);
        process.exit(1);
    }
}

testAll();
