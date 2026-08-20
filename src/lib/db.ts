import { supabase } from "./supabase";

/* ── Types (mirrored from admin/page.tsx) ──────────────── */
export interface Election {
  id: string;
  name: string;
  type: "नगर पालिका वार्ड" | "नगर पालिका पूर्ण" | "विधान सभा" | "लोक सभा" | "पंचायत";
  date: string;
  constituency: string;
  state: string;
  status: "आगामी" | "सक्रिय" | "समाप्त";
  voterCount: number;
  candidateCount: number;
}

export interface Party {
  id: string;
  name: string;
  abbreviation: string;
  symbol: string;
  color: string;
  candidates: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  date: string;
  category: "सामान्य" | "चुनाव" | "घोषणा" | "परिणाम";
  published: boolean;
}

export interface Voter {
  id: string;
  name: string;
  familyHead: string;
  booth: number;
  area: string;
  age: number;
  gender: "पुरुष" | "महिला";
  electionId?: string;
  ward?: string;
  part?: string;
  relation?: string;
  houseNo?: string;
  mobile?: string;
  availability?: "उपलब्ध" | "बाहर";
  contactStatus?: "संपर्क हुआ" | "फिर संपर्क" | "घर पर नहीं मिले" | "मीटिंग तय";
  lastContact?: string;
  nextAction?: string;
  group?: string;
}

/* ── Row-shape helpers (DB ↔ App) ──────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toElection(row: any): Election {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Election["type"],
    date: row.date,
    constituency: row.constituency ?? "",
    state: row.state ?? "राजस्थान",
    status: row.status,
    voterCount: row.voter_count ?? 0,
    candidateCount: row.candidate_count ?? 0,
  };
}

function fromElection(e: Election) {
  return {
    id: e.id,
    name: e.name,
    type: e.type,
    date: e.date,
    constituency: e.constituency,
    state: e.state,
    status: e.status,
    voter_count: e.voterCount,
    candidate_count: e.candidateCount,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toParty(row: any): Party {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation ?? "",
    symbol: row.symbol ?? "⭐",
    color: row.color ?? "#6366F1",
    candidates: row.candidates ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNews(row: any): NewsItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? "",
    date: row.date ?? "",
    category: row.category ?? "सामान्य",
    published: row.published ?? false,
  };
}

function fromNews(n: NewsItem) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    date: n.date || null,
    category: n.category,
    published: n.published,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toVoter(row: any): Voter {
  return {
    id:            row.id,
    name:          row.name ?? "",
    familyHead:    row.family_head ?? "",
    booth:         row.booth ?? 0,
    area:          row.area ?? "",
    age:           row.age ?? 0,
    gender:        (row.gender as Voter["gender"]) ?? "पुरुष",
    electionId:    row.election_id ?? undefined,
    ward:          row.ward ?? undefined,
    part:          row.part ?? undefined,
    relation:      row.relation ?? undefined,
    houseNo:       row.house_no ?? undefined,
    mobile:        row.mobile ?? undefined,
    availability:  (row.availability as Voter["availability"]) ?? "उपलब्ध",
    contactStatus: (row.contact_status as Voter["contactStatus"]) ?? "फिर संपर्क",
    lastContact:   row.last_contact ?? undefined,
    nextAction:    row.next_action ?? undefined,
    group:         row.group ?? undefined,
  };
}

function fromVoter(v: Voter) {
  return {
    id:             v.id,
    name:           v.name,
    family_head:    v.familyHead,
    booth:          v.booth,
    area:           v.area,
    age:            v.age,
    gender:         v.gender,
    election_id:    v.electionId ?? null,
    ward:           v.ward ?? null,
    part:           v.part ?? null,
    relation:       v.relation ?? null,
    house_no:       v.houseNo ?? null,
    mobile:         v.mobile ?? null,
    availability:   v.availability ?? "उपलब्ध",
    contact_status: v.contactStatus ?? "फिर संपर्क",
    last_contact:   v.lastContact ?? null,
    next_action:    v.nextAction ?? null,
  };
}

/* ── Elections ─────────────────────────────────────────── */
export const elections = {
  async getAll(): Promise<Election[]> {
    const { data, error } = await supabase
      .from("elections")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toElection);
  },

  async upsert(e: Election): Promise<void> {
    const { error } = await supabase
      .from("elections")
      .upsert(fromElection(e), { onConflict: "id" });
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("elections").delete().eq("id", id);
    if (error) throw error;
  },

  async incrementVoterCount(id: string, by: number): Promise<void> {
    const { error } = await supabase.rpc("increment_voter_count", {
      election_id: id,
      increment_by: by,
    });
    if (error) {
      // Fallback: fetch + update
      const { data } = await supabase
        .from("elections")
        .select("voter_count")
        .eq("id", id)
        .single();
      if (data) {
        await supabase
          .from("elections")
          .update({ voter_count: (data.voter_count ?? 0) + by })
          .eq("id", id);
      }
    }
  },
};

