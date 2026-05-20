import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function cleanText(value) {
  return String(value || "").trim();
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const pollId = cleanText(body?.pollId);
  const optionId = cleanText(body?.optionId);
  const voterId = cleanText(body?.voterId);

  if (!pollId || !optionId || voterId.length < 10) {
    return NextResponse.json({ error: "Missing vote details." }, { status: 400 });
  }

  const { data: poll, error: pollError } = await supabaseAdmin
    .from("polls")
    .select("id, active")
    .eq("id", pollId)
    .single();

  if (pollError || !poll || !poll.active) {
    return NextResponse.json({ error: "Poll is not available." }, { status: 404 });
  }

  const { data: option, error: optionError } = await supabaseAdmin
    .from("options")
    .select("id, poll_id")
    .eq("id", optionId)
    .single();

  if (optionError || !option || option.poll_id !== pollId) {
    return NextResponse.json({ error: "Invalid option." }, { status: 400 });
  }

  const { error: voteError } = await supabaseAdmin
    .from("votes")
    .insert({ poll_id: pollId, option_id: optionId, voter_id: voterId });

  if (voteError?.code === "23505") {
    return NextResponse.json({ error: "You already voted in this poll." }, { status: 409 });
  }

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
