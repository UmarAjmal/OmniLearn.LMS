"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface Lesson {
  id?: number;
  title: string;
  duration: string;
  media_url?: string;
  sort_order: number;
  hands_on_task?: string;
  project_milestone?: string;
  tech_stack?: string;
  difficulty?: string;
}

interface Section {
  id?: number;
  title: string;
  sort_order: number;
  lessons: Lesson[];
  isExpanded?: boolean;
}

export default function CreateCourse() {
  const router = useRouter();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);
  const [courseId, setCourseId] = useState<number | null>(null);

  // Step 1: Course Info States
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop");
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  // Step 2: Curriculum Builder States
  const [sections, setSections] = useState<Section[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  // New States for File Import & zero-latency manual customizations
  const [showFileImportModal, setShowFileImportModal] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [importedSectionsPreview, setImportedSectionsPreview] = useState<Section[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState("");
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);

  // Step 3: Media Upload Simulator States
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [simulatedMediaUrl, setSimulatedMediaUrl] = useState("");

  // Step 4: Pricing & Publish States
  const [price, setPrice] = useState("49.99");
  const [isPublishing, setIsPublishing] = useState(false);

  // Focus utility styling helper
  const handleInputFocus = (e: React.FocusEvent<any>) => {
    e.target.closest(".space-y-2")?.querySelector("label")?.classList.add("text-primary-container");
  };

  const handleInputBlur = (e: React.FocusEvent<any>) => {
    e.target.closest(".space-y-2")?.querySelector("label")?.classList.remove("text-primary-container");
  };

  // Thumbnail list for click-to-select mockup
  const mockThumbnails = [
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop", // Quantum
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop", // Cyber
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&auto=format&fit=crop", // Server
    "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&auto=format&fit=crop", // Web3
  ];

  // ========================================================
  // STEP 1 ACTIONS: COURSE DETAILS
  // ========================================================
  const handleSaveCourseInfo = async () => {
    if (!title.trim()) {
      toast.error("Please enter a course title.");
      return false;
    }

    setIsSubmittingInfo(true);
    try {
      const payload = { title, category, description, thumbnail_url: thumbnailUrl };
      let response;
      
      if (courseId) {
        // Update existing course
        response = await fetch(`https://omnilearn-lms.onrender.com/api/courses/${courseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new course
        response = await fetch("https://omnilearn-lms.onrender.com/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await response.json();
      if (json.success) {
        setCourseId(json.data.id);
        toast.success(courseId ? "Course details updated!" : "Draft course created!");
        
        // Load existing sections/lessons if any
        if (courseId) {
          fetchCurriculum(courseId);
        }
        return true;
      } else {
        toast.error(json.error || "Failed to save course.");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection failed.");
      return false;
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  const handleNextStep1 = async () => {
    const success = await handleSaveCourseInfo();
    if (success) {
      setCurrentStep(2);
    }
  };

  // ========================================================
  // STEP 2 ACTIONS: CURRICULUM BUILDER
  // ========================================================
  const fetchCurriculum = async (id: number) => {
    try {
      const res = await fetch(`https://omnilearn-lms.onrender.com/api/courses/${id}`);
      const json = await res.json();
      if (json.success) {
        const loadedSections = (json.data.sections || []).map((s: any) => ({
          ...s,
          isExpanded: true,
          lessons: s.lessons || [],
        }));
        setSections(loadedSections);
      }
    } catch (err) {
      console.error("Failed to load curriculum:", err);
    }
  };

  useEffect(() => {
    if (courseId && currentStep === 2) {
      fetchCurriculum(courseId);
    }
  }, [courseId, currentStep]);

  const handleSaveCurriculum = async (showToast = true) => {
    if (!courseId) {
      toast.error("Please save course details first.");
      return false;
    }
    setIsImporting(true);
    try {
      const response = await fetch(`https://omnilearn-lms.onrender.com/api/courses/${courseId}/bulk-curriculum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const json = await response.json();
      if (json.success) {
        if (showToast) toast.success("Curriculum synced with server successfully!");
        return true;
      } else {
        toast.error(json.error || "Failed to save curriculum.");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection failed when saving curriculum.");
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  // Purely Local Snappy Operations (0ms latency!)
  const handleAddSection = () => {
    const newSection: Section = {
      id: -Date.now(), // negative temporary ID
      title: `Section ${sections.length + 1}: New Section`,
      sort_order: sections.length + 1,
      lessons: [],
      isExpanded: true,
    };
    setSections([...sections, newSection]);
    toast.success("Section added!");
  };

  const handleUpdateSectionTitle = (sectionId: number, newTitle: string) => {
    setSections(
      sections.map(s => (s.id === sectionId ? { ...s, title: newTitle } : s))
    );
  };

  const handleDeleteSection = (sectionId: number) => {
    setSections(sections.filter(s => s.id !== sectionId));
    toast.success("Section removed.");
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[swapIndex];
    newSections[swapIndex] = temp;

    setSections(
      newSections.map((s, idx) => ({
        ...s,
        sort_order: idx + 1,
      }))
    );
  };

  const handleAddLesson = (sectionId: number) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          const newLesson: Lesson = {
            id: -Date.now() - Math.random(), // unique negative temporary ID
            title: `Lesson ${s.lessons.length + 1}: Untitled Lesson`,
            duration: "10:00",
            sort_order: s.lessons.length + 1,
          };
          return { ...s, lessons: [...s.lessons, newLesson] };
        }
        return s;
      })
    );
    toast.success("Lesson added!");
  };

  const handleUpdateLessonTitle = (sectionId: number, lessonId: number, newTitle: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, title: newTitle } : l)),
          };
        }
        return s;
      })
    );
  };

  const handleUpdateLessonDuration = (sectionId: number, lessonId: number, newDuration: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, duration: newDuration } : l)),
          };
        }
        return s;
      })
    );
  };

  const handleDeleteLesson = (sectionId: number, lessonId: number) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) };
        }
        return s;
      })
    );
    toast.success("Lesson removed.");
  };

  const handleMoveLesson = (sectionId: number, lessonIndex: number, direction: "up" | "down") => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          const newLessons = [...s.lessons];
          const swapWithIndex = direction === "up" ? lessonIndex - 1 : lessonIndex + 1;
          if (swapWithIndex < 0 || swapWithIndex >= newLessons.length) return s;

          const temp = newLessons[lessonIndex];
          newLessons[lessonIndex] = newLessons[swapWithIndex];
          newLessons[swapWithIndex] = temp;

          return {
            ...s,
            lessons: newLessons.map((l, idx) => ({ ...l, sort_order: idx + 1 })),
          };
        }
        return s;
      })
    );
  };

  const handleClearAllCurriculum = () => {
    if (confirm("Are you sure you want to clear the entire curriculum?")) {
      setSections([]);
      toast.success("Curriculum cleared!");
    }
  };

  const handleNextStep2 = async () => {
    const success = await handleSaveCurriculum(false);
    if (success) {
      if (courseId) {
        await fetchCurriculum(courseId); // refresh to get database IDs for Step 3
      }
      setCurrentStep(3);
    }
  };

  // CSV Curriculum Importer (Text paste fallback)
  const handleCsvImport = () => {
    if (!csvText.trim()) {
      toast.error("Please enter CSV text data.");
      return;
    }

    try {
      const grid = parseCsvLines(csvText);
      processCurriculumGrid(grid);
      setShowImportModal(false);
      setCsvText("");
      toast.success("CSV text parsed into preview! review below, then click save.");
      setShowFileImportModal(true);
    } catch (e) {
      toast.error("Failed to parse CSV text.");
    }
  };

  // Dynamically load SheetJS
  const loadSheetJS = () => {
    return new Promise<any>((resolve, reject) => {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      script.onload = () => {
        resolve((window as any).XLSX);
      };
      script.onerror = (err) => {
        reject(err);
      };
      document.head.appendChild(script);
    });
  };

  // CSV parsing routine
  const parseCsvLines = (text: string): any[][] => {
    const lines: any[][] = [];
    let row: any[] = [];
    let inQuotes = false;
    let entry = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          entry += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(entry.trim());
        entry = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
        row.push(entry.trim());
        if (row.some(x => x !== "")) {
          lines.push(row);
        }
        row = [];
        entry = "";
      } else {
        entry += char;
      }
    }
    if (entry || row.length > 0) {
      row.push(entry.trim());
      lines.push(row);
    }
    return lines;
  };  // Process selected grid data (from CSV or Excel)
  const processCurriculumGrid = (grid: any[][]) => {
    if (grid.length === 0) return;

    // 1. Find header row (search first 10 rows for fields like phase, week, topic, lesson)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(grid.length, 10); i++) {
      const row = grid[i].map(x => String(x || "").toLowerCase());
      if (row.some(c => c.includes("day") || c.includes("week") || c.includes("phase") || c.includes("topic") || c.includes("lesson"))) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = grid[headerRowIdx].map(x => String(x || "").trim().toLowerCase());
    
    // 2. Identify column indices with specific priority order
    let sectionIdx = -1;
    const sectionKeywords = ["phase", "section", "module", "chapter", "week", "subject"];
    for (const kw of sectionKeywords) {
      sectionIdx = headers.findIndex(h => h.includes(kw));
      if (sectionIdx !== -1) break;
    }

    let titleIdx = headers.findIndex(h => h.includes("topic") || h.includes("lesson") || h.includes("title") || h.includes("subject") || h.includes("name"));
    let dayIdx = headers.findIndex(h => h.includes("day") || h.includes("number") || h.includes("id") || h.includes("no"));
    let durationIdx = headers.findIndex(h => h.includes("duration") || h.includes("time") || h.includes("length"));
    
    // Custom enterprise fields detection
    let taskIdx = headers.findIndex(h => h.includes("task") || h.includes("exercise") || h.includes("hands-on") || h.includes("practice") || h.includes("activity"));
    let milestoneIdx = headers.findIndex(h => h.includes("milestone") || h.includes("project") || h.includes("assignment"));
    let techIdx = headers.findIndex(h => h.includes("stack") || h.includes("tech") || h.includes("tool") || h.includes("technology"));
    let diffIdx = headers.findIndex(h => h.includes("difficulty") || h.includes("level"));

    // Fallbacks if columns are not found
    if (sectionIdx === -1) sectionIdx = 0;
    if (titleIdx === -1) titleIdx = grid[headerRowIdx].length > 1 ? 1 : 0;

    const parsedSections: Section[] = [];
    const sectionMap: { [key: string]: Section } = {};
    const dataRows = grid.slice(headerRowIdx + 1);
    let sectionSort = 1;
    
    // Track previous row's section name to support merged cells / carry forward!
    let prevSectionName = "";

    for (const row of dataRows) {
      if (row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === "")) continue;

      const rawSectionName = String(row[sectionIdx] || "").trim();
      const rawLessonTitle = String(row[titleIdx] || "").trim();
      const rawDay = dayIdx !== -1 ? String(row[dayIdx] || "").trim() : "";
      const rawDuration = durationIdx !== -1 ? String(row[durationIdx] || "").trim() : "10:00";
      
      const rawTask = taskIdx !== -1 ? String(row[taskIdx] || "").trim() : "";
      const rawMilestone = milestoneIdx !== -1 ? String(row[milestoneIdx] || "").trim() : "";
      const rawTech = techIdx !== -1 ? String(row[techIdx] || "").trim() : "";
      const rawDiff = diffIdx !== -1 ? String(row[diffIdx] || "").trim() : "Beginner";

      if (!rawSectionName && !rawLessonTitle) continue;

      // Carry forward / inherit the previous row's section if empty!
      let sectionName = rawSectionName;
      if (!sectionName) {
        sectionName = prevSectionName || "General Introduction";
      } else {
        prevSectionName = sectionName; // update track
      }
      
      let section = sectionMap[sectionName];
      if (!section) {
        section = {
          id: -Date.now() - Math.random(),
          title: sectionName,
          sort_order: sectionSort++,
          lessons: [],
          isExpanded: true,
        };
        sectionMap[sectionName] = section;
        parsedSections.push(section);
      }

      if (rawLessonTitle) {
        const prefix = rawDay ? `Day ${rawDay}: ` : "";
        const lessonTitle = `${prefix}${rawLessonTitle}`;
        
        let duration = rawDuration;
        if (!duration || duration === "—" || duration === "undefined" || duration === "") {
          duration = "10:00";
        }
        
        section.lessons.push({
          id: -Date.now() - Math.random(),
          title: lessonTitle,
          duration: duration,
          sort_order: section.lessons.length + 1,
          hands_on_task: rawTask,
          project_milestone: rawMilestone,
          tech_stack: rawTech,
          difficulty: rawDiff
        });
      }
    }

    setImportedSectionsPreview(parsedSections);
    setIsParsingFile(false);
  };

  const handleUpdateLessonTask = (sectionId: number, lessonId: number, newTask: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, hands_on_task: newTask } : l)),
          };
        }
        return s;
      })
    );
  };

  const handleUpdateLessonMilestone = (sectionId: number, lessonId: number, newMilestone: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, project_milestone: newMilestone } : l)),
          };
        }
        return s;
      })
    );
  };

  const handleUpdateLessonTech = (sectionId: number, lessonId: number, newTech: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, tech_stack: newTech } : l)),
          };
        }
        return s;
      })
    );
  };

  const handleUpdateLessonDifficulty = (sectionId: number, lessonId: number, newDiff: string) => {
    setSections(
      sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map(l => (l.id === lessonId ? { ...l, difficulty: newDiff } : l)),
          };
        }
        return s;
      })
    );
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    try {
      const reader = new FileReader();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        reader.onload = async (evt) => {
          const text = evt.target?.result as string;
          parseCsvContent(text);
        };
        reader.readAsText(file);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const XLSX = await loadSheetJS();
        reader.onload = async (evt) => {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          setSelectedSheetName(firstSheetName);
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          parseExcelContent(jsonData);
        };
        reader.readAsArrayBuffer(file);
      } else {
        toast.error("Unsupported file format. Please upload a .csv or .xlsx file.");
        setIsParsingFile(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error reading file.");
      setIsParsingFile(false);
    }
  };

  const parseCsvContent = (text: string) => {
    const grid = parseCsvLines(text);
    processCurriculumGrid(grid);
  };

  const parseExcelContent = (grid: any[][]) => {
    processCurriculumGrid(grid);
  };

  const handleApplyImportedCurriculum = () => {
    if (importedSectionsPreview.length === 0) {
      toast.error("No sections to import.");
      return;
    }
    setSections(importedSectionsPreview);
    setShowFileImportModal(false);
    setImportedSectionsPreview([]);
    toast.success("Imported curriculum loaded! Click 'Sync Curriculum' or save to persist to server.");
  };

  const handlePrepopulateTemplate = () => {
    const template: Section[] = [
      {
        id: -1,
        title: "PHASE 1 — Python Foundations",
        sort_order: 1,
        isExpanded: true,
        lessons: [
          { id: -1.1, title: "Day 1: Environment Setup: VS Code, Python install, venv, pip, folder structure", duration: "10:00", sort_order: 1 },
          { id: -1.2, title: "Day 2: Variables, Data Types, Type Casting, Comments", duration: "10:00", sort_order: 2 },
          { id: -1.3, title: "Day 3: Strings: indexing, slicing, methods, f-strings", duration: "10:00", sort_order: 3 }
        ]
      },
      {
        id: -2,
        title: "PHASE 2 — Dev Tools & Version Control",
        sort_order: 2,
        isExpanded: true,
        lessons: [
          { id: -2.1, title: "Day 11: Git basics: init, add, commit, status, log, diff, .gitignore", duration: "12:00", sort_order: 1 },
          { id: -2.2, title: "Day 12: Git branching: branch, checkout, merge, conflicts resolution", duration: "15:00", sort_order: 2 }
        ]
      }
    ];
    setSections(template);
    toast.success("Loaded AI Engineer roadmap template!");
  };

  // ========================================================
  // STEP 3 ACTIONS: MEDIA UPLOADS
  // ========================================================
  const handleStartSimulatedUpload = (lessonId: number) => {
    setSelectedLessonId(lessonId);
    setUploadProgress(0);
    
    // Simulate progression
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Save mock video URL and duration
            const mockDurations = ["06:45", "12:30", "08:15", "15:40"];
            const chosenDuration = mockDurations[Math.floor(Math.random() * mockDurations.length)];
            const mockUrl = "https://player.vimeo.com/video/76979871";

            fetch(`https://omnilearn-lms.onrender.com/api/lessons/${lessonId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                duration: chosenDuration,
                media_url: mockUrl,
              }),
            })
              .then(res => res.json())
              .then(json => {
                if (json.success && courseId) {
                  fetchCurriculum(courseId);
                  toast.success("Video attached successfully!");
                }
                setUploadProgress(null);
                setSelectedLessonId(null);
              });
          }, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  // ========================================================
  // STEP 4 ACTIONS: PRICING & PUBLISH
  // ========================================================
  const handlePublishCourse = async () => {
    if (!courseId) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`https://omnilearn-lms.onrender.com/api/courses/${courseId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(price) }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Congratulations! Your course is published!");
        router.push("/");
      } else {
        toast.error(json.error || "Failed to publish course.");
      }
    } catch (err) {
      toast.error("Publishing request failed.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      {/* Background Gradients */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-container/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-6xl w-full mx-auto pb-32">
        {/* Header Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-headline-xl text-4xl font-extrabold text-on-surface mb-2">
            Create New Course
          </h1>
          <p className="font-body-lg text-on-surface-variant">
            Design a world-class learning experience for your elite students.
          </p>
        </div>

        {/* Multi-step Stepper Indicator */}
        <div className="glass-panel inner-glow-border rounded-xl p-6 mb-10 shadow-2xl relative overflow-hidden bg-surface-container-lowest/80 backdrop-blur-2xl">
          <div className="flex justify-between items-center relative px-4">
            
            {/* Stepper Progress bar */}
            <div className="absolute left-0 right-0 h-0.5 bg-surface-variant/30 -z-10 mx-10">
              <div
                className="h-full bg-primary-container shadow-[0_0_12px_rgba(252,163,17,0.7)] transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>

            {/* Step 1 */}
            <div
              className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${
                currentStep >= 1 ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => courseId && setCurrentStep(1)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === 1
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(252,163,17,0.5)] border-2 border-white/20"
                    : currentStep > 1
                    ? "bg-emerald-500 text-white"
                    : "bg-surface-container-high text-on-surface"
                }`}
              >
                {currentStep > 1 ? (
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                ) : (
                  "1"
                )}
              </div>
              <span className={`font-label-md text-xs ${currentStep === 1 ? "text-primary-container font-bold" : "text-on-surface-variant"}`}>
                Course Info
              </span>
            </div>

            {/* Step 2 */}
            <div
              className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${
                currentStep >= 2 ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => courseId && setCurrentStep(2)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === 2
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(252,163,17,0.5)] border-2 border-white/20"
                    : currentStep > 2
                    ? "bg-emerald-500 text-white"
                    : "bg-surface-container-high text-on-surface"
                }`}
              >
                {currentStep > 2 ? (
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                ) : (
                  "2"
                )}
              </div>
              <span className={`font-label-md text-xs ${currentStep === 2 ? "text-primary-container font-bold" : "text-on-surface-variant"}`}>
                Curriculum
              </span>
            </div>

            {/* Step 3 */}
            <div
              className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${
                currentStep >= 3 ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => courseId && setCurrentStep(3)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === 3
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(252,163,17,0.5)] border-2 border-white/20"
                    : currentStep > 3
                    ? "bg-emerald-500 text-white"
                    : "bg-surface-container-high text-on-surface"
                }`}
              >
                {currentStep > 3 ? (
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                ) : (
                  "3"
                )}
              </div>
              <span className={`font-label-md text-xs ${currentStep === 3 ? "text-primary-container font-bold" : "text-on-surface-variant"}`}>
                Media
              </span>
            </div>

            {/* Step 4 */}
            <div
              className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                currentStep >= 4 ? "opacity-100" : "opacity-40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === 4
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(252,163,17,0.5)] border-2 border-white/20"
                    : "bg-surface-container-high text-on-surface"
                }`}
              >
                "4"
              </div>
              <span className={`font-label-md text-xs ${currentStep === 4 ? "text-primary-container font-bold" : "text-on-surface-variant"}`}>
                Pricing
              </span>
            </div>

          </div>
        </div>

        {/* FORM PANEL CONTAINER */}
        <div className="glass-panel inner-glow-border rounded-xl overflow-hidden shadow-2xl bg-surface-container/60 backdrop-blur-3xl border border-white/5">
          
          {/* ========================================================
              STEP 1: COURSE INFO FORM CONTENT
              ======================================================== */}
          {currentStep === 1 && (
            <div className="p-8 md:p-10 space-y-8 animate-fadeIn">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Course Title */}
                <div className="space-y-2">
                  <label className="font-label-md text-sm text-on-surface-variant transition-all font-semibold">
                    Course Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    type="text"
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg px-4 py-3 text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all outline-none"
                    placeholder="e.g. Masterclass in Quantum Cryptography"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="font-label-md text-sm text-on-surface-variant transition-all font-semibold">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg px-4 py-3 text-body-md appearance-none focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Business Strategy">Business Strategy</option>
                      <option value="Fine Arts">Fine Arts</option>
                      <option value="Humanities">Humanities</option>
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-on-surface-variant">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="font-label-md text-sm text-on-surface-variant transition-all font-semibold">
                  Course Description
                </label>
                <div className="bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-3 border-b border-outline-variant/30 bg-surface-variant/10">
                    <button type="button" className="p-1.5 hover:bg-surface-bright/20 rounded text-on-surface-variant hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">format_bold</span>
                    </button>
                    <button type="button" className="p-1.5 hover:bg-surface-bright/20 rounded text-on-surface-variant hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">format_italic</span>
                    </button>
                    <button type="button" className="p-1.5 hover:bg-surface-bright/20 rounded text-on-surface-variant hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                    </button>
                    <div className="w-px h-6 bg-outline-variant/30 mx-1"></div>
                    <button type="button" className="p-1.5 hover:bg-surface-bright/20 rounded text-on-surface-variant hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">link</span>
                    </button>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent border-none p-4 text-body-md focus:ring-0 resize-none outline-none"
                    placeholder="Describe the journey and outcomes of this course..."
                    rows={5}
                  ></textarea>
                </div>
              </div>

              {/* Thumbnail Selector */}
              <div className="space-y-3">
                <label className="font-label-md text-sm text-on-surface-variant transition-all font-semibold block">
                  Course Thumbnail
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {mockThumbnails.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setThumbnailUrl(url)}
                      className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 active:scale-95 ${
                        thumbnailUrl === url ? "border-primary-container shadow-[0_0_12px_rgba(252,163,17,0.5)]" : "border-transparent opacity-65"
                      }`}
                    >
                      <img src={url} alt={`Mock Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      {thumbnailUrl === url && (
                        <div className="absolute inset-0 bg-primary-container/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white font-bold bg-primary-container/80 p-1 rounded-full text-sm">check</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-2 border-dashed border-outline-variant/40 rounded-lg p-8 flex flex-col items-center justify-center gap-4 bg-surface-variant/5 hover:bg-surface-variant/10 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container group-hover:scale-115 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">upload_file</span>
                  </div>
                  <div className="text-center">
                    <p className="font-body-md text-on-surface font-semibold text-sm">Custom upload mock trigger</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">High-fidelity 16:9 PNG or JPG (max. 2MB)</p>
                  </div>
                </div>
              </div>

              {/* Form Footer Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={handleSaveCourseInfo}
                  disabled={isSubmittingInfo}
                  className="px-6 py-3 rounded-lg border border-outline-variant/30 text-on-surface font-label-md hover:bg-surface-variant/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
                >
                  {isSubmittingInfo ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep1}
                  disabled={isSubmittingInfo}
                  className="px-8 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md font-bold shadow-lg shadow-primary-container/20 hover:shadow-primary-container/40 hover:translate-y-[-2px] transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
                >
                  Next Step: Curriculum
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 2: CURRICULUM BUILDER CONTENT
              ======================================================== */}
          {currentStep === 2 && (
            <div className="p-8 md:p-10 space-y-8 animate-fadeIn">
              
              {/* Premium Import / Action Toolbar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* AI / Spreadsheet Importer Card */}
                <div
                  onClick={() => setShowFileImportModal(true)}
                  className="border-2 border-dashed border-primary-container/30 hover:border-primary-container rounded-xl p-6 flex items-center gap-4 bg-primary-container/5 hover:bg-primary-container/10 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      upload_file
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white mb-0.5 flex items-center gap-1.5">
                      Import Excel / CSV
                      <span className="text-[10px] bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-full font-bold uppercase">Popular</span>
                    </h3>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed max-w-sm">
                      Upload `.xlsx` or `.csv` outlines (like `AI roadmap.xlsx`). Our system auto-groups sections & lessons instantly!
                    </p>
                  </div>
                </div>

                {/* AI Quick Templates Card */}
                <div
                  onClick={handlePrepopulateTemplate}
                  className="border-2 border-dashed border-emerald-500/20 hover:border-emerald-500/50 rounded-xl p-6 flex items-center gap-4 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white mb-0.5">Pre-populate Roadmap Template</h3>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed max-w-sm">
                      Don't want to type? Click here to instantly load a gorgeous 12-week AI Engineer training roadmap template.
                    </p>
                  </div>
                </div>

              </div>

              {/* Manual Builder Section */}
              <div className="space-y-6">
                
                {/* Builder Header & Local Controls */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div>
                    <h3 className="font-headline-lg text-lg font-bold text-primary-container flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      Interactive Curriculum Builder
                    </h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Customize sections, reorder topics, and set lesson durations with zero latency.
                    </p>
                  </div>
                  
                  {/* Toolkit buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="flex items-center gap-1 text-[11px] text-primary-container border border-primary-container/30 px-3.5 py-1.5 rounded-full hover:bg-primary-container/10 transition-all font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      Add Section
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveCurriculum(true)}
                      disabled={isImporting}
                      className="flex items-center gap-1 text-[11px] text-white bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full hover:bg-white/10 transition-all font-bold cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-xs">sync</span>
                      {isImporting ? "Saving..." : "Sync Curriculum"}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllCurriculum}
                      className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 border border-red-500/20 px-3.5 py-1.5 rounded-full hover:bg-red-500/10 transition-all font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">delete_sweep</span>
                      Clear All
                    </button>
                  </div>
                </div>

                {sections.length === 0 ? (
                  <div className="border border-outline-variant/10 rounded-xl p-16 text-center text-on-surface-variant bg-surface-container-low/20">
                    <span className="material-symbols-outlined text-5xl mb-3 block text-primary-container animate-pulse">
                      playlist_add
                    </span>
                    <p className="font-semibold text-white text-sm">Your Curriculum is Empty</p>
                    <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm mx-auto">
                      Get started by importing an Excel/CSV file, pre-populating our industry standard template, or adding custom sections manually.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section, sIdx) => (
                      <div
                        key={section.id}
                        className="glass-panel rounded-lg overflow-hidden border border-white/5 bg-white/5 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                      >
                        {/* Section Header */}
                        <div className="p-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all border-b border-white/5 gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="material-symbols-outlined text-on-surface-variant cursor-grab select-none">
                              drag_indicator
                            </span>
                            <span className="text-xs font-mono font-bold text-primary-container px-2 py-0.5 bg-primary-container/10 rounded">
                              S{sIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleUpdateSectionTitle(section.id!, e.target.value)}
                              className="bg-transparent border-none text-white text-sm md:text-base font-bold outline-none focus:border-b focus:border-primary-container pb-0.5 w-full cursor-text truncate"
                              placeholder="e.g. Section Title"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            
                            {/* Reorder Section */}
                            <button
                              type="button"
                              onClick={() => handleMoveSection(sIdx, "up")}
                              disabled={sIdx === 0}
                              className="p-1 hover:bg-white/10 rounded text-on-surface-variant disabled:opacity-30 transition-all"
                              title="Move Section Up"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">arrow_upward</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSection(sIdx, "down")}
                              disabled={sIdx === sections.length - 1}
                              className="p-1 hover:bg-white/10 rounded text-on-surface-variant disabled:opacity-30 transition-all"
                              title="Move Section Down"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">arrow_downward</span>
                            </button>

                            <div className="w-px h-5 bg-white/10 mx-1"></div>

                            <button
                              type="button"
                              onClick={() => {
                                setSections(
                                  sections.map(s =>
                                    s.id === section.id ? { ...s, isExpanded: !s.isExpanded } : s
                                  )
                                );
                              }}
                              className="p-1.5 hover:bg-white/10 rounded transition-colors text-on-surface-variant hover:text-white"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {section.isExpanded ? "expand_less" : "expand_more"}
                              </span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section.id!)}
                              className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-on-surface-variant hover:text-red-400"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Section Lessons */}
                        {section.isExpanded && (
                          <div className="p-4 space-y-2 bg-black/20">
                            {section.lessons.map((lesson, lIdx) => (
                              <div key={lesson.id} className="space-y-2">
                                <div
                                  className="bg-surface-variant/10 border border-white/5 p-3 rounded-lg flex items-center justify-between hover:border-primary-container/20 hover:bg-surface-variant/20 transition-all group gap-4"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="material-symbols-outlined text-on-surface-variant text-base flex-shrink-0 select-none">
                                      play_circle
                                    </span>
                                    <span className="text-[10px] font-mono text-on-surface-variant bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0 select-none">
                                      L{lIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={lesson.title}
                                      onChange={(e) => handleUpdateLessonTitle(section.id!, lesson.id!, e.target.value)}
                                      className="bg-transparent border-none text-white text-xs md:text-sm outline-none focus:border-b focus:border-primary-container w-full cursor-text truncate"
                                      placeholder="e.g. Lesson Topic / Day Content"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    
                                    {/* Expandable Customization Settings button */}
                                    <button
                                      type="button"
                                      onClick={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id!)}
                                      className={`p-1 rounded text-on-surface-variant hover:text-primary-container hover:bg-white/5 transition-all ${
                                        expandedLessonId === lesson.id ? "text-primary-container bg-primary-container/10" : ""
                                      }`}
                                      title="Customize Lesson Details"
                                    >
                                      <span className="material-symbols-outlined text-sm font-bold">tune</span>
                                    </button>

                                    {/* Sort control arrows */}
                                    <div className="flex items-center">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveLesson(section.id!, lIdx, "up")}
                                        disabled={lIdx === 0}
                                        className="p-1 hover:bg-white/10 rounded text-on-surface-variant disabled:opacity-30 transition-all"
                                        title="Move Lesson Up"
                                      >
                                        <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveLesson(section.id!, lIdx, "down")}
                                        disabled={lIdx === section.lessons.length - 1}
                                        className="p-1 hover:bg-white/10 rounded text-on-surface-variant disabled:opacity-30 transition-all"
                                        title="Move Lesson Down"
                                      >
                                        <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLesson(section.id!, lesson.id!)}
                                      className="p-1 hover:bg-red-500/10 rounded text-on-surface-variant hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Rich Collapsible Enterprise Customization Panel */}
                                {expandedLessonId === lesson.id && (
                                  <div className="bg-black/35 border border-white/5 p-4 rounded-lg space-y-4 animate-fadeIn ml-6 relative overflow-hidden">
                                    <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 mb-2">
                                      <span className="material-symbols-outlined text-primary-container text-xs">tune</span>
                                      <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">Customize Lesson Details</h5>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Tech Stack Input */}
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Tech Stack</label>
                                        <input
                                          type="text"
                                          value={lesson.tech_stack || ""}
                                          onChange={(e) => handleUpdateLessonTech(section.id!, lesson.id!, e.target.value)}
                                          className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary-container transition-all"
                                          placeholder="e.g. Python, Docker, PyTorch"
                                        />
                                      </div>

                                      {/* Difficulty dropdown */}
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Difficulty Level</label>
                                        <select
                                          value={lesson.difficulty || "Beginner"}
                                          onChange={(e) => handleUpdateLessonDifficulty(section.id!, lesson.id!, e.target.value)}
                                          className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary-container transition-all"
                                        >
                                          <option value="Beginner">Beginner</option>
                                          <option value="Intermediate">Intermediate</option>
                                          <option value="Advanced">Advanced</option>
                                          <option value="Soft Skill">Soft Skill</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Hands-on Task / Exercise */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Hands-on Task / Exercise</label>
                                      <textarea
                                        value={lesson.hands_on_task || ""}
                                        onChange={(e) => handleUpdateLessonTask(section.id!, lesson.id!, e.target.value)}
                                        rows={2}
                                        className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded p-2.5 text-xs text-white outline-none focus:border-primary-container resize-none transition-all"
                                        placeholder="e.g. Build a simple unit converter (km -> miles), practice OOP concepts"
                                      ></textarea>
                                    </div>

                                    {/* Project Milestone */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Project Milestone</label>
                                      <input
                                        type="text"
                                        value={lesson.project_milestone || ""}
                                        onChange={(e) => handleUpdateLessonMilestone(section.id!, lesson.id!, e.target.value)}
                                        className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary-container transition-all"
                                        placeholder="e.g. ✅ DELIVER: CLI Contact Book or —"
                                      />
                                    </div>

                                    {/* Duration editor box */}
                                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded border border-white/5 max-w-xs">
                                      <span className="material-symbols-outlined text-[13px] text-on-surface-variant">schedule</span>
                                      <span className="text-[10px] text-on-surface-variant font-semibold">Standard Duration:</span>
                                      <input
                                        type="text"
                                        value={lesson.duration}
                                        onChange={(e) => handleUpdateLessonDuration(section.id!, lesson.id!, e.target.value)}
                                        className="bg-black/30 border border-white/10 rounded text-center font-mono text-[10px] text-white w-14 outline-none p-1 focus:ring-1 focus:ring-primary-container"
                                        placeholder="10:00"
                                      />
                                    </div>
                                    
                                  </div>
                                )}
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddLesson(section.id!)}
                              className="ml-1.5 mt-2 flex items-center gap-1 text-[11px] text-primary-container hover:text-cream-accent hover:translate-x-1 transition-all font-semibold cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">add_circle</span>
                              Add Lesson
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Footer Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 rounded-lg border border-outline-variant/30 text-on-surface font-label-md hover:bg-surface-variant/20 transition-all active:scale-95 cursor-pointer text-sm font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="px-8 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md font-bold shadow-lg shadow-primary-container/20 hover:shadow-primary-container/40 hover:translate-y-[-2px] transition-all active:scale-95 cursor-pointer text-sm flex items-center gap-1"
                >
                  Next Step: Media
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 3: MEDIA UPLOAD MANAGER CONTENT
              ======================================================== */}
          {currentStep === 3 && (
            <div className="p-8 md:p-10 space-y-8 animate-fadeIn">
              <div>
                <h3 className="font-headline-lg text-xl font-bold text-primary-container mb-2">
                  Attach Lesson Media
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Select a lesson below to upload and link class video materials. Videos will automatically determine standard duration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Curriculum Lesson Tree (Left 1/3) */}
                <div className="md:col-span-1 border border-outline-variant/20 rounded-xl p-4 bg-black/20 max-h-[380px] overflow-y-auto custom-scrollbar">
                  <h4 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-3">Curriculum Index</h4>
                  {sections.length === 0 ? (
                    <p className="text-xs text-on-surface-variant italic">No sections created yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {sections.map(s => (
                        <div key={s.id} className="space-y-1">
                          <p className="text-xs text-primary font-bold truncate">{s.title}</p>
                          <div className="pl-2 space-y-1">
                            {s.lessons.map(l => (
                              <div
                                key={l.id}
                                onClick={() => setSelectedLessonId(l.id!)}
                                className={`p-2 rounded text-xs cursor-pointer truncate transition-all ${
                                  selectedLessonId === l.id
                                    ? "bg-primary-container/20 border-l-2 border-primary-container text-white font-bold"
                                    : "text-on-surface-variant hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                {l.title} {l.media_url && "✅"}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Workspace (Right 2/3) */}
                <div className="md:col-span-2 border border-outline-variant/20 rounded-xl p-6 bg-black/10 flex flex-col justify-center min-h-[300px]">
                  {selectedLessonId ? (
                    (() => {
                      const activeLesson = sections.flatMap(s => s.lessons).find(l => l.id === selectedLessonId);
                      if (!activeLesson) return null;

                      return (
                        <div className="text-center space-y-6">
                          <h4 className="text-base font-bold text-white">Uploading media for:</h4>
                          <p className="text-sm text-primary font-semibold truncate bg-white/5 px-4 py-2 rounded-lg max-w-md mx-auto">
                            {activeLesson.title}
                          </p>

                          {uploadProgress !== null ? (
                            <div className="max-w-xs mx-auto space-y-3">
                              {/* Simple Circular Progress Simulator */}
                              <div className="w-16 h-16 rounded-full border-4 border-surface-container-high border-t-primary-container animate-spin mx-auto"></div>
                              <p className="text-sm font-semibold font-mono text-primary-container">{uploadProgress}% uploaded...</p>
                            </div>
                          ) : activeLesson.media_url ? (
                            <div className="space-y-4">
                              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                                <span className="material-symbols-outlined text-[32px]">check_circle</span>
                              </div>
                              <p className="text-sm text-on-surface-variant font-semibold">Video preview attached successfully!</p>
                              <div className="flex justify-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleStartSimulatedUpload(activeLesson.id!)}
                                  className="px-4 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold rounded-full cursor-pointer text-white transition-colors"
                                >
                                  Reupload Video
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleStartSimulatedUpload(activeLesson.id!)}
                              className="border-2 border-dashed border-outline-variant/30 rounded-lg p-8 flex flex-col items-center justify-center gap-4 bg-surface-variant/5 hover:bg-surface-variant/10 transition-all cursor-pointer group"
                            >
                              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[28px]">movie</span>
                              </div>
                              <div className="text-center">
                                <p className="font-body-md text-on-surface font-semibold text-sm">Simulate MP4/WebM Upload</p>
                                <p className="text-[11px] text-on-surface-variant mt-1">Recommended resolution: 1080p (max. 100MB)</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center text-on-surface-variant space-y-3">
                      <span className="material-symbols-outlined text-4xl text-outline block">
                        touch_app
                      </span>
                      <p className="font-semibold text-sm">Select a lesson from index to continue.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Form Footer Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-lg border border-outline-variant/30 text-on-surface font-label-md hover:bg-surface-variant/20 transition-all active:scale-95 cursor-pointer text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-8 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md font-bold shadow-lg shadow-primary-container/20 hover:shadow-primary-container/40 hover:translate-y-[-2px] transition-all active:scale-95 cursor-pointer text-sm"
                >
                  Next Step: Pricing
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 4: PRICING & REVIEW PUBLISH CONTENT
              ======================================================== */}
          {currentStep === 4 && (
            <div className="p-8 md:p-10 space-y-8 animate-fadeIn">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Course Card Live Preview (Left 5/12) */}
                <div className="lg:col-span-5 space-y-3">
                  <h4 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Dynamic Live Card Preview</h4>
                  
                  {/* Dynamic Rendering Card */}
                  <div className="glass-card rounded-lg overflow-hidden flex flex-col group border border-white/10 hover:shadow-[0_0_20px_rgba(252,163,17,0.15)] transition-all duration-300">
                    <div className="h-44 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                      <img
                        className="w-full h-full object-cover"
                        src={thumbnailUrl}
                        alt="Course Thumbnail Preview"
                      />
                      <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                        <span className="px-3 py-1 bg-gold-accent text-black text-[10px] font-bold uppercase rounded-full tracking-wider">
                          {category}
                        </span>
                        <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                          {sections.flatMap(s => s.lessons).length} Lessons
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1 bg-surface-container-low/20">
                      <h3 className="text-base font-bold text-white mb-2 truncate">
                        {title || "Untitled Course"}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mb-4">
                        {description || "No description provided yet."}
                      </p>
                      
                      <div className="mt-auto flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-lg font-extrabold text-white font-mono">
                          ${parseFloat(price).toFixed(2)}
                        </span>
                        <span className="text-xs bg-primary-container/20 text-primary-container px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                          Live Preview
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Configurations (Right 7/12) */}
                <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-headline-lg text-xl font-bold text-white mb-1">
                        Pricing & Availability
                      </h3>
                      <p className="text-xs text-on-surface-variant">Configure standard pricing and release details before launching.</p>
                    </div>

                    {/* Price Input */}
                    <div className="space-y-2 max-w-xs">
                      <label className="font-label-md text-xs text-on-surface-variant font-semibold">Standard Cost (USD)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant font-mono text-sm">$</span>
                        <input
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg pl-8 pr-4 py-3 text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container font-mono outline-none text-sm"
                        />
                      </div>
                    </div>

                    {/* Simple summary checklist */}
                    <div className="p-4 rounded-lg bg-surface-container-lowest/30 border border-outline-variant/20 space-y-2">
                      <h5 className="text-xs text-white font-bold uppercase tracking-wide mb-1">Course Summary</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant">
                        <p>Total Sections: <span className="text-white font-bold">{sections.length}</span></p>
                        <p>Total Lessons: <span className="text-white font-bold">{sections.flatMap(s => s.lessons).length}</span></p>
                        <p>Thumbnail: <span className="text-emerald-400 font-bold">Configured</span></p>
                        <p>Price Point: <span className="text-primary-container font-bold">${price}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Form Footer Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-3 rounded-lg border border-outline-variant/30 text-on-surface font-label-md hover:bg-surface-variant/20 transition-all active:scale-95 cursor-pointer text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePublishCourse}
                      disabled={isPublishing}
                      className="px-10 py-3 rounded-lg bg-gradient-to-r from-primary-container to-amber-500 text-on-primary-container font-label-md font-bold shadow-lg shadow-primary-container/40 hover:shadow-primary-container/60 hover:scale-105 transition-all active:scale-95 cursor-pointer text-sm flex items-center gap-1.5 border border-white/10"
                    >
                      {isPublishing ? "Publishing..." : "Publish Course"}
                      <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

        {/* Dynamic Context Tips */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-lg inner-glow-border bg-white/5 border border-white/5">
            <span className="material-symbols-outlined text-primary-container mb-3 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              lightbulb
            </span>
            <h4 className="font-label-md text-on-surface font-bold mb-2">Engaging Titles</h4>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              Courses with clear, outcome-based titles see a 40% higher enrollment rate among elite learners.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-lg inner-glow-border bg-white/5 border border-white/5">
            <span className="material-symbols-outlined text-primary-container mb-3 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              visibility
            </span>
            <h4 className="font-label-md text-on-surface font-bold mb-2">Visual Impact</h4>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              High-resolution thumbnails (1920x1080) communicate prestige and technological sophistication.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-lg inner-glow-border bg-white/5 border border-white/5">
            <span className="material-symbols-outlined text-primary-container mb-3 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock_open
            </span>
            <h4 className="font-label-md text-on-surface font-bold mb-2">Early Access</h4>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              You can publish as 'In Development' to start building a waitlist before the content is finalized.
            </p>
          </div>
        </div>
      </div>

      {/* Paste CSV Text Importer Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="glass-panel inner-glow-border rounded-xl p-6 max-w-lg w-full bg-surface-container border border-white/10 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary-container font-bold">article</span>
                Paste Raw CSV Text Importer
              </h4>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 hover:bg-white/10 rounded text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-on-surface-variant font-semibold">Paste CSV Outline (Section, Lesson, Duration)</label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg p-3 text-xs font-mono focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none text-white resize-none"
                placeholder="Section 1: Foundations, Lesson 1.1: System Models, 10:30&#10;Section 1: Foundations, Lesson 1.2: Topology, 14:15&#10;Section 2: Architecture, Lesson 2.1: Message Broker, 08:20"
              ></textarea>
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-[10px] text-on-surface-variant italic">Format: Section, Lesson Name, Duration (e.g. 10:00)</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs cursor-pointer text-on-surface-variant hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCsvImport}
                  className="px-5 py-2 bg-primary-container text-on-primary-container rounded-lg text-xs font-bold cursor-pointer hover:bg-primary-container/90"
                >
                  Parse & Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Excel & CSV Smart File Importer Modal */}
      {showFileImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="glass-panel inner-glow-border rounded-xl p-6 max-w-2xl w-full bg-surface-container border border-white/10 space-y-6 my-8 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary-container/10 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>table_chart</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Smart Spreadsheet Importer</h4>
                  <p className="text-[10px] text-on-surface-variant">Auto-parse curriculum roadmaps from custom files</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowFileImportModal(false);
                  setImportedSectionsPreview([]);
                }}
                className="p-1 hover:bg-white/10 rounded text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Main Modal Content Split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Upload or Preview (7/12) */}
              <div className="md:col-span-7 space-y-4">
                
                {importedSectionsPreview.length === 0 ? (
                  /* File Upload Drop Zone */
                  <div className="space-y-4">
                    <label className="border-2 border-dashed border-outline-variant/30 hover:border-primary-container rounded-lg p-10 flex flex-col items-center justify-center gap-4 bg-surface-variant/5 hover:bg-surface-variant/10 transition-all cursor-pointer group text-center">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {isParsingFile ? (
                        <div className="space-y-3">
                          <div className="w-10 h-10 rounded-full border-4 border-surface-container-high border-t-primary-container animate-spin mx-auto"></div>
                          <p className="text-xs font-semibold text-primary-container">Reading & grouping roadmap columns...</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                          </div>
                          <div>
                            <p className="font-body-md text-white font-semibold text-sm">Select Excel (.xlsx) or CSV file</p>
                            <p className="text-[11px] text-on-surface-variant mt-1">Accepts roadmaps formatted like `AI roadmap.xlsx`</p>
                          </div>
                        </>
                      )}
                    </label>

                    {/* Or paste CSV text button */}
                    <div className="text-center">
                      <span className="text-[10px] text-on-surface-variant">or want to paste outline instead? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFileImportModal(false);
                          setShowImportModal(true);
                        }}
                        className="text-[10px] text-primary-container font-bold underline hover:text-amber-400 cursor-pointer"
                      >
                        Paste CSV Text
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Interactive Import Tree Preview */
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-primary-container uppercase tracking-wider">
                        ROADMAP IMPORT PREVIEW ({selectedSheetName ? `Sheet: ${selectedSheetName}` : 'CSV'})
                      </h5>
                      <button
                        type="button"
                        onClick={() => setImportedSectionsPreview([])}
                        className="text-[10px] text-red-400 font-bold hover:underline"
                      >
                        Reset Upload
                      </button>
                    </div>

                    <div className="border border-outline-variant/20 rounded-xl p-3 bg-black/30 max-h-[250px] overflow-y-auto custom-scrollbar space-y-3">
                      {importedSectionsPreview.map((s, sIdx) => (
                        <div key={s.id} className="space-y-1">
                          <p className="text-xs font-bold text-white flex items-center gap-1">
                            <span className="text-[9px] bg-primary-container/20 text-primary-container px-1 py-0.5 rounded font-mono">S{sIdx + 1}</span>
                            {s.title}
                          </p>
                          <div className="pl-3 border-l border-white/5 space-y-1">
                            {s.lessons.map((l, lIdx) => (
                              <p key={l.id} className="text-[10px] text-on-surface-variant truncate flex items-center justify-between">
                                <span>L{lIdx + 1}: {l.title}</span>
                                <span className="font-mono text-[9px] bg-white/5 px-1 rounded flex-shrink-0 ml-2">{l.duration}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Visual Layout Guidance & Specifications (5/12) */}
              <div className="md:col-span-5 border-l border-white/10 md:pl-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-amber-400">info</span>
                    Column Mapping Guide
                  </h5>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Our smart import parser automatically detects headers in your Excel sheet or CSV and maps them logically:
                  </p>

                  <div className="bg-black/30 rounded border border-white/5 p-2 space-y-2 text-[9px] font-mono text-on-surface-variant">
                    <p className="text-white border-b border-white/5 pb-1 flex justify-between font-bold">
                      <span>Header In File</span>
                      <span>Maps To</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Phase / Week / Module</span>
                      <span className="text-emerald-400 font-bold">Course Sections</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Topics Covered / Title</span>
                      <span className="text-primary-container font-bold">Lesson Titles</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Day / Unit Number</span>
                      <span className="text-cream-accent font-bold">Prefixes Title</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Duration / Time</span>
                      <span className="text-purple-400 font-bold">Lesson Duration</span>
                    </p>
                  </div>

                  <p className="text-[9px] text-on-surface-variant italic leading-relaxed">
                    💡 <strong>Tip:</strong> If your sheet is structured day-by-day (like the `AI roadmap.xlsx`), the parser will group the lessons seamlessly.
                  </p>
                </div>

                {/* Import Apply CTA */}
                {importedSectionsPreview.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyImportedCurriculum}
                    className="w-full py-3 bg-gradient-to-r from-primary-container to-amber-500 text-on-primary-container rounded-lg text-xs font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    <span className="material-symbols-outlined text-xs">done_all</span>
                    Apply to Curriculum Builder
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
