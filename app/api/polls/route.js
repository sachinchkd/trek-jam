import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function cleanText(value) {
  return String(value || "").trim();
}

export async function GET() {
  const { data: polls, error: pollError } = await supabaseAdmin
    .from("polls")
    .select("id, question, active, created_at, options(id, text)")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (pollError) {
    return NextResponse.json({ error: pollError.message }, { status: 500 });
  }

  const pollIds = (polls || []).map((poll) => poll.id);
  let votes = [];

  if (pollIds.length > 0) {
    const { data, error: voteError } = await supabaseAdmin
      .from("votes")
      .select("poll_id, option_id")
      .in("poll_id", pollIds);

    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }

    votes = data || [];
  }

  const voteCounts = votes.reduce((map, vote) => {
    const key = vote.option_id;
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});

  const response = (polls || []).map((poll) => {
    const options = (poll.options || []).map((option) => ({
      ...option,
      votes: voteCounts[option.id] || 0
    }));

    return {
      ...poll,
      options,
      total_votes: options.reduce((sum, option) => sum + option.votes, 0)
    };
  });

  return NextResponse.json({ polls: response });
}

export async function POST(request) {
  const adminSecret = request.headers.get("x-admin-secret");

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const question = cleanText(body?.question);
  const options = Array.isArray(body?.options)
    ? body.options.map(cleanText).filter(Boolean)
    : [];

  if (question.length < 5) {
    return NextResponse.json({ error: "Question must be at least 5 characters." }, { status: 400 });
  }

  if (options.length < 2 || options.length > 8) {
    return NextResponse.json({ error: "Add 2 to 8 answer options." }, { status: 400 });
  }

  const { data: poll, error: pollError } = await supabaseAdmin
    .from("polls")
    .insert({ question })
    .select("id, question, created_at")
    .single();

  if (pollError) {
    return NextResponse.json({ error: pollError.message }, { status: 500 });
  }

  const optionRows = options.map((text) => ({ poll_id: poll.id, text }));
  const { error: optionError } = await supabaseAdmin.from("options").insert(optionRows);

  if (optionError) {
    await supabaseAdmin.from("polls").delete().eq("id", poll.id);
    return NextResponse.json({ error: optionError.message }, { status: 500 });
  }

  return NextResponse.json({ poll }, { status: 201 });
}
