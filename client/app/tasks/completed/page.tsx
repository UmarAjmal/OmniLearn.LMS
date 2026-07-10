"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";

const COURSES = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer", icon: "smart_toy" },
  { id: "web-dev", label: "Web Development", icon: "code" },
  { id: "app-dev", label: "App Development", icon: "phone_android" },
  { id: "devops", label: "DevOps", icon: "cloud_sync" },
];

interface TaskRecord {
  id: number;
  studentName: string;
  studentAvatar?: string;
  courseId: string;
  courseLabel: string;
  taskName: string;
  status: "completed" | "pending" | "marked";
  score?: number;
  submissionDetails?: {
    githubUrl: string;
    liveUrl: string;
    studentNotes: string;
    submittedAt: string;
  };
}

export default function CompletedTasksPage() {
  const [selectedCourse, setSelectedCourse] = useState("fullstack-ai");
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<TaskRecord | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  // Seed highly detailed mock database
  const [tasks, setTasks] = useState<TaskRecord[]>([
    // Full Stack AI Engineer
    {
      id: 101,
      studentName: "Muhammad Umar Ajmal",
      studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBodHFNUpxhuuuel4X1YH69Bzjd8eld_2A8IqbRAytMStzuG0hXaTt0LCK6CtzrUhYlmdUJ7MD0tAnZfLQVOEFJwsftuFc1vcwGvGpd7HvcjYPE_ZGE9P9PBy6tpeE4FJgFXIi6gbwvo_xr4QJ_Oqg9lH5Xy0J6zFdm_AZRFayBN6rl922oZTq-L3WZHGNQpZ6YmjUPRTE8uVBgDy8XhzCqP_kNo7-m1RmH99bDMe4GTqr5aKE0W6FBnBE0b_l_joA3NnrKFUjcT2p3",
      courseId: "fullstack-ai",
      courseLabel: "Full Stack AI Engineer",
      taskName: "Build LangChain RAG Pipeline with ChromaDB",
      status: "completed",
      submissionDetails: {
        githubUrl: "https://github.com/umar/langchain-rag-pipeline",
        liveUrl: "https://rag-demo.falconswift.online",
        studentNotes: "Completed RAG implementation using Chroma vector database and Gemini API. Chunk size is 500 characters with 10% overlap.",
        submittedAt: "2026-07-09T18:45:00Z"
      }
    },
    {
      id: 102,
      studentName: "Elena Rostova",
      studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx",
      courseId: "fullstack-ai",
      courseLabel: "Full Stack AI Engineer",
      taskName: "Build LangChain RAG Pipeline with ChromaDB",
      status: "pending"
    },
    {
      id: 103,
      studentName: "Amara Okoye",
      studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDa0Oqlh4FijmMIUgyEIAjtq6L6al5O1wWksfJDlypBQ5Gt4Y1VIpXxaKypW9f5gx3vUpGRas-T4EQOnI_tOccnQDyQ_cOWzVseRuRM1w7cajgYlskkYBQEXfi-SZDPaeFmVAGA31V1NJhtsXBwWFl_DNVzN1TwWecR7rnowkpkQnXZQ-IYLTpUJeMqmZwIjY-ZPSjolb8f5mu4P_hMT5zIShEnUuP1Z_C9ypdGiQ5iWsmBSvLcHFsDc9ceoCrpe_GPzxEAGXCRbeJZ",
      courseId: "fullstack-ai",
      courseLabel: "Full Stack AI Engineer",
      taskName: "Deploy Deep Learning Model on FastAPI",
      status: "marked",
      score: 95
    },

    // Web Development
    {
      id: 201,
      studentName: "Marcus Aurelius",
      studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqg6lDqFufGA9x0LwbeSh0Mr3Uc1oXYQlvy_j5H_g9nVnr3W4x8WlfILXtJiBevVZ3_c1aeHNxmCv1LaKbUQNP1E2vI50qJ3TeZ6oUTlm18EGEdmv13wUbgXPk-DYCBIci6nKiOKu2dRfiZ-mPZyFdZ2sVldoSx9CvvMZlXMnfiAJQZKll-Sj53cFwyDU3xbjLh6BzNfsQZCg4p_DQZ6UxBJSRsRMIbvzS2jmxrUioshSTCpE-QH3iJ84-txlAB-KbdxYt992qMT4R",
      courseId: "web-dev",
      courseLabel: "Web Development",
      taskName: "Build Responsive E-Commerce Grid with Vanilla CSS",
      status: "completed",
      submissionDetails: {
        githubUrl: "https://github.com/marcus/css-grid-ecommerce",
        liveUrl: "https://marcus-shop.vercel.app",
        studentNotes: "A fully responsive layout made without external frameworks. Responsive down to 320px screens using media queries.",
        submittedAt: "2026-07-09T10:15:00Z"
      }
    },
    {
      id: 202,
      studentName: "Jane Doe",
      courseId: "web-dev",
      courseLabel: "Web Development",
      taskName: "Build Responsive E-Commerce Grid with Vanilla CSS",
      status: "pending"
    },
    {
      id: 203,
      studentName: "Zayn Malik",
      courseId: "web-dev",
      courseLabel: "Web Development",
      taskName: "Create Interactive Dashboard UI with Chart.js",
      status: "marked",
      score: 88
    },

    // App Development
    {
      id: 301,
      studentName: "Elena Rostova",
      studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx",
      courseId: "app-dev",
      courseLabel: "App Development",
      taskName: "Setup React Native Navigation Stack & Auth Flow",
      status: "completed",
      submissionDetails: {
        githubUrl: "https://github.com/elena/rn-navigation-auth",
        liveUrl: "https://expo.dev/@elena/rn-nav-auth-demo",
        studentNotes: "Utilized React Navigation v6 stack and tab navigators. Context state API manages auth token validation locally.",
        submittedAt: "2026-07-09T22:30:00Z"
      }
    },
    {
      id: 302,
      studentName: "Marcus Aurelius",
      studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqg6lDqFufGA9x0LwbeSh0Mr3Uc1oXYQlvy_j5H_g9nVnr3W4x8WlfILXtJiBevVZ3_c1aeHNxmCv1LaKbUQNP1E2vI50qJ3TeZ6oUTlm18EGEdmv13wUbgXPk-DYCBIci6nKiOKu2dRfiZ-mPZyFdZ2sVldoSx9CvvMZlXMnfiAJQZKll-Sj53cFwyDU3xbjLh6BzNfsQZCg4p_DQZ6UxBJSRsRMIbvzS2jmxrUioshSTCpE-QH3iJ84-txlAB-KbdxYt992qMT4R",
      courseId: "app-dev",
      courseLabel: "App Development",
      taskName: "Setup React Native Navigation Stack & Auth Flow",
      status: "pending"
    },

    // DevOps
    {
      id: 401,
      studentName: "Amara Okoye",
      studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDa0Oqlh4FijmMIUgyEIAjtq6L6al5O1wWksfJDlypBQ5Gt4Y1VIpXxaKypW9f5gx3vUpGRas-T4EQOnI_tOccnQDyQ_cOWzVseRuRM1w7cajgYlskkYBQEXfi-SZDPaeFmVAGA31V1NJhtsXBwWFl_DNVzN1TwWecR7rnowkpkQnXZQ-IYLTpUJeMqmZwIjY-ZPSjolb8f5mu4P_hMT5zIShEnUuP1Z_C9ypdGiQ5iWsmBSvLcHFsDc9ceoCrpe_GPzxEAGXCRbeJZ",
      courseId: "devops",
      courseLabel: "DevOps",
      taskName: "Configure Docker Compose for Multi-Container Setup",
      status: "completed",
      submissionDetails: {
        githubUrl: "https://github.com/amara/docker-compose-setup",
        liveUrl: "https://hub.docker.com/r/amara/docker-compose-setup",
        studentNotes: "Configured multi-container service with Nginx proxy, Node backend, and PostgreSQL database with persistent volume volumes.",
        submittedAt: "2026-07-08T15:00:00Z"
      }
    },
    {
      id: 402,
      studentName: "Muhammad Umar Ajmal",
      studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBodHFNUpxhuuuel4X1YH69Bzjd8eld_2A8IqbRAytMStzuG0hXaTt0LCK6CtzrUhYlmdUJ7MD0tAnZfLQVOEFJwsftuFc1vcwGvGpd7HvcjYPE_ZGE9P9PBy6tpeE4FJgFXIi6gbwvo_xr4QJ_Oqg9lH5Xy0J6zFdm_AZRFayBN6rl922oZTq-L3WZHGNQpZ6YmjUPRTE8uVBgDy8XhzCqP_kNo7-m1RmH99bDMe4GTqr5aKE0W6FBnBE0b_l_joA3NnrKFUjcT2p3",
      courseId: "devops",
      courseLabel: "DevOps",
      taskName: "Setup CI/CD Pipeline via GitHub Actions",
      status: "pending"
    }
  ]);

  // Handle submit grade score
  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForReview) return;
    
    const scoreNum = Number(gradeScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error("Please enter a valid score percentage between 0 and 100.");
      return;
    }

    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === selectedTaskForReview.id) {
        return {
          ...t,
          status: "marked",
          score: scoreNum
        };
      }
      return t;
    }));

    toast.success(`🎉 Graded successfully! ${selectedTaskForReview.studentName} scored ${scoreNum}/100.`);
    setSelectedTaskForReview(null);
    setGradeScore("");
    setReviewNotes("");
  };

  // Filter tasks based on status & current course filter selection
  const completedList = tasks.filter(t => t.courseId === selectedCourse && t.status === "completed");
  const pendingList = tasks.filter(t => t.courseId === selectedCourse && t.status === "pending");
  const markedList = tasks.filter(t => t.courseId === selectedCourse && t.status === "marked");

  return (
    <div className="relative text-xs font-sans text-white/90">
      <style dangerouslySetInnerHTML={{__html: `
        .glacier-card {
          background: rgba(10, 20, 38, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
        .table-header {
          color: rgba(206, 229, 255, 0.45);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 10px;
        }
      `}} />

      <div className="p-2 md:p-6 flex-1 relative z-10 w-full max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Complete Tasks Audit</h2>
          <p className="text-on-surface-variant font-light text-xs mt-1">Review student task completions, grade deliverables, and monitor learning statuses.</p>
        </div>

        {/* Course Filter Pills */}
        <div className="glacier-card p-4 rounded-2xl">
          <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2.5">
            Filter by Course Department
          </label>
          <div className="flex flex-wrap gap-2">
            {COURSES.map((course) => {
              const isActive = selectedCourse === course.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourse(course.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(252,163,17,0.15)]"
                      : "border-white/10 bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{course.icon}</span>
                  {course.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List 1: Submitted & Completed Tasks awaiting review */}
        <div className="glacier-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Completions Submitted</h3>
              <p className="text-on-surface-variant text-[11px] mt-0.5">Tasks successfully uploaded by students and awaiting grading reviews.</p>
            </div>
            <span className="bg-primary/10 border border-primary/20 text-primary font-bold text-[11px] px-3 py-1 rounded-full">
              {completedList.length} Awaiting
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a1426]/30">
                  <th className="px-6 py-3.5 table-header">Name</th>
                  <th className="px-6 py-3.5 table-header">Course</th>
                  <th className="px-6 py-3.5 table-header">Task Name</th>
                  <th className="px-6 py-3.5 table-header">Status</th>
                  <th className="px-6 py-3.5 table-header text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {completedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-on-surface-variant/60 font-light">
                      No submissions awaiting review for this course.
                    </td>
                  </tr>
                ) : (
                  completedList.map((task) => (
                    <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        <img src={task.studentAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx"} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                        {task.studentName}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">{task.courseLabel}</td>
                      <td className="px-6 py-4 text-white font-medium">{task.taskName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Submitted
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskForReview(task)}
                          className="p-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Review deliverable details"
                        >
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* List 2: Pending Tasks (Locked Action) */}
        <div className="glacier-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Pending Assignments</h3>
              <p className="text-on-surface-variant text-[11px] mt-0.5">Tasks currently in-progress or not yet completed by students.</p>
            </div>
            <span className="bg-white/5 border border-white/10 text-on-surface-variant font-bold text-[11px] px-3 py-1 rounded-full">
              {pendingList.length} Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a1426]/30">
                  <th className="px-6 py-3.5 table-header">Name</th>
                  <th className="px-6 py-3.5 table-header">Course</th>
                  <th className="px-6 py-3.5 table-header">Task Name</th>
                  <th className="px-6 py-3.5 table-header">Status</th>
                  <th className="px-6 py-3.5 table-header text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-on-surface-variant/60 font-light">
                      No pending assignments active for this course.
                    </td>
                  </tr>
                ) : (
                  pendingList.map((task) => (
                    <tr key={task.id} className="hover:bg-white/[0.02] transition-colors opacity-75">
                      <td className="px-6 py-4 font-bold text-white/80 flex items-center gap-2">
                        <img src={task.studentAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx"} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                        {task.studentName}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant/70">{task.courseLabel}</td>
                      <td className="px-6 py-4 text-white/70">{task.taskName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          In Progress
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="p-1.5 rounded-full bg-white/5 border border-white/5 text-on-surface-variant/40 cursor-not-allowed inline-flex items-center justify-center"
                          disabled
                          title="Review locked — Deliverable not yet submitted"
                        >
                          <span className="material-symbols-outlined text-[18px]">lock</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* List 3: Graded & Marked Tasks */}
        <div className="glacier-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Graded Deliverables</h3>
              <p className="text-on-surface-variant text-[11px] mt-0.5">Tasks successfully reviewed, marked, and graded by the evaluator.</p>
            </div>
            <span className="bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-[11px] px-3 py-1 rounded-full">
              {markedList.length} Reviewed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a1426]/30">
                  <th className="px-6 py-3.5 table-header">Name</th>
                  <th className="px-6 py-3.5 table-header">Course</th>
                  <th className="px-6 py-3.5 table-header">Task Name</th>
                  <th className="px-6 py-3.5 table-header">Status</th>
                  <th className="px-6 py-3.5 table-header text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {markedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-on-surface-variant/60 font-light">
                      No graded deliverables logged for this course.
                    </td>
                  </tr>
                ) : (
                  markedList.map((task) => (
                    <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        <img src={task.studentAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx"} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                        {task.studentName}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">{task.courseLabel}</td>
                      <td className="px-6 py-4 text-white font-medium">{task.taskName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                          Graded
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-primary text-sm">
                        {task.score}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Dynamic Review Deliverable Modal Box */}
      {selectedTaskForReview && selectedTaskForReview.submissionDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glacier-card w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-[#101f38] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">rate_review</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Review Task Deliverable</h4>
                  <p className="text-[10px] text-on-surface-variant">Review code repository and allocate final score.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskForReview(null)}
                className="text-on-surface-variant hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              {/* Student Metadata */}
              <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <img src={selectedTaskForReview.studentAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx"} alt="" className="w-8 h-8 rounded-full border border-white/10" />
                <div>
                  <p className="text-xs font-bold text-white">{selectedTaskForReview.studentName}</p>
                  <p className="text-[10px] text-on-surface-variant">{selectedTaskForReview.courseLabel} · Task #{selectedTaskForReview.id}</p>
                </div>
              </div>

              {/* Task Details */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Assigned Objective</span>
                <p className="text-xs font-semibold text-white bg-[#0a1426]/30 p-2.5 rounded-lg border border-white/5">{selectedTaskForReview.taskName}</p>
              </div>

              {/* Deliverable Submissions */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Deliverable Links</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={selectedTaskForReview.submissionDetails.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl flex items-center gap-2.5 transition-all text-xs font-medium text-white decoration-none"
                  >
                    <span className="material-symbols-outlined text-primary text-base">terminal</span>
                    <div className="truncate">
                      <p className="text-[10px] text-on-surface-variant font-bold leading-none mb-1">GitHub Repository</p>
                      <p className="truncate text-white/80 leading-none">{selectedTaskForReview.submissionDetails.githubUrl}</p>
                    </div>
                  </a>
                  <a
                    href={selectedTaskForReview.submissionDetails.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl flex items-center gap-2.5 transition-all text-xs font-medium text-white decoration-none"
                  >
                    <span className="material-symbols-outlined text-primary text-base">language</span>
                    <div className="truncate">
                      <p className="text-[10px] text-on-surface-variant font-bold leading-none mb-1">Hosted Prototype</p>
                      <p className="truncate text-white/80 leading-none">{selectedTaskForReview.submissionDetails.liveUrl}</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Student Notes */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Student Notes / Remarks</span>
                <p className="text-xs text-on-surface-variant/90 bg-[#0a1426]/30 p-3 rounded-lg border border-white/5 leading-relaxed">
                  "{selectedTaskForReview.submissionDetails.studentNotes}"
                </p>
              </div>

              {/* Grading Input Form */}
              <form onSubmit={handleGradeSubmit} className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">
                    Score (Percentage) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 90"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    className="w-full bg-[#0a1426]/60 border border-primary/30 rounded-lg p-3 text-white focus:outline-none focus:border-primary text-xs font-bold text-center"
                    required
                  />
                </div>
                <div className="sm:col-span-8 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTaskForReview(null)}
                    className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all cursor-pointer text-[10px] uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/95 text-black font-bold py-3 rounded-xl shadow-[0_4px_15px_rgba(252,163,17,0.2)] transition-all cursor-pointer text-[10px] uppercase tracking-wider"
                  >
                    Submit Grade
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

      {/* Decorative Background Glows */}
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
    </div>
  );
}
