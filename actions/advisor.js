"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to serialize Decimal values
const serializeAmount = (obj) => {
  if (!obj) return null;

  const serialized = { ...obj };
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  return serialized;
};

// Get user's financial data for the AI
async function getUserFinancialData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Get accounts
  const accounts = await db.account.findMany({
    where: { userId: user.id },
  });

  // Get budget
  const budget = await db.budget.findFirst({
    where: { userId: user.id },
  });

  // Get current month's transactions
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);

  const currentMonthTransactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startOfCurrentMonth,
        lte: endOfCurrentMonth,
      },
    },
    orderBy: { date: "desc" },
    take: 50, // Limit to recent transactions
  });

  // Get previous month's transactions
  const previousMonth = subMonths(now, 1);
  const startOfPrevMonth = startOfMonth(previousMonth);
  const endOfPrevMonth = endOfMonth(previousMonth);

  const previousMonthTransactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startOfPrevMonth,
        lte: endOfPrevMonth,
      },
    },
  });

  // Calculate monthly stats
  const currentMonthStats = calculateMonthlyStats(currentMonthTransactions);
  const previousMonthStats = calculateMonthlyStats(previousMonthTransactions);

  return {
    accounts: accounts.map(serializeAmount),
    budget: budget ? serializeAmount(budget) : null,
    currentMonthTransactions: currentMonthTransactions.map(serializeAmount),
    currentMonthStats,
    previousMonthStats,
    userName: user.name || "User",
  };
}

// Calculate monthly statistics
function calculateMonthlyStats(transactions) {
  return transactions.reduce(
    (stats, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : t.amount.toNumber();

      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}

// Chat with the AI advisor
export async function chatWithAdvisor(messages) {
  try {
    const userData = await getUserFinancialData();

    // Format the financial data for the AI
    const formattedAccounts = userData.accounts.map(account =>
      `Account: ${account.name} (${account.type}), Balance: $${account.balance.toFixed(2)}`
    ).join("\n");

    const formattedBudget = userData.budget
      ? `Monthly Budget: $${userData.budget.amount.toFixed(2)}`
      : "No budget set";

    const currentMonthName = format(new Date(), 'MMMM yyyy');
    const previousMonthName = format(subMonths(new Date(), 1), 'MMMM yyyy');

    const formattedCurrentStats = `
${currentMonthName} Stats:
- Total Income: $${userData.currentMonthStats.totalIncome.toFixed(2)}
- Total Expenses: $${userData.currentMonthStats.totalExpenses.toFixed(2)}
- Net: $${(userData.currentMonthStats.totalIncome - userData.currentMonthStats.totalExpenses).toFixed(2)}
- Top Expense Categories: ${Object.entries(userData.currentMonthStats.byCategory)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([category, amount]) => `${category} ($${amount.toFixed(2)})`)
  .join(", ")}
`;

    const formattedPreviousStats = `
${previousMonthName} Stats:
- Total Income: $${userData.previousMonthStats.totalIncome.toFixed(2)}
- Total Expenses: $${userData.previousMonthStats.totalExpenses.toFixed(2)}
- Net: $${(userData.previousMonthStats.totalIncome - userData.previousMonthStats.totalExpenses).toFixed(2)}
`;

    // Recent transactions (just a few for context)
    const recentTransactions = userData.currentMonthTransactions
      .slice(0, 5)
      .map(t =>
        `${format(new Date(t.date), 'MMM dd')}: ${t.type === "EXPENSE" ? "-" : "+"}$${t.amount.toFixed(2)} - ${t.description || t.category}`
      ).join("\n");

    // Create system prompt with financial context
    const systemPrompt = `
You are SmartSaver's AI Financial Advisor, a helpful and knowledgeable financial assistant.
You have access to the following financial information about the user (${userData.userName}):

${formattedAccounts}

${formattedBudget}

${formattedCurrentStats}

${formattedPreviousStats}

Recent Transactions:
${recentTransactions}

Your role is to:
1. Provide personalized financial advice based on the user's spending patterns, income, and budget
2. Answer questions about their finances in a clear, concise manner
3. Suggest ways to improve their financial health
4. Explain financial concepts in simple terms
5. Be encouraging and positive, while being honest about financial realities

Keep your responses concise and focused on the user's question. Use specific numbers from their financial data when relevant.
Don't make up information that isn't provided in the context.
`;

    // Format the conversation history for the AI
    // Gemini API has a different format for messages
    // First, create the system message
    const systemMessage = {
      role: "user",
      parts: [{ text: systemPrompt }]
    };

    // Then format the user messages
    const userMessages = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Call the Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Start a chat session
    // If there's only one message (the user's current message), don't include any history
    // Otherwise, include the system message and all but the last user message
    const chatHistory = userMessages.length <= 1
      ? [systemMessage]
      : [systemMessage, ...userMessages.slice(0, -1)];

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });

    // Check if there are any user messages
    if (userMessages.length === 0) {
      // If no user messages, just return the system prompt as a response
      return {
        content: "Hello! I'm your SmartSaver AI Financial Advisor. How can I help you with your finances today?",
        financialSummary: {
          accounts: userData.accounts,
          budget: userData.budget,
          currentMonthStats: userData.currentMonthStats,
          previousMonthStats: userData.previousMonthStats,
        }
      };
    }

    // Get the last user message
    const lastMessage = userMessages[userMessages.length - 1];

    // Send the message and get the response
    const result = await chat.sendMessage(lastMessage.parts[0].text);

    return {
      content: result.response.text(),
      financialSummary: {
        accounts: userData.accounts,
        budget: userData.budget,
        currentMonthStats: userData.currentMonthStats,
        previousMonthStats: userData.previousMonthStats,
      }
    };
  } catch (error) {
    console.error("Error in chatWithAdvisor:", error);
    return {
      content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
      error: error.message
    };
  }
}
