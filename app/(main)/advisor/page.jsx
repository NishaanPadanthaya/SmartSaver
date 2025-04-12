"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithAdvisor } from "@/actions/advisor";
import { Sparkles, Send, ArrowUp, ArrowDown, Wallet, PiggyBank } from "lucide-react";
import { format } from "date-fns";

export default function AdvisorPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi there! I'm your SmartSaver AI Financial Advisor. How can I help you with your finances today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [financialSummary, setFinancialSummary] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Make sure we have at least the welcome message and the user message
      const messagesToSend = [...messages, userMessage].filter(msg =>
        // Filter out any empty messages
        msg.content && msg.content.trim() !== ""
      );

      // Add all previous messages for context
      const response = await chatWithAdvisor(messagesToSend);

      if (response.error) {
        setMessages(prev => [...prev, { role: "assistant", content: response.content }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: response.content }]);
        if (response.financialSummary) {
          setFinancialSummary(response.financialSummary);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Suggested questions
  const suggestedQuestions = [
    "How can I improve my savings?",
    "Where am I spending the most money?",
    "How does my spending compare to last month?",
    "What's a good budget for me?",
    "How can I reduce my expenses?"
  ];

  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main chat area */}
        <div className="flex-1">
          <Card className="h-[calc(100vh-12rem)] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="gradient-purple gradient-text">AI Financial Advisor</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-gradient-purple text-white"
                        : "bg-secondary"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-xl px-4 py-2 bg-secondary">
                    <div className="flex space-x-2 items-center">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Ask about your finances..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-purple hover:bg-gradient-purple/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              {/* Suggested questions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Financial summary sidebar */}
        <div className="w-full md:w-80">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {financialSummary ? (
                <>
                  {/* Accounts */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Wallet className="h-4 w-4 text-blue-500" /> Accounts
                    </h3>
                    <div className="space-y-2">
                      {financialSummary.accounts.map((account, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{account.name}</span>
                          <span className="font-medium">${account.balance.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <PiggyBank className="h-4 w-4 text-green-500" /> Budget
                    </h3>
                    {financialSummary.budget ? (
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span>Monthly Budget:</span>
                          <span className="font-medium">${financialSummary.budget.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Spent So Far:</span>
                          <span className="font-medium">${financialSummary.currentMonthStats.totalExpenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining:</span>
                          <span className="font-medium">${(financialSummary.budget.amount - financialSummary.currentMonthStats.totalExpenses).toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No budget set</p>
                    )}
                  </div>

                  {/* Current Month Stats */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <span className="gradient-blue gradient-text">{format(new Date(), 'MMMM yyyy')}</span>
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3 text-green-500" /> Income
                        </span>
                        <span className="font-medium">${financialSummary.currentMonthStats.totalIncome.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <ArrowDown className="h-3 w-3 text-red-500" /> Expenses
                        </span>
                        <span className="font-medium">${financialSummary.currentMonthStats.totalExpenses.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium pt-1 border-t">
                        <span>Net</span>
                        <span>${(financialSummary.currentMonthStats.totalIncome - financialSummary.currentMonthStats.totalExpenses).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Expense Categories */}
                  {Object.keys(financialSummary.currentMonthStats.byCategory).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Top Expenses</h3>
                      <div className="space-y-1 text-sm">
                        {Object.entries(financialSummary.currentMonthStats.byCategory)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([category, amount], index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span>{category}</span>
                              <span className="font-medium">${amount.toFixed(2)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Ask the AI advisor a question to see your financial summary</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
