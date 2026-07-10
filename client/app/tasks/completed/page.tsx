"use client";

import React, { useState } from "react";

interface CompletedTask {
  id: number;
  title: string;
  description: string;
  completedAt: string;
  studentName: string;
  program: string;
}

export default function CompletedTasksPage() {
  const [completedTasks] = useState<CompletedTask[]>([
    {
      id: 1,
      title: "Full Stack Authentication Logic Setup",
      description: "Implemented JWT tokens, passport validation, middleware route guards, and password hashing standard.",
      completedAt: "2026-07-09T18:45:00Z",
      studentName: "Muhammad Ali Khan",
      program: "Full Stack AI Engineer"
    },
    {
      id: 2,
      title: "Kafka Event-Driven Architecture Pipeline",
      description: "Wrote consumer/producer message streaming endpoints and verified broker failover scenarios.",
      completedAt: "2026-07-08T14:20:00Z",
      studentName: "Sarah Ahmed",
      program: "DevOps Engineer"
    }
  ]);

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
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Complete Tasks</h2>
            <p className="text-on-surface-variant font-light text-base mt-2">Audit and review educational milestones successfully achieved by student participants.</p>
          </div>
        </div>

        {/* Completed Tasks List */}
        <div className="space-y-6">
          {completedTasks.length === 0 ? (
            <div className="task-glass-panel p-16 text-center rounded-3xl">
              <span className="material-symbols-outlined text-on-surface-variant/40 text-5xl mb-4 block">
                inbox
              </span>
              <p className="text-on-surface-variant font-light">No tasks have been audited as completed yet.</p>
            </div>
          ) : (
            completedTasks.map((task) => (
              <div key={task.id} className="task-glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/5 hover:border-primary/30 transition-all duration-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{task.title}</h3>
                    <span className="px-2.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant/80 max-w-2xl">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant/50">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">person</span>
                      {task.studentName} ({task.program})
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      Completed on: {new Date(task.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
    </div>
  );
}
