import { cached } from "./cache";
import { dayOfYear, type ISODate } from "./dates";

export type Principle = {
  law: string; // e.g. "1st Law · Make it obvious"
  title: string;
  body: string;
  action: string;
};

/** The core ideas of Atomic Habits, paraphrased, rotated one per day. */
export const PRINCIPLES: Principle[] = [
  { law: "Identity", title: "Every action is a vote", body: "Each rep is a vote for the type of person you want to become. You don't need a unanimous vote, just a majority.", action: "Pick one habit and finish it today for the identity behind it, not the outcome." },
  { law: "Compounding", title: "1% better every day", body: "Improving by 1% a day compounds to 37x better in a year. Habits are the compound interest of self-improvement.", action: "Don't aim for a perfect day. Aim for slightly better than yesterday." },
  { law: "1st Law · Make it obvious", title: "Implementation intentions", body: "People who make a specific plan for when and where they will act are far more likely to follow through.", action: "Fill in: I will [habit] at [time] in [location] for one habit that keeps slipping." },
  { law: "1st Law · Make it obvious", title: "Habit stacking", body: "The best way to start a new habit is to anchor it to one you already do: after [current habit], I will [new habit].", action: "Add a stack anchor to a habit that has no cue yet." },
  { law: "1st Law · Make it obvious", title: "Design your environment", body: "Make the cues of good habits visible and the cues of bad habits invisible. Environment beats motivation.", action: "Put one object where you'll trip over it tomorrow: the book on the pillow, the shoes by the door." },
  { law: "2nd Law · Make it attractive", title: "Temptation bundling", body: "Pair an action you want to do with an action you need to do.", action: "Only listen to your favourite podcast while doing the habit you avoid." },
  { law: "2nd Law · Make it attractive", title: "Join a culture", body: "We imitate the habits of the close, the many and the powerful. Surround yourself with people for whom your desired behaviour is normal.", action: "Tell one person about the habit you're building this week." },
  { law: "3rd Law · Make it easy", title: "The two-minute rule", body: "When you start a new habit it should take less than two minutes. Master the art of showing up before you optimise.", action: "Do the two-minute version of a habit you've been skipping." },
  { law: "3rd Law · Make it easy", title: "Reduce friction", body: "The less energy a habit requires, the more likely it happens. Prime your environment so the next action is easy.", action: "Prepare tomorrow's habit tonight so it starts with zero decisions." },
  { law: "3rd Law · Make it easy", title: "Motion vs action", body: "Planning and researching feel productive but they're motion. Action is what delivers a result.", action: "Skip the planning today and do one rep." },
  { law: "4th Law · Make it satisfying", title: "Never miss twice", body: "Missing once is an accident. Missing twice is the start of a new habit. Get back on track fast.", action: "If you missed yesterday, make today's rep tiny but non-negotiable." },
  { law: "4th Law · Make it satisfying", title: "Don't break the chain", body: "Habit tracking is obvious, attractive and satisfying all at once. The streak itself becomes the reward.", action: "Check off your habits as soon as you finish them, not at the end of the day." },
  { law: "4th Law · Make it satisfying", title: "Immediate rewards", body: "What is immediately rewarded is repeated. What is immediately punished is avoided. Add a small reward to the end of a habit.", action: "Decide what the reward is for finishing today's hardest habit." },
  { law: "Plateau of latent potential", title: "Trust the process", body: "Habits often appear to make no difference until you cross a critical threshold. Breakthroughs are the product of many previous actions.", action: "Look at your monthly grid instead of today's mood." },
  { law: "Systems over goals", title: "Fall in love with systems", body: "You do not rise to the level of your goals. You fall to the level of your systems.", action: "Review one habit: is the system (cue, time, place) actually designed to work?" },
  { law: "Goldilocks rule", title: "Just manageable difficulty", body: "Humans experience peak motivation when working on tasks right on the edge of their current abilities.", action: "If a habit feels boring, raise the bar slightly. If it feels heavy, shrink it." },
  { law: "Habit scorecard", title: "Awareness before change", body: "Until you make the unconscious conscious it will direct your life. List your daily behaviours and mark them +, - or =.", action: "Note one behaviour today that's quietly working against you." },
  { law: "Identity", title: "Decide who you are", body: "The goal is not to read a book, it's to become a reader. Focus on who you wish to become, then prove it with small wins.", action: "Write or refresh your identity statement in Settings." },
  { law: "1st Law · Make it obvious", title: "Time and place", body: "The two most common cues are time and location. A habit without a specific cue depends on willpower.", action: "Give every habit on your list a cue time." },
  { law: "4th Law · Make it satisfying", title: "Accountability", body: "A habit contract makes the costs of your bad habits public and painful. Knowing someone is watching is a powerful motivator.", action: "Share your Insights page with someone who'll ask about it." },
  { law: "Boredom", title: "Show up on the bad days", body: "The greatest threat to success is not failure but boredom. Professionals stick to the schedule; amateurs let life get in the way.", action: "Do the scheduled rep even if it's uninspired. Especially then." },
  { law: "Reflection", title: "Review and adjust", body: "Reflection and review lets you remain conscious of your performance over time and course-correct.", action: "Spend two minutes on Insights: which habit needs attention this week?" },
];

export function principleForDay(date: ISODate): Principle {
  return PRINCIPLES[(dayOfYear(date) - 1) % PRINCIPLES.length];
}

export type Quote = { text: string; author: string; source: "local" | "zenquotes" };

export const LOCAL_QUOTES: Quote[] = [
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", source: "local" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear", source: "local" },
  { text: "Habits are the compound interest of self-improvement.", author: "James Clear", source: "local" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant", source: "local" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", source: "local" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca", source: "local" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun", source: "local" },
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard", source: "local" },
  { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson", source: "local" },
  { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall", source: "local" },
  { text: "First we make our habits, then our habits make us.", author: "John Dryden", source: "local" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln (attributed)", source: "local" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Laozi", source: "local" },
  { text: "Well begun is half done.", author: "Aristotle", source: "local" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier", source: "local" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali", source: "local" },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin", source: "local" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese proverb", source: "local" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", source: "local" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso", source: "local" },
  { text: "Your net worth to the world is usually determined by what remains after your bad habits are subtracted from your good ones.", author: "Benjamin Franklin", source: "local" },
];

export function localQuoteForDay(date: ISODate): Quote {
  return LOCAL_QUOTES[(dayOfYear(date) * 7) % LOCAL_QUOTES.length];
}

type Zen = { q: string; a: string }[];

/**
 * Daily quote. Provider is controlled by QUOTE_PROVIDER: "zenquotes" (default) or "local".
 * Network failures always fall back to the bundled list so the dashboard never breaks.
 */
export async function getDailyQuote(date: ISODate): Promise<Quote> {
  const providerName = process.env.QUOTE_PROVIDER ?? "zenquotes";
  if (providerName === "local") return localQuoteForDay(date);
  try {
    return await cached<Quote>(`quote:${date}`, 24 * 3600, async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      try {
        const res = await fetch("https://zenquotes.io/api/today", { signal: ctrl.signal });
        if (!res.ok) throw new Error(`zenquotes ${res.status}`);
        const data = (await res.json()) as Zen;
        const first = data[0];
        if (!first?.q) throw new Error("empty quote");
        return { text: first.q, author: first.a || "Unknown", source: "zenquotes" };
      } finally {
        clearTimeout(t);
      }
    });
  } catch {
    return localQuoteForDay(date);
  }
}
