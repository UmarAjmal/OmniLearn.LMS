"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";

export default function NewTaskPage() {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error("Please enter a task title.");
      return;
    }
    toast.success(`Task "${taskTitle}" initialized successfully (local shell state).`);
    setTaskTitle("");
    setTaskDescription("");
    setDueDate("");
    setPriority("medium");
  };

  return (
    <div className="relative">
      <style dangerouslySetInnerHTML={{__html: `
        .task-glass-panel {
            background: rgba(20, 33, 61, 0.7);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 50px rgba(4, 18, 46, 0.4);
        }
      `}} />

      <div className="p-2 md:p-8 flex-1 animate-fade-in relative z-10 w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">New Task</h2>
            <p className="text-on-surface-variant font-light text-base mt-2">Initialize and assign new objectives, milestones, or learning tasks.</p>
          </div>
        </div>

        {/* Task Form Card */}
        <div className="task-glass-panel p-8 rounded-3xl max-w-2xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                Task Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Implement Distributed Database Replication"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full bg-[#14213D] border border-white/10 rounded-lg p-3.5 text-white focus:outline-none focus:border-primary/50 text-sm font-medium transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                Description / Objectives
              </label>
              <textarea
                placeholder="Describe the learning objectives, instructions, and outcomes for the students..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={4}
                className="w-full bg-[#14213D] border border-white/10 rounded-lg p-3.5 text-white focus:outline-none focus:border-primary/50 text-sm font-medium transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#14213D] border border-white/10 rounded-lg p-3.5 text-white focus:outline-none focus:border-primary/50 text-sm font-medium transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Priority / Impact Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#14213D] border border-white/10 rounded-lg p-3.5 text-white focus:outline-none focus:border-primary/50 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <option value="low">Low Impact</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Milestone</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
              <button
                type="submit"
                className="bg-primary text-black font-bold px-8 py-3.5 rounded-xl shadow-[0_15px_30px_rgba(252,163,17,0.2)] hover:shadow-[0_20px_40px_rgba(252,163,17,0.3)] active:scale-95 transition-all cursor-pointer text-sm font-semibold uppercase tracking-wider"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
    </div>
  );
}
