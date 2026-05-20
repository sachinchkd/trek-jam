"use client";

import { useEffect, useMemo, useState } from "react";

const VOTER_KEY = "dhorpatan_jam_voter_id";
const VOTED_KEY = "dhorpatan_jam_voted_polls";

function getVoterId() {
  if (typeof window === "undefined") return "";

  let voterId = localStorage.getItem(VOTER_KEY);
  if (!voterId) {
    voterId = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

    localStorage.setItem(VOTER_KEY, voterId);
  }

  return voterId;
}

function getVotedPolls() {
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY) || "[]");
  } catch {
    return [];
  }
}

function rememberVote(pollId) {
  const voted = new Set(getVotedPolls());
  voted.add(pollId);
  localStorage.setItem(VOTED_KEY, JSON.stringify([...voted]));
}

export default function HomePage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [votedPolls, setVotedPolls] = useState([]);

  async function loadPolls() {
    const res = await fetch("/api/polls", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Could not load polls.");
    }

    setPolls(data.polls || []);
  }

  useEffect(() => {
    setVotedPolls(getVotedPolls());

    loadPolls()
      .catch((error) => setStatus(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function vote(pollId, optionId) {
    setStatus("Submitting your vote...");

    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollId, optionId, voterId: getVoterId() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Vote failed.");

      if (res.status === 409) {
        rememberVote(pollId);
        setVotedPolls(getVotedPolls());
      }

      return;
    }

    rememberVote(pollId);
    setVotedPolls(getVotedPolls());
    setStatus("Vote saved. Thank you!");
    await loadPolls();
  }

  const votedSet = useMemo(() => new Set(votedPolls), [votedPolls]);

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-content">
          <p className="badge">Live Voting</p>

          <h1>Dhorpatan Jam</h1>

          <p className="hero-text">
            Vote in live polls and see what everyone thinks.
          </p>

          <div className="hero-image-wrap">
            <img
              src="/dhorpatan-jam.jpg"
              alt="Dhorpatan Jam"
              className="hero-image"
            />
          </div>
        </div>
      </section>

      <section className="content">
        {status ? <p className="notice">{status}</p> : null}
        {loading ? <p className="notice">Loading polls...</p> : null}

        <div className="poll-list">
          {!loading && polls.length === 0 ? (
            <article className="card empty-card">
              <h2>No active polls yet.</h2>
              <p>Create one from the admin page.</p>
            </article>
          ) : null}

          {polls.map((poll) => {
            const hasVoted = votedSet.has(poll.id);

            return (
              <article className="card" key={poll.id}>
                <div className="poll-header">
                  <h2>{poll.question}</h2>

                  <span className="vote-count">
                    {poll.total_votes} vote{poll.total_votes === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="options">
                  {poll.options.map((option) => {
                    const percent =
                      poll.total_votes > 0
                        ? Math.round((option.votes / poll.total_votes) * 100)
                        : 0;

                    return (
                      <button
                        className={`option ${hasVoted ? "voted" : ""}`}
                        disabled={hasVoted}
                        key={option.id}
                        onClick={() => vote(poll.id, option.id)}
                      >
                        <span className="option-top">
                          <strong>{option.text}</strong>
                          <span>{hasVoted ? `${percent}%` : "Vote"}</span>
                        </span>

                        {hasVoted ? (
                          <span className="bar" aria-hidden="true">
                            <span style={{ width: `${percent}%` }} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {hasVoted ? (
                  <p className="voted-text">You already voted in this poll.</p>
                ) : (
                  <p className="hint-text">Choose one option to vote.</p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}