"use client";

import { useState } from "react";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("Yes\nNo");
  const [status, setStatus] = useState("");

  async function createPoll(event) {
    event.preventDefault();
    setStatus("Creating poll...");

    const optionList = options
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    const res = await fetch("/api/polls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret
      },
      body: JSON.stringify({ question, options: optionList })
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Could not create poll.");
      return;
    }

    setQuestion("");
    setOptions("Yes\nNo");
    setStatus("Poll created. Open the home page to vote.");
  }

  return (
    <main>
      <section className="hero">
        <h1>Admin</h1>
        <p>Create Dhorpatan Jam polls. Keep your admin secret private.</p>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <form className="admin-form" onSubmit={createPoll}>
          <label>
            Admin secret
            <input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Same as ADMIN_SECRET"
              required
            />
          </label>

          <label>
            Poll question
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: Which performance should open Dhorpatan Jam?"
              required
            />
          </label>

          <label>
            Options, one per line
            <textarea
              value={options}
              onChange={(event) => setOptions(event.target.value)}
              required
            />
          </label>

          <button className="primary" type="submit">Create poll</button>
        </form>

        {status ? <p className="notice">{status}</p> : null}
        <p className="notice"><a href="/">Back to voting page</a></p>
      </section>
    </main>
  );
}
