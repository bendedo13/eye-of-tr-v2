"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      alert("Dosya seçilmedi");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://localhost:8000/api/search", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert("Backend bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0b0b",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "#111",
          padding: 30,
          borderRadius: 10,
          width: 420,
          boxShadow: "0 0 20px rgba(0,0,0,0.8)",
        }}
      >
        <h1 style={{ marginBottom: 20 }}>EyeOfWeb – Yüz Arama</h1>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginBottom: 15 }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 0",
            background: loading ? "#333" : "#0f62fe",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Analiz ediliyor..." : "Analiz Et"}
        </button>

        {result && (
          <pre
            style={{
              marginTop: 20,
              background: "#000",
              padding: 15,
              borderRadius: 6,
              fontSize: 12,
              maxHeight: 300,
              overflow: "auto",
              color: "#00ff88",
            }}
          >
{JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}