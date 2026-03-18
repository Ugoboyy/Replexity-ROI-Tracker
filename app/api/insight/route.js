import grok from "@/lib/grok";

export async function POST(req) {
  try {
    const {
      clientName,
      automationType,
      weekNumber,
      monthNumber,
      hoursSaved,
      moneySaved,
      errorsCaught,
      issuesNoted,
      satisfaction,
      cumulativeHours,
      cumulativeMoney,
    } = await req.json();

    const period = monthNumber ? "month" : "week";
    const periodNumber = monthNumber || weekNumber;

    const prompt = `You are an automation analyst writing a ${period}ly insight for a business that deployed an AI automation or custom Agentic system. Be specific, encouraging, and practical.

Client: ${clientName}
Automation type: ${automationType}
${period === "month" ? "Month" : "Week"} number: ${periodNumber}
This ${period}: Saved ${hoursSaved} hours and $${moneySaved}.
Errors caught by automation: ${errorsCaught}
Issues noted: ${issuesNoted || "None"}
Satisfaction: ${satisfaction}/5
Cumulative to date: ${cumulativeHours} hours and $${cumulativeMoney}

Write exactly 2 sentences:
1. A specific observation about this ${period}'s performance
2. One concrete optimisation suggestion for next ${period}
Do not use bullet points. Do not use headers. Just 2 sentences.`;

    const completion = await grok.chat.completions.create({
      model: "grok-3",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 256,
    });

    const insight = completion.choices[0].message.content.trim();
    return Response.json({ insight });
  } catch (error) {
    console.error("Grok insight error:", error);
    return Response.json({
      insight:
        "This period showed steady automation performance. Consider reviewing error logs to identify further optimisation opportunities.",
    });
  }
}
