import type { HabitInput } from "@/app/actions/habits";

export type HabitTemplate = { label: string; emoji: string; input: Partial<HabitInput> };

export const HABIT_TEMPLATES: HabitTemplate[] = [
  { label: "Wake up at 5am", emoji: "🌅", input: { name: "Wake up at 5am", color: "amber", cueTime: "05:00", identity: "I am a disciplined early riser", twoMinuteVersion: "Sit up and put both feet on the floor" } },
  { label: "Meditation", emoji: "🧘", input: { name: "Meditation", color: "violet", cueTime: "06:30", identity: "I am a calm, present person", twoMinuteVersion: "Three deep breaths on the cushion", stackAfter: "I brush my teeth" } },
  { label: "Gym", emoji: "🏋️", input: { name: "Gym", color: "rose", frequency: "weekly", timesPerPeriod: 4, identity: "I am someone who never misses a workout", twoMinuteVersion: "Put on gym clothes and drive there" } },
  { label: "Read 10 pages", emoji: "📚", input: { name: "Read 10 pages", color: "sky", cueTime: "21:00", identity: "I am a reader", twoMinuteVersion: "Read one page", stackAfter: "I get into bed" } },
  { label: "Eat healthy", emoji: "🥗", input: { name: "Eat healthy", color: "lime", identity: "I am someone who fuels their body well" } },
  { label: "Plan next day", emoji: "🗓️", input: { name: "Plan next day", color: "coral", cueTime: "20:30", twoMinuteVersion: "Write tomorrow's top 3", stackAfter: "I finish dinner" } },
  { label: "Journaling", emoji: "✍️", input: { name: "Journaling", color: "pink", cueTime: "07:00", twoMinuteVersion: "Write one sentence", stackAfter: "I pour my morning coffee" } },
  { label: "Cold shower", emoji: "🚿", input: { name: "Cold shower", color: "sky", twoMinuteVersion: "30 seconds cold at the end" } },
  { label: "No social media", emoji: "📵", input: { name: "No social media", color: "mint", kind: "break", identity: "I am in control of my attention", twoMinuteVersion: "Phone stays in another room until 9am" } },
  { label: "Drink 2L water", emoji: "💧", input: { name: "Drink 2L water", color: "sky", twoMinuteVersion: "Fill the bottle first thing" } },
  { label: "Walk 10k steps", emoji: "🚶", input: { name: "Walk 10k steps", color: "lime", twoMinuteVersion: "Walk around the block" } },
  { label: "Call someone you care about", emoji: "📞", input: { name: "Call someone you care about", color: "coral", frequency: "weekly", timesPerPeriod: 1 } },
  { label: "Weekly review", emoji: "🧭", input: { name: "Plan the week ahead", color: "violet", frequency: "weekly", timesPerPeriod: 1, cueTime: "17:00" } },
  { label: "Budget review", emoji: "💸", input: { name: "Review budget", color: "amber", frequency: "monthly", timesPerPeriod: 1 } },
];
