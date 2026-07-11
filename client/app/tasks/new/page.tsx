"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

const COURSES = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer", icon: "smart_toy" },
  { id: "web-dev", label: "Web Development", icon: "code" },
  { id: "app-dev", label: "App Development", icon: "phone_android" },
  { id: "devops", label: "DevOps", icon: "cloud_sync" },
];

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  avatar_url?: string;
  email: string;
}

interface ReferenceLink {
  id: string;
  title: string;
  url: string;
}

export default function NewTaskPage() {
  const [selectedCourse, setSelectedCourse] = useState("fullstack-ai");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskContent, setTaskContent] = useState("");
  const [points, setPoints] = useState("100");
  const [dueDate, setDueDate] = useState("");
  
  // Reference Links
  const [links, setLinks] = useState<ReferenceLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Students list
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");

  // Rich Text Editor states / mock helpers
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);


  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/students`);
        const json = await res.json();
        if (json.success) {
          setStudents(json.data);
        } else {
          toast.error("Failed to load students registry.");
        }
      } catch (err) {
        console.error("Error loading students:", err);
        toast.error("Network error while loading students.");
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  // Filter students based on selected course & search query
  const filteredStudents = students.filter((s) => {
    // Map program tags to match course id
    const studentProgram = (s.program || "").toLowerCase().trim();
    const matchesCourse = studentProgram === selectedCourse || 
      (selectedCourse === "fullstack-ai" && studentProgram.includes("ai")) ||
      (selectedCourse === "web-dev" && studentProgram.includes("web")) ||
      (selectedCourse === "app-dev" && studentProgram.includes("app")) ||
      (selectedCourse === "devops" && studentProgram.includes("devops"));

    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(studentSearch.toLowerCase()) || 
      s.enrollment_id?.toLowerCase().includes(studentSearch.toLowerCase());

    return matchesCourse && matchesSearch;
  });

  // Handle Add Link
  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast.warning("Please provide both reference title and URL.");
      return;
    }
    
    // Simple validation for URL format
    if (!newLinkUrl.startsWith("http://") && !newLinkUrl.startsWith("https://")) {
      toast.warning("URL must start with http:// or https://");
      return;
    }

    const newLink: ReferenceLink = {
      id: Date.now().toString(),
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim(),
    };

    setLinks([...links, newLink]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    toast.success("Reference link attached successfully.");
  };

  // Handle Remove Link
  const handleRemoveLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
    toast.info("Reference link detached.");
  };

  // Handle Student Selection
  const handleToggleStudent = (id: number) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // Handle Select All Students
  const handleSelectAll = () => {
    const visibleIds = filteredStudents.map((s) => s.id);
    const allSelected = visibleIds.every((id) => selectedStudentIds.includes(id));

    if (allSelected) {
      // Unselect all currently visible
      setSelectedStudentIds(selectedStudentIds.filter((id) => !visibleIds.includes(id)));
    } else {
      // Select all currently visible (union)
      const newSelections = Array.from(new Set([...selectedStudentIds, ...visibleIds]));
      setSelectedStudentIds(newSelections);
    }
  };

  // Assign Task
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskTitle.trim()) {
      toast.error("Task title cannot be blank.");
      return;
    }

    if (!taskContent.trim()) {
      toast.error("Please compose some guidelines or instructions in the text area.");
      return;
    }

    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student to assign this task.");
      return;
    }

    const course = COURSES.find(c => c.id === selectedCourse);
    setIsSubmittingTask(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskContent,
          courseId: selectedCourse,
          courseLabel: course?.label || selectedCourse,
          points: Number(points) || 100,
          dueDate: dueDate || null,
          referenceLinks: links.map(l => ({ title: l.title, url: l.url })),
          assignedStudentIds: selectedStudentIds,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to create task.");
      } else {
        toast.success(`🎉 Task assigned to ${selectedStudentIds.length} student(s)!`);
        setTaskTitle("");
        setTaskContent("");
        setLinks([]);
        setSelectedStudentIds([]);
        setDueDate("");
        setPoints("100");
      }
    } catch {
      toast.error("Network error. Could not reach the server.");
    } finally {
      setIsSubmittingTask(false);
    }
  };


  return (
    <div className="relative text-xs md:text-sm font-sans text-white/90">
      <style dangerouslySetInnerHTML={{__html: `
        .glacier-card {
          background: rgba(10, 20, 38, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
        .text-editor-toolbar button {
          transition: all 0.15s ease;
        }
        .text-editor-toolbar button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        .custom-checkbox {
          width: 16px;
          height: 16px;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .custom-checkbox.checked {
          background: #fcac11;
          border-color: #fcac11;
          color: #000000;
        }
      `}} />

      <div className="p-2 md:p-6 flex-1 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">New Task Creator</h2>
          <p className="text-on-surface-variant font-light text-xs mt-1">Design course milestones, set goals and assign objectives to registered students.</p>
        </div>

        {/* Top Section: Course Selector Filters */}
        <div className="glacier-card p-4 rounded-2xl mb-6">
          <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2.5">
            Select Targeted Course
          </label>
          <div className="flex flex-wrap gap-2">
            {COURSES.map((course) => {
              const isActive = selectedCourse === course.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    setSelectedCourse(course.id);
                    setSelectedStudentIds([]); // Clear selection when course changes
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
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

        {/* Bottom Section: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Form & Text Area (7 cols on large) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glacier-card p-6 rounded-2xl">
              
              <form onSubmit={handleAssignTask} className="space-y-5">
                
                {/* Task Title */}
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Building a REST API in Node.js"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-medium transition-colors"
                    required
                  />
                </div>

                {/* Office Word Style Editor Container */}
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                    Task Description & Requirements *
                  </label>
                  
                  {/* Editor ToolBar */}
                  <div className="text-editor-toolbar flex items-center gap-1 bg-[#101f38] border border-white/10 border-b-0 rounded-t-lg px-2 py-1.5 text-on-surface-variant">
                    <button
                      type="button"
                      onClick={() => setIsBold(!isBold)}
                      className={`p-1.5 rounded flex items-center justify-center ${isBold ? "text-primary bg-white/5" : ""}`}
                      title="Bold"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_bold</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsItalic(!isItalic)}
                      className={`p-1.5 rounded flex items-center justify-center ${isItalic ? "text-primary bg-white/5" : ""}`}
                      title="Italic"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_italic</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCode(!isCode)}
                      className={`p-1.5 rounded flex items-center justify-center ${isCode ? "text-primary bg-white/5" : ""}`}
                      title="Code Block"
                    >
                      <span className="material-symbols-outlined text-[18px]">code</span>
                    </button>
                    <div className="h-4 w-px bg-white/10 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => setTaskContent(prev => prev + "\n- ")}
                      className="p-1.5 rounded flex items-center justify-center"
                      title="Bullet List"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskContent(prev => prev + "\n1. ")}
                      className="p-1.5 rounded flex items-center justify-center"
                      title="Numbered List"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskContent(prev => prev + "\n> ")}
                      className="p-1.5 rounded flex items-center justify-center"
                      title="Quote"
                    >
                      <span className="material-symbols-outlined text-[18px]">format_quote</span>
                    </button>
                    <div className="h-4 w-px bg-white/10 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskContent("");
                        toast.info("Content cleared.");
                      }}
                      className="p-1.5 rounded flex items-center justify-center ml-auto hover:text-red-400"
                      title="Clear Content"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    placeholder="Writie task objectives, description, guidelines, and expectations here..."
                    value={taskContent}
                    onChange={(e) => setTaskContent(e.target.value)}
                    rows={8}
                    style={{
                      fontWeight: isBold ? "bold" : "normal",
                      fontStyle: isItalic ? "italic" : "normal",
                      fontFamily: isCode ? "monospace" : "inherit"
                    }}
                    className="w-full bg-[#0a1426]/60 border border-white/10 rounded-b-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-medium transition-colors resize-none"
                    required
                  />
                </div>

                {/* Additional Settings (XP, Due Date) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                      Milestone Reward (XP / Points)
                    </label>
                    <input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-medium transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                      Submission Deadline
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-medium transition-colors"
                    />
                  </div>
                </div>

                {/* Dynamic Reference Links Builder */}
                <div className="pt-4 border-t border-white/5">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Reference Materials & Links
                  </label>
                  
                  {/* Link Inputs */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Resource Title (e.g. Git Cheatsheet)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="flex-1 bg-[#0a1426]/60 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-primary/50 text-xs"
                    />
                    <input
                      type="url"
                      placeholder="URL (https://...)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="flex-1 bg-[#0a1426]/60 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-primary/50 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold rounded-lg px-4 py-2.5 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add Link
                    </button>
                  </div>

                  {/* Links List */}
                  {links.length > 0 && (
                    <div className="space-y-1.5 bg-[#0a1426]/30 p-3 rounded-lg border border-white/5">
                      {links.map((link) => (
                        <div key={link.id} className="flex items-center justify-between gap-3 text-xs bg-white/5 p-2 rounded-md border border-white/5">
                          <div className="flex items-center gap-2 truncate">
                            <span className="material-symbols-outlined text-[16px] text-primary">link</span>
                            <span className="font-semibold text-white truncate">{link.title}</span>
                            <span className="text-[10px] text-on-surface-variant truncate">({link.url})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(link.id)}
                            className="text-on-surface-variant hover:text-red-400 p-0.5 rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={isSubmittingTask}
                    className="w-full bg-primary hover:bg-primary/95 disabled:opacity-60 text-black font-bold py-3 px-6 rounded-xl shadow-[0_8px_24px_-4px_rgba(252,163,17,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer font-semibold uppercase tracking-wider text-xs"
                  >
                    {isSubmittingTask ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />Creating Task…</>
                    ) : (
                      <><span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                      Assign Task to Candidates ({selectedStudentIds.length})</>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>

          {/* Right Column - Student Selectors (5 cols on large) */}
          <div className="lg:col-span-5">
            <div className="glacier-card p-6 rounded-2xl flex flex-col h-full min-h-[500px]">
              
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white mb-1">Target Candidates</h3>
                <p className="text-on-surface-variant text-[11px]">Select enrolled students from this program to assign this task.</p>
              </div>

              {/* Student Search & Select All Actions */}
              <div className="flex gap-2 mb-4 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search candidate name or ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-primary/50 text-xs"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-[16px]">
                    search
                  </span>
                </div>
                {filteredStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {filteredStudents.every((s) => selectedStudentIds.includes(s.id)) ? "deselect" : "select_all"}
                    </span>
                    {filteredStudents.every((s) => selectedStudentIds.includes(s.id)) ? "Deselect" : "Select All"}
                  </button>
                )}
              </div>

              {/* Students List Container */}
              <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar space-y-2 pr-1">
                {isLoadingStudents ? (
                  <div className="text-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-2" />
                    <p className="text-on-surface-variant text-xs font-light">Loading program students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                    <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl mb-2 block">
                      group_off
                    </span>
                    <p className="text-on-surface-variant text-xs font-light">No students found matching current criteria.</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const isChecked = selectedStudentIds.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => handleToggleStudent(student.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isChecked
                            ? "bg-primary/5 border-primary/30"
                            : "bg-[#0a1426]/30 border-white/5 hover:border-white/10"
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`custom-checkbox shrink-0 ${isChecked ? "checked" : ""}`}>
                          {isChecked && (
                            <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                          )}
                        </div>

                        {/* Student Info */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <img
                            alt={`${student.first_name} avatar`}
                            className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0"
                            src={student.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx"}
                          />
                          <div className="truncate">
                            <p className="text-white font-bold text-xs truncate">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-[10px] text-on-surface-variant/60 truncate">
                              ID: {student.enrollment_id || "N/A"}
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-on-surface-variant shrink-0">
                          {student.program || "Course"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selection Summary Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-on-surface-variant/80">
                <span>Enrolled in Program: <strong>{filteredStudents.length}</strong></span>
                <span>Selected Candidates: <strong className="text-primary">{selectedStudentIds.length}</strong></span>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Decorative Background Elements */}
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
    </div>
  );
}