/* ── Parties ───────────────────────────────────────────── */
export const parties = {
  async getAll(): Promise<Party[]> {
    const { data, error } = await supabase
      .from("parties")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toParty);
  },

  async upsert(p: Party): Promise<void> {
    const { error } = await supabase.from("parties").upsert(
      { id: p.id, name: p.name, abbreviation: p.abbreviation, symbol: p.symbol, color: p.color, candidates: p.candidates },
      { onConflict: "id" }
    );
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("parties").delete().eq("id", id);
    if (error) throw error;
  },
};

/* ── News ──────────────────────────────────────────────── */
export const news = {
  async getAll(): Promise<NewsItem[]> {
    const { data, error } = await supabase
      .from("news_items")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toNews);
  },

  async upsert(n: NewsItem): Promise<void> {
    const { error } = await supabase
      .from("news_items")
      .upsert(fromNews(n), { onConflict: "id" });
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("news_items").delete().eq("id", id);
    if (error) throw error;
  },
};

/* ── Voters ────────────────────────────────────────────── */
export const voters = {
  async countAll(): Promise<number> {
    const { count, error } = await supabase
      .from("voters")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },

  async countByWard(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from("ward_voter_counts")
      .select("ward, voter_count");
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      if (row.ward) counts[row.ward] = row.voter_count;
    }
    return counts;
  },

  async bulkInsert(rows: Voter[]): Promise<number> {
    const CHUNK = 500;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK).map(fromVoter);
      const { error } = await supabase
        .from("voters")
        .upsert(chunk, { onConflict: "id", ignoreDuplicates: true });
      if (error) throw error;
      inserted += chunk.length;
    }
    return inserted;
  },

  async getAll(limit = 2000): Promise<Voter[]> {
    const { data, error } = await supabase
      .from("voters")
      .select("*")
      .order("ward", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(toVoter);
  },

  async getPage(opts: {
    page: number; perPage: number;
    ward?: string; search?: string;
    contactStatus?: string; availability?: string;
    electionId?: string;
  }): Promise<{ data: Voter[]; total: number }> {
    const { page, perPage, ward, search, contactStatus, availability, electionId } = opts;
    const from = (page - 1) * perPage;

    let q = supabase.from("voters").select("*", { count: "exact" });
    if (ward)           q = q.eq("ward", ward);
    if (availability)   q = q.eq("availability", availability);
    if (contactStatus)  q = q.eq("contact_status", contactStatus);
    if (electionId)     q = q.eq("election_id", electionId);
    if (search) {
      q = q.or(`name.ilike.%${search}%,id.ilike.%${search}%,mobile.ilike.%${search}%`);
    }
    q = q.order("created_at", { ascending: false }).range(from, from + perPage - 1);

    const { data, count, error } = await q;
    if (error) throw error;
    return { data: (data ?? []).map(toVoter), total: count ?? 0 };
  },

  async updateCRM(id: string, fields: {
    mobile?: string; availability?: string;
    contactStatus?: string; lastContact?: string; nextAction?: string;
    area?: string; group?: string;
  }): Promise<void> {
    const update: Record<string, string | null> = {};
    if (fields.mobile         !== undefined) update.mobile         = fields.mobile;
    if (fields.availability   !== undefined) update.availability   = fields.availability;
    if (fields.contactStatus  !== undefined) update.contact_status = fields.contactStatus;
    if (fields.lastContact    !== undefined) update.last_contact   = fields.lastContact;
    if (fields.nextAction     !== undefined) update.next_action    = fields.nextAction;
    if (fields.area           !== undefined) update.area           = fields.area;
    if (fields.group          !== undefined) update.group          = fields.group;
    const { error } = await supabase.from("voters").update(update).eq("id", id);
    if (error) throw error;
  },
};

/* ── Tasks ─────────────────────────────────────────────── */
export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "उच्च" | "सामान्य";
  done: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTask(row: any): Task {
  return {
    id:          row.id,
    title:       row.title ?? "",
    description: row.description ?? "",
    dueDate:     row.due_date ?? "",
    priority:    (row.priority as Task["priority"]) ?? "सामान्य",
    done:        row.done ?? false,
  };
}

export const tasks = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toTask);
  },

  async upsert(t: Task): Promise<void> {
    const { error } = await supabase.from("tasks").upsert(
      { id: t.id, title: t.title, description: t.description, due_date: t.dueDate || null, priority: t.priority, done: t.done },
      { onConflict: "id" }
    );
    if (error) throw error;
  },

  async toggleDone(id: string, done: boolean): Promise<void> {
    const { error } = await supabase.from("tasks").update({ done }).eq("id", id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
  },
};

/* ── Team Members ──────────────────────────────────────── */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  area: string;
  mobile: string;
  color: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTeamMember(row: any): TeamMember {
  return {
    id:     row.id,
    name:   row.name ?? "",
    role:   row.role ?? "",
    area:   row.area ?? "",
    mobile: row.mobile ?? "",
    color:  row.color ?? "#0f5e38",
  };
}

export const teamMembers = {
  async getAll(): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toTeamMember);
  },

  async upsert(m: TeamMember): Promise<void> {
    const { error } = await supabase.from("team_members").upsert(
      { id: m.id, name: m.name, role: m.role, area: m.area, mobile: m.mobile, color: m.color },
      { onConflict: "id" }
    );
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) throw error;
  },
};

/* ── Named re-exports for convenience ──────────────────── */
const db = { elections, parties, news, voters, tasks, teamMembers };
export default db;
